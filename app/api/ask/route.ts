import { NextResponse } from "next/server";
import { parseAskRequest } from "@/lib/ask-request";
import { questionAnsweringService } from "@/lib/qa/service";

export const runtime = "nodejs";

function getAnswerFailure(error: unknown) {
  const status =
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : null;

  if (status === 429) {
    return {
      status: 429,
      message:
        "Gemini quota is temporarily exhausted. Try again after the quota resets or update the Gemini API billing/quota settings.",
    };
  }

  if (status === 401 || status === 403) {
    return {
      status: 502,
      message:
        "Gemini rejected the server API key. Check the deployment environment variable and API key permissions.",
    };
  }

  return {
    status: 500,
    message: "The documents were loaded, but answer generation failed.",
  };
}

export async function POST(request: Request) {
  const availability = questionAnsweringService.getAvailability();

  if (!availability.ready) {
    return NextResponse.json(
      {
        status: "error",
        error: availability.message,
      },
      { status: 503 },
    );
  }

  const parsed = await parseAskRequest(request);

  if (!parsed.ok) {
    return NextResponse.json(parsed.body, { status: parsed.status });
  }

  try {
    const answer = await questionAnsweringService.answer(parsed.question);
    return NextResponse.json(answer);
  } catch (error) {
    console.error("Failed to answer question", error);
    const failure = getAnswerFailure(error);
    return NextResponse.json(
      {
        status: "error",
        error: failure.message,
      },
      { status: failure.status },
    );
  }
}
