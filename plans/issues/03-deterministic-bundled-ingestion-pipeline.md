## Parent PRD

#1

## What to build

Harden the bundled document ingestion pipeline so Docwise AI can reliably transform a small developer-controlled document library into a deterministic precomputed index for deployment. This slice should cover supported file handling, parse-failure behavior, chunk and metadata generation, and build-time index output suitable for shipping with the app.

## Acceptance criteria

- [ ] Supported bundled documents are discovered, parsed, cleaned, chunked, and serialized into a reproducible precomputed index.
- [ ] Unsupported or broken files are handled gracefully with warnings while the rest of the corpus remains usable.
- [ ] The generated index contains the metadata needed by runtime retrieval and source display, including document identity, chunk identity, excerpts, and page information when available.

## Blocked by

None - can start immediately

## User stories addressed

- User story 4
- User story 13
- User story 14
- User story 15
- User story 16
- User story 19
- User story 29
