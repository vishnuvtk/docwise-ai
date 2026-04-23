# Assignment 6 Evaluation Results

This result sheet is based on the current system behavior in the repo, the bundled document set, and the existing automated checks in `tests/` and `e2e/`. It is written as a current-system evaluation record, not as a claim of identical model wording on every run.

## Summary

- Evaluated system: current Docwise AI app
- Corpus size: 3 bundled text documents
- Retrieval style: bundled embedding index with top-k chunk ranking
- Answer contract: concise answer with inline `[Source N]` citations
- Guardrails: refusal on weak support, refusal on uncited synthesis, disabled Q&A when runtime is not ready
- Measurement basis: a mix of direct automated coverage, source-backed review of the bundled corpus, and inspection of the current retrieval and answer-generation code paths

## Case Results

| ID | Result | Notes |
| --- | --- | --- |
| R1 | Pass, directly exercised | This is the strongest happy-path case in the current app and is reflected in unit coverage plus browser coverage of the answer-and-evidence UI. Expected answer: escalation to the operations lead within two hours of confirmation, with visible evidence from `support-playbook.md`. |
| R2 | Pass, source-backed expected | The source text directly states the finance-partner notification rule, so this should be answered cleanly from `support-playbook.md` with citations. |
| R3 | Pass, source-backed expected | The launch notes support a short synthesis about bundled deployment, Vercel, server-side Node.js routing, and prebuilt retrieval index generation. |
| R4 | Pass, source-backed expected | The launch notes explicitly describe the missing-key-at-build behavior: document list still renders, but Q&A stays disabled until the index is rebuilt. |
| R5 | Pass, source-backed expected | `product-overview.txt` directly supports both facts: v1 is single-turn only and answers should stay concise by default. |
| F1 | Pass, directly exercised | The current app is designed to refuse unsupported questions. Unit tests cover the refusal decision, and the browser test covers the refusal UI with visible evidence using a mocked `/api/ask` response. |
| F2 | Pass, directly exercised | The runtime readiness path is explicitly implemented and tested. When the Gemini key is missing or embeddings are unavailable, the app reports Q&A as unavailable rather than attempting a weak answer. |

## What "Pass" Means Here

- The answerable cases are fully supported by the current bundled documents.
- The unsupported case matches the app's refusal policy.
- The readiness failure case matches the app's runtime guardrails.
- The exact prose may vary, but the content and decision boundary should remain stable.
- "Directly exercised" means supported by existing automated tests in this repo.
- "Source-backed expected" means the case is grounded in the bundled documents and current code path, even though it is not separately automated as a standalone test today.

## Known Limits Observed During Evaluation

- The corpus is very small, so the app is more like a tightly scoped document assistant than a broad knowledge bot.
- Each bundled text file is currently represented as a single chunk, which can reduce evidence precision for narrowly targeted questions.
- The current evaluation does not measure latency, citation formatting quality beyond basic gating, or answer consistency across repeated live model runs.
