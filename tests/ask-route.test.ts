import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/qa/service", () => ({
  questionAnsweringService: {
    answer: vi.fn(),
    getAvailability: vi.fn(),
  },
}));

import { questionAnsweringService } from "@/lib/qa/service";
import { POST } from "@/app/api/ask/route";

const mockAnswerQuestion = vi.mocked(questionAnsweringService.answer);
const mockGetQueryAvailability = vi.mocked(
  questionAnsweringService.getAvailability,
);

beforeEach(() => {
  mockGetQueryAvailability.mockReturnValue({
    ready: true,
    message: "Ready",
  });
});

describe("POST /api/ask", () => {
  it("rejects malformed JSON request bodies", async () => {
    const response = await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{",
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      status: "error",
      error: "The request body must be valid JSON.",
    });
  });

  it("rejects empty questions before calling the answer pipeline", async () => {
    const response = await POST(
      new Request("http://localhost/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: "   " }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      status: "error",
      error: "A question is required.",
    });
    expect(mockAnswerQuestion).not.toHaveBeenCalled();
  });
});
