"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadSyncCache, saveSyncCache } from "./sync-data";

export const cloudConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
let client: SupabaseClient | null = null;
let signingIn: Promise<void> | null = null;
export function getCloudClient() {
  if (!cloudConfigured) throw new Error("Cloud is not configured");
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storageKey: "nucleo-cloud-auth-v1", persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(15000) }) }
  });
  return client;
}
export async function ensureCloudUser() {
  if (signingIn) return signingIn;
  signingIn = (async () => {
    const api = getCloudClient();
    const { data, error } = await api.auth.getSession();
    if (error) throw error;
    const cache = loadSyncCache();
    if (cache?.identity && (!data.session || data.session.user.id !== cache.identity)) throw new Error("Cloud session missing");
    if (data.session) {
      if (cache && !cache.identity) saveSyncCache({ ...cache, identity: data.session.user.id }, false);
      return;
    }
    const result = await api.auth.signInAnonymously();
    if (result.error) throw result.error;
    const current = loadSyncCache();
    if (current && result.data.user) saveSyncCache({ ...current, identity: result.data.user.id }, false);
  })().finally(() => { signingIn = null; });
  return signingIn;
}
