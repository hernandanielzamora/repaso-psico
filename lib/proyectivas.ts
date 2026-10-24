import type { AperceptiveMode, DeterminantRow } from "./proyectivas-types";
import type { Question } from "../data";

export const aperceptiveGuide: Record<AperceptiveMode, { evidence: string; explanation: string }> = {
  W: { evidence: "Usa la totalidad de la mancha, sin recortar un sector ni utilizar el blanco como figura.", explanation: "W: global. La localización informada abarca toda la mancha; no se decide por el tamaño de un cuadro en pantalla." },
  D: { evidence: "Usa solo el sector señalado, fácilmente separable del conjunto por sus propios límites; no integra toda la mancha ni utiliza el blanco.", explanation: "D: detalle usual, definido por segregabilidad y convención de referencia, no por ser pequeño. La clave toma la localización explicitada en el caso." },
  Dd: { evidence: "Recorta una parte poco segregable del conjunto, sin que el caso precise un subtipo.", explanation: "Dd: detalle inusual. No hay información suficiente para exigir un subtipo más específico." },
  Dde: { evidence: "Sigue exclusivamente un tramo del borde externo, sin incluir la superficie de la mancha.", explanation: "Dde: detalle inusual externo, sustentado por el uso del borde y no de la superficie." },
  Ddi: { evidence: "Recorta una pequeña zona dentro de la superficie pigmentada, sin tocar el borde exterior ni usar el blanco.", explanation: "Ddi: detalle inusual interno. El dato decisivo es su ubicación interior y la separación poco usual, no solo su tamaño." },
  Ddr: { evidence: "Recorta una zona trazando un límite imaginario que no sigue los bordes o divisiones habituales de la mancha.", explanation: "Ddr: detalle inusual raro. El recorte se construye por límites no habituales; no basta con que el contenido resulte extraño." },
  Ddd: { evidence: "Usa únicamente un pequeño elemento aislado, rodeado en gran parte por blanco y separado del resto de la mancha.", explanation: "Ddd: detalle inusual diminuto, aislado y de carácter independiente. No equivale a todo recorte interior pequeño." },
  S: { evidence: "Interpreta exclusivamente el espacio blanco señalado; la mancha pigmentada queda como fondo.", explanation: "S: espacio blanco puro. La mancha no integra el percepto y la blancura no es necesariamente un determinante de color acromático." },
  WS: { evidence: "Parte de toda la mancha y agrega el blanco como complemento de esa figura.", explanation: "WS: global con blanco complementario. El orden señala que la organización parte de la mancha." },
  SW: { evidence: "Parte de las figuras blancas e integra el conjunto de la mancha como complemento de la escena.", explanation: "SW: el blanco inicia la organización y luego se integra la totalidad pigmentada. No se intercambia automáticamente con WS." },
  DS: { evidence: "Parte del detalle usual señalado y agrega un espacio blanco como complemento de ese mismo percepto.", explanation: "DS: detalle con blanco complementario. No es S puro porque la mancha también participa." },
  SD: { evidence: "Parte del espacio blanco y agrega un detalle pigmentado como complemento de la respuesta.", explanation: "SD: blanco como punto de partida con detalle complementario. Se distingue de DS por cómo se organizó la percepción." },
  Do: { evidence: "Solo interpreta una parte de una figura humana o animal en un área donde el caso establece que habitualmente se integra la figura completa.", explanation: "Do es una denominación histórica para ese tipo de recorte; no es un diagnóstico ni un sinónimo de cualquier detalle pequeño." }
};

export function gradeAperceptiveMode(row: DeterminantRow, value: string) {
  const entered = value.trim();
  const correct = entered === row.mode;
  let message = correct ? row.modeExplanation : `Tu modo: ${entered || "sin completar"}. Clave: ${row.mode}. ${row.modeExplanation}`;
  if (!correct && entered === "W") message += " Encerrar la zona en un cuadro no la vuelve global: revisá si se usa toda la mancha, un detalle o el blanco.";
  if (!correct && (entered === "Dd" || row.mode === "Dd")) message += " En estos casos se pide el subtipo cuando la descripción lo permite; si no se precisa subtipo, no hay que inventarlo.";
  if (!correct && ["S", "SW", "WS", "SD", "DS"].includes(row.mode)) message += " Revisá si el blanco es exclusivo, punto de partida o complemento, y qué parte pigmentada se integra.";
  return { correct, entered, message };
}

export const parcialitoComposition = [
  { type: "determinant-table", count: 1, label: "Cuadro de modos aperceptivos y determinantes" },
  { type: "development", count: 3, label: "Preguntas a desarrollar" },
  { type: "plate-significance", count: 1, label: "Lámina aleatoria" },
  { type: "special-phenomenon", count: 2, label: "Fenómenos especiales a desarrollar" }
] as const;

export function generateParcialito(bank: Question[], previousPlate?: number, random: () => number = Math.random): { questions: Question[]; error?: string } {
  const unique = [...new Map(bank.filter((q) => q.subjectId === "proyectivas").map((q) => [q.id, q])).values()];
  const result: Question[] = [];
  for (const section of parcialitoComposition) {
    let pool = unique.filter((q) => q.type === section.type);
    if (pool.length < section.count) return { questions: [], error: `Faltan actividades para generar el parcialito: ${section.label.toLowerCase()} (${section.count} necesarias).` };
    if (section.type === "plate-significance" && pool.some((q) => q.projection?.plate !== previousPlate)) pool = pool.filter((q) => q.projection?.plate !== previousPlate);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    result.push(...pool.slice(0, section.count));
  }
  return { questions: result };
}

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
