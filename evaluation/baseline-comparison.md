# Baseline Comparison

## Baseline Definition

For Assignment 6, the comparison baseline is a simple bundled-document QA approach with these limitations:

- retrieve documents by rough lexical overlap only
- return a short summary or top excerpt without mandatory inline citations
- no refusal policy for weak support
- no explicit runtime-readiness gate when embeddings or API configuration are missing

This is a realistic baseline for a first-pass document chatbot, but it is weaker than the current Docwise AI system.

## Current System vs. Baseline

| Area | Baseline | Current Docwise AI app |
| --- | --- | --- |
| Grounding | Likely to return a plausible-looking answer or raw excerpt. | Is designed to answer from retrieved bundled excerpts and refuse when support is weak. |
| Citations | Optional or absent. | Every factual answer is expected to include inline `[Source N]` citations. |
| Unsupported questions | May guess or overgeneralize from weak matches. | Refuses when retrieval support is too weak or when a cited answer cannot be produced. |
| Evidence visibility | Often hidden behind the generated answer. | Shows supporting excerpts, source filenames, and retrieval scores in the UI. |
| Runtime safety | May attempt answering even when setup is incomplete. | Disables Q&A when `GEMINI_API_KEY` is missing or embeddings are unavailable. |
| Fit for this repo | Generic chatbot behavior. | Explicitly designed for the bundled `documents/` corpus. |

## Case-Level Comparison

| Case | Baseline expectation | Current system expectation |
| --- | --- | --- |
| R1: support escalation window | Usually correct because the phrase is explicit in one document, but may omit citations. | Correct with visible evidence and citations. |
| R2: billing or contract notification | Could miss the second clause or answer incompletely. | Better chance of retrieving the full support rule and citing it. |
| R3: two-sentence launch summary | May be acceptable, but groundedness is harder to verify without citation enforcement. | Better fit because the answer must stay concise and cited. |
| R4: missing API key during build | Could hallucinate a generic deployment answer. | Should stay anchored to the exact launch-note behavior. |
| R5: single-turn and concise answer style | Might answer only one half of the question. | Better because both facts live in the same source and citation gating pushes grounded synthesis. |
| F1: CEO favorite color | High risk of fabrication. | Should refuse instead of guessing. |
| F2: missing key or embeddings at runtime | May fail late or unpredictably. | Fails early with an explicit readiness message. |

## Bottom Line

The current Docwise AI app is stronger than a naive baseline because it treats this as a grounded document QA problem, not a general chat task. Its biggest gains are refusal behavior, visible evidence, and configuration-aware readiness checks.
