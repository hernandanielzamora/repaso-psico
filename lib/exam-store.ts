"use client";

import { useSyncExternalStore } from "react";
import { subjects } from "../data";

export type Exam = "first" | "second" | "final";
type PartialExam = Exclude<Exam, "final">;
type Preferences = Record<string, Partial<Record<PartialExam, string[]>>>;
type Snapshot = { preferences: Preferences; warning: string };
export const examStorageKey = "nucleo-exams-v1";
const empty: Snapshot = { preferences: {}, warning: "" };
let current = empty;
let initialized = false;
const listeners = new Set<() => void>();

export function parseExamPreferences(raw: string | null): Preferences {
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const result: Preferences = {};
    for (const subject of subjects.filter((item) => item.units)) {
      const candidate = (parsed as Record<string, unknown>)[subject.id];
      if (!candidate || typeof candidate !== "object") continue;
      const settings: Partial<Record<PartialExam, string[]>> = {};
      for (const exam of ["first", "second"] as const) {
        const ids = (candidate as Record<string, unknown>)[exam];
        if (Array.isArray(ids)) settings[exam] = subject.units!.filter((unit) => ids.includes(unit.id)).map((unit) => unit.id);
      }
      result[subject.id] = settings;
    }
    return result;
  } catch { return {}; }
}

function readStorage() {
  try { current = { preferences: parseExamPreferences(localStorage.getItem(examStorageKey)), warning: "" }; }
  catch { current = { ...current, warning: "La selección de unidades se conservará solo durante esta visita: el navegador no permite guardarla." }; }
}
function getSnapshot() {
  if (!initialized) { readStorage(); initialized = true; }
  return current;
}
function storageChanged(event: StorageEvent) {
  if (event.key !== examStorageKey && event.key !== null) return;
  readStorage(); listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", storageChanged);
  return () => { listeners.delete(listener); if (!listeners.size) window.removeEventListener("storage", storageChanged); };
}
export function setExamUnits(subjectId: string, exam: PartialExam, unitIds: string[]) {
  getSnapshot();
  const preferences = parseExamPreferences(JSON.stringify({ ...current.preferences,
    [subjectId]: { ...current.preferences[subjectId], [exam]: unitIds } }));
  current = { preferences, warning: "" };
  try { localStorage.setItem(examStorageKey, JSON.stringify(preferences)); }
  catch { current.warning = "No se pudo guardar la selección de unidades. Se mantiene durante esta visita."; }
  listeners.forEach((listener) => listener());
}
export function useExamPreferences() { return useSyncExternalStore(subscribe, getSnapshot, () => empty); }
