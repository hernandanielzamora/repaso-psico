import { questions, type QuestionType } from "../data";

export type Mode = QuestionType | "all";
export type Review = { mastered: boolean; attempts: number; date: string };
export type Progress = Record<string, Review>;
export const storageKey = "nucleo-progress-v1";

export function selectQuestions(subjectId: string, mode: Mode = "all", topic = "all") {
  return questions.filter((question) => question.subjectId === subjectId
    && (mode === "all" || question.type === mode)
    && (topic === "all" || question.topic === topic));
}

// Only accept known question IDs and valid records from browser storage.
export function parseProgress(raw: string | null): Progress {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const progress: Progress = {};
    for (const question of questions) {
      const record = (value as Record<string, unknown>)[question.id];
      if (!record || typeof record !== "object") continue;
      const item = record as Partial<Review>;
      if (typeof item.mastered === "boolean" && Number.isSafeInteger(item.attempts)
        && item.attempts! > 0 && typeof item.date === "string" && Number.isFinite(Date.parse(item.date))) {
        progress[question.id] = item as Review;
      }
    }
    return progress;
  } catch { return {}; }
}

export function subjectProgress(subjectId: string, progress: Progress) {
  const bank = selectQuestions(subjectId);
  const reviewed = bank.filter((question) => progress[question.id]).length;
  const mastered = bank.filter((question) => progress[question.id]?.mastered).length;
  return { total: bank.length, reviewed, mastered, percent: bank.length ? Math.round(reviewed / bank.length * 100) : 0 };
}
