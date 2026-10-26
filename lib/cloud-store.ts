"use client";

import { useSyncExternalStore } from "react";
import { parseProgress } from "./study";
import { currentProgress, replaceCloudProgress } from "./progress-store";
import { acknowledgeEvents, applyPendingEvents, loadSyncCache, saveSyncCache, startSyncCache, syncCacheKey, syncChangedEvent } from "./sync-data";
import { cloudConfigured, ensureCloudUser, getCloudClient } from "./supabase-client";

type CloudState = { active: boolean; phase: "local" | "syncing" | "synced" | "offline" | "error"; message: string; lastSync: string; devices: number; pending: number };
const empty: CloudState = { active: false, phase: "local", message: "Progreso guardado en este navegador.", lastSync: "", devices: 0, pending: 0 };
let snapshot = empty;
let started = false, busy = false, again = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let interval: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();
let stopListeners: (() => void) | undefined;
function update(value: Partial<CloudState>) { snapshot = { ...snapshot, ...value }; listeners.forEach((listener) => listener()); }

export function cloudError(error: unknown): string {
  const message = error && typeof error === "object" && "message" in error ? String(error.message) : String(error);
  if (/anonymous.*(disabled|not allowed)|anonymous_provider_disabled/i.test(message)) return "Activá Anonymous Sign-Ins en Authentication de Supabase.";
  if (/study_|schema cache|function.*not.*found|PGRST202/i.test(message)) return "Falta ejecutar supabase/sync.sql en el SQL Editor del proyecto de Supabase.";
  if (/invalid or expired link/i.test(message)) return "El vínculo venció, ya se usó o no es válido. Generá un QR nuevo.";
  if (/other device/i.test(message)) return "Confirmá este QR desde el otro dispositivo, no desde el que lo muestra.";
  if (/another shared profile/i.test(message)) return "Ese dispositivo ya comparte otro perfil. No se modificó la vinculación existente.";
  if (/too many links/i.test(message)) return "Se generaron demasiados vínculos. Esperá antes de solicitar otro.";
  if (/JWT|refresh token|session.*missing/i.test(message)) return "La sesión de sincronización venció. Tus avances siguen locales; volvé a activar la conexión.";
  return "No se pudo conectar con Supabase. El progreso sigue local y se reintentará al recuperar la conexión.";
}

export function scheduleCloudSync() {
  if (timer) clearTimeout(timer);
  const cache = loadSyncCache();
  update({ active: cache?.active ?? false, pending: cache?.events.length ?? 0 });
  if (!cache?.active) return;
  if (!navigator.onLine) { update({ phase: "offline", message: "Sin conexión. Los avances quedan pendientes para enviarse al reconectar." }); return; }
  if (cache.events.length) update({ phase: "syncing", message: "Revisiones pendientes de enviar…" });
  timer = setTimeout(() => { void syncNow(); }, 750);
}

export async function syncNow() {
  const cache = loadSyncCache();
  if (!cache?.active || !cloudConfigured) return;
  if (busy) { again = true; return; }
  if (!navigator.onLine) { update({ phase: "offline", message: "Sin conexión. Los avances quedan pendientes para enviarse al reconectar.", pending: cache.events.length }); return; }
  busy = true; again = false;
  update({ active: true, phase: "syncing", message: "Sincronizando progreso…", pending: cache.events.length });
  try {
    await ensureCloudUser();
    const batch = cache.events.slice(0, 200);
    const { data, error } = await getCloudClient().rpc("study_sync", { p_baseline: cache.baseline, p_events: batch });
    if (error) throw error;
    if (!data || typeof data.profileId !== "string" || typeof data.devices !== "number" || !data.progress || typeof data.progress !== "object") throw new Error("Invalid cloud response");
    const pending = acknowledgeEvents(batch);
    replaceCloudProgress(applyPendingEvents(parseProgress(JSON.stringify(data.progress)), pending));
    update({ ...(loadSyncCache()?.active ? { phase: "synced" as const, message: "Progreso sincronizado." } : {}), lastSync: new Date().toISOString(), devices: data.devices, pending: pending.length });
    if (pending.length) again = true;
  } catch (error) { update({ phase: navigator.onLine ? "error" : "offline", message: cloudError(error) }); }
  finally { busy = false; if (again) scheduleCloudSync(); }
}

export async function activateCloud() {
  if (!cloudConfigured) { update({ phase: "error", message: "Falta configurar la URL y la clave pública de Supabase para esta versión de la app." }); return; }
  startSyncCache(currentProgress());
  update({ active: true });
  await syncNow();
}
export function pauseCloud() {
  const cache = loadSyncCache();
  if (cache) saveSyncCache({ ...cache, active: false });
  update({ active: false, phase: "local", message: "Sincronización pausada. Los avances nuevos siguen guardándose localmente." });
}

function start() {
  if (started) return;
  started = true;
  const cache = loadSyncCache();
  update({ active: cache?.active ?? false, pending: cache?.events.length ?? 0 });
  const storageChanged = (event: StorageEvent) => { if (event.key === syncCacheKey) scheduleCloudSync(); };
  const offline = () => { if (loadSyncCache()?.active) update({ phase: "offline", message: "Sin conexión. Tu avance se enviará al reconectar." }); };
  const visibility = () => { if (!document.hidden) scheduleCloudSync(); };
  window.addEventListener(syncChangedEvent, scheduleCloudSync);
  window.addEventListener("storage", storageChanged);
  window.addEventListener("online", scheduleCloudSync);
  window.addEventListener("offline", offline);
  window.addEventListener("focus", scheduleCloudSync);
  document.addEventListener("visibilitychange", visibility);
  stopListeners = () => {
    window.removeEventListener(syncChangedEvent, scheduleCloudSync); window.removeEventListener("storage", storageChanged);
    window.removeEventListener("online", scheduleCloudSync); window.removeEventListener("offline", offline); window.removeEventListener("focus", scheduleCloudSync);
    document.removeEventListener("visibilitychange", visibility); if (timer) clearTimeout(timer);
  };
  interval = setInterval(() => { if (!document.hidden) void syncNow(); }, 15000);
  if (cache?.active) scheduleCloudSync();
}
function subscribe(listener: () => void) {
  listeners.add(listener); start();
  return () => {
    listeners.delete(listener);
    if (!listeners.size) { if (interval) clearInterval(interval); interval = undefined; stopListeners?.(); started = false; }
  };
}
export function useCloudState() { return useSyncExternalStore(subscribe, () => snapshot, () => empty); }
