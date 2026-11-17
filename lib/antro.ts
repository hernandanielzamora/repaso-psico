import { antroQuestions, antroUnits } from "../content/antro";
import type { Question } from "../data";

// Elección editorial: una consigna por unidad y una transversal. No es un formato oficial.
export function generateAntroFinal(previousIds: string[] = [], random: () => number = Math.random): Question[] {
  const choose = (pool: Question[]) => {
    const fresh = pool.filter((question) => !previousIds.includes(question.id));
    const candidates = fresh.length ? fresh : pool;
    return candidates[Math.min(candidates.length - 1, Math.max(0, Math.floor(random() * candidates.length)))];
  };
  const regular = antroUnits.map((unit) => choose(antroQuestions.filter((question) => question.unit === unit.id && !question.finalOnly)));
  const hasCase = regular.some((question) => question.type === "case-study");
  const integration = choose(antroQuestions.filter((question) => question.finalOnly && (hasCase || question.type === "case-study")));
  return [...regular, integration];
}

export type WrittenRating = "achieved" | "partial" | "incorrect";
export const writtenRatingLabels: Record<WrittenRating, string> = { achieved: "Logrado", partial: "Incompleto", incorrect: "Incorrecto o ausente" };
export function writtenOutcome(ratings: WrittenRating[]) {
  return ratings.length > 0 && ratings.every((rating) => rating === "achieved");
}
