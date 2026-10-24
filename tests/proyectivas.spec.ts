import { test, expect, type Page } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { proyectivasQuestions } from "../content/proyectivas";
import { plateSources } from "../content/proyectivas-plates";
import { subjects } from "../data";
import { avoidRepeatedPlate, balanceQuestionTypes, gradeDeterminants, matchesPhenomenon } from "../lib/proyectivas";
import { selectQuestions, buildSession, storageKey } from "../lib/study";

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
  expect(proyectivasQuestions).toHaveLength(74);
  expect(selectQuestions(subjectId, "determinant-table")).toHaveLength(11);
  expect(selectQuestions(subjectId, "development")).toHaveLength(23);
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
    expect(q.sourcePages![0]).toBeGreaterThanOrEqual(1);
    expect(q.sourcePages![1]).toBeLessThanOrEqual(76);
    expect(q.sourcePages![0]).toBeLessThanOrEqual(q.sourcePages![1]);
    expect(q.source).toContain("Resumen Completo Proyectivas.pdf");
    for (const row of q.projection!.rows ?? []) {
      expect(row.codes.length).toBeLessThanOrEqual(3);
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
  expect(matchesPhenomenon("inversion figura-fondo", ["Inversión figura-fondo"])).toBe(true);
  expect(matchesPhenomenon("no es MOR", ["MOR"])).toBe(false);
  const bank = selectQuestions(subjectId, "plate-significance");
  const result = avoidRepeatedPlate(bank, bank[0].projection!.plate);
  expect(result[0].id).not.toBe(bank[0].id);
  expect(bank[0].id).toBe("proy-lamina-1");
});

test("table corrections explain specific errors and preserve pending progress", async ({ page }) => {
  await open(page, "determinant-table");
  await expect(page.getByRole("radio")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Corregir cuadro" })).toBeDisabled();
  await page.getByLabel("Respuesta 1, determinante 1", { exact: true }).fill("F");
  await page.getByLabel("Respuesta 2, determinante 1", { exact: true }).fill("FC");
  await page.getByLabel("Respuesta 3, determinante 1", { exact: true }).fill("C'F");
  await page.getByRole("button", { name: "Corregir cuadro" }).click();
  await expect(page.getByText("Codificación: 2 de 3 filas correctas.")).toBeVisible();
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

test("phenomena use free naming and evidence rather than choices", async ({ page }) => {
  await open(page, "special-phenomenon");
  const first = buildSession(selectQuestions(subjectId, "special-phenomenon"), 10, false)[0];
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(first.prompt);
  await page.getByLabel("Nombre del fenómeno", { exact: true }).fill("MOR");
  await page.getByLabel("Fundamento, diferencia con otro fenómeno y límites").fill("El ejemplo utiliza el blanco como figura, sin integrar mancha y blanco.");
  await page.getByRole("button", { name: "Revisar con la guía" }).click();
  await expect(page.getByRole("heading", { name: "Nombre escrito: no coincide con la clave" })).toBeVisible();
  await expect(page.getByText(`Dato decisivo: ${first.projection!.phenomenon!.clue}`, { exact: true })).toBeVisible();
  await reviewAll(page, 2);
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
