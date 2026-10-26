import { questions } from "../data";
import { parseProgress, type Progress, type Review } from "./study";

export type ReviewEvent = { id: string; questionId: string; mastered: boolean; date: string };
export type SyncCache = { version: 1; active: boolean; baseline: Progress; events: ReviewEvent[]; identity?: string };
export const syncCacheKey = "nucleo-sync-v1";
export const syncChangedEvent = "nucleo-sync-local-change";
const ids = new Set(questions.map((q) => q.id));
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
let memory: SyncCache | null = null;
let unpersisted = false;

export function parseSyncCache(raw: string | null): SyncCache | null {
  try {
    const value = JSON.parse(raw ?? "null");
    if (!value || value.version !== 1 || typeof value.active !== "boolean" || !Array.isArray(value.events)) return null;
    const events = new Map<string, ReviewEvent>();
    for (const e of value.events) {
      if (e && typeof e.id === "string" && uuid.test(e.id) && ids.has(e.questionId) && typeof e.mastered === "boolean" && typeof e.date === "string" && Number.isFinite(Date.parse(e.date))) events.set(e.id, { id: e.id, questionId: e.questionId, mastered: e.mastered, date: e.date });
    }
    return { version: 1, active: value.active, baseline: parseProgress(JSON.stringify(value.baseline)), events: [...events.values()], ...(typeof value.identity === "string" && uuid.test(value.identity) ? { identity: value.identity } : {}) };
  } catch { return null; }
}

export function loadSyncCache() {
  if (unpersisted) return memory;
  try { const raw = localStorage.getItem(syncCacheKey); if (raw !== null) memory = parseSyncCache(raw) ?? memory; } catch {}
  return memory;
}
export function saveSyncCache(value: SyncCache, notify = true) {
  memory = value;
  let durable = true;
  try { localStorage.setItem(syncCacheKey, JSON.stringify(value)); unpersisted = false; } catch { durable = false; unpersisted = true; }
  if (notify) window.dispatchEvent(new Event(syncChangedEvent));
  return durable;
}
export function startSyncCache(progress: Progress) {
  const previous = loadSyncCache();
  const cache: SyncCache = previous ? { ...previous, active: true } : { version: 1, active: true, baseline: parseProgress(JSON.stringify(progress)), events: [] };
  saveSyncCache(cache); return cache;
}
export function enqueueReview(questionId: string, mastered: boolean, date: string) {
  const cache = loadSyncCache();
  // Before the first activation there is only the existing local aggregate.
  if (!cache || !ids.has(questionId)) return;
  const event: ReviewEvent = { id: crypto.randomUUID(), questionId, mastered, date };
  saveSyncCache({ ...cache, events: [...cache.events, event] });
}
export function acknowledgeEvents(sent: ReviewEvent[]) {
  const cache = loadSyncCache(); if (!cache) return [];
  const acknowledged = new Set(sent.map((event) => event.id));
  const events = cache.events.filter((event) => !acknowledged.has(event.id));
  saveSyncCache({ ...cache, events }, false); return events;
}

export function applyPendingEvents(progress: Progress, pending: ReviewEvent[]): Progress {
  const result = { ...progress };
  const seen = new Set<string>();
  for (const event of pending) {
    if (seen.has(event.id) || !ids.has(event.questionId)) continue;
    seen.add(event.id);
    const old = result[event.questionId];
    const newer = !old || Date.parse(event.date) >= Date.parse(old.date);
    const next: Review = { attempts: (old?.attempts ?? 0) + 1, mastered: newer ? event.mastered : old.mastered, date: newer ? event.date : old.date };
    result[event.questionId] = next;
  }
  return result;
}

export function parsePairingInput(value: string, origin: string): string | null {
  const input = value.trim();
  if (/^[a-f0-9]{64}$/.test(input)) return input;
  try {
    const url = new URL(input);
    if (url.origin !== origin) return null;
    return /^#vincular\/([a-f0-9]{64})$/.exec(url.hash)?.[1] ?? null;
  } catch { return null; }
}
