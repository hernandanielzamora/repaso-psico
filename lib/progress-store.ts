"use client";

import { useSyncExternalStore } from "react";
import { parseProgress, storageKey, type Progress } from "./study";

type Snapshot = { progress: Progress; warning: string };
const empty: Snapshot = { progress: {}, warning: "" };
let snapshot = empty;
let loaded = false;
const listeners = new Set<() => void>();

function readStorage() {
  try { snapshot = { progress: parseProgress(window.localStorage.getItem(storageKey)), warning: "" }; }
  catch { snapshot = { ...snapshot, warning: "El navegador no permite guardar el progreso. Podés practicar, pero el avance de esta visita se perderá al cerrar." }; }
}

function getSnapshot() {
  if (!loaded) { readStorage(); loaded = true; }
  return snapshot;
}

function onStorage(event: StorageEvent) {
  if (event.key !== storageKey && event.key !== null) return;
  readStorage();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("storage", onStorage);
  };
}

export function recordReview(id: string, mastered: boolean) {
  getSnapshot();
  try { snapshot = { ...snapshot, progress: { ...snapshot.progress, ...parseProgress(window.localStorage.getItem(storageKey)) } }; }
  catch { /* Keep in-memory progress if storage is unavailable. */ }
  const progress = { ...snapshot.progress, [id]: {
    mastered, attempts: (snapshot.progress[id]?.attempts ?? 0) + 1, date: new Date().toISOString()
  } };
  snapshot = { progress, warning: "" };
  try { window.localStorage.setItem(storageKey, JSON.stringify(progress)); }
  catch { snapshot.warning = "No se pudo guardar el progreso en este navegador. Se conserva durante esta visita."; }
  listeners.forEach((listener) => listener());
}

export function useProgress() {
  return useSyncExternalStore(subscribe, getSnapshot, () => empty);
}
