import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { antroQuestions, antroTopics, antroUnits } from "../content/antro";
import { generateAntroFinal } from "../lib/antro";
import { selectQuestions, storageKey } from "../lib/study";

test("Antropología cubre lecturas, unidades y devoluciones con fuentes válidas", () => {
  expect(antroQuestions).toHaveLength(52);
  expect(new Set(antroQuestions.map((question) => question.id)).size).toBe(52);
  for (const topic of antroTopics) expect(antroQuestions.some((question) => question.topic === topic)).toBe(true);
  for (const unit of antroUnits) {
    const bank = selectQuestions("antro", "all", "all", { unitIds: [unit.id], includeFinalOnly: false });
    expect(bank.length).toBeGreaterThanOrEqual(8);
  }
  for (const question of antroQuestions) {
    expect(["development", "case-study"]).toContain(question.type);
    expect(question.writtenCriteria).toHaveLength(3);
    expect(question.rubric).toEqual(question.writtenCriteria!.map((criterion) => criterion.expected));
    expect(question.explanation.length).toBeGreaterThan(200);
    for (const criterion of question.writtenCriteria!) expect(criterion.guidance.length).toBeGreaterThan(50);
    const unit = antroUnits.find((item) => item.id === question.unit)!;
    expect(question.sourcePages![0]).toBeGreaterThanOrEqual(unit.pages[0]);
    expect(question.sourcePages![1]).toBeLessThanOrEqual(unit.pages[1]);
    expect(question.sourcePages![0]).toBeLessThanOrEqual(question.sourcePages![1]);
    expect(question.source).toContain(Number(question.unit!.slice(1)) <= 2 ? "Resumen primer parcial.pdf" : "Resumen segundo parcial.pdf");
  }
});

test("cada final distribuye cinco unidades, una integración y al menos un caso sin repetir la generación anterior", () => {
  const original = antroQuestions.map((question) => question.id);
  let previous: string[] = [];
  for (let i = 0; i < 50; i++) {
    const bank = generateAntroFinal(previous);
    expect(bank).toHaveLength(6);
    expect(new Set(bank.map((question) => question.id)).size).toBe(6);
    expect(bank.slice(0, 5).map((question) => question.unit)).toEqual(antroUnits.map((unit) => unit.id));
    expect(bank.slice(0, 5).some((question) => question.finalOnly)).toBe(false);
    expect(bank[5].finalOnly).toBe(true);
    expect(bank.some((question) => question.type === "case-study")).toBe(true);
    expect(bank.some((question) => previous.includes(question.id))).toBe(false);
    previous = bank.map((question) => question.id);
  }
  expect(antroQuestions.map((question) => question.id)).toEqual(original);
});

test("Artro completo queda ignorado y sin archivos rastreados", () => {
  expect(execFileSync("git", ["check-ignore", "Artro/Resumen primer parcial.pdf", "Artro/ejemplo.txt", "Artro/subcarpeta/otro.docx"], { encoding: "utf8" }).trim().split(/\r?\n/)).toHaveLength(3);
  expect(execFileSync("git", ["ls-files", "Artro"], { encoding: "utf8" })).toBe("");
});

test("simulacro retiene respuestas al navegar, oculta guías hasta entregar y ofrece balance descargable", async ({ page }) => {
  await page.goto("/#subject/antro");
  await page.getByRole("button", { name: "Generar final integrador" }).click();
  const prompts: string[] = [];
  await expect(page.getByRole("button", { name: "Entregar y revisar" })).toBeDisabled();
  await expect(page.getByRole("heading", { name: "Respuesta orientativa" })).toHaveCount(0);
  for (let i = 0; i < 6; i++) {
    prompts.push((await page.getByRole("heading", { level: 2 }).textContent())!);
    await page.getByRole("textbox").fill(`Respuesta ${i + 1}: desarrollo mi argumento con los autores y relaciones del caso.`);
    if (i < 5) await page.getByRole("button", { name: "Siguiente consigna" }).click();
  }
  await page.getByRole("button", { name: "Consigna 1 · escrita", exact: true }).click();
  await expect(page.getByRole("textbox")).toHaveValue(/^Respuesta 1:/);
  await page.getByRole("button", { name: "Entregar y revisar" }).click();
  for (let i = 0; i < 6; i++) {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(prompts[i]);
    const selectors = page.getByRole("combobox");
    const next = page.getByRole("button", { name: i === 5 ? "Ver balance del simulacro" : "Revisar siguiente consigna" });
    await expect(next).toBeDisabled();
    await selectors.nth(0).selectOption(i === 0 ? "partial" : "achieved");
    await selectors.nth(1).selectOption(i === 0 ? "incorrect" : "achieved");
    await expect(page.getByRole("button", { name: "Registrar revisión por criterios" })).toBeDisabled();
    await selectors.nth(2).selectOption("achieved");
    if (i === 0) {
      await expect(page.getByText("Para completar:", { exact: true })).toBeVisible();
      await expect(page.getByText("Para corregir:", { exact: true })).toBeVisible();
    }
    await page.getByRole("button", { name: "Registrar revisión por criterios" }).click();
    await expect(page.getByRole("button", { name: "Registrar revisión por criterios" })).toBeDisabled();
    await next.click();
  }
  await expect(page.getByRole("heading", { name: "Balance del simulacro" })).toBeVisible();
  await expect(page.getByText(/5 de 6 respuestas logradas/)).toBeVisible();
  await page.getByText("Consigna 1 · Para reforzar", { exact: false }).click();
  await expect(page.getByText("Incompleto:", { exact: true })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar respuestas y devolución" }).click();
  expect((await download).suggestedFilename()).toBe("antro-final-revision.txt");
  const first = antroQuestions.find((question) => question.prompt === prompts[0])!;
  const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
  expect(progress[first.id].mastered).toBe(false);
  expect(progress[first.id].attempts).toBe(1);
  await page.getByRole("link", { name: "Volver a Antropología" }).click();
  await page.getByLabel("Solo pendientes de repaso").check();
  await page.getByRole("button", { name: "Empezar sesión" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(first.prompt);
});

test("la práctica libre exige escribir y revisar cada criterio antes de registrar dominio", async ({ page }) => {
  await page.goto("/#subject/antro");
  await page.getByRole("combobox", { name: "Tema", exact: true }).selectOption("Ser afectado");
  await page.getByRole("button", { name: "Empezar sesión" }).click();
  await expect(page.getByRole("button", { name: "Ver guía de respuesta" })).toBeDisabled();
  await page.getByLabel("Tu respuesta", { exact: true }).fill("Desarrollo una comparación entre afectación y empatía.");
  await page.getByRole("button", { name: "Ver guía de respuesta" }).click();
  await expect(page.getByRole("button", { name: "Ver resultados" })).toBeDisabled();
  for (const selector of await page.getByRole("combobox").all()) await selector.selectOption("achieved");
  await page.getByRole("button", { name: "Registrar revisión por criterios" }).click();
  await expect(page.getByRole("heading", { name: "Respuesta lograda según tu revisión" })).toBeVisible();
  await page.getByRole("button", { name: "Ver resultados" }).click();
  await expect(page.getByText("1 de 1 logradas", { exact: true })).toBeVisible();
});
