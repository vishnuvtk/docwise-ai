## Parent PRD

#1

## What to build

Introduce the initial unit-test harness and meaningful automated coverage for the core trust-critical server behavior in Docwise AI. This slice should establish a sustainable testing baseline for index generation outputs, retrieval ranking, refusal rules, and citation-gating behavior without coupling tests to internal implementation trivia.

## Acceptance criteria

- [ ] The repository includes a working unit-test setup appropriate for the current Next.js codebase and server-side modules.
- [ ] Automated unit coverage exercises index/runtime behavior plus retrieval and answer/refusal decisions using stable, behavior-focused assertions.
- [ ] The test suite can validate citation-gating and unsupported-question outcomes in a deterministic way using controlled fixtures or mocks.

## Blocked by

- Blocked by #3
- Blocked by #4
- Blocked by #5

## User stories addressed

- User story 24
