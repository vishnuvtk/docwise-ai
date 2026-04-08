import type { DocumentIndex } from "@/lib/document-index";

export type QuestionAnsweringAvailability = {
  ready: boolean;
  message: string;
};

export type Citation = {
  chunkId: string;
  documentId: string;
  documentName: string;
  relativePath: string;
  pageNumber: number | null;
  excerpt: string;
  score: number;
};

export type AnsweredQuestion = {
  status: "answered";
  answer: string;
  citations: Citation[];
  retrievalMessage: string;
  usedDocumentNames: string[];
};

export type RefusedQuestion = {
  status: "refused";
  answer: string;
  citations: Citation[];
  retrievalMessage: string;
  usedDocumentNames: string[];
};

export type QuestionAnsweringResult = AnsweredQuestion | RefusedQuestion;

export type RetrievalCandidate = {
  chunkId: string;
  documentId: string;
  documentName: string;
  relativePath: string;
  pageNumber: number | null;
  excerpt: string;
  text: string;
  score: number;
};

export type GeminiLikeClient = {
  models: {
    embedContent(params: {
      model: string;
      contents: string | string[];
      config?: {
        taskType?: string;
        [key: string]: unknown;
      };
    }): Promise<{
      embeddings?: Array<{
        values?: number[] | null;
      }>;
    }>;
    generateContent(params: {
      model: string;
      contents: string;
      config?: {
        temperature?: number;
        maxOutputTokens?: number;
        systemInstruction?: string;
      };
    }): Promise<{
      text?: string;
    }>;
  };
};

export type QuestionAnsweringDependencies = {
  getClient: () => GeminiLikeClient | null;
  getIndex: () => DocumentIndex;
};
