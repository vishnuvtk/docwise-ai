# Docwise AI

Docwise AI is a small Next.js document Q&A app that answers questions using only bundled PDF, TXT, and MD files.

It indexes files from `documents/`, precomputes a bundled retrieval index before `next build`, refuses unsupported questions instead of guessing, and shows supporting excerpts and page numbers when available.

## System Classification

Docwise AI is a retrieval-first, single-turn, server-side RAG system over a bundled local corpus.

- Retrieval-first: the app embeds the user question, ranks indexed chunks from the bundled corpus, and refuses if support is too weak.
- RAG: the generator never receives the whole corpus directly at question time. It receives only the retrieved excerpts plus source labels, then produces a concise cited answer.
- Single-turn: v1 does not maintain conversational memory across turns.
- Server-side: embeddings and answer generation use Gemini from the Node.js server route, not from the browser.

## Why This Is Retrieval-First / RAG

The current app is not a general chatbot with document attachments. It follows a retrieval-first pipeline:

1. Precompute embeddings for bundled documents at build time into `data/document-index.json`.
2. Embed the incoming question at runtime.
3. Rank stored chunks by cosine similarity.
4. Refuse immediately if retrieval support is below threshold.
5. Send only the retrieved excerpts to Gemini for answer synthesis.
6. Refuse again if the generated answer is unsupported or missing inline citations.

That structure makes the app a small grounded RAG system rather than prompt-only generation.

## Main Alternative Rejected

The main alternative rejected for v1 was prompt-only full-corpus stuffing: sending the entire bundled library to the model for every question without a retrieval stage.

That approach was rejected because it would:

- scale poorly as the document set grows
- make evidence selection less explicit
- weaken refusal behavior on partially related questions
- make it harder to show why one passage, rather than another, justified the answer

## Important Capability Not Implemented Yet

Multi-turn conversational memory is intentionally not implemented in v1.

`documents/product-overview.txt` says the first release is single-turn only. Multi-turn support would be added only after the system can preserve citation quality and refusal behavior across follow-up questions without silently carrying unsupported context from earlier turns.

## Pipeline And Data Flow

### Build-Time Pipeline

1. `scripts/build-document-index.mjs` scans `documents/` for `.txt`, `.md`, and text-readable `.pdf` files.
2. It normalizes extracted text, chunks each document, creates short excerpts, and records document metadata.
3. If `GEMINI_API_KEY` is available, it generates document embeddings with `gemini-embedding-001`.
4. It writes the bundled index to `data/document-index.json`.
5. `npm run build` runs this indexing step before the Next.js build so the deployment bundle ships with the prepared index.

### Runtime Data Flow

1. The homepage loads document summaries from the bundled index.
2. The user submits a question to `app/api/ask/route.ts`.
3. `lib/ask-request.ts` validates JSON shape, emptiness, and the 600-character limit.
4. `lib/qa/runtime-status.ts` blocks requests when the Gemini key is missing or embeddings were not built.
5. `lib/qa/service.ts` embeds the question and calls `lib/qa/retrieval-engine.ts`.
6. The retrieval engine ranks chunks, prepares citations, and computes a retrieval message.
7. If support is weak, the service returns a refusal instead of generating an answer.
8. If support is strong enough, `lib/qa/answer-generator.ts` prompts Gemini with only the retrieved excerpts.
9. If the model does not return a properly cited answer, the service refuses instead of guessing.
10. The UI shows the answer or refusal, plus visible evidence including excerpts, filenames, scores, and page numbers when available.

## Architecture

- `scripts/build-document-index.mjs` owns ingestion, normalization, chunking, excerpting, embedding, and bundled index generation.
- `lib/document-index.ts` loads the generated bundled index and exposes summaries and runtime status.
- `lib/qa/service.ts` owns the end-to-end question-answering workflow.
- `lib/qa/retrieval-engine.ts` owns chunk ranking, support checks, citations, and retrieval summaries.
- `lib/qa/answer-generator.ts` owns grounded Gemini prompting and citation gating.
- `lib/ask-request.ts` owns API request parsing and validation.
- `app/api/ask/route.ts` is a thin Node.js route that delegates to the service layer.
- `app/components/question-panel.tsx` renders the ask flow, readiness messaging, and visible evidence UI.

## Assignment 6 Evaluation

Detailed artifacts live in:

- [cases.md](evaluation/cases.md)
- [results.md](evaluation/results.md)
- [baseline-comparison.md](evaluation/baseline-comparison.md)
- [improvement-note.md](evaluation/improvement-note.md)

### Output Quality Evaluation

For this app, output quality is not just "did the model sound fluent?" It is judged by whether the answer:

- stays within the bundled corpus
- includes inline `[Source N]` citations
- stays concise
- shows supporting excerpts in the UI
- refuses unsupported questions instead of improvising

The current code enforces part of this directly:

- weak retrieval support triggers refusal
- missing inline citations triggers refusal
- the answer generator is instructed to use only retrieved excerpts

### End-To-End Task Success Evaluation

The end-to-end task is: a user asks a question about the bundled library and either gets a grounded cited answer or a safe refusal with visible evidence.

Success is evaluated by whether the current app:

- loads the bundled document list
- accepts a valid question
- returns an answer for supported questions
- returns a refusal for unsupported questions
- renders supporting excerpts and file paths
- blocks Q&A when runtime prerequisites are missing

Current automated evidence:

- `tests/retrieval.test.ts` covers answered, weak-support refusal, and citation-gating refusal paths
- `tests/document-index.test.ts` covers runtime readiness and missing-embedding states
- `tests/ask-route.test.ts` covers malformed and empty API requests
- `e2e/ask-flow.spec.ts` covers the browser flow and evidence UI, with `/api/ask` mocked for deterministic assertions

### Upstream Retrieval Evaluation

Upstream retrieval is evaluated before answer generation. For this repo, the important questions are:

- Did the correct document rank near the top?
- Was the top match strong enough to justify synthesis?
- Did weak or ambiguous retrieval correctly trigger refusal?

The current retrieval layer uses cosine similarity over bundled embeddings plus thresholds from `lib/config.ts`:

- strong match threshold: `0.72`
- support threshold: `0.55`
- secondary support threshold: `0.42`
- top-k retrieved chunks: `5`

This means retrieval is not only used for context selection. It is also the first safety gate.

### Representative Cases

These five cases are the main happy-path evaluation set for the current bundled corpus:

| ID | Question | Expected outcome | Main source |
| --- | --- | --- | --- |
| R1 | What is the support escalation window for a high-severity launch blocker? | Answer with the two-hour escalation rule. | `support-playbook.md` |
| R2 | If a blocker affects billing or contract obligations, who else needs to be notified and when? | Answer that the finance partner must also be notified the same day. | `support-playbook.md` |
| R3 | Summarize the v1 launch plan in two sentences. | Concise synthesis of bundled deployment, Vercel, Node.js route, and prebuilt index. | `launch-notes.md` |
| R4 | What happens if the Gemini API key is missing during build time? | Answer that the app can still render the document list but Q&A stays disabled until the index is rebuilt. | `launch-notes.md` |
| R5 | Is the first release multi-turn, and how should answers be written? | Answer that v1 is single-turn only and answers should stay concise. | `product-overview.txt` |

### Failure Cases

These two cases capture the main failure behavior expected from the current app:

| ID | Question or condition | Expected behavior |
| --- | --- | --- |
| F1 | Who is the CEO's favorite color? | Refusal because the bundled documents do not support the answer. |
| F2 | Ask a valid question while `GEMINI_API_KEY` is missing or the index has no embeddings. | Readiness failure: Q&A stays disabled and the API returns an error instead of attempting synthesis. |

### Lightweight Baseline Comparison

The baseline is a simple bundled-document QA system that retrieves by rough lexical overlap, summarizes loosely, and does not require citations or refusal on weak support.

| Area | Lightweight baseline | Current Docwise AI app |
| --- | --- | --- |
| Evidence use | May summarize a matching document loosely. | Retrieves ranked chunks, then generates from retrieved excerpts only. |
| Unsupported questions | Higher hallucination risk. | Refuses when support is weak or uncited. |
| Citation discipline | Optional or absent. | Inline citations are required for answered responses. |
| UI transparency | Often answer-first. | Shows excerpts, filenames, and scores. |
| Runtime readiness | May fail late. | Fails early when key prerequisites are missing. |

### One Evidence-Based Improvement

The best next improvement is smaller semantic chunking for text documents.

Evidence for that choice is already present in the current repo:

- the checked-in Assignment 6 bundle contains 3 documents and 3 chunks in `data/document-index.json`
- each bundled text file is effectively retrieved as one large chunk right now
- that makes evidence broader than necessary and increases dependence on coarse score thresholds

Smaller chunking would likely improve:

- precision for narrow fact questions
- refusal quality on partially supported questions
- usefulness of the visible evidence shown in the UI

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Add a Gemini API key:

```bash
cp .env.example .env.local
```

3. Generate the bundled index:

```bash
npm run index-docs
```

4. Start the app:

```bash
npm run dev
```

## Testing

Run the unit test suite with:

```bash
npm run test
```

Run the browser suite with:

```bash
npm run test:e2e
```

The browser tests are deterministic because they mock `/api/ask`, so they validate the visible UI flow and evidence rendering rather than live Gemini behavior.

## Documents

Put preloaded source files in `documents/`.

Supported file types:

- `.txt`
- `.md`
- `.pdf` for text-readable PDFs

Scanned PDFs are intentionally unsupported in v1.

## Build And Deploy

`npm run build` runs the document indexer first, then builds Next.js. That means Vercel can ship the generated index with the deployment bundle.

If `GEMINI_API_KEY` is missing during indexing:

- the app still builds
- the document list still renders
- Q&A is disabled until the index is rebuilt with embeddings

## Vercel Deployment

Docwise AI is ready to deploy as a standard Next.js project on Vercel. The app does not need a custom `vercel.json` file for v1.

### Required Assumptions

- Node.js `20.9.0` or newer
- The bundled source files in `documents/` must be committed to the repo
- `GEMINI_API_KEY` must be configured in Vercel if you want Q&A to work after deploy

### Required Environment Variables

- `GEMINI_API_KEY`
  Required for build-time embeddings and runtime answer generation
- `GEMINI_EMBEDDING_MODEL`
  Optional override, defaults to `gemini-embedding-001`
- `GEMINI_CHAT_MODEL`
  Optional override, defaults to `gemini-2.5-flash`

Only `GEMINI_API_KEY` is required for a fully working deployment. None of these variables should use the `NEXT_PUBLIC_` prefix because they must stay server-side.

### Exact Deployment Steps

1. Push the repo to GitHub.
2. Go to Vercel and choose `Add New...` -> `Project`.
3. Import the `docwise-ai` GitHub repository.
4. Keep the detected framework preset as `Next.js`.
5. In the project settings, add these environment variables:
   - `GEMINI_API_KEY` for `Production`
   - `GEMINI_API_KEY` for `Preview` too if you want preview deployments to have working Q&A
   - optionally `GEMINI_EMBEDDING_MODEL`
   - optionally `GEMINI_CHAT_MODEL`
6. Leave the default install command as `npm install`.
7. Leave the build command as `npm run build`.
8. Leave the output setting as the default for Next.js.
9. Deploy.
10. After the first deployment finishes, verify:
   - the homepage loads
   - the loaded document list is visible
   - a supported question returns an answer with citations and source excerpts
   - an unsupported question returns a refusal instead of a guessed answer

## Gemini Defaults

The app defaults to these Gemini API models:

- Embeddings: `gemini-embedding-001`
- Chat: `gemini-2.5-flash`

You can override them with environment variables if you want to test different models.

## Useful Scripts

- `npm run dev`
- `npm run index-docs`
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
