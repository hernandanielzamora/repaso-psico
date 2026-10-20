import { test, expect } from "@playwright/test";
import { atencionQuestions, atencionTopics, atencionUnits } from "../content/atencion";
import { buildSession, selectQuestions, storageKey } from "../lib/study";

const id = "psicobiologia-tp1";

test("TP1 source coverage and session sampling stay separate from the second partial", () => {
  expect(atencionQuestions).toHaveLength(48);
  expect(new Set(atencionQuestions.map((q) => q.type)).size).toBe(6);
  for (const [index, unit] of atencionUnits.entries()) {
    const bank = selectQuestions(id, "all", atencionTopics[index], { unitIds: [unit.id] });
    expect(bank.length).toBeGreaterThanOrEqual(6);
    for (const q of bank) {
      expect(q.sourcePages![0]).toBeGreaterThanOrEqual(unit.pages[0]);
      expect(q.sourcePages![1]).toBeLessThanOrEqual(unit.pages[1]);
      expect(q.sourcePages![0]).toBeLessThanOrEqual(q.sourcePages![1]);
      expect(q.source).toContain("Resumen_Psicobiologia_Experimental.pdf");
      expect(q.finalOnly).not.toBe(true);
    }
  }
  const short = buildSession(atencionQuestions, 10);
  expect(new Set(short.map((q) => q.unit)).size).toBe(5);
  expect(new Set(short.map((q) => q.id)).size).toBe(10);
  expect(selectQuestions("psicobiologia-experimental").some((q) => q.id.startsWith("atencion-"))).toBe(false);
});

for (const mode of ["choice", "true-false", "development", "case-study", "flashcard", "image-analysis"] as const) {
  test(`TP1 ${mode}: feedback, source, persistence and pending review`, async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link").filter({ has: page.getByRole("heading", { name: "Psicobiología Experimental · TP 1", exact: true }) }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Psicobiología Experimental · TP 1");
    await expect(page.getByLabel("Estoy preparando")).toHaveCount(0);
    await page.getByLabel("Forma de practicar").selectOption(mode);
    await page.getByLabel("Variar el orden en cada sesión").uncheck();
    await page.getByRole("button", { name: "Empezar sesión" }).click();
    const first = buildSession(selectQuestions(id, mode), 10, false)[0];
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(first.prompt);
    if (first.options) {
      await page.getByRole("radio").nth((first.answer! + 1) % first.options.length).check();
      await page.getByRole("button", { name: "Comprobar respuesta" }).click();
    } else {
      if (mode === "flashcard") await expect(page.getByRole("textbox")).toHaveCount(0);
      else await page.getByLabel("Tu respuesta", { exact: true }).fill("Distingo las medidas, los resultados y las interpretaciones del texto.");
      if (mode === "image-analysis") await expect(page.getByRole("img", { name: first.media!.alt, exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Ver guía de respuesta" }).click();
      await page.getByRole("button", { name: "Necesito repasar" }).click();
    }
    await expect(page.getByText(`Fuente: ${first.source}`, { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Volver a la materia" }).click();
    await page.reload();
    const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
    expect(progress[first.id].mastered).toBe(false);
    await page.getByLabel("Solo pendientes de repaso").check();
    await page.getByRole("button", { name: "Empezar sesión" }).click();
    await expect(page.getByText("Pregunta 1 de 1", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(first.prompt);
  });
}

test("TP1 reading shortcuts and integrative topic work at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto(`/#subject/${id}`);
  await page.getByLabel("Variar el orden en cada sesión").uncheck();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole("button", { name: /Lectura 3 · Funes y Lupiáñez/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(selectQuestions(id, "all", "all", { unitIds: ["u3"] })[0].prompt);
  await page.getByRole("link", { name: "Volver a la materia" }).click();
  await page.getByLabel("Variar el orden en cada sesión").uncheck();
  await page.getByRole("combobox", { name: "Tema", exact: true }).selectOption("Integración entre autores");
  await page.getByRole("button", { name: "Empezar sesión" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(selectQuestions(id, "all", "Integración entre autores")[0].prompt);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
