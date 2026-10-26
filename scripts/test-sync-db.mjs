import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const db = new PGlite();
const phone = "11111111-1111-4111-8111-111111111111";
const computer = "22222222-2222-4222-8222-222222222222";
const stranger = "33333333-3333-4333-8333-333333333333";
const baseline = { salmon: { attempts: 3, mastered: true, date: "2026-01-01T12:00:00Z" } };
const event = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", questionId: "salmon", mastered: false, date: "2026-01-02T12:00:00Z" };
async function as(user) { await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub', '${user}', false);`); }
async function sync(base = {}, events = []) { return (await db.query("select public.study_sync($1::jsonb,$2::jsonb) as value", [JSON.stringify(base), JSON.stringify(events)])).rows[0].value; }
async function link() { return (await db.query("select public.study_create_link() as value")).rows[0].value; }
async function rejects(action, pattern) { await assert.rejects(action, pattern); }
try {
  await db.exec("create role anon; create role authenticated; create schema auth; create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$; grant usage on schema auth to authenticated, anon; grant execute on function auth.uid() to authenticated, anon;");
  const sql = readFileSync(new URL("../supabase/sync.sql", import.meta.url), "utf8");
  await db.exec(sql);
  await db.exec(sql); // Migration may be applied twice without resetting data.
  await as(phone);
  let state = await sync(baseline, [event]);
  assert.equal(state.progress.salmon.attempts, 4);
  assert.equal(state.progress.salmon.mastered, false);
  state = await sync(baseline, [event]);
  assert.equal(state.progress.salmon.attempts, 4, "retry must not duplicate an attempt");
  const phoneProfile = state.profileId;
  await as(computer);
  state = await sync({ ...baseline, vigilance: { attempts: 2, mastered: true, date: "2026-01-01T12:00:00Z" } });
  assert.notEqual(state.profileId, phoneProfile);
  const invitation = await link();
  assert.equal(invitation.token.length, 64);
  await rejects(() => db.query("select public.study_confirm_link($1)", [invitation.token]), /other device/i);
  await as(stranger);
  assert.equal((await sync()).progress.salmon, undefined, "unrelated profile must see no foreign progress");
  assert.equal((await db.query("select public.study_link_status($1) as s", [invitation.id])).rows[0].s, "unavailable");
  await rejects(() => db.query("select * from public.study_events"), /permission denied/i);
  await rejects(() => db.query("select * from public.study_links"), /permission denied/i);
  await rejects(() => db.query("select public.study_confirm_link($1)", ["0".repeat(64)]), /invalid or expired/i);
  await as(phone);
  await db.query("select public.study_confirm_link($1)", [invitation.token]);
  state = await sync(baseline, [event]);
  assert.equal(state.devices, 2);
  assert.equal(state.progress.salmon.attempts, 4, "duplicate legacy baselines must not be added");
  assert.equal(state.progress.vigilance.attempts, 2, "computer's previous progress must be preserved");
  await rejects(() => db.query("select public.study_confirm_link($1)", [invitation.token]), /invalid or expired/i);
  await as(computer);
  assert.equal((await db.query("select public.study_link_status($1) as s", [invitation.id])).rows[0].s, "confirmed");
  const offline = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", questionId: "salmon", mastered: true, date: "2026-01-03T12:00:00Z" };
  state = await sync(baseline, [offline]);
  assert.equal(state.profileId, phoneProfile);
  assert.equal(state.progress.salmon.attempts, 5);
  assert.equal(state.progress.salmon.mastered, true);
  await as(phone);
  assert.equal((await sync()).progress.salmon.attempts, 5);
  const cancelled = await link();
  await db.query("select public.study_cancel_link($1)", [cancelled.id]);
  await as(computer);
  await rejects(() => db.query("select public.study_confirm_link($1)", [cancelled.token]), /invalid or expired/i);
  const expired = await link();
  await db.exec("reset role");
  await db.query("update public.study_links set expires_at = now() - interval '1 second' where id=$1", [expired.id]);
  await as(phone);
  await rejects(() => db.query("select public.study_confirm_link($1)", [expired.token]), /invalid or expired/i);
  await rejects(() => sync({}, [event, { ...event, id: "bad-id" }]), /uuid/i);
  assert.equal((await sync()).progress.salmon.attempts, 5, "invalid batch rolls back atomically");
  const future = { "rmf-indirecta": { attempts: 2, mastered: false, date: "2100-01-01T12:00:00Z" } };
  const firstDate = (await sync(future)).progress["rmf-indirecta"].date;
  assert.equal((await sync(future)).progress["rmf-indirecta"].date, firstDate, "a future baseline must not get a new server date on every retry");
  await sync(future, [{ id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", questionId: "rmf-indirecta", mastered: true, date: "2101-01-01T00:00:00Z" }]);
  assert.equal((await sync(future)).progress["rmf-indirecta"].mastered, true, "replayed legacy data cannot overwrite newer events");
  await db.exec("reset role; set role anon; select set_config('request.jwt.claim.sub', '', false);");
  await rejects(() => sync(), /permission denied/i);
  await db.exec("reset role; set role authenticated; select set_config('request.jwt.claim.sub', '', false);");
  await rejects(() => sync(), /authentication required/i);
  await db.exec("reset role");
  assert.equal((await db.query("select count(*)::int as n from pg_tables where schemaname='public' and tablename like 'study_%' and rowsecurity")).rows[0].n, 5);
  console.log("Sync SQL passed: isolated profiles, permission checks, repeatable migration, idempotent events, merging, token ownership, expiry and single use.");
} finally { await db.close(); }
