import {
  MIN_SECONDARY_MATCH_THRESHOLD,
  RETRIEVAL_TOP_K,
  STRONG_MATCH_THRESHOLD,
  SUPPORT_MATCH_THRESHOLD,
} from "@/lib/config";
import type { Citation, RetrievalCandidate } from "@/lib/qa/types";
import type { DocumentIndex } from "@/lib/document-index";

function dotProduct(a: number[], b: number[]) {
  let total = 0;

  for (let index = 0; index < a.length; index += 1) {
    total += a[index] * b[index];
  }

  return total;
}

function magnitude(values: number[]) {
  return Math.sqrt(dotProduct(values, values));
}

function cosineSimilarity(a: number[], b: number[]) {
  const denominator = magnitude(a) * magnitude(b);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct(a, b) / denominator;
}

export function rankIndexedChunks(
  index: DocumentIndex,
  questionEmbedding: number[],
) {
  return index.chunks
    .filter((chunk) => Array.isArray(chunk.embedding))
    .map((chunk) => ({
      chunkId: chunk.id,
      documentId: chunk.documentId,
      documentName: chunk.documentName,
      relativePath: chunk.relativePath,
      pageNumber: chunk.pageNumber,
      excerpt: chunk.excerpt,
      text: chunk.text,
      score: cosineSimilarity(questionEmbedding, chunk.embedding as number[]),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, RETRIEVAL_TOP_K);
}

export function hasEnoughSupport(results: RetrievalCandidate[]) {
  const [first, second] = results;

  if (!first) {
    return false;
  }

  if (first.score >= STRONG_MATCH_THRESHOLD) {
    return true;
  }

  return (
    first.score >= SUPPORT_MATCH_THRESHOLD &&
    Boolean(second && second.score >= MIN_SECONDARY_MATCH_THRESHOLD)
  );
}

export function createRetrievalMessage(results: RetrievalCandidate[]) {
  return results.length
    ? `Top match score ${results[0].score.toFixed(2)} across ${results.length} retrieved chunks.`
    : "No indexed chunks were available for retrieval.";
}

export function createCitations(results: RetrievalCandidate[]): Citation[] {
  return results.map((item) => ({
    chunkId: item.chunkId,
    documentId: item.documentId,
    documentName: item.documentName,
    relativePath: item.relativePath,
    pageNumber: item.pageNumber,
    excerpt: item.excerpt,
    score: item.score,
  }));
}

export function collectUsedDocumentNames(results: RetrievalCandidate[]) {
  return [...new Set(results.map((item) => item.documentName))];
}
