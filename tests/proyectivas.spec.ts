import { test, expect, type Page } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { proyectivasQuestions } from "../content/proyectivas";
import { plateSources } from "../content/proyectivas-plates";
import { subjects } from "../data";
import { avoidRepeatedPlate, balanceQuestionTypes, generateParcialito, gradeAperceptiveMode, gradeDeterminants } from "../lib/proyectivas";
import { selectQuestions, buildSession, parseProgress, storageKey } from "../lib/study";

const subjectId = "proyectivas";
async function open(page: Page, mode: string) {
  await page.goto(`/#subject/${subjectId}`);
  await page.getByLabel("Forma de practicar").selectOption(mode);
  await page.getByLabel("Variar el orden en cada sesión").uncheck();
  await page.getByRole("button", { name: "Empezar sesión" }).click();
}
async function reviewAll(page: Page, count: number) {
  for (let i = 1; i <= count; i++) await page.getByRole("button", { name: `Lo incluí · criterio ${i}`, exact: true }).click();
}

test("Proyectivas has four written modes, traceable keys and intact images", () => {
  expect(proyectivasQuestions).toHaveLength(69);
  expect(selectQuestions(subjectId, "determinant-table")).toHaveLength(19);
  expect(selectQuestions(subjectId, "development")).toHaveLength(10);
  expect(selectQuestions(subjectId, "special-phenomenon")).toHaveLength(30);
  expect(selectQuestions(subjectId, "plate-significance")).toHaveLength(10);
  expect(subjects.find((s) => s.id === subjectId)!.questionTypes).not.toContain("choice");
  for (const randomize of [true, false]) {
    const session = balanceQuestionTypes(buildSession(proyectivasQuestions, proyectivasQuestions.length, randomize), 10);
    expect(new Set(session.map((q) => q.type)).size).toBe(4);
    expect(new Set(session.map((q) => q.id)).size).toBe(10);
  }
  for (const q of proyectivasQuestions) {
    expect(q.options).toBeUndefined();
    expect(q.projection).toBeTruthy();
    expect(q.sourcePages![0]).toBeGreaterThanOrEqual(40);
    expect(q.sourcePages![1]).toBeLessThanOrEqual(76);
    expect(q.sourcePages![0]).toBeLessThanOrEqual(q.sourcePages![1]);
    expect(q.source).toContain("Resumen Completo Proyectivas.pdf");
    for (const row of q.projection!.rows ?? []) {
      expect(row.codes.length).toBeLessThanOrEqual(3);
      expect(gradeAperceptiveMode(row, row.mode).correct).toBe(true);
      expect(row.localization).toBeTruthy();
      expect(row.region.x + row.region.width).toBeLessThanOrEqual(1);
      expect(row.region.y + row.region.height).toBeLessThanOrEqual(1);
    }
  }
  for (const asset of plateSources) {
    expect(existsSync(asset.file)).toBe(true);
    expect(createHash("sha256").update(readFileSync(asset.file)).digest("hex")).toBe(asset.sha256);
  }
});

test("determinant correction preserves case, order within codes and multiplicity", () => {
  for (const q of selectQuestions(subjectId, "determinant-table")) {
    for (const row of q.projection!.rows!) {
      expect(gradeDeterminants(row, [...row.codes].reverse()).correct).toBe(true);
      expect(gradeDeterminants(row, [...row.codes, row.codes[0]]).correct).toBe(false);
      expect(gradeDeterminants(row, ["No corresponde"]).correct).toBe(false);
      expect(gradeDeterminants(row, []).correct).toBe(false);
    }
  }
  const texture = selectQuestions(subjectId, "determinant-table").find((q) => q.projection!.plate === 6)!.projection!.rows![0];
  expect(gradeDeterminants(texture, ["FC"]).messages.join(" ")).toContain("mayúsculas");
  const achromatic = selectQuestions(subjectId, "determinant-table")[0].projection!.rows![1];
  expect(gradeDeterminants(achromatic, ["FC’", "", ""]).correct).toBe(true);
  expect(gradeDeterminants(achromatic, ["F", "C'"]).correct).toBe(false);
  const bank = selectQuestions(subjectId, "plate-significance");
  const result = avoidRepeatedPlate(bank, bank[0].projection!.plate);
  expect(result[0].id).not.toBe(bank[0].id);
  expect(bank[0].id).toBe("proy-lamina-1");
});

test("all original Rorschach tables remain and new localizations cover detail, unusual detail and white space", () => {
  const tables = selectQuestions(subjectId, "determinant-table");
  for (let i = 1; i <= 11; i++) expect(tables.some((q) => q.id === `proy-cuadro-${i}`)).toBe(true);
  const newRows = tables.slice(11).flatMap((q) => q.projection!.rows!);
  for (const mode of ["W", "D", "Dd", "Dde", "Ddi", "Ddr", "Ddd", "S", "WS", "SW", "DS", "SD"]) expect(newRows.some((row) => row.mode === mode)).toBe(true);
  const white = newRows.find((row) => row.mode === "S")!;
  expect(gradeAperceptiveMode(white, "W").message).toContain("blanco");
  const inside = newRows.find((row) => row.mode === "Ddi")!;
  expect(gradeAperceptiveMode(inside, "Dd").correct).toBe(false);
  const old = { mastered: true, attempts: 1, date: "2026-10-24T12:00:00Z" };
  expect(parseProgress(JSON.stringify({ "proy-des-tro-series": old, "proy-des-administracion": old, salmon: old }))).toEqual({ "proy-des-administracion": old, salmon: old });
});

test("parcialitos contain exactly 1+3+1+2 unique Rorschach activities and fail atomically if incomplete", () => {
  const before = proyectivasQuestions.map((q) => q.id);
  let lastPlate: number | undefined;
  for (let i = 0; i < 50; i++) {
    const result = generateParcialito(proyectivasQuestions, lastPlate);
    expect(result.error).toBeUndefined();
    expect(result.questions.map((q) => q.type)).toEqual(["determinant-table", "development", "development", "development", "plate-significance", "special-phenomenon", "special-phenomenon"]);
    expect(new Set(result.questions.map((q) => q.id)).size).toBe(7);
    const plate = result.questions[4].projection!.plate;
    expect(plate).not.toBe(lastPlate);
    lastPlate = plate;
  }
  expect(proyectivasQuestions.map((q) => q.id)).toEqual(before);
  const short = generateParcialito(proyectivasQuestions.filter((q) => q.type !== "development"));
  expect(short.questions).toEqual([]);
  expect(short.error).toContain("Faltan actividades");
  expect(generateParcialito([...proyectivasQuestions, ...proyectivasQuestions]).questions).toHaveLength(7);
});

test("table corrections explain specific errors and preserve pending progress", async ({ page }) => {
  await open(page, "determinant-table");
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Corregir cuadro" })).toBeDisabled();
  await page.getByLabel("Respuesta 1, determinante 1", { exact: true }).fill("F");
  await page.getByLabel("Respuesta 2, determinante 1", { exact: true }).fill("FC");
  await page.getByLabel("Respuesta 3, determinante 1", { exact: true }).fill("C'F");
  await expect(page.getByRole("button", { name: "Corregir cuadro" })).toBeDisabled();
  for (const [i, row] of selectQuestions(subjectId, "determinant-table")[0].projection!.rows!.entries()) await page.getByLabel(`Respuesta ${i + 1}, modo aperceptivo`, { exact: true }).fill(row.mode);
  await page.getByRole("button", { name: "Corregir cuadro" }).click();
  await expect(page.getByText("Codificación: 2 de 3 filas correctas en determinantes.")).toBeVisible();
  await expect(page.getByText("Modos aperceptivos: 3 de 3 correctos.")).toBeVisible();
  await expect(page.getByText(/Falta fundamentar: FC'/)).toBeVisible();
  await page.getByRole("button", { name: "Guardar revisión" }).click();
  await expect(page.getByText("Actividad guardada como pendiente de repaso.")).toBeVisible();
  await page.getByRole("link", { name: "Volver a la materia" }).click();
  await page.reload();
  const data = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
  expect(data["proy-cuadro-1"].mastered).toBe(false);
  await page.getByLabel("Forma de practicar").selectOption("determinant-table");
  await page.getByLabel("Solo pendientes de repaso").check();
  await page.getByRole("button", { name: "Empezar sesión" }).click();
  await expect(page.getByText("Pregunta 1 de 1", { exact: true })).toBeVisible();
  const rows = selectQuestions(subjectId, "determinant-table")[0].projection!.rows!;
  for (const [i, row] of rows.entries()) for (const [j, code] of row.codes.entries()) await page.getByLabel(`Respuesta ${i + 1}, determinante ${j + 1}`, { exact: true }).fill(code);
  for (const [i, row] of rows.entries()) await page.getByLabel(`Respuesta ${i + 1}, modo aperceptivo`, { exact: true }).fill(row.mode);
  await page.getByRole("button", { name: "Corregir cuadro" }).click();
  await page.getByRole("button", { name: "Guardar revisión" }).click();
  await page.getByRole("button", { name: "Ver resultados" }).click();
  await expect(page.getByRole("heading", { name: "Sesión completada" })).toBeVisible();
  await expect(page.getByText(/Clave de codificación y revisión del fundamento/)).toContainText("1 de 1 logradas");
});

test("plate viewer supports drawing, rotation, keyboard coordinates and shared zoom marks", async ({ page }) => {
  await open(page, "determinant-table");
  const canvas = page.getByRole("img", { name: "Lámina 1 con áreas de referencia", exact: true });
  await expect(canvas.locator("rect")).toHaveCount(2);
  await page.getByRole("button", { name: "Marcar área", exact: true }).click();
  await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * .2, box.y + box.height * .2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5);
  await page.mouse.up();
  await expect(page.getByText("Marca agregada al área 1.")).toBeVisible();
  await expect(canvas.locator("rect")).toHaveCount(4);
  await page.getByLabel("Izquierda", { exact: true }).fill("30");
  await expect(page.getByLabel("Izquierda", { exact: true })).toHaveValue("30");
  await page.getByRole("button", { name: "Girar 90°", exact: true }).click();
  await expect(page.getByText(/Posición: 90°/).first()).toBeVisible();
  await expect(canvas).toHaveAttribute("viewBox", "0 0 482 736");
  await page.getByRole("button", { name: "Ampliar lámina" }).click();
  const dialog = page.getByRole("dialog", { name: "Lámina ampliada" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img").locator("rect")).toHaveCount(4);
  await dialog.getByRole("slider").fill("200");
  await dialog.getByRole("button", { name: "Ocultar marcas" }).click();
  await expect(dialog.getByRole("img").locator("rect")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Mostrar marcas" }).click();
  await page.getByRole("button", { name: "Restaurar marcas" }).click();
  await expect(canvas.locator("rect")).toHaveCount(2);
});

test("written review requires each criterion and gives a personal reinforcement list", async ({ page }) => {
  await open(page, "development");
  await page.getByLabel("Tu desarrollo").fill("Distingo el ajuste del percepto y la precisión, y necesito localizarlo antes de evaluar calidad formal.");
  await page.getByRole("button", { name: "Revisar con la guía" }).click();
  await expect(page.getByRole("button", { name: "Guardar revisión" })).toBeDisabled();
  await page.getByRole("button", { name: "Lo incluí · criterio 1", exact: true }).click();
  await page.getByRole("button", { name: "Me faltó o lo confundí · criterio 2", exact: true }).click();
  await page.getByRole("button", { name: "Lo incluí · criterio 3", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Para reforzar en tu próxima respuesta" })).toBeVisible();
  await page.getByRole("button", { name: "Guardar revisión" }).click();
  await expect(page.getByText("Actividad guardada como pendiente de repaso.")).toBeVisible();
});

test("phenomena are developed in prose and require review of definition, evidence and contrast", async ({ page }) => {
  await open(page, "special-phenomenon");
  const first = buildSession(selectQuestions(subjectId, "special-phenomenon"), 10, false)[0];
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(first.prompt);
  await expect(page.getByRole("textbox")).toHaveCount(1);
  await page.getByLabel("Tu desarrollo sobre fenómenos especiales").fill("La inversión figura-fondo utiliza el blanco como figura. Se diferencia de fusión porque no integra mancha y blanco; no infiero un diagnóstico.");
  await page.getByRole("button", { name: "Revisar con la guía" }).click();
  await expect(page.getByRole("heading", { name: "Concepto y fundamento para comparar tu desarrollo" })).toBeVisible();
  await expect(page.getByText(`Dato decisivo: ${first.projection!.phenomenon!.clue}`, { exact: true })).toBeVisible();
  await reviewAll(page, 2);
  await expect(page.getByRole("button", { name: "Guardar revisión" })).toBeDisabled();
  await page.getByRole("button", { name: "Me faltó o lo confundí · criterio 3", exact: true }).click();
  await page.getByRole("button", { name: "Guardar revisión" }).click();
  await expect(page.getByText("Actividad guardada como pendiente de repaso.")).toBeVisible();
});

test("significance uses all ten plates and never repeats its first plate on the next practice", async ({ page }) => {
  await open(page, "plate-significance");
  const first = await page.getByRole("heading", { level: 1 }).textContent();
  for (const label of ["Aspectos perturbadores", "Aspectos tranquilizadores", "Valor significativo según el resumen"]) await page.getByLabel(label, { exact: true }).fill("Describo el estímulo y distingo lo que el apunte explicita de una inferencia.");
  await page.getByRole("button", { name: "Revisar con la guía" }).click();
  await reviewAll(page, 3);
  await page.getByRole("button", { name: "Guardar revisión" }).click();
  await expect(page.getByText("Actividad lograda según la clave y tu revisión.")).toBeVisible();
  await page.getByRole("link", { name: "Volver a la materia" }).click();
  await page.reload();
  await page.getByLabel("Forma de practicar").selectOption("plate-significance");
  await page.getByLabel("Variar el orden en cada sesión").uncheck();
  await page.getByRole("button", { name: "Empezar sesión" }).click();
  await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(first!);
});

test("Proyectivas keeps its table scroll contained at 320px and handles image failure", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.route("**/images/proyectivas/*.jpg", (route) => route.abort());
  await open(page, "determinant-table");
  await expect(page.getByRole("alert").filter({ hasText: "No se pudo cargar la lámina" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole("button", { name: "Ampliar lámina" })).toBeDisabled();
});

test("a wrong aperceptive mode cannot be overridden by correct determinants", async ({ page }) => {
  await open(page, "determinant-table");
  const rows = selectQuestions(subjectId, "determinant-table")[0].projection!.rows!;
  await expect(page.getByRole("columnheader", { name: "Modos Aperceptivos", exact: true })).toBeVisible();
  for (const [i, row] of rows.entries()) {
    await page.getByLabel(`Respuesta ${i + 1}, modo aperceptivo`, { exact: true }).fill("S");
    for (const [j, code] of row.codes.entries()) await page.getByLabel(`Respuesta ${i + 1}, determinante ${j + 1}`, { exact: true }).fill(code);
  }
  await page.getByRole("button", { name: "Corregir cuadro" }).click();
  await expect(page.getByText("Codificación: 3 de 3 filas correctas en determinantes.")).toBeVisible();
  await expect(page.getByText("Modos aperceptivos: 0 de 3 correctos.")).toBeVisible();
  await page.getByRole("button", { name: "Guardar revisión" }).click();
  await expect(page.getByText("Actividad guardada como pendiente de repaso.")).toBeVisible();
});

test("a generated parcialito completes all seven sections and the next generation changes its plate", async ({ page }) => {
  await page.goto(`/#subject/${subjectId}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Rorschach");
  await expect(page.getByLabel("Tema", { exact: true }).locator("option")).not.toContainText(["TRO", "Desiderativo", "Técnicas gráficas"]);
  // Free-practice filters cannot shorten the fixed seven-activity exam.
  await page.getByLabel("Forma de practicar").selectOption("development");
  await page.getByLabel("Solo pendientes de repaso").check();
  await page.getByRole("button", { name: "Generar parcialito" }).click();
  await expect(page.getByText("Parcialito de Rorschach · 7 actividades", { exact: true })).toBeVisible();
  const types = ["determinant-table", "development", "development", "development", "plate-significance", "special-phenomenon", "special-phenomenon"];
  const ids: string[] = [];
  let firstPlate: number | undefined;
  for (let i = 0; i < 7; i++) {
    await expect(page.getByText(`Pregunta ${i + 1} de 7`, { exact: true })).toBeVisible();
    const prompt = await page.getByRole("heading", { level: 1 }).textContent();
    const q = proyectivasQuestions.find((question) => question.prompt === prompt)!;
    expect(q.type).toBe(types[i]); ids.push(q.id);
    if (q.type === "plate-significance") firstPlate = q.projection!.plate;
    if (q.projection!.rows) {
      for (const [r, row] of q.projection!.rows.entries()) {
        await page.getByLabel(`Respuesta ${r + 1}, modo aperceptivo`, { exact: true }).fill(row.mode);
        for (const [c, code] of row.codes.entries()) await page.getByLabel(`Respuesta ${r + 1}, determinante ${c + 1}`, { exact: true }).fill(code);
      }
      await page.getByRole("button", { name: "Corregir cuadro" }).click();
    } else {
      const fields = page.getByRole("textbox");
      for (let f = 0; f < await fields.count(); f++) await fields.nth(f).fill("Desarrollo el concepto, fundamento el caso con el resumen y diferencio las categorías y límites de interpretación.");
      await page.getByRole("button", { name: "Revisar con la guía" }).click();
      const count = await page.getByRole("button", { name: /^Lo incluí/ }).count();
      await reviewAll(page, count);
    }
    await page.getByRole("button", { name: "Guardar revisión" }).click();
    await page.getByRole("button", { name: i === 6 ? "Ver resultados" : "Siguiente pregunta" }).click();
  }
  expect(new Set(ids).size).toBe(7);
  await expect(page.getByText("Revisaste 7 preguntas de Rorschach.", { exact: true })).toBeVisible();
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
  for (const id of ids) expect(stored[id].mastered).toBe(true);
  await page.getByRole("link", { name: "Elegir otra práctica" }).click();
  await page.getByRole("button", { name: "Generar parcialito" }).click();
  const rememberedPlate = await page.evaluate(() => Number(sessionStorage.getItem("nucleo-proy-first-plate")));
  expect(rememberedPlate).not.toBe(firstPlate);
  await expect(page.getByText("Pregunta 1 de 7", { exact: true })).toBeVisible();
});
