"use client";

import { startTransition, useState } from "react";

type DocumentSummary = {
  id: string;
  name: string;
  type: "pdf" | "text";
  chunkCount: number;
  pageCount: number | null;
  characterCount: number;
};

type RuntimeStatus = {
  ready: boolean;
  message: string;
};

type Citation = {
  chunkId: string;
  documentId: string;
  documentName: string;
  relativePath: string;
  pageNumber: number | null;
  excerpt: string;
  score: number;
};

type AskSuccess = {
  status: "answered" | "refused";
  answer: string;
  citations: Citation[];
  retrievalMessage: string;
  usedDocumentNames: string[];
};

type AskFailure = {
  status: "error";
  error: string;
};

type AskResponse = AskSuccess | AskFailure;

type QuestionPanelProps = {
  documents: DocumentSummary[];
  runtime: RuntimeStatus;
  warnings: string[];
};

const SAMPLE_QUESTIONS = [
  "What is the support escalation window?",
  "Summarize the launch plan in two sentences.",
  "Which source mentions billing constraints?",
];

export default function QuestionPanel({
  documents,
  runtime,
  warnings,
}: QuestionPanelProps) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<AskSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const submitQuestion = async (nextQuestion: string) => {
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: nextQuestion }),
      });

      const payload = (await response.json()) as AskResponse;

      if (!response.ok || payload.status === "error") {
        setResult(null);
        setError(
          payload.status === "error"
            ? payload.error
            : "The request could not be completed.",
        );
        return;
      }

      setResult(payload);
    } catch {
      setResult(null);
      setError("The question could not be sent. Try again in a moment.");
    } finally {
      setIsPending(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = question.trim();
    if (!trimmed) {
      setError("Enter a question before searching the library.");
      return;
    }

    startTransition(() => {
      void submitQuestion(trimmed);
    });
  };

  const askExample = (sample: string) => {
    setQuestion(sample);
    startTransition(() => {
      void submitQuestion(sample);
    });
  };

  return (
    <section className="surface-panel rounded-[1.9rem] p-6 sm:p-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.3em] text-[#0c5b53]">
          Ask the corpus
        </p>
        <h2 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950">
          Grounded answers with visible evidence
        </h2>
        <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
          Search runs across all bundled documents, then returns a concise
          answer plus the supporting excerpts that made it through retrieval.
        </p>
      </div>

      <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="sr-only">Question</span>
          <textarea
            className="h-36 w-full resize-none rounded-[1.5rem] border border-slate-200 bg-white/92 px-5 py-4 text-base leading-7 text-slate-950 outline-none transition focus:border-[#0c5b53] focus:ring-4 focus:ring-[#0c5b53]/10"
            name="question"
            placeholder="Ask something the documents should be able to prove."
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={!runtime.ready || isPending}
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUESTIONS.map((sample) => (
              <button
                key={sample}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-[#0c5b53] hover:text-[#0c5b53]"
                type="button"
                onClick={() => askExample(sample)}
                disabled={!runtime.ready || isPending}
              >
                {sample}
              </button>
            ))}
          </div>

          <button
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-[#0c5b53] disabled:cursor-not-allowed disabled:bg-slate-300"
            type="submit"
            disabled={!runtime.ready || isPending}
          >
            {isPending ? "Searching..." : "Ask documents"}
          </button>
        </div>
      </form>

      {!runtime.ready ? (
        <div className="mt-6 rounded-[1.4rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-950">
          <p className="font-semibold">Q&amp;A unavailable</p>
          <p className="mt-1">{runtime.message}</p>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="mt-6 rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-700">
          <p className="font-semibold text-slate-950">Index notes</p>
          <ul className="mt-2 space-y-1">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-[1.4rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm leading-7 text-rose-950">
          {error}
        </div>
      ) : null}

      <div className="mt-8 rounded-[1.7rem] border border-slate-200/75 bg-white/80 p-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold tracking-[-0.03em] text-slate-950">
            Latest result
          </h3>
          <span className="rounded-full bg-[#d8efe8] px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[#0c5b53]">
            {documents.length} bundled docs
          </span>
        </div>

        {result ? (
          <div className="mt-5 space-y-6">
            <div className="rounded-[1.4rem] bg-slate-950 px-5 py-5 text-slate-50">
              <p className="text-xs uppercase tracking-[0.24em] text-teal-200/70">
                {result.status === "refused" ? "Refusal" : "Answer"}
              </p>
              <p className="mt-3 text-base leading-8 sm:text-lg">
                {result.answer}
              </p>
              <p className="mt-4 text-sm leading-7 text-teal-100/75">
                {result.retrievalMessage}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Sources
              </h4>
              <ul className="mt-3 space-y-3">
                {result.citations.map((citation) => (
                  <li
                    key={citation.chunkId}
                    className="rounded-[1.4rem] border border-slate-200 bg-slate-50/85 px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-semibold text-slate-950">
                        {citation.documentName}
                      </span>
                      {citation.pageNumber ? (
                        <span className="rounded-full bg-white px-2 py-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                          Page {citation.pageNumber}
                        </span>
                      ) : null}
                      <span className="rounded-full bg-white px-2 py-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                        Score {citation.score.toFixed(2)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      &quot;{citation.excerpt}&quot;
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                      {citation.relativePath}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-[1.4rem] border border-dashed border-slate-300 px-5 py-8 text-sm leading-7 text-slate-500">
            Submit a question to see the answer, supporting excerpts, and the
            document paths used to ground it.
          </div>
        )}
      </div>
    </section>
  );
}
