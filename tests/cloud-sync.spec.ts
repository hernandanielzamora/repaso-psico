import { test, expect, type BrowserContext } from "@playwright/test";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { applyPendingEvents, parsePairingInput, parseSyncCache } from "../lib/sync-data";

test("sync input and pending-event merging preserve newer work without accepting foreign links", () => {
  const baseline = { salmon: { attempts: 3, mastered: true, date: "2026-01-02T00:00:00Z" } };
  const event = { id: randomUUID(), questionId: "salmon", mastered: false, date: "2026-01-01T00:00:00Z" };
  const merged = applyPendingEvents(baseline, [event, event]);
  expect(merged.salmon.attempts).toBe(4);
  expect(merged.salmon.mastered).toBe(true);
  expect(baseline.salmon.attempts).toBe(3);
  expect(applyPendingEvents(baseline, [{ ...event, date: "2026-01-03T00:00:00Z" }]).salmon.mastered).toBe(false);
  expect(parseSyncCache("bad")).toBeNull();
  expect(parseSyncCache(JSON.stringify({ version: 1, active: true, baseline, events: [event, event, { ...event, id: "invalid" }] }))!.events).toHaveLength(1);
  const token = "a".repeat(64);
  expect(parsePairingInput(`http://127.0.0.1:3100/#vincular/${token}`, "http://127.0.0.1:3100")).toBe(token);
  expect(parsePairingInput(`https://other.example/#vincular/${token}`, "http://127.0.0.1:3100")).toBeNull();
  expect(parsePairingInput("short", "http://127.0.0.1:3100")).toBeNull();
});

test("two browser devices link and synchronize completed reviews through the real SQL functions", async ({ browser }) => {
  test.setTimeout(90000);
  const db = new PGlite();
  const contexts: BrowserContext[] = [];
  let serial: Promise<unknown> = Promise.resolve();
  function locked<T>(fn: () => Promise<T>): Promise<T> { const next = serial.then(fn, fn); serial = next.catch(() => {}); return next; }
  try {
    await db.exec("create role anon; create role authenticated; create schema auth; create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$; grant usage on schema auth to authenticated, anon; grant execute on function auth.uid() to authenticated, anon;");
    await db.exec(readFileSync("supabase/sync.sql", "utf8"));
    async function device(progress: object) {
      const uid = randomUUID();
      const mobile = test.info().project.name === "mobile";
      const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, isMobile: mobile, hasTouch: mobile }); contexts.push(context);
      await context.addInitScript((value) => { if (!localStorage.getItem("nucleo-progress-v1")) localStorage.setItem("nucleo-progress-v1", JSON.stringify(value)); }, progress);
      await context.route(/^https:\/\/[^/]+\.supabase\.co\//, async (route) => {
        const request = route.request(); const url = new URL(request.url());
        const headers = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "content-type": "application/json" };
        if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers });
        if (url.pathname.startsWith("/auth/v1/")) {
          const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: uid, aud: "authenticated", role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url")}.test`;
          return route.fulfill({ headers, json: { access_token: token, refresh_token: `test-${uid}`, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: uid, aud: "authenticated", role: "authenticated", is_anonymous: true, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } } });
        }
        const name = url.pathname.split("/").at(-1);
        const args = request.postDataJSON() ?? {};
        try {
          const value = await locked(async () => {
            await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub', '${uid}', false);`);
            if (name === "study_sync") return (await db.query<{ value: unknown }>("select public.study_sync($1::jsonb,$2::jsonb) as value", [JSON.stringify(args.p_baseline), JSON.stringify(args.p_events)])).rows[0].value;
            if (name === "study_create_link") return (await db.query<{ value: unknown }>("select public.study_create_link() as value")).rows[0].value;
            if (name === "study_link_status") return (await db.query<{ value: unknown }>("select public.study_link_status($1) as value", [args.p_id])).rows[0].value;
            if (name === "study_confirm_link") { await db.query("select public.study_confirm_link($1)", [args.p_token]); return null; }
            if (name === "study_cancel_link") { await db.query("select public.study_cancel_link($1)", [args.p_id]); return null; }
            throw new Error("Unknown test RPC");
          });
          await route.fulfill({ headers, body: JSON.stringify(value) });
        } catch (error) { await route.fulfill({ status: 400, headers, json: { message: error instanceof Error ? error.message : "Test database error" } }); }
      });
      const page = await context.newPage();
      await page.goto("http://127.0.0.1:3100/");
      await page.locator("summary").filter({ hasText: "Sincronizar dispositivos" }).click();
      await page.getByRole("button", { name: "Activar sincronización", exact: true }).click();
      await expect(page.getByText(/Progreso sincronizado\./).first()).toBeVisible();
      return { page, context };
    }
    const phone = await device({ salmon: { attempts: 3, mastered: true, date: "2026-01-01T12:00:00Z" } });
    const computer = await device({ salmon: { attempts: 3, mastered: true, date: "2026-01-01T12:00:00Z" }, vigilance: { attempts: 2, mastered: false, date: "2026-01-02T12:00:00Z" } });
    await computer.page.getByRole("button", { name: "Mostrar QR para vincular este dispositivo" }).click();
    await expect(computer.page.getByRole("img", { name: "QR temporal para vincular este dispositivo" })).toBeVisible();
    expect(await computer.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await computer.page.screenshot({ path: `.scratch/sync-${test.info().project.name}.png`, fullPage: true });
    const url = await computer.page.getByLabel("Enlace de vinculación (también podés copiarlo)").inputValue();
    await phone.page.getByLabel("Enlace o código recibido").fill(url);
    await phone.page.getByRole("button", { name: "Confirmar vínculo con mi progreso" }).click();
    await expect(phone.page.getByText("Vinculación confirmada. Ambos dispositivos comparten el progreso.")).toBeVisible();
    await expect(computer.page.getByText("Dispositivo vinculado. Se combinaron los avances.")).toBeVisible({ timeout: 15000 });
    const read = () => computer.page.evaluate(() => JSON.parse(localStorage.getItem("nucleo-progress-v1")!));
    await expect.poll(async () => (await read()).vigilance?.attempts).toBe(2);
    expect((await read()).salmon.attempts).toBe(3);

    await phone.page.evaluate(() => { location.hash = "#subject/psicologia-experimental"; });
    await phone.page.getByLabel("Forma de practicar").selectOption("choice");
    await phone.page.getByRole("combobox", { name: "Tema", exact: true }).selectOption("Estadística");
    await phone.page.getByRole("button", { name: "Empezar sesión" }).click();
    await phone.context.setOffline(true);
    await phone.page.getByRole("radio").nth(1).check();
    await phone.page.getByRole("button", { name: "Comprobar respuesta" }).click();
    await expect(phone.page.getByText(/Sin conexión\. Los avances quedan pendientes/)).toBeVisible();
    expect(await phone.page.evaluate(() => JSON.parse(localStorage.getItem("nucleo-sync-v1")!).events.length)).toBe(1);
    await phone.context.setOffline(false);
    await phone.page.evaluate(() => window.dispatchEvent(new Event("online")));
    await expect.poll(() => phone.page.evaluate(() => JSON.parse(localStorage.getItem("nucleo-sync-v1")!).events.length)).toBe(0);
    await computer.page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await expect.poll(async () => (await read()).salmon?.attempts, { timeout: 15000 }).toBe(4);
    expect((await read()).salmon.mastered).toBe(true);
    await computer.page.getByRole("button", { name: "Sincronizar ahora", exact: true }).click();
    await expect(computer.page.getByText(/Progreso sincronizado\./).first()).toBeVisible();
    expect((await read()).salmon.attempts).toBe(4);
    await computer.page.getByRole("button", { name: "Pausar sincronización" }).click();
    await expect(computer.page.getByText(/Sincronización pausada/)).toBeVisible();
  } finally { for (const context of contexts) await context.close(); await db.close(); }
});
