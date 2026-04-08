import { afterEach, describe, expect, it, vi } from "vitest";

const originalApiKey = process.env.GEMINI_API_KEY;
const baseIndex = {
  generatedAt: "2026-04-07T00:00:00.000Z",
  embeddingModel: "gemini-embedding-001",
  chatModelDefault: "gemini-2.5-flash",
  warnings: [] as string[],
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
  ],
  chunks: [
    {
      id: "chunk-1",
      documentId: "doc-1",
      documentName: "support-playbook.md",
      relativePath: "documents/support-playbook.md",
      kind: "text" as const,
      pageNumber: null,
      text: "High-severity launch blockers should be escalated quickly.",
      excerpt: "High-severity launch blockers should be escalated quickly.",
      embedding: [1, 0],
    },
  ],
};

async function loadDocumentIndex(overrides?: Partial<typeof baseIndex>) {
  vi.resetModules();
  vi.doMock("@/data/document-index.json", () => ({
    default: {
      ...baseIndex,
      ...overrides,
    },
  }));

  return import("@/lib/document-index");
}

afterEach(() => {
  if (originalApiKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = originalApiKey;
  }

  vi.resetModules();
  vi.doUnmock("@/data/document-index.json");
});

describe("getRuntimeStatus", () => {
  it("disables question answering when the Gemini key is missing", async () => {
    delete process.env.GEMINI_API_KEY;

    const { getRuntimeStatus } = await import("@/lib/document-index");

    expect(getRuntimeStatus()).toEqual({
      ready: false,
      message: "Add GEMINI_API_KEY to enable question answering.",
    });
  });

  it("surfaces index warnings when embeddings are unavailable", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const { getRuntimeStatus } = await loadDocumentIndex({
      embeddingModel: null,
      warnings: ["Embeddings are missing until the index is rebuilt."],
      chunks: [
        {
          ...baseIndex.chunks[0],
          embedding: null,
        },
      ],
    });

    expect(getRuntimeStatus()).toEqual({
      ready: false,
      message: "Embeddings are missing until the index is rebuilt.",
    });
  });

  it("reports ready when a Gemini key and embeddings are both present", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    const { getRuntimeStatus, getIndexSummary } = await loadDocumentIndex();

    expect(getRuntimeStatus()).toEqual({
      ready: true,
      message: "Ready for Q&A",
    });
    expect(getIndexSummary()).toMatchObject({
      chunkCount: 1,
      warnings: [],
    });
    expect(getIndexSummary().documents).toHaveLength(1);
  });
});
