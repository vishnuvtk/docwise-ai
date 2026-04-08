import type { DocumentIndex } from "@/lib/document-index";
import type { QuestionAnsweringAvailability } from "@/lib/qa/types";

type RuntimeStatusOptions = {
  index: DocumentIndex;
  hasClient: boolean;
  readyMessage: string;
  missingEmbeddingsMessage: string;
};

export function evaluateQuestionAnsweringAvailability({
  index,
  hasClient,
  readyMessage,
  missingEmbeddingsMessage,
}: RuntimeStatusOptions): QuestionAnsweringAvailability {
  if (!hasClient) {
    return {
      ready: false,
      message: "Add GEMINI_API_KEY to enable question answering.",
    };
  }

  if (!index.chunks.some((chunk) => Array.isArray(chunk.embedding))) {
    return {
      ready: false,
      message: index.warnings[0] ?? missingEmbeddingsMessage,
    };
  }

  if (index.documents.length === 0) {
    return {
      ready: false,
      message: "No supported documents were indexed yet.",
    };
  }

  return {
    ready: true,
    message: readyMessage,
  };
}
