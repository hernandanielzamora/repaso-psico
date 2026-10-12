import { test, expect } from "@playwright/test";
import { psicobioQuestions, psicobioTopics, psicobioUnits } from "../content/psicobio";
import { buildSession, selectQuestions, storageKey } from "../lib/study";

const subjectId = "psicobiologia-experimental";

test("the second-partial bank covers its source units, topics and study modes", () => {
  expect(psicobioQuestions.length).toBeGreaterThanOrEqual(60);
  expect(new Set(psicobioQuestions.map((q) => q.type)).size).toBe(5);
  for (const topic of psicobioTopics) expect(psicobioQuestions.some((q) => q.topic === topic)).toBe(true);
  for (const unit of psicobioUnits) {
    const bank = selectQuestions(subjectId, "all", "all", { unitIds: [unit.id] });
    expect(bank.length).toBeGreaterThanOrEqual(15);
    for (const type of ["choice", "true-false", "development", "case-study", "flashcard"]) {
      expect(bank.some((q) => q.type === type)).toBe(true);
    }
    for (const q of bank) {
      expect(q.sourcePages![0]).toBeGreaterThanOrEqual(unit.pages[0]);
      expect(q.sourcePages![1]).toBeLessThanOrEqual(unit.pages[1]);
      expect(q.sourcePages![0]).toBeLessThanOrEqual(q.sourcePages![1]);
      expect(q.finalOnly).not.toBe(true);
    }
  }
  const session = buildSession(psicobioQuestions, 10);
  expect(new Set(session.map((q) => q.unit)).size).toBe(3);
});

for (const mode of ["choice", "true-false", "development", "case-study", "flashcard"] as const) {
  test(`${mode}: practice, feedback, pending review and persistent progress`, async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link").filter({ has: page.getByRole("heading", { name: "Psicobiología Experimental", exact: true }) }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Psicobiología Experimental");
    await expect(page.getByText(/Este material no cubre el primer parcial ni el final completo/)).toBeVisible();
    await expect(page.getByLabel("Estoy preparando")).toHaveCount(0);
    await page.getByLabel("Forma de practicar").selectOption(mode);
    await page.getByLabel("Variar el orden en cada sesión").uncheck();
    await page.getByRole("button", { name: "Empezar sesión" }).click();
    const first = buildSession(selectQuestions(subjectId, mode), 10, false)[0];
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(first.prompt);
    if (first.options) {
      await page.getByRole("radio").nth((first.answer! + 1) % first.options.length).check();
      await page.getByRole("button", { name: "Comprobar respuesta" }).click();
    } else {
      if (mode !== "flashcard") await page.getByLabel("Tu respuesta", { exact: true }).fill("Relaciono las ideas del autor con los diseños y sus límites.");
      else await expect(page.getByRole("textbox")).toHaveCount(0);
      await page.getByRole("button", { name: "Ver guía de respuesta" }).click();
      await page.getByRole("button", { name: "Necesito repasar" }).click();
    }
    await expect(page.getByText(`Fuente: ${first.source}`, { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Volver a la materia" }).click();
    await page.reload();
    const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
    expect(stored[first.id].mastered).toBe(false);
    await page.getByLabel("Solo pendientes de repaso").check();
    await page.getByRole("button", { name: "Empezar sesión" }).click();
    await expect(page.getByText("Pregunta 1 de 1", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(first.prompt);
  });
}

test("topic and unit shortcuts select only the requested content", async ({ page }) => {
  await page.goto(`/#subject/${subjectId}`);
  await page.getByRole("combobox", { name: "Tema", exact: true }).selectOption("Genética y expresión génica");
  await page.getByLabel("Variar el orden en cada sesión").uncheck();
  await page.getByRole("button", { name: "Empezar sesión" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(selectQuestions(subjectId, "all", "Genética y expresión génica")[0].prompt);
  await page.getByRole("link", { name: "Volver a la materia" }).click();
  await page.getByLabel("Variar el orden en cada sesión").uncheck();
  await page.getByRole("button", { name: /Unidad 5 · Salud mental y trastornos afectivos/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(selectQuestions(subjectId, "all", "all", { unitIds: ["u5"] })[0].prompt);
});
