import { expect, test, type Page } from "@playwright/test";

type AskPayload = {
  status: "answered" | "refused";
  answer: string;
  retrievalMessage: string;
  usedDocumentNames: string[];
  citations: Array<{
    chunkId: string;
    documentId: string;
    documentName: string;
    relativePath: string;
    pageNumber: number | null;
    excerpt: string;
    score: number;
  }>;
};

async function mockAskResponse(page: Page, payload: AskPayload) {
  await page.route("**/api/ask", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

test("homepage loads and a supported question shows a grounded answer with visible evidence", async ({
  page,
}) => {
  await mockAskResponse(page, {
    status: "answered",
    answer:
      "High-severity launch blockers should be escalated to the operations lead within two hours of confirmation [Source 1].",
    retrievalMessage: "Top match score 0.72 across 3 retrieved chunks.",
    usedDocumentNames: ["support-playbook.md"],
    citations: [
      {
        chunkId: "support-1",
        documentId: "support-doc",
        documentName: "support-playbook.md",
        relativePath: "documents/support-playbook.md",
        pageNumber: null,
        excerpt:
          "High-severity launch blockers should be escalated to the operations lead within two hours of confirmation.",
        score: 0.72,
      },
    ],
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Ask the library. Get answers only from the files we shipped.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Loaded documents" }),
  ).toBeVisible();
  await expect(page.getByText("support-playbook.md")).toBeVisible();
  await expect(page.getByText("launch-notes.md")).toBeVisible();
  await expect(page.getByText("product-overview.txt")).toBeVisible();

  await page.getByRole("textbox", { name: "Question" }).fill(
    "What is the support escalation window?",
  );
  await page.getByRole("button", { name: "Ask documents" }).click();

  await expect(page.getByText("Answer", { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      "High-severity launch blockers should be escalated to the operations lead within two hours of confirmation [Source 1].",
    ),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sources" })).toBeVisible();
  await expect(
    page.getByText(
      '"High-severity launch blockers should be escalated to the operations lead within two hours of confirmation."',
    ),
  ).toBeVisible();
  await expect(page.getByText("documents/support-playbook.md")).toBeVisible();
});

test("submitting an unsupported question shows a refusal state with visible explanation and evidence", async ({
  page,
}) => {
  await mockAskResponse(page, {
    status: "refused",
    answer:
      "I couldn't find enough support for that answer in the bundled documents, so I'm refusing instead of guessing.",
    retrievalMessage: "Top match score 0.31 across 2 retrieved chunks.",
    usedDocumentNames: ["launch-notes.md"],
    citations: [
      {
        chunkId: "launch-1",
        documentId: "launch-doc",
        documentName: "launch-notes.md",
        relativePath: "documents/launch-notes.md",
        pageNumber: null,
        excerpt:
          "The launch plan uses a bundled document index and a server-side Node runtime.",
        score: 0.31,
      },
    ],
  });

  await page.goto("/");

  await page.getByRole("textbox", { name: "Question" }).fill(
    "What is the CEO's favorite color?",
  );
  await page.getByRole("button", { name: "Ask documents" }).click();

  await expect(page.getByText("Refusal", { exact: true })).toBeVisible();
  await expect(
    page.getByText(
      "I couldn't find enough support for that answer in the bundled documents, so I'm refusing instead of guessing.",
    ),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sources" })).toBeVisible();
  await expect(
    page.getByText(
      '"The launch plan uses a bundled document index and a server-side Node runtime."',
    ),
  ).toBeVisible();
  await expect(page.getByText("documents/launch-notes.md")).toBeVisible();
});
