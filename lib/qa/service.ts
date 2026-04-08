import "server-only";
import { getDocumentIndex } from "@/lib/document-index";
import { getGeminiClient } from "@/lib/gemini";
import {
  createCitations,
  createRetrievalMessage,
  collectUsedDocumentNames,
  hasEnoughSupport,
  rankIndexedChunks,
} from "@/lib/qa/retrieval-engine";
import { evaluateQuestionAnsweringAvailability } from "@/lib/qa/runtime-status";
import { synthesizeGroundedAnswer, hasInlineSourceCitations } from "@/lib/qa/answer-generator";
import type {
  QuestionAnsweringAvailability,
  QuestionAnsweringDependencies,
} from "@/lib/qa/types";

async function embedQuestion(
  dependencies: QuestionAnsweringDependencies,
  question: string,
) {
  const client = dependencies.getClient();
  const index = dependencies.getIndex();

  if (!client || !index.embeddingModel) {
    return null;
  }

  const response = await client.models.embedContent({
    model: index.embeddingModel,
    contents: question,
    config: {
      taskType: "RETRIEVAL_QUERY",
    },
  });

  return response.embeddings?.[0]?.values ?? null;
}

export function createQuestionAnsweringService(
  dependencies: QuestionAnsweringDependencies,
) {
  return {
    getAvailability(): QuestionAnsweringAvailability {
      return evaluateQuestionAnsweringAvailability({
        index: dependencies.getIndex(),
        hasClient: Boolean(dependencies.getClient()),
        readyMessage: "Ready",
        missingEmbeddingsMessage:
          "Rebuild the bundled index with embeddings before asking questions.",
      });
    },

    async answer(question: string) {
      const questionEmbedding = await embedQuestion(dependencies, question);

      if (!questionEmbedding) {
        throw new Error("Question embeddings could not be created.");
      }

      const index = dependencies.getIndex();
      const retrieval = rankIndexedChunks(index, questionEmbedding);
      const citations = createCitations(retrieval);
      const retrievalMessage = createRetrievalMessage(retrieval);
      const usedDocumentNames = collectUsedDocumentNames(retrieval);

      if (!hasEnoughSupport(retrieval)) {
        return {
          status: "refused" as const,
          answer:
            "I couldn't find enough support for that answer in the bundled documents, so I'm refusing instead of guessing.",
          citations,
          retrievalMessage,
          usedDocumentNames,
        };
      }

      const client = dependencies.getClient();
      if (!client) {
        throw new Error("Gemini client unavailable.");
      }

      const answer = await synthesizeGroundedAnswer({
        client,
        index,
        question,
        retrieval,
      });

      if (answer === "UNSUPPORTED" || !hasInlineSourceCitations(answer)) {
        return {
          status: "refused" as const,
          answer:
            "I found relevant excerpts, but I couldn't produce a properly cited answer from them, so I'm refusing instead of guessing.",
          citations,
          retrievalMessage,
          usedDocumentNames,
        };
      }

      return {
        status: "answered" as const,
        answer,
        citations,
        retrievalMessage,
        usedDocumentNames,
      };
    },
  };
}

export const questionAnsweringService = createQuestionAnsweringService({
  getClient: getGeminiClient,
  getIndex: getDocumentIndex,
});
