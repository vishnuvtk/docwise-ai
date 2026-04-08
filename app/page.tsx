import QuestionPanel from "@/app/components/question-panel";
import { getIndexSummary, getRuntimeStatus } from "@/lib/document-index";

export default function Home() {
  const summary = getIndexSummary();
  const runtime = getRuntimeStatus();

  return (
    <main className="flex-1">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-5 py-8 sm:px-8 lg:px-10">
        <div className="hero-shell overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,rgba(12,63,58,0.94),rgba(6,23,24,0.97))] p-7 text-white shadow-[0_35px_80px_rgba(8,25,26,0.18)] sm:p-10">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.35em] text-teal-100/80">
                Document-grounded Q&amp;A
              </p>
              <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
                Ask the library. Get answers only from the files we shipped.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-teal-50/82 sm:text-lg">
                Docwise AI searches a bundled document set, refuses unsupported
                questions, and shows the exact passages behind every answer.
              </p>
            </div>
            <dl className="grid gap-3 text-sm text-teal-50/88 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/6 px-4 py-4 backdrop-blur">
                <dt className="text-teal-100/70">Indexed files</dt>
                <dd className="mt-2 text-3xl font-semibold text-white">
                  {summary.documents.length}
                </dd>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/6 px-4 py-4 backdrop-blur">
                <dt className="text-teal-100/70">Search chunks</dt>
                <dd className="mt-2 text-3xl font-semibold text-white">
                  {summary.chunkCount}
                </dd>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/6 px-4 py-4 backdrop-blur">
                <dt className="text-teal-100/70">Status</dt>
                <dd className="mt-2 text-lg font-semibold text-white">
                  {runtime.ready ? "Ready for Q&A" : runtime.message}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.55fr_0.95fr]">
          <QuestionPanel
            documents={summary.documents}
            runtime={runtime}
            warnings={summary.warnings}
          />

          <aside className="space-y-6">
            <section className="surface-panel rounded-[1.75rem] p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                  Loaded documents
                </h2>
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-50">
                  {summary.documents.length} files
                </span>
              </div>
              <ul className="mt-5 space-y-3">
                {summary.documents.map((document) => (
                  <li
                    key={document.id}
                    className="rounded-3xl border border-slate-200/75 bg-white/88 px-4 py-4 shadow-[0_12px_24px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">
                          {document.type}
                        </p>
                        <p className="mt-1 text-base font-semibold text-slate-950">
                          {document.name}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#d8efe8] px-3 py-1 text-xs font-medium text-[#0c5b53]">
                        {document.chunkCount} chunks
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {document.type === "pdf"
                        ? `${document.pageCount} pages`
                        : `${document.characterCount.toLocaleString()} characters`}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="surface-panel rounded-[1.75rem] p-6">
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                Guardrails
              </h2>
              <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-700">
                <li>Answers are grounded only in bundled PDF, TXT, and MD files.</li>
                <li>Weak retrieval triggers a refusal instead of a guess.</li>
                <li>PDF citations include page numbers whenever available.</li>
                <li>The API key stays server-side in the Node runtime route.</li>
              </ul>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
