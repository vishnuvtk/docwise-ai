## Parent PRD

#1

## What to build

Strengthen the server-side retrieval and refusal engine so Docwise AI can search across the bundled library and make trustworthy decisions about when to answer versus refuse. This slice should deliver a clear end-to-end retrieval contract that ranks chunks, detects weak support, and preserves conflicting evidence instead of guessing.

## Acceptance criteria

- [ ] Questions are embedded and matched against the bundled index using semantic retrieval across the whole document library.
- [ ] Retrieval behavior includes a clear support threshold that causes unsupported or weakly supported questions to refuse instead of generating speculative answers.
- [ ] The retrieval module exposes stable outputs that can support answer generation, conflict handling, and later automated tests without coupling to the UI.

## Blocked by

- Blocked by #3

## User stories addressed

- User story 3
- User story 5
- User story 10
- User story 11
- User story 12
- User story 18
- User story 20
- User story 21
