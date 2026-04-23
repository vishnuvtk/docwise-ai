# Assignment 6 Evaluation Cases

This evaluation set uses the current Docwise AI app as the system under test. It is aligned to the bundled document library that ships in this repo today:

- `documents/support-playbook.md`
- `documents/launch-notes.md`
- `documents/product-overview.txt`

The app is expected to answer only from these documents, return concise cited answers, show supporting excerpts, and refuse unsupported questions instead of guessing.

## Representative Cases

| ID | User question | Why this case matters | Expected grounded outcome | Expected source focus |
| --- | --- | --- | --- | --- |
| R1 | What is the support escalation window for a high-severity launch blocker? | Direct fact lookup from the support document. | Answered. The response should say high-severity launch blockers are escalated to the operations lead within two hours of confirmation. | `support-playbook.md` |
| R2 | If a blocker affects billing or contract obligations, who else needs to be notified and when? | Multi-clause retrieval from one document. | Answered. The response should say the finance partner must also be notified the same day. | `support-playbook.md` |
| R3 | Summarize the v1 launch plan in two sentences. | Short synthesis across launch constraints. | Answered. The response should mention a small bundled document set, Vercel deployment, a server-side Node.js route, and a bundled retrieval index generated before deployment. | `launch-notes.md` |
| R4 | What happens if the Gemini API key is missing during build time? | Important product/runtime limitation described in the docs. | Answered. The response should say the app can still render the document list, but question answering remains disabled until the index is regenerated. | `launch-notes.md` |
| R5 | Is the first release multi-turn, and how should answers be written? | Checks product behavior and answer-style constraints. | Answered. The response should say v1 is single-turn only and answers should stay concise by default. | `product-overview.txt` |

## Failure Cases

| ID | User question or condition | Why this should fail | Expected app behavior | Expected source focus |
| --- | --- | --- | --- | --- |
| F1 | Who is the CEO's favorite color? | The bundled library does not contain this information. | Refused. The app should say it cannot find enough support in the bundled documents and should not invent an answer. | Weak or irrelevant retrieval may still surface, but the final state should be refusal. |
| F2 | Ask a valid question while `GEMINI_API_KEY` is missing or the bundled index has no embeddings. | The app is not ready for Q&A in this state. | Availability failure. The UI should disable asking, and the API should return an error instead of attempting answer generation. | Runtime readiness message, not document evidence. |

## Evaluation Notes

- Exact answer wording may vary because synthesis is model-generated.
- For answered cases, success means the factual content is correct, grounded in the bundled corpus, and includes inline citations in the answer.
- For refusal cases, success means the app declines to answer rather than filling gaps with outside knowledge.
