## Problem Statement

Students and evaluators need a small, credible end-to-end AI application that demonstrates retrieval-augmented question answering over a controlled set of documents without drifting into unsupported claims. A generic chatbot is not sufficient for the assignment because it can hallucinate, hide its evidence, and blur the line between what came from the source material and what came from the model.

Docwise AI should solve that problem with a narrow, class-assignment-friendly proof of concept: users ask a single question against a small bundled library of preloaded PDF, text, and markdown files, and the system either returns a concise grounded answer with visible citations or refuses when the documents do not support the claim. The final repository should also make the engineering work legible through tests, issues, commits, and clear architectural reasoning.

## Solution

Build Docwise AI as a small Next.js web app deployed on Vercel that performs document-grounded Q&A over a developer-controlled library bundled with the application. Source files are ingested before runtime, cleaned, chunked, embedded, and written into a precomputed index that ships with the app. At request time, the server embeds the user question, retrieves the most relevant chunks across the whole library, and asks a server-side model to answer only from those retrieved chunks.

The user experience should stay deliberately simple. Version 1 is single-turn only, searches the whole library by default, keeps the API key server-side, and shows the loaded documents, answer text, and supporting excerpts together. If retrieval is weak or the model cannot produce a properly supported cited answer, the system refuses instead of guessing. The finished repo should be suitable for a public class submission, with meaningful automated tests, a deployable Vercel configuration, and a parent GitHub issue that can be decomposed into child tasks.

## User Stories

1. As a student evaluator, I want to open the app and immediately understand that it answers only from bundled documents, so that the system boundary is obvious.
2. As a user, I want to see which documents are loaded into the app, so that I know what corpus the system is allowed to use.
3. As a user, I want to ask one question across the whole bundled library, so that I do not need to choose a file manually before searching.
4. As a user, I want the app to search PDF, TXT, and MD documents together, so that the format of a bundled file does not change how I ask questions.
5. As a user, I want the system to answer only from retrieved document content, so that I can trust that the response is grounded.
6. As a user, I want concise answers by default, so that I can understand the result quickly.
7. As a user, I want every factual answer sentence to include visible citations, so that I can verify where the claim came from.
8. As a user, I want a visible sources section with excerpts, so that I can inspect the exact supporting passages without re-reading every file.
9. As a user, I want PDF citations to include page numbers when available, so that I can navigate back to the original source precisely.
10. As a user, I want the system to refuse unsupported questions, so that it does not fabricate an answer when the corpus is incomplete.
11. As a user, I want the refusal language to be explicit and honest, so that I understand the limitation is in the documents rather than in my question.
12. As a user, I want the app to surface conflicting document evidence when sources disagree, so that the system does not flatten disagreement into a made-up conclusion.
13. As a user, I want the app to keep working even if one bundled document fails to parse, so that one bad file does not break the whole demo.
14. As a developer, I want documents to be preloaded from the repository, so that v1 avoids file-upload, storage, and moderation complexity.
15. As a developer, I want ingestion to happen before runtime, so that Vercel deployment stays fast and predictable.
16. As a developer, I want the retrieval index bundled with the app, so that serverless instances do not need to rebuild embeddings on request.
17. As a developer, I want the question-answering flow to run server-side only, so that the model key and document-processing logic stay off the client.
18. As a developer, I want a small-corpus architecture with minimal infrastructure, so that the proof of concept stays understandable for a class assignment.
19. As a developer, I want the document ETL and chunking logic to be deterministic, so that index generation is reproducible across builds.
20. As a developer, I want retrieval thresholds and refusal rules to be centralized, so that trust-related behavior is easy to reason about and tune.
21. As a developer, I want retrieval logic separated from UI concerns, so that it can be tested in isolation.
22. As a developer, I want index loading and runtime readiness checks encapsulated cleanly, so that the UI and API can share the same system status.
23. As a developer, I want the ask route to validate malformed requests clearly, so that the public API surface is predictable.
24. As a developer, I want meaningful unit tests around retrieval and index behavior, so that grounding and refusal rules can be changed safely.
25. As a developer, I want at least one browser-level end-to-end test for the ask flow, so that the real user path is verified from page load through cited answer rendering.
26. As an evaluator, I want the public repository to show commits, issues, tests, and architecture evidence, so that the project demonstrates software-engineering process rather than only a final UI.
27. As an evaluator, I want deployment instructions and environment setup to be clear, so that I can reproduce the app locally or on Vercel.
28. As a maintainer, I want the app to disable Q&A gracefully when the model key or index embeddings are unavailable, so that setup failures are debuggable.
29. As a maintainer, I want supported and unsupported document types to be explicit, so that the app fails in understandable ways.
30. As a future contributor, I want the v1 scope to remain intentionally narrow, so that later enhancements like uploads or multi-turn chat can be added from a stable baseline.

## Implementation Decisions

- The product remains a small, single-turn document-grounded Q&A web application named Docwise AI.
- The UI should present three core ideas at a glance: what the app does, which documents are loaded, and how evidence is shown.
- The document library is developer-controlled and bundled with the repository. End users do not upload documents in v1.
- Search runs across the whole bundled document set by default. Users do not need to choose a single document before asking.
- The runtime stack is a Next.js application deployed to Vercel with the question-answering endpoint running on the Node.js runtime.
- All retrieval and answer generation stay server-side. The browser only submits a question and renders the result.
- The document ingestion pipeline should remain a distinct module boundary that owns file discovery, parsing, normalization, chunking, excerpt generation, and index serialization.
- The ingestion pipeline should support text-readable PDF, TXT, and MD files only. Scanned or image-only PDF support is explicitly deferred.
- The index should be generated before runtime and written as a bundled artifact consumed by the application at request time.
- The index format should include document metadata, chunk metadata, embeddings, warnings, and the default chat model so runtime behavior can be derived from one source of truth.
- The retrieval engine should remain a distinct module boundary that owns question embedding, vector similarity scoring, top-k selection, support thresholds, and refusal gating.
- Retrieval should use embeddings-based semantic search rather than keyword-only matching because the assignment is centered on natural-language Q&A over a small corpus.
- The embedding model should be a Gemini embedding model appropriate for retrieval queries and retrieval documents, with task-type-specific embedding calls for document indexing and user questions.
- The answer synthesis module should receive only the retrieved chunks, not the raw full document set, and should instruct the model to answer only from those chunks.
- The answer generation prompt must require inline citations in the final prose and must support an explicit unsupported/refusal outcome.
- If the first generation pass does not produce a properly cited answer, the server may attempt a constrained rewrite pass, but must still refuse if citation requirements are not met.
- Refusal is a product feature, not an edge case. The app should refuse when retrieval support is too weak or the model cannot produce a sufficiently grounded cited response.
- Conflict handling is also a product feature. When retrieved sources disagree, the answer should surface the disagreement instead of selecting a synthetic “best” truth.
- Runtime readiness should be encapsulated in a status layer that can explain missing API keys, missing embeddings, empty document sets, and similar setup problems to both the UI and API route.
- The ask API contract should remain simple: accept a single question, enforce basic validation, and return one of three states: answered, refused, or error.
- The ask response payload should include answer/refusal text, citations, retrieval diagnostics, and the set of used document names so the UI can remain mostly presentational.
- The UI should visibly distinguish between answered and refused outcomes, while still showing retrieved evidence in both cases.
- The source display should include document name, relative path, relevance score, excerpt text, and page number when available.
- Configuration such as retrieval thresholds, top-k selection, and default models should remain server-side constants or environment configuration, not user-facing settings.
- The repo should include a public parent GitHub issue based on this PRD and child implementation issues that break the work into understandable slices.
- The repo should demonstrate architecture improvement evidence by keeping core logic in testable server modules instead of burying behavior in route handlers or UI components.

## Testing Decisions

- A good test should verify externally observable behavior and contracts, not implementation details such as private helper order, internal variable names, or prompt string formatting beyond required behavior.
- Unit tests should focus on deep modules with stable interfaces: document index status behavior, chunk retrieval/scoring behavior, support-threshold/refusal behavior, and citation-gating behavior.
- Unit tests should cover both happy-path and trust-path behavior, including supported answers, unsupported questions, conflicting evidence handling, and setup-disabled states.
- Unit tests should validate index behavior such as supported-file filtering, chunk metadata shape, document metadata shape, and warnings when embeddings cannot be generated.
- Retrieval tests should use controlled fixture data so that similarity ranking and refusal thresholds can be asserted from outputs rather than implementation details.
- API-level tests should verify request validation for empty questions, malformed JSON, overlong questions, and unavailable runtime state.
- At least one meaningful browser or end-to-end test should cover the real ask flow: load the homepage, verify the bundled document list is visible, submit a question, and assert that a grounded answer or refusal plus visible citations/excerpts is rendered.
- The end-to-end suite should include at least one refusal scenario so the trust contract is tested, not just the success path.
- Tests should prefer stable user-facing assertions such as visible text, response shape, and rendered evidence instead of brittle CSS or DOM-structure coupling.
- Because the current repository does not yet include automated tests, this work should also establish the initial test harness and conventions rather than assuming prior test infrastructure exists.
- Prior art inside the current codebase is limited because there are no existing unit or browser tests yet. The first test suite should therefore define a clean baseline using standard Next.js-friendly tooling for unit and browser coverage.

## Out of Scope

- End-user document uploads
- Multi-turn chat memory or conversational history
- General web search or open-domain answering
- Any answer that relies on information outside the bundled documents
- Large-corpus scaling concerns such as vector databases or distributed indexing
- Authentication, user accounts, or multi-user collaboration
- Admin panels for live reindexing or document management
- OCR for scanned or image-only PDFs
- User-facing tuning controls for retrieval thresholds, models, or chunking parameters
- Replacing the simple proof-of-concept architecture with heavyweight infrastructure that is unnecessary for the assignment

## Further Notes

- The current codebase already demonstrates most of the core product behavior: bundled-document ingestion, precomputed indexing, server-side retrieval, server-side Gemini answer generation, refusal behavior, and visible citations/excerpts.
- The main assignment-completion gap is not product direction but verification and presentation: automated tests, public GitHub issue hygiene, and explicit architectural evidence in the repository history.
- The parent GitHub issue created from this PRD should likely spawn child issues for ingestion/indexing hardening, retrieval/answer behavior, UI and evidence presentation, automated testing, deployment/documentation polish, and repository/process artifacts.
- The public repository should make it easy for a reviewer to answer three questions quickly: what the app does, why the system can be trusted, and how the implementation was validated.
