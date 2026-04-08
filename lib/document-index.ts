import "server-only";
import indexData from "@/data/document-index.json";
import { evaluateQuestionAnsweringAvailability } from "@/lib/qa/runtime-status";

export type IndexedDocument = {
  id: string;
  name: string;
  relativePath: string;
  type: "pdf" | "text";
  chunkCount: number;
  pageCount: number | null;
  characterCount: number;
};

export type IndexedChunk = {
  id: string;
  documentId: string;
  documentName: string;
  relativePath: string;
  kind: "pdf" | "text";
  pageNumber: number | null;
  text: string;
  excerpt: string;
  embedding: number[] | null;
};

export type DocumentIndex = {
  generatedAt: string;
  embeddingModel: string | null;
  chatModelDefault: string;
  warnings: string[];
  documents: IndexedDocument[];
  chunks: IndexedChunk[];
};

const documentIndex = indexData as DocumentIndex;

export function getDocumentIndex() {
  return documentIndex;
}

export function getIndexSummary() {
  return {
    documents: documentIndex.documents,
    chunkCount: documentIndex.chunks.length,
    warnings: documentIndex.warnings,
  };
}

export function getRuntimeStatus() {
  return evaluateQuestionAnsweringAvailability({
    index: documentIndex,
    hasClient: Boolean(process.env.GEMINI_API_KEY),
    readyMessage: "Ready for Q&A",
    missingEmbeddingsMessage:
      "Rebuild the document index with a Gemini API key to generate embeddings.",
  });
}
