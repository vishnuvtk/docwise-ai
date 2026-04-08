## Parent PRD

#1

## What to build

Finish the server-side answer generation contract so Docwise AI produces concise grounded answers from retrieved chunks only, with required inline citations and refusal fallback when citation quality is not sufficient. This slice should establish the trust contract between retrieval, generation, and the API response returned to the UI.

## Acceptance criteria

- [ ] The answer-generation step uses only retrieved document excerpts and never broadens to the full corpus or outside knowledge.
- [ ] Successful answers include inline citations and support visible source passage rendering in the UI response payload.
- [ ] If the model cannot produce a properly grounded cited answer, the system returns a refusal rather than an uncited or weakly supported answer.

## Blocked by

- Blocked by #4

## User stories addressed

- User story 5
- User story 6
- User story 7
- User story 8
- User story 9
- User story 12
- User story 17
