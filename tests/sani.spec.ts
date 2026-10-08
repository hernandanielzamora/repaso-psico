import { test, expect, type Page } from "@playwright/test";
import { questions, subjects, type Question } from "../data";
import { saniQuestions, saniUnits } from "../content/sani";
import { buildSession, selectQuestions, parseProgress, storageKey } from "../lib/study";
import { examStorageKey, parseExamPreferences } from "../lib/exam-store";

async function openSani(page: Page) {
  await page.goto("/#subject/sani");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Psicología Sanitaria");
  await expect(page.getByLabel("Estoy preparando")).toHaveValue("final");
}

async function answer(page: Page, question: Question, last: boolean, mastered = true) {
  if (question.options) {
    await page.getByRole("radio").nth(mastered ? question.answer! : (question.answer! + 1) % question.options.length).check();
    await page.getByRole("button", { name: "Comprobar respuesta" }).click();
  } else {
    if (question.type === "flashcard") await expect(page.getByRole("textbox")).toHaveCount(0);
    else {
      await expect(page.getByRole("button", { name: "Ver guía de respuesta" })).toBeDisabled();
      await page.getByLabel("Tu respuesta", { exact: true }).fill("Mi respuesta relaciona los conceptos del resumen y los aplica al problema planteado.");
    }
    await page.getByRole("button", { name: "Ver guía de respuesta" }).click();
    await expect(page.getByRole("button", { name: last ? "Ver resultados" : "Siguiente pregunta" })).toBeDisabled();
    await page.getByRole("button", { name: mastered ? "Lo pude explicar" : "Necesito repasar" }).click();
  }
  await expect(page.getByText(`Fuente: ${question.source}`, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: last ? "Ver resultados" : "Siguiente pregunta" }).click();
}

test("Sani covers five source units, six modes, and excludes obsolete demo progress", () => {
  expect(subjects.find((subject) => subject.id === "sani")?.demo).not.toBe(true);
  expect(saniQuestions.length).toBeGreaterThanOrEqual(90);
  expect(new Set(saniQuestions.map((question) => question.type)).size).toBe(6);
  expect(saniQuestions.filter((question) => question.finalOnly).length).toBeGreaterThan(0);
  expect(questions.some((question) => question.id.startsWith("sani-demo-"))).toBe(false);
  for (const unit of saniUnits) {
    const bank = selectQuestions("sani", "all", "all", { unitIds: [unit.id], includeFinalOnly: false });
    expect(bank.length).toBeGreaterThanOrEqual(10);
    expect(bank.some((question) => question.type === "choice")).toBe(true);
    expect(bank.some((question) => question.type === "case-study")).toBe(true);
    for (const question of bank) {
      expect(question.sourcePages![0]).toBeGreaterThanOrEqual(unit.pages[0]);
      expect(question.sourcePages![1]).toBeLessThanOrEqual(unit.pages[1]);
      expect(question.sourcePages![0]).toBeLessThanOrEqual(question.sourcePages![1]);
      expect(question.source).toContain("Sani Final PDF");
    }
  }
  const old = { "sani-demo-choice": { mastered: true, attempts: 1, date: "2026-10-06" }, "rmf-indirecta": { mastered: true, attempts: 1, date: "2026-10-06" } };
  expect(parseProgress(JSON.stringify(old))).toEqual({ "rmf-indirecta": old["rmf-indirecta"] });
});

test("short sessions cover eligible units without duplicates or mutating the source", () => {
  const ids = saniQuestions.map((question) => question.id);
  for (let attempt = 0; attempt < 10; attempt++) {
    const session = buildSession(saniQuestions, 10);
    expect(session).toHaveLength(10);
    expect(new Set(session.map((question) => question.id)).size).toBe(10);
    for (const unit of saniUnits) expect(session.some((question) => question.unit === unit.id && !question.finalOnly)).toBe(true);
    expect(session.some((question) => question.finalOnly)).toBe(true);
  }
  expect(saniQuestions.map((question) => question.id)).toEqual(ids);
  expect(buildSession([], 10)).toEqual([]);
  expect(buildSession(saniQuestions.slice(0, 3), 10)).toHaveLength(3);
  expect(selectQuestions("sani", "all", "all", { unitIds: [] })).toEqual([]);
  expect(parseExamPreferences('{"sani":{"first":["u1","unknown","u1",12],"second":"bad"}}')).toEqual({ sani: { first: ["u1"] } });
});

test("partials require a personal scope, remember independent choices and exclude final-only questions", async ({ page }) => {
  await openSani(page);
  await page.getByLabel("Estoy preparando").selectOption("first");
  await expect(page.getByRole("button", { name: "Empezar sesión" })).toBeDisabled();
  await page.getByRole("checkbox", { name: /Unidad 1/ }).check();
  await page.getByRole("checkbox", { name: /Unidad 2/ }).check();
  await page.getByLabel("Estoy preparando").selectOption("second");
  await expect(page.getByRole("checkbox", { name: /Unidad 1/ })).not.toBeChecked();
  await page.getByRole("checkbox", { name: /Unidad 3/ }).check();
  await page.reload();
  await page.getByLabel("Estoy preparando").selectOption("first");
  await expect(page.getByRole("checkbox", { name: /Unidad 1/ })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: /Unidad 2/ })).toBeChecked();
  await page.getByLabel("Estoy preparando").selectOption("second");
  await expect(page.getByRole("checkbox", { name: /Unidad 3/ })).toBeChecked();
  await page.getByLabel("Forma de practicar").selectOption("flashcard");
  await page.getByLabel("Duración de la práctica").selectOption("all");
  await page.getByRole("button", { name: "Empezar sesión" }).click();
  await expect(page.getByText("Segundo parcial · U3", { exact: true })).toBeVisible();
  const expected = selectQuestions("sani", "flashcard", "all", { unitIds: ["u3"], includeFinalOnly: false });
  for (let index = 0; index < expected.length; index++) {
    const prompt = await page.getByRole("heading", { level: 1 }).textContent();
    const question = expected.find((item) => item.prompt === prompt)!;
    expect(question).toBeTruthy();
    expect(question.finalOnly).not.toBe(true);
    await answer(page, question, index === expected.length - 1);
  }
  await expect(page.getByRole("heading", { name: "Sesión completada" })).toBeVisible();
});

test("a final session completes with mixed activities across all units", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openSani(page);
  await page.getByRole("button", { name: "Empezar sesión" }).click();
  const seen: Question[] = [];
  for (let index = 0; index < 10; index++) {
    const prompt = await page.getByRole("heading", { level: 1 }).textContent();
    const question = saniQuestions.find((item) => item.prompt === prompt)!;
    expect(question).toBeTruthy();
    seen.push(question);
    await answer(page, question, index === 9);
  }
  expect(new Set(seen.map((question) => question.id)).size).toBe(10);
  for (const unit of saniUnits) expect(seen.some((question) => question.unit === unit.id && !question.finalOnly)).toBe(true);
  expect(seen.some((question) => question.finalOnly)).toBe(true);
  await expect(page.getByRole("heading", { name: "Sesión completada" })).toBeVisible();
  await page.getByRole("link", { name: "Volver a la materia" }).click();
  await expect(page.getByText(`10 de ${saniQuestions.length} preguntas recorridas`, { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const type of ["true-false", "case-study", "image-analysis"] as const) {
  test(`Sani ${type} completes, persists and can be reviewed as pending`, async ({ page }) => {
    await openSani(page);
    await page.getByLabel("Estoy preparando").selectOption("first");
    await page.getByRole("checkbox", { name: /Unidad 1/ }).check();
    await page.getByLabel("Forma de practicar").selectOption(type);
    await page.getByRole("button", { name: "Empezar sesión" }).click();
    const bank = selectQuestions("sani", type, "all", { unitIds: ["u1"], includeFinalOnly: false });
    let firstId = "";
    for (let index = 0; index < bank.length; index++) {
      const prompt = await page.getByRole("heading", { level: 1 }).textContent();
      const question = bank.find((item) => item.prompt === prompt)!;
      expect(question).toBeTruthy();
      if (index === 0) firstId = question.id;
      if (type === "image-analysis") {
        await page.getByRole("button", { name: "Ampliar imagen" }).click();
        const image = page.getByRole("dialog").locator("img");
        await expect(image).toBeVisible();
        expect(await image.evaluate((node: HTMLImageElement) => node.naturalWidth > 0)).toBe(true);
        await page.getByRole("button", { name: "Cerrar imagen" }).click();
      }
      await answer(page, question, index === bank.length - 1, index !== 0);
    }
    await expect(page.getByRole("button", { name: "Repasar pendientes" })).toBeVisible();
    await page.getByRole("link", { name: "Volver a la materia" }).click();
    await page.getByRole("checkbox", { name: "Solo pendientes de repaso" }).check();
    await page.getByRole("button", { name: "Empezar sesión" }).click();
    await expect(page.getByText("Pregunta 1 de 1", { exact: true })).toBeVisible();
    const question = bank.find((item) => item.id === firstId)!;
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(question.prompt);
    await answer(page, question, true);
    const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
    expect(saved[firstId].mastered).toBe(true);
    expect(saved[firstId].attempts).toBe(2);
  });
}

test("Sani handles empty mode/unit combinations, blocked storage and 320px layout", async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new Error("unavailable"); } }); });
  await page.setViewportSize({ width: 320, height: 740 });
  await openSani(page);
  await page.getByLabel("Estoy preparando").selectOption("second");
  await page.getByRole("checkbox", { name: /Unidad 2/ }).check();
  await expect(page.getByText(/No se pudo guardar la selección de unidades/)).toBeVisible();
  await page.getByLabel("Forma de practicar").selectOption("image-analysis");
  await expect(page.getByRole("button", { name: "Empezar sesión" })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByLabel("Forma de practicar").selectOption("flashcard");
  await page.getByRole("button", { name: "Empezar sesión" }).click();
  await expect(page.getByRole("button", { name: "Ver guía de respuesta" })).toBeEnabled();
});

test("invalid saved exam configuration cannot select foreign units", async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, '{"sani":{"first":["rmf","u99"]}}'), examStorageKey);
  await openSani(page);
  await page.getByLabel("Estoy preparando").selectOption("first");
  await expect(page.getByRole("button", { name: "Empezar sesión" })).toBeDisabled();
});
