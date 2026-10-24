"use client";

import { useEffect, useRef, useState } from "react";
import type { Question } from "@/data";
import { questionTypeLabels } from "@/data";
import { aperceptiveGuide, determinantGuide, gradeAperceptiveMode, gradeDeterminants } from "@/lib/proyectivas";
import { PlateViewer } from "./plate-viewer";

const primary = "button button-primary", secondary = "button button-secondary";
export function ProjectionQuestion({ question, last, onRecord, onNext }: { question: Question; last: boolean; onRecord: (q: Question, mastered: boolean) => void; onNext: () => void }) {
  const exercise = question.projection!;
  const criteria = exercise.phenomenon ? [{ label: "Identifiqué el fenómeno y expliqué su definición.", guidance: `El caso trabaja ${exercise.phenomenon.names[0]}. ${exercise.phenomenon.clue}`, confusion: "Nombrar una categoría sin definirla o justificarla no desarrolla el tema." }, ...exercise.criteria] : exercise.criteria;
  const [codes, setCodes] = useState<string[][]>(() => exercise.rows?.map(() => ["", "", ""]) ?? []);
  const [modes, setModes] = useState<string[]>(() => exercise.rows?.map(() => "") ?? []);
  const [written, setWritten] = useState<string[]>(() => exercise.fields?.map(() => "") ?? [""]);
  const [revealed, setRevealed] = useState(false);
  const [reviews, setReviews] = useState<(boolean | null)[]>(() => criteria.map(() => null));
  const [recorded, setRecorded] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null), feedback = useRef<HTMLDivElement>(null);
  useEffect(() => { heading.current?.focus(); window.scrollTo(0, 0); }, []);
  useEffect(() => { if (revealed) feedback.current?.focus(); }, [revealed]);
  const results = exercise.rows?.map((row, index) => gradeDeterminants(row, codes[index]));
  const modeResults = exercise.rows?.map((row, index) => gradeAperceptiveMode(row, modes[index]));
  const objectiveCorrect = (results?.every((row) => row.correct) ?? true) && (modeResults?.every((row) => row.correct) ?? true);
  const ready = exercise.rows ? modes.every((value) => value.trim()) && codes.every((row) => row.some((value) => value.trim())) : written.every((value) => value.trim());
  const criteriaReady = reviews.every((value) => value !== null);
  const mastered = objectiveCorrect && reviews.every((value) => value === true);
  function save() { if (recorded || !revealed || !criteriaReady) return; setRecorded(true); onRecord(question, mastered); }
  const labels = exercise.fields?.map((f) => f.label) ?? [exercise.phenomenon ? "Tu desarrollo sobre fenómenos especiales" : "Tu desarrollo"];
  return <article className="min-w-0 overflow-hidden rounded-3xl border border-[#ded9cf] bg-[#fbfaf7]">
    <div className="space-y-4 border-b border-[#ded9cf] p-5 sm:p-8"><p className="eyebrow">{questionTypeLabels[question.type]} · {question.topic}</p><h1 tabIndex={-1} ref={heading} className="text-3xl leading-tight sm:text-4xl">{question.prompt}</h1>
      {question.media && exercise.plate && <PlateViewer key={question.id} plate={exercise.plate} media={question.media} initialRegions={exercise.rows?.map((row) => row.region)} />}
      {exercise.rows && <p className="rounded-xl bg-[#f0e7df] p-4 text-sm leading-6">Cada número de área corresponde a una respuesta. Leé su localización e interrogatorio y completá la primera columna con el modo aperceptivo. Luego escribí hasta tres determinantes, un código por celda, respetando mayúsculas (FC ≠ Fc). Dejá vacías las columnas de determinantes que no necesites.</p>}
    </div>
    <div className="space-y-5 p-5 sm:p-8">
      {exercise.rows ? <>
        <section className="space-y-3" aria-label="Casos del cuadro"><h2 className="text-2xl">Respuestas del paciente ficticio</h2>{exercise.rows.map((row, index) => <section key={index} className="space-y-2 rounded-xl border border-[#d8d4ca] p-4"><h3 className="font-bold">Respuesta {index + 1} · Área {index + 1}</h3><p>«{row.response}»</p><p><strong>Localización:</strong> {row.localization}</p><p><strong>Interrogatorio:</strong> {row.inquiry}</p></section>)}</section>
        <div className="overflow-x-auto" role="region" aria-label="Cuadro de determinantes" tabIndex={0}><table className="determinant-table"><caption className="mb-3 text-left font-bold">Modos aperceptivos y hasta tres determinantes</caption><thead><tr><th scope="col">Modos Aperceptivos</th>{[1, 2, 3].map((n) => <th scope="col" key={n}>Determinante {n}</th>)}</tr></thead><tbody>{exercise.rows.map((_, index) => <tr key={index}><th scope="row"><label className="block text-sm">Respuesta {index + 1}<input aria-label={`Respuesta ${index + 1}, modo aperceptivo`} type="text" autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={12} value={modes[index]} readOnly={revealed} onChange={(event) => setModes((prev) => prev.map((value, i) => i === index ? event.target.value : value))} /></label></th>{[0, 1, 2].map((column) => <td key={column}><input aria-label={`Respuesta ${index + 1}, determinante ${column + 1}`} type="text" autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={24} value={codes[index][column]} readOnly={revealed} onChange={(event) => setCodes((previous) => previous.map((values, i) => i === index ? values.map((value, j) => j === column ? event.target.value : value) : values))} /></td>)}</tr>)}</tbody></table><p className="mt-2 text-sm">En pantallas pequeñas, desplazá el cuadro horizontalmente para ver las cuatro columnas.</p></div>
      </> : <div className="space-y-5">{labels.map((label, index) => <label key={label} className="block font-bold">{label}<textarea className="mt-2" rows={exercise.fields ? 4 : 7} maxLength={15000} value={written[index]} readOnly={revealed} onChange={(event) => setWritten((prev) => prev.map((value, i) => i === index ? event.target.value : value))} /></label>)}</div>}
      <p className="text-sm text-[#526056]">Práctica académica. Los modos aperceptivos y determinantes se comparan con una clave basada en la localización informada. Los desarrollos, incluidos fenómenos especiales, se revisan criterio por criterio; no se califican por palabras sueltas ni se envían a un servicio externo. El texto se reinicia al salir.</p>
      {!revealed ? <button className={primary} disabled={!ready} onClick={() => setRevealed(true)}>{exercise.rows ? "Corregir cuadro" : "Revisar con la guía"}</button> : <div ref={feedback} tabIndex={-1} className="space-y-5 rounded-2xl bg-[#eaf0e6] p-5">
        <h2 className="text-2xl">Devolución del ejercicio</h2><p className="leading-7">{question.explanation}</p>
        {results && <><p className="font-bold">Codificación: {results.filter((row) => row.correct).length} de {results.length} filas correctas en determinantes.</p><p className="font-bold">Modos aperceptivos: {modeResults!.filter((row) => row.correct).length} de {results.length} correctos.</p>{exercise.rows!.map((row, index) => <section key={index} className="space-y-2 rounded-xl border border-[#b4c5af] bg-white p-4"><h3 className="font-bold">Fila {index + 1}: {results[index].correct && modeResults![index].correct ? "codificación correcta" : "revisá la codificación"}</h3><p className={modeResults![index].correct ? "" : "text-[#834021]"}><strong>Modo aperceptivo:</strong> {modeResults![index].message}</p><p>Modo que escribiste: {modes[index]}. Clave: <strong>{row.mode}</strong>.</p><p>Determinantes que escribiste: {results[index].entered.join(" · ") || "sin códigos"}. Clave: <strong>{row.codes.join(" · ")}</strong>.</p>{results[index].messages.map((message, i) => <p key={i} className="text-[#834021]">{message}</p>)}<p className="leading-7">Por qué: {row.explanation}</p></section>)}</>}
        {exercise.phenomenon && <section className="space-y-3 rounded-xl bg-white p-4"><h3 className="font-bold">Concepto y fundamento para comparar tu desarrollo</h3><p>Fenómeno trabajado: <strong>{exercise.phenomenon.names[0]}</strong>.</p><p>Dato decisivo: {exercise.phenomenon.clue}</p><p>Para distinguirlo: {exercise.phenomenon.confusion}</p></section>}
        {exercise.fields?.map((field) => <section key={field.label}><h3 className="font-bold">{field.label}</h3><p className="leading-7">{field.guide}</p></section>)}
        {criteria.length > 0 && <fieldset className="space-y-4"><legend className="mb-3 text-xl">Compará tu fundamento con cada criterio</legend>{criteria.map((criterion, index) => <section key={index} className="space-y-2 rounded-xl bg-white p-4"><h3 className="font-bold">{index + 1}. {criterion.label}</h3><p>{criterion.guidance}</p><p className="text-[#834021]">Confusión a revisar: {criterion.confusion}</p><div className="flex flex-wrap gap-2">{[true, false].map((value) => <button key={String(value)} className={secondary} disabled={recorded} aria-pressed={reviews[index] === value} onClick={() => setReviews((prev) => prev.map((review, i) => i === index ? value : review))}>{value ? "Lo incluí" : "Me faltó o lo confundí"}<span className="sr-only"> · criterio {index + 1}</span></button>)}</div></section>)}</fieldset>}
        {reviews.some((value) => value === false) && <div><h3 className="font-bold">Para reforzar en tu próxima respuesta</h3><ul className="list-disc space-y-2 pl-5">{criteria.filter((_, i) => reviews[i] === false).map((criterion) => <li key={criterion.label}>{criterion.guidance}</li>)}</ul></div>}
        <p className="text-sm">Fuente: {question.source}</p>
        {!recorded ? <button className={primary} disabled={!criteriaReady} onClick={save}>Guardar revisión</button> : <><p role="status" className="font-bold">{mastered ? "Actividad lograda según la clave y tu revisión." : "Actividad guardada como pendiente de repaso."}</p><button className={primary} onClick={onNext}>{last ? "Ver resultados" : "Siguiente pregunta →"}</button></>}
      </div>}
      {exercise.rows && <details className="rounded-xl border border-[#d8d4ca] p-4"><summary className="cursor-pointer font-bold">Consultar glosario de códigos (ayuda opcional)</summary><p className="my-3 text-sm">Consultarlo convierte este intento en práctica guiada. Las claves siguen el apunte; no equivalen a otros sistemas de Rorschach.</p><h3 className="my-3 font-bold">Modos aperceptivos</h3><dl className="space-y-3">{Object.entries(aperceptiveGuide).map(([code, entry]) => <div key={code}><dt className="font-bold">{code}</dt><dd>{entry.explanation}</dd></div>)}</dl><h3 className="my-3 font-bold">Determinantes</h3><dl className="space-y-3">{Object.entries(determinantGuide).map(([code, meaning]) => <div key={code}><dt className="font-bold">{code}</dt><dd>{meaning}</dd></div>)}</dl></details>}
    </div>
  </article>;
}
