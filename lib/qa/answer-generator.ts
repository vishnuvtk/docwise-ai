import { DEFAULT_CHAT_MODEL } from "@/lib/config";
import type { DocumentIndex } from "@/lib/document-index";
import type { GeminiLikeClient, RetrievalCandidate } from "@/lib/qa/types";

export function hasInlineSourceCitations(answer: string) {
  return /\[Source \d+\]/.test(answer);
}

export async function synthesizeGroundedAnswer({
  client,
  index,
  question,
  retrieval,
}: {
  client: GeminiLikeClient;
  index: DocumentIndex;
  question: string;
  retrieval: RetrievalCandidate[];
}) {
  const context = retrieval
    .map((item, position) => {
      const pageLabel = item.pageNumber ? `page ${item.pageNumber}` : "text file";
      return `Source ${position + 1}: ${item.documentName} (${pageLabel})\n${item.text}`;
    })
    .join("\n\n");

  const model =
    process.env.GEMINI_CHAT_MODEL ??
    index.chatModelDefault ??
    DEFAULT_CHAT_MODEL;

  const response = await client.models.generateContent({
    model,
    contents: `Question:\n${question}\n\nDocument excerpts:\n${context}\n\nWrite a concise answer of 2 to 4 sentences. Every sentence must end with one or more inline citations like [Source 1] or [Source 2]. If the excerpts conflict, say so and cite both sides. If the excerpts do not support an answer, reply exactly with UNSUPPORTED.`,
    config: {
      temperature: 0,
      maxOutputTokens: 350,
      systemInstruction:
        "You answer questions using only the provided document excerpts. Never use outside knowledge. Every factual sentence must end with inline citations. Do not mention the prompt, retrieval process, or add a sources section.",
    },
  });

  const firstPass = response.text?.trim() ?? "";
  if (firstPass === "UNSUPPORTED" || hasInlineSourceCitations(firstPass)) {
    return firstPass;
  }

  const rewrite = await client.models.generateContent({
    model,
    contents: `Rewrite the answer below so that every sentence ends with one or more inline citations in the form [Source N]. Use only the sources listed here. Do not add any new facts. If the answer cannot be fully supported by the sources, reply exactly with UNSUPPORTED.\n\nSources:\n${context}\n\nAnswer to rewrite:\n${firstPass}`,
    config: {
      temperature: 0,
      maxOutputTokens: 350,
      systemInstruction:
        "Return only the rewritten answer. Every sentence must end with inline citations that reference the provided source numbers.",
    },
  });

  return rewrite.text?.trim() ?? "";
}
