## Parent PRD

#1

## What to build

Make runtime readiness and setup failures first-class behavior so Docwise AI remains understandable when keys, embeddings, or bundled data are missing or invalid. This slice should cover both the API and the UI-facing status model so setup problems fail honestly instead of crashing or silently degrading.

## Acceptance criteria

- [ ] The application can distinguish between ready and not-ready runtime states, including missing model credentials, missing embeddings, and empty or unusable indexes.
- [ ] The ask API returns clear validation and availability errors for malformed input and unavailable runtime conditions.
- [ ] The user-facing experience explains setup failures in plain language while preserving access to non-Q&A parts of the app where appropriate.

## Blocked by

- Blocked by #3
- Blocked by #5

## User stories addressed

- User story 22
- User story 23
- User story 28
- User story 29
