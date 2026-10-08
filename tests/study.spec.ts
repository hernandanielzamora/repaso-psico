import { test, expect, type Page } from "@playwright/test";
import { questions, subjects } from "../data";
import { parseProgress, selectQuestions, storageKey } from "../lib/study";
import { existsSync } from "node:fs";
import { join } from "node:path";

async function openExperimental(page: Page, mode = "choice", topic = "all") {
  await page.goto("/#subject/psicologia-experimental");
  await page.getByLabel("Forma de practicar").selectOption(mode);
  await page.getByRole("combobox", { name: "Tema", exact: true }).selectOption(topic);
  await page.getByRole("button", { name: "Empezar sesión" }).click();
}

test("bank has valid subjects, answers, rubrics and local images", () => {
  expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
  expect(selectQuestions("psicologia-experimental", "choice")).toHaveLength(9);
  expect(selectQuestions("psicologia-experimental", "development")).toHaveLength(3);
  for (const question of questions) {
    const subject = subjects.find((s) => s.id === question.subjectId)!;
    expect(subject).toBeTruthy();
    expect(subject.questionTypes).toContain(question.type);
    expect(subject.topics).toContain(question.topic);
    expect(question.source).toBeTruthy();
    if (question.type === "choice" || question.type === "true-false") {
      expect(question.options!.length).toBeGreaterThan(1);
      expect(Number.isInteger(question.answer)).toBe(true);
      expect(question.answer!).toBeGreaterThanOrEqual(0);
      expect(question.answer!).toBeLessThan(question.options!.length);
    } else { expect(question.rubric!.length).toBeGreaterThan(0); }
    if (question.type === "image-analysis") {
      expect(question.media?.alt).toBeTruthy();
      expect(existsSync(join(process.cwd(), "public", question.media!.src))).toBe(true);
    }
  }
  for (const raw of [null, "invalid", "[]", "null", '{"rmf-indirecta":{"mastered":true,"attempts":-1,"date":"bad"}}']) {
    expect(parseProgress(raw)).toEqual({});
  }
});

test("choice finishes, shows correct answer, retries mistakes and persists real progress", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openExperimental(page);
  const bank = selectQuestions("psicologia-experimental", "choice");
  for (const [index, question] of bank.entries()) {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(question.prompt);
    await expect(page.getByRole("button", { name: "Comprobar respuesta" })).toBeDisabled();
    await page.getByRole("radio").nth(index === 0 ? 0 : question.answer!).check();
    await page.getByRole("button", { name: "Comprobar respuesta" }).click();
    await expect(page.getByText("Respuesta correcta", { exact: true })).toBeVisible();
    await expect(page.getByRole("radio").first()).toBeDisabled();
    await page.getByRole("button", { name: index === bank.length - 1 ? "Ver resultados" : "Siguiente pregunta" }).click();
  }
  await expect(page.getByRole("heading", { name: "Sesión completada" })).toBeVisible();
  await expect(page.getByText("8 de 9 correctas", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Repasar pendientes" }).click();
  await expect(page.getByText("Pregunta 1 de 1", { exact: true })).toBeVisible();
  await page.getByRole("radio").nth(bank[0].answer!).check();
  await page.getByRole("button", { name: "Comprobar respuesta" }).click();
  await page.getByRole("button", { name: "Ver resultados" }).click();
  await expect(page.getByRole("button", { name: "Repasar pendientes" })).toHaveCount(0);
  await page.getByRole("link", { name: "Volver a la materia" }).click();
  await page.reload();
  await expect(page.getByText("9 de 13 preguntas recorridas", { exact: true })).toBeVisible();
  const progress = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
  expect(progress[bank[0].id].attempts).toBe(2);
  expect(progress[bank[0].id].mastered).toBe(true);
  expect(errors).toEqual([]);
});

test("development requires writing and explicit self-assessment", async ({ page }) => {
  await openExperimental(page, "development");
  for (const [index, question] of selectQuestions("psicologia-experimental", "development").entries()) {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(question.prompt);
    await page.getByLabel("Tu respuesta", { exact: true }).fill("   ");
    await expect(page.getByRole("button", { name: "Ver guía de respuesta" })).toBeDisabled();
    await page.getByLabel("Tu respuesta", { exact: true }).fill("Mi explicación incluye las variables, las técnicas y sus controles.");
    await page.getByRole("button", { name: "Ver guía de respuesta" }).click();
    const next = page.getByRole("button", { name: index === 2 ? "Ver resultados" : "Siguiente pregunta" });
    await expect(next).toBeDisabled();
    await expect(page.getByRole("heading", { name: "Criterios para revisar tu respuesta" })).toBeVisible();
    await page.getByRole("button", { name: index === 0 ? "Necesito repasar" : "Lo pude explicar" }).click();
    await next.click();
  }
  await expect(page.getByText("2 de 3 logradas", { exact: true })).toBeVisible();
  await expect(page.getByText(/correctas/)).toHaveCount(0);
});

test("image zoom, keyboard dismissal and self-assessment work", async ({ page }) => {
  await openExperimental(page, "image-analysis");
  const image = page.getByRole("button", { name: "Ampliar imagen" });
  await expect(image.locator("img")).toBeVisible();
  expect(await image.locator("img").evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
  await image.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(image).toBeFocused();
  await page.getByLabel("Tu respuesta", { exact: true }).fill("B es sham y muestra decremento en vigilancia; A mantiene los aciertos.");
  await page.getByRole("button", { name: "Ver guía de respuesta" }).click();
  await page.getByRole("button", { name: "Lo pude explicar" }).click();
  await page.getByRole("button", { name: "Ver resultados" }).click();
  await expect(page.getByText("1 de 1 logradas", { exact: true })).toBeVisible();
});

test("filters handle empty results and topic buttons use actual questions", async ({ page }) => {
  await page.goto("/#subject/psicologia-experimental");
  await page.getByLabel("Forma de practicar").selectOption("image-analysis");
  await page.getByRole("combobox", { name: "Tema", exact: true }).selectOption("RMf");
  await expect(page.getByRole("button", { name: "Empezar sesión" })).toBeDisabled();
  await expect(page.getByText(/Todavía no hay preguntas/)).toBeVisible();
  await page.getByRole("button", { name: /^RMf/ }).click();
  await expect(page.getByText("Pregunta 1 de 2", { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { name: "Prepará tu sesión" })).toBeVisible();
});

test("demos are isolated, finish, and never count towards academic progress", async ({ page }) => {
  await page.goto("/#subject/psicopato");
  await page.getByRole("button", { name: "Probar sesión" }).click();
  await expect(page.getByText("Imagen de demostración. No es una lámina de Rorschach.", { exact: true })).toBeVisible();
  await page.getByLabel("Tu respuesta", { exact: true }).fill("Dos círculos, un triángulo y un rectángulo.");
  await page.getByRole("button", { name: "Ver guía de respuesta" }).click();
  await page.getByRole("button", { name: "Lo pude explicar" }).click();
  await page.getByRole("button", { name: "Ver resultados" }).click();
  await expect(page.getByRole("heading", { name: "Sesión completada" })).toBeVisible();
  await page.getByRole("link", { name: "Todas las materias", exact: true }).click();
  const total = questions.filter((question) => !subjects.find((subject) => subject.id === question.subjectId)?.demo).length;
  await expect(page.getByText(`0 / ${total} preguntas`, { exact: true })).toBeVisible();
});

test("corrupt and unavailable storage do not prevent study", async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, "{broken"), storageKey);
  await openExperimental(page, "choice", "RMf");
  await page.getByRole("radio").nth(1).check();
  await page.getByRole("button", { name: "Comprobar respuesta" }).click();
  await expect(page.getByRole("heading", { name: "¡Correcto!" })).toBeVisible();
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
  });
  await page.reload();
  await openExperimental(page, "choice", "RMf");
  await page.getByRole("radio").nth(1).check();
  await page.getByRole("button", { name: "Comprobar respuesta" }).click();
  await expect(page.getByText(/No se pudo guardar el progreso/)).toBeVisible();
  await page.getByRole("button", { name: "Siguiente pregunta" }).click();
  await expect(page.getByText("Pregunta 2 de 2", { exact: true })).toBeVisible();
});

test("all screens fit a narrow mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  for (const hash of ["", "#subject/psicologia-experimental", "#session/psicologia-experimental", "#subject/psicopato", "#session/psicopato", "#subject/sani", "#session/sani"]) {
    await page.goto(`/${hash}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
