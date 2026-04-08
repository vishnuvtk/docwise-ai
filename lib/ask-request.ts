type AskRequestBody = {
  question?: string;
};

type ValidAskRequest = {
  ok: true;
  question: string;
};

type InvalidAskRequest = {
  ok: false;
  status: number;
  body: {
    status: "error";
    error: string;
  };
};

export async function parseAskRequest(
  request: Request,
): Promise<ValidAskRequest | InvalidAskRequest> {
  let body: AskRequestBody;

  try {
    body = (await request.json()) as AskRequestBody;
  } catch {
    return {
      ok: false,
      status: 400,
      body: {
        status: "error",
        error: "The request body must be valid JSON.",
      },
    };
  }

  const question = body.question?.trim();

  if (!question) {
    return {
      ok: false,
      status: 400,
      body: {
        status: "error",
        error: "A question is required.",
      },
    };
  }

  if (question.length > 600) {
    return {
      ok: false,
      status: 400,
      body: {
        status: "error",
        error: "Questions must stay under 600 characters for this v1 app.",
      },
    };
  }

  return {
    ok: true,
    question,
  };
}
