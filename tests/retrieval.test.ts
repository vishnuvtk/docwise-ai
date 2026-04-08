import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/gemini", () => ({
  getGeminiClient: vi.fn(),
}));

vi.mock("@/lib/document-index", () => ({
  getDocumentIndex: vi.fn(),
}));

import { getGeminiClient } from "@/lib/gemini";
import { getDocumentIndex } from "@/lib/document-index";
import { answerQuestion, getQueryAvailability } from "@/lib/retrieval";

const mockGetGeminiClient = vi.mocked(getGeminiClient);
const mockGetDocumentIndex = vi.mocked(getDocumentIndex);

const baseIndex = {
  generatedAt: "2026-04-07T00:00:00.000Z",
  embeddingModel: "gemini-embedding-001",
  chatModelDefault: "gemini-2.5-flash",
  warnings: [],
  documents: [
    {
      id: "doc-1",
      name: "support-playbook.md",
      relativePath: "documents/support-playbook.md",
      type: "text" as const,
      chunkCount: 1,
      pageCount: null,
      characterCount: 120,
    },
    {
      id: "doc-2",
      name: "launch-notes.md",
      relativePath: "documents/launch-notes.md",
      type: "text" as const,
      chunkCount: 1,
      pageCount: null,
      characterCount: 120,
    },
    {
      id: "doc-3",
      name: "product-overview.txt",
      relativePath: "documents/product-overview.txt",
      type: "text" as const,
      chunkCount: 1,
      pageCount: null,
      characterCount: 120,
    },
  ],
  chunks: [
    {
      id: "chunk-1",
      documentId: "doc-1",
      documentName: "support-playbook.md",
      relativePath: "documents/support-playbook.md",
      kind: "text" as const,
      pageNumber: null,
      text: "High-severity launch blockers should be escalated to the operations lead within two hours.",
      excerpt:
        "High-severity launch blockers should be escalated to the operations lead within two hours.",
      embedding: [1, 0],
    },
    {
      id: "chunk-2",
      documentId: "doc-2",
      documentName: "launch-notes.md",
      relativePath: "documents/launch-notes.md",
      kind: "text" as const,
      pageNumber: null,
      text: "The launch plan uses a bundled document index and a server-side Node runtime.",
      excerpt:
        "The launch plan uses a bundled document index and a server-side Node runtime.",
      embedding: [0.5, 0.5],
    },
    {
      id: "chunk-3",
      documentId: "doc-3",
      documentName: "product-overview.txt",
      relativePath: "documents/product-overview.txt",
      kind: "text" as const,
      pageNumber: null,
      text: "The first release is single-turn only and answers should stay concise.",
      excerpt:
        "The first release is single-turn only and answers should stay concise.",
      embedding: [0, 1],
    },
  ],
};

function createGeminiClient(options: {
  questionEmbedding: number[];
  answers: string[];
}) {
  const embedContent = vi.fn().mockResolvedValue({
    embeddings: [{ values: options.questionEmbedding }],
  });
  const generateContent = vi
    .fn()
    .mockImplementation(async () => ({ text: options.answers.shift() ?? "" }));

  return {
    models: {
      embedContent,
      generateContent,
    },
  };
}

beforeEach(() => {
  process.env.GEMINI_API_KEY = "test-key";
  mockGetDocumentIndex.mockReturnValue(baseIndex);
});

describe("getQueryAvailability", () => {
  it("uses the bundled index and Gemini availability to report ready status", () => {
    mockGetGeminiClient.mockReturnValue(createGeminiClient({
      questionEmbedding: [1, 0],
      answers: [],
    }) as never);

    expect(getQueryAvailability()).toEqual({
      ready: true,
      message: "Ready",
    });
  });
});

describe("answerQuestion", () => {
  it("returns an answered result with citations ordered by relevance", async () => {
    mockGetGeminiClient.mockReturnValue(createGeminiClient({
      questionEmbedding: [1, 0],
      answers: [
        "High-severity launch blockers should be escalated to the operations lead within two hours [Source 1].",
      ],
    }) as never);

    const result = await answerQuestion("What is the support escalation window?");

    expect(result.status).toBe("answered");
    expect(result.answer).toContain("[Source 1]");
    expect(result.citations.map((citation) => citation.documentName)).toEqual([
      "support-playbook.md",
      "launch-notes.md",
      "product-overview.txt",
    ]);
    expect(result.retrievalMessage).toContain("Top match score 1.00");
  });

  it("refuses when retrieval support is too weak", async () => {
    mockGetDocumentIndex.mockReturnValue({
      ...baseIndex,
      chunks: [
        {
          ...baseIndex.chunks[0],
          embedding: [0.6, 0.8],
        },
        {
          ...baseIndex.chunks[1],
          embedding: [0.3, 0.9539392014],
        },
      ],
    });

    const client = createGeminiClient({
      questionEmbedding: [1, 0],
      answers: [
        "This answer should not be used [Source 1].",
      ],
    });
    mockGetGeminiClient.mockReturnValue(client as never);

    const result = await answerQuestion("What is the support escalation window?");

    expect(result.status).toBe("refused");
    expect(result.answer).toContain("I couldn't find enough support");
    expect(client.models.generateContent).not.toHaveBeenCalled();
  });

  it("refuses when citation gating cannot produce a cited answer", async () => {
    const client = createGeminiClient({
      questionEmbedding: [1, 0],
      answers: [
        "High-severity launch blockers should be escalated quickly.",
        "High-severity launch blockers should be escalated quickly.",
      ],
    });
    mockGetGeminiClient.mockReturnValue(client as never);

    const result = await answerQuestion("What is the support escalation window?");

    expect(result.status).toBe("refused");
    expect(result.answer).toContain("couldn't produce a properly cited answer");
    expect(client.models.generateContent).toHaveBeenCalledTimes(2);
  });
});
