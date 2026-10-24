import type { DeterminantRow } from "./proyectivas-types";

export const determinantGuide: Record<string, string> = {
  F: "Forma: contornos o lineamientos. No se agrega F como código independiente si la forma ya integra otro determinante de la misma percepción.",
  M: "Movimiento humano, incluso acción humana atribuida a animales no adiestrados.",
  FM: "Movimiento propio de un animal, incluyendo una acción de circo si se explicita adiestramiento.",
  Fm: "Movimiento inanimado con forma precisa, incluso caída por gravedad.",
  mF: "Movimiento inanimado con forma secundaria o vaga.", m: "Movimiento inanimado sin participación de forma.",
  FC: "Color cromático subordinado a forma definida.", CF: "Color cromático predominante; forma secundaria o vaga.", C: "Color cromático sin forma.",
  "FC'": "Color acromático (negro/gris/blanco) con predominio formal.", "C'F": "Color acromático predominante con forma secundaria.", "C'": "Color acromático sin forma.",
  Fc: "Textura: matices que dan sensación táctil, con predominio formal. c minúscula.", cF: "Textura predominante con forma secundaria.", c: "Sensación táctil por matices, sin forma.",
  FK: "Claroscuro que da volumen/profundidad con predominio formal.", KF: "Profundidad por claroscuro con forma secundaria.", K: "Claroscuro difuso sin forma, como bruma.",
  Fk: "Tridimensión en bidimensión (p. ej. radiografía) con forma definida. k minúscula.", kF: "Tridimensión en bidimensión con forma secundaria.", k: "Tridimensión en bidimensión sin forma.",
  "FC forz": "Color forzado con forma definida: la relación color-objeto es forzada en la explicación.",
  "FC arb": "Color arbitrario: se usa solo para delimitar partes, no como color natural del objeto.",
  "FC simb": "Color simbólico con forma definida: el color representa un valor o idea explícitos.",
  "C desc": "Color puro descripto: describe relaciones y características de los colores.",
  "C n": "Color puro nombrado: enumera nombres de colores, sin construir un percepto."
};

export function normalizeCode(value: string) { return value.trim().replace(/[’‘′]/g, "'").replace(/\s+/g, " "); }
export function gradeDeterminants(row: DeterminantRow, values: string[]) {
  const entered = values.map(normalizeCode).filter(Boolean);
  const missing = row.codes.filter((code) => !entered.includes(code));
  const extra = entered.filter((code) => !row.codes.includes(code));
  const duplicates = entered.filter((code, index) => entered.indexOf(code) !== index);
  const messages = extra.map((code) => {
    const caseMatch = row.codes.find((expected) => expected.toLowerCase() === code.toLowerCase());
    if (caseMatch) return `${code} no equivale a ${caseMatch}: las mayúsculas cambian la categoría. ${determinantGuide[caseMatch]}`;
    if (code === "F" && row.codes.some((expected) => expected.includes("F") || expected === "M" || expected === "FM")) return "Revisá F aislada: no se duplica la forma ya incluida en un determinante compuesto. Usá solo los rasgos explicitados en el interrogatorio.";
    return determinantGuide[code] ? `${code}: ${determinantGuide[code]} Esa condición no está sustentada por este interrogatorio.` : `No se reconoce «${code}» en la clave de este ejercicio. Revisá símbolo, orden y mayúsculas; no escribas varios códigos en una sola celda.`;
  });
  if (missing.length) messages.push(`Falta fundamentar: ${missing.join(", ")}.`);
  if (duplicates.length) messages.push("Hay códigos repetidos: cada determinante se consigna una sola vez.");
  return { correct: !missing.length && !extra.length && !duplicates.length, entered, missing, extra, messages };
}

export function normalizeName(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[.()'’“”\"]/g, "").replace(/\s+/g, " ").trim(); }
export function matchesPhenomenon(value: string, names: string[]) { return names.some((name) => normalizeName(value) === normalizeName(name)); }

export function balanceQuestionTypes<T extends { type: string }>(bank: T[], limit: number) {
  const groups = new Map<string, T[]>();
  for (const question of bank) {
    const group = groups.get(question.type) ?? [];
    group.push(question); groups.set(question.type, group);
  }
  const count = Math.min(bank.length, Math.max(0, Math.floor(limit)));
  const result: T[] = [];
  while (result.length < count) {
    for (const group of groups.values()) {
      const question = group.shift();
      if (question) result.push(question);
      if (result.length === count) break;
    }
  }
  return result;
}

// A new practice of plate significance starts with a different plate when possible.
export function avoidRepeatedPlate<T extends { projection?: { plate?: number } }>(bank: T[], previous?: number) {
  const result = [...bank];
  if (result[0]?.projection?.plate === previous && result.length > 1) {
    const index = result.findIndex((q) => q.projection?.plate !== previous);
    if (index > 0) [result[0], result[index]] = [result[index], result[0]];
  }
  return result;
}
