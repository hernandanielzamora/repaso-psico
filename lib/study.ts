import { questions, type QuestionType } from "../data";

export type Mode = QuestionType | "all";
export type Review = { mastered: boolean; attempts: number; date: string };
export type Progress = Record<string, Review>;
export const storageKey = "nucleo-progress-v1";

export type StudyScope = { unitIds?: string[]; includeFinalOnly?: boolean };

export function selectQuestions(subjectId: string, mode: Mode = "all", topic = "all", scope: StudyScope = {}) {
  return questions.filter((question) => question.subjectId === subjectId
    && (mode === "all" || question.type === mode)
    && (topic === "all" || question.topic === topic)
    && (!scope.unitIds || !!question.unit && scope.unitIds.includes(question.unit))
    && (scope.includeFinalOnly !== false || !question.finalOnly));
}

// Round-robin by unit keeps short mixed sessions from covering just the first unit.
export function buildSession<T extends { unit?: string; finalOnly?: boolean }>(bank: T[], limit: number, randomize = true): T[] {
  const pool = [...bank];
  if (randomize) {
    for (let index = pool.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [pool[index], pool[other]] = [pool[other], pool[index]];
    }
  }
  const groups = new Map<string, T[]>();
  for (const question of pool) {
    const key = question.finalOnly ? "final" : question.unit ?? "general";
    const group = groups.get(key) ?? [];
    group.push(question);
    groups.set(key, group);
  }
  const result: T[] = [];
  const count = Math.min(bank.length, Math.max(0, Math.floor(limit)));
  while (result.length < count) {
    for (const group of groups.values()) {
      const question = group.shift();
      if (question) result.push(question);
      if (result.length === count) break;
    }
  }
  return result;
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
