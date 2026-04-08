# Docwise AI

Docwise AI is a small Next.js document Q&A app that answers questions using only bundled PDF, TXT, and MD files.

## What it does

- Indexes files from `documents/`
- Precomputes a bundled retrieval index before `next build`
- Refuses unsupported questions instead of guessing
- Shows supporting excerpts and PDF page numbers when available
- Uses the Gemini API server-side for embeddings and grounded answer synthesis

## Architecture

- `scripts/build-document-index.mjs` owns document ingestion, cleaning, chunking, and bundled index generation
- `lib/qa/service.ts` owns the server-side question-answering workflow
- `lib/qa/` contains the deeper Q&A modules for runtime readiness, retrieval, and answer generation
- `lib/ask-request.ts` owns request parsing and validation for the ask route
- `app/api/ask/route.ts` stays thin and delegates to the service layer

## Getting started

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

The initial Vitest coverage focuses on runtime readiness, retrieval/refusal behavior, citation gating, and API request validation.

Run the browser end-to-end suite with:

```bash
npm run test:e2e
```

The Playwright tests start a local Next.js server, keep a dummy server-side Gemini key in the test environment so the ask UI is enabled, and mock `/api/ask` responses for deterministic browser assertions.

## Documents

Put preloaded source files in `documents/`.

Supported file types:

- `.txt`
- `.md`
- `.pdf` for text-readable PDFs

Scanned PDFs are intentionally unsupported in v1.

## Build and deploy

`npm run build` runs the document indexer first, then builds Next.js. That means Vercel can ship the generated index with the deployment bundle.

If `GEMINI_API_KEY` is missing during indexing:

- the app still builds
- the document list still renders
- Q&A is disabled until the index is rebuilt with embeddings

## Vercel Deployment

Docwise AI is ready to deploy as a standard Next.js project on Vercel. The app does not need a custom `vercel.json` file for v1.

### Required assumptions

- Node.js `20.9.0` or newer
- The bundled source files in `documents/` must be committed to the repo
- `GEMINI_API_KEY` must be configured in Vercel if you want Q&A to work after deploy

### Required environment variables

- `GEMINI_API_KEY`
  Required for build-time embeddings and runtime answer generation
- `GEMINI_EMBEDDING_MODEL`
  Optional override, defaults to `gemini-embedding-001`
- `GEMINI_CHAT_MODEL`
  Optional override, defaults to `gemini-2.5-flash`

Only `GEMINI_API_KEY` is required for a fully working deployment. None of these variables should use the `NEXT_PUBLIC_` prefix because they must stay server-side.

### Exact deployment steps

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
10. After the first deployment finishes, open the site and verify:
   - the homepage loads
   - the loaded document list is visible
   - a supported question returns an answer with citations and source excerpts
   - an unsupported question returns a refusal instead of a guessed answer

### What would break on Vercel

- Missing `GEMINI_API_KEY`: deployment succeeds, but the app ships with Q&A disabled because embeddings are skipped at build time.
- Missing bundled documents: the app deploys, but the library will be empty and readiness will report that no supported documents were indexed.
- Using scanned/image-only PDFs: the indexer will not produce useful text, so those files will be skipped or contribute no grounded content.
- Running on an older Node version: Next.js 16 requires Node.js `20.9.0` or newer.

### Production verification command

If you want to verify the same build assumptions locally before pushing:

```bash
npm run build
```

## Gemini defaults

The app defaults to these Gemini API models:

- Embeddings: `gemini-embedding-001`
- Chat: `gemini-2.5-flash`

You can override them with environment variables if you want to test different models.

## Useful scripts

- `npm run dev`
- `npm run index-docs`
- `npm run build`
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
