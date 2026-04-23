# Improvement Note

## Highest-Value Next Improvement

Split bundled text documents into smaller semantic chunks instead of indexing each text file as one large chunk.

## Why This Matters

Right now, each of the three bundled text files is effectively retrieved as a single chunk. That works for this tiny corpus, but it creates two weaknesses:

- evidence is broader than necessary, so citations point to a whole document-sized block instead of the exact supporting passage
- unsupported or partially supported questions may still retrieve a vaguely related document, which makes refusal depend more heavily on score thresholds

## Expected Benefit

Smaller chunks would make the app more precise on questions like:

- "Who must be notified if billing is affected?"
- "What exactly happens when the Gemini API key is missing during build?"
- "Is v1 multi-turn?"

The answer would still come from the same documents, but retrieval would be tighter and the visible evidence would be easier to trust.

## Suggested Follow-Up

Update `scripts/build-document-index.mjs` so Markdown and TXT files are split into smaller sections or paragraph groups before embeddings are generated, then rebuild `data/document-index.json`. After that, rerun this evaluation set and compare:

- answer precision
- refusal quality on unsupported prompts
- excerpt usefulness in the UI

## Why This Improvement Was Chosen

This change improves the current system without changing its product scope. It strengthens the main promise of Docwise AI: answer only from the files that shipped, and show exactly why the answer is justified.
