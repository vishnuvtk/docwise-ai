import { NextResponse } from "next/server";
import { parseAskRequest } from "@/lib/ask-request";
import { questionAnsweringService } from "@/lib/qa/service";

export const runtime = "nodejs";

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
    return NextResponse.json(
      {
        status: "error",
        error: "The documents were loaded, but answer generation failed.",
      },
      { status: 500 },
    );
  }
}
