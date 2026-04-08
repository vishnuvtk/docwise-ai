import "server-only";
import { questionAnsweringService } from "@/lib/qa/service";

export function getQueryAvailability() {
  return questionAnsweringService.getAvailability();
}

export async function answerQuestion(question: string) {
  return questionAnsweringService.answer(question);
}
