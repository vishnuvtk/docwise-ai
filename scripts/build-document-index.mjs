import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import nextEnv from "@next/env";
import { GoogleGenAI } from "@google/genai";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const ROOT = process.cwd();
const { loadEnvConfig } = nextEnv;
loadEnvConfig(ROOT, true);

const DOCUMENTS_DIR = path.join(ROOT, "documents");
const OUTPUT_DIR = path.join(ROOT, "data");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "document-index.json");

const SUPPORTED_EXTENSIONS = new Set([".txt", ".md", ".pdf"]);
const DEFAULT_EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL ?? "gemini-embedding-001";
const DEFAULT_CHAT_MODEL = process.env.GEMINI_CHAT_MODEL ?? "gemini-2.5-flash";
const CHUNK_SIZE = 900;
const CHUNK_OVERLAP = 160;
const EMBEDDING_BATCH_SIZE = 16;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeText(value) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function makeExcerpt(value) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 240) {
    return normalized;
  }

  return `${normalized.slice(0, 237).trimEnd()}...`;
}

function chunkText(text) {
  const normalized = normalizeText(text);

  if (!normalized) {
    return [];
  }

  const chunks = [];
  let start = 0;

  while (start < normalized.length) {
    const tentativeEnd = Math.min(start + CHUNK_SIZE, normalized.length);
    let end = tentativeEnd;

    if (tentativeEnd < normalized.length) {
      const paragraphBreak = normalized.lastIndexOf("\n\n", tentativeEnd);
      const sentenceBreak = normalized.lastIndexOf(". ", tentativeEnd);
      const chosenBreak = Math.max(paragraphBreak, sentenceBreak);

      if (chosenBreak > start + Math.floor(CHUNK_SIZE * 0.55)) {
        end = chosenBreak + (chosenBreak === paragraphBreak ? 2 : 1);
      }
    }

    const segment = normalized.slice(start, end).trim();
    if (segment) {
      chunks.push(segment);
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}

async function listSupportedFiles(directory) {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const absolutePath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          return listSupportedFiles(absolutePath);
        }

        const extension = path.extname(entry.name).toLowerCase();
        return SUPPORTED_EXTENSIONS.has(extension) ? [absolutePath] : [];
      }),
    );

    return files.flat();
  } catch {
    return [];
  }
}

async function readTextFile(absolutePath) {
  const content = await fs.readFile(absolutePath, "utf8");
  return {
    type: "text",
    pages: [
      {
        pageNumber: null,
        text: normalizeText(content),
      },
    ],
  };
}

async function readPdfFile(absolutePath) {
  const buffer = await fs.readFile(absolutePath);
  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  });
  const pdf = await loadingTask.promise;
  const pages = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const text = normalizeText(
        textContent.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .trim(),
      );

      if (text) {
        pages.push({
          pageNumber,
          text,
        });
      }
    }
  } finally {
    await pdf.destroy();
  }

  return {
    type: "pdf",
    pages,
  };
}

async function loadDocument(absolutePath) {
  const extension = path.extname(absolutePath).toLowerCase();

  if (extension === ".pdf") {
    return readPdfFile(absolutePath);
  }

  return readTextFile(absolutePath);
}

async function buildEmbeddings(chunks, warnings) {
  if (!process.env.GEMINI_API_KEY) {
    warnings.push(
      "GEMINI_API_KEY was not available during indexing, so embeddings were skipped and Q&A will stay disabled until the index is rebuilt.",
    );
    return chunks.map((chunk) => ({ ...chunk, embedding: null }));
  }

  const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const enrichedChunks = chunks.map((chunk) => ({
    ...chunk,
    embedding: null,
  }));

  try {
    for (
      let start = 0;
      start < enrichedChunks.length;
      start += EMBEDDING_BATCH_SIZE
    ) {
      const batch = enrichedChunks.slice(start, start + EMBEDDING_BATCH_SIZE);
      const response = await client.models.embedContent({
        model: DEFAULT_EMBEDDING_MODEL,
        contents: batch.map((chunk) => chunk.text),
        config: {
          taskType: "RETRIEVAL_DOCUMENT",
        },
      });

      response.embeddings?.forEach((item, index) => {
        batch[index].embedding = item.values ?? null;
      });
    }
  } catch (error) {
    warnings.push(
      `Embedding generation failed. The build kept the documents, but Q&A is disabled until indexing succeeds. ${error instanceof Error ? error.message : "Unknown Gemini API error."}`,
    );
  }

  return enrichedChunks;
}

async function main() {
  const warnings = [];
  const supportedFiles = await listSupportedFiles(DOCUMENTS_DIR);
  const documents = [];
  const chunks = [];

  for (const absolutePath of supportedFiles) {
    const relativePath = path.relative(ROOT, absolutePath).replaceAll("\\", "/");

    try {
      const document = await loadDocument(absolutePath);
      const pages = document.pages.filter((page) => page.text);
      const documentId = sha256(relativePath).slice(0, 12);
      const documentName = path.basename(relativePath);

      let chunkCount = 0;
      let characterCount = 0;

      pages.forEach((page) => {
        characterCount += page.text.length;
        const pageChunks = chunkText(page.text);

        pageChunks.forEach((segment, index) => {
          chunkCount += 1;
          chunks.push({
            id: `${documentId}-${page.pageNumber ?? "text"}-${index + 1}`,
            documentId,
            documentName,
            relativePath,
            kind: document.type,
            pageNumber: page.pageNumber,
            text: segment,
            excerpt: makeExcerpt(segment),
          });
        });
      });

      documents.push({
        id: documentId,
        name: documentName,
        relativePath,
        type: document.type,
        chunkCount,
        pageCount: document.type === "pdf" ? pages.length : null,
        characterCount,
      });
    } catch (error) {
      warnings.push(
        `Skipped ${relativePath} because it could not be parsed. ${error instanceof Error ? error.message : "Unknown parsing error."}`,
      );
    }
  }

  const chunksWithEmbeddings = await buildEmbeddings(chunks, warnings);
  const hasEmbeddings = chunksWithEmbeddings.some((chunk) =>
    Array.isArray(chunk.embedding),
  );

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(
    OUTPUT_FILE,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        embeddingModel: hasEmbeddings ? DEFAULT_EMBEDDING_MODEL : null,
        chatModelDefault: DEFAULT_CHAT_MODEL,
        warnings,
        documents,
        chunks: chunksWithEmbeddings,
      },
      null,
      2,
    ),
  );

  console.log(
    `Indexed ${documents.length} documents into ${chunksWithEmbeddings.length} chunks.`,
  );
}

void main();
