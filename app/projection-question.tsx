"use client";

import { useEffect, useRef, useState } from "react";
import type { Question } from "@/data";
import { questionTypeLabels } from "@/data";
import { determinantGuide, gradeDeterminants, matchesPhenomenon } from "@/lib/proyectivas";
import { PlateViewer } from "./plate-viewer";

const primary = "button button-primary", secondary = "button button-secondary";
export function ProjectionQuestion({ question, last, onRecord, onNext }: { question: Question; last: boolean; onRecord: (q: Question, mastered: boolean) => void; onNext: () => void }) {
  const exercise = question.projection!;
  const [codes, setCodes] = useState<string[][]>(() => exercise.rows?.map(() => ["", "", ""]) ?? []);
  const [written, setWritten] = useState<string[]>(() => exercise.fields?.map(() => "") ?? (exercise.phenomenon ? ["", ""] : [""]));
  const [revealed, setRevealed] = useState(false);
  const [reviews, setReviews] = useState<(boolean | null)[]>(() => exercise.criteria.map(() => null));
  const [recorded, setRecorded] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null), feedback = useRef<HTMLDivElement>(null);
  useEffect(() => { heading.current?.focus(); window.scrollTo(0, 0); }, []);
  useEffect(() => { if (revealed) feedback.current?.focus(); }, [revealed]);
  const results = exercise.rows?.map((row, index) => gradeDeterminants(row, codes[index]));
  const nameCorrect = exercise.phenomenon ? matchesPhenomenon(written[0], exercise.phenomenon.names) : true;
  const objectiveCorrect = (results?.every((row) => row.correct) ?? true) && nameCorrect;
  const ready = exercise.rows ? codes.every((row) => row.some((value) => value.trim())) : written.every((value) => value.trim());
  const criteriaReady = reviews.every((value) => value !== null);
  const mastered = objectiveCorrect && reviews.every((value) => value === true);
  function save() { if (recorded || !revealed || !criteriaReady) return; setRecorded(true); onRecord(question, mastered); }
  const labels = exercise.fields?.map((f) => f.label) ?? (exercise.phenomenon ? ["Nombre del fenómeno", "Fundamento, diferencia con otro fenómeno y límites"] : ["Tu desarrollo"]);
  return <article className="min-w-0 overflow-hidden rounded-3xl border border-[#ded9cf] bg-[#fbfaf7]">
    <div className="space-y-4 border-b border-[#ded9cf] p-5 sm:p-8"><p className="eyebrow">{questionTypeLabels[question.type]} · {question.topic}</p><h1 tabIndex={-1} ref={heading} className="text-3xl leading-tight sm:text-4xl">{question.prompt}</h1>
      {question.media && exercise.plate && <PlateViewer key={question.id} plate={exercise.plate} media={question.media} initialRegions={exercise.rows?.map((row) => row.region)} />}
      {exercise.rows && <p className="rounded-xl bg-[#f0e7df] p-4 text-sm leading-6">Cada número de área corresponde a una fila. La primera columna reproduce lo que dice un paciente ficticio y su interrogatorio. Escribí un código por celda, respetando mayúsculas (FC ≠ Fc). Dejá vacías las columnas que no necesites. Los casos no evalúan adecuación formal ni localizaciones normadas.</p>}
    </div>
    <div className="space-y-5 p-5 sm:p-8">
      {exercise.rows ? <div className="overflow-x-auto" role="region" aria-label="Cuadro de determinantes" tabIndex={0}><table className="determinant-table"><caption className="mb-3 text-left font-bold">Respuesta del paciente y hasta tres determinantes</caption><thead><tr><th scope="col">Respuesta y área</th>{[1, 2, 3].map((n) => <th scope="col" key={n}>Determinante {n}</th>)}</tr></thead><tbody>{exercise.rows.map((row, index) => <tr key={index}><th scope="row"><span className="block font-bold">Área {index + 1} · «{row.response}»</span><span className="mt-2 block font-normal">Interrogatorio: {row.inquiry}</span></th>{[0, 1, 2].map((column) => <td key={column}><input aria-label={`Respuesta ${index + 1}, determinante ${column + 1}`} type="text" autoComplete="off" autoCapitalize="off" spellCheck={false} maxLength={24} value={codes[index][column]} readOnly={revealed} onChange={(event) => setCodes((previous) => previous.map((values, i) => i === index ? values.map((value, j) => j === column ? event.target.value : value) : values))} /></td>)}</tr>)}</tbody></table><p className="mt-2 text-sm">En pantallas pequeñas, desplazá el cuadro horizontalmente para ver las cuatro columnas.</p></div>
        : <div className="space-y-5">{labels.map((label, index) => <label key={label} className="block font-bold">{label}{exercise.phenomenon && index === 0 ? <input className="mt-2" autoComplete="off" maxLength={200} value={written[index]} readOnly={revealed} onChange={(event) => setWritten((prev) => prev.map((value, i) => i === index ? event.target.value : value))} /> : <textarea className="mt-2" rows={exercise.fields ? 4 : 7} maxLength={15000} value={written[index]} readOnly={revealed} onChange={(event) => setWritten((prev) => prev.map((value, i) => i === index ? event.target.value : value))} />}</label>)}</div>}
      <p className="text-sm text-[#526056]">Práctica académica. Solo los códigos y el nombre breve del fenómeno se comparan con una clave. Los desarrollos se revisan criterio por criterio; no se califican por palabras sueltas ni se envían a un servicio externo. El texto se reinicia al salir.</p>
      {!revealed ? <button className={primary} disabled={!ready} onClick={() => setRevealed(true)}>{exercise.rows ? "Corregir cuadro" : "Revisar con la guía"}</button> : <div ref={feedback} tabIndex={-1} className="space-y-5 rounded-2xl bg-[#eaf0e6] p-5">
        <h2 className="text-2xl">Devolución del ejercicio</h2><p className="leading-7">{question.explanation}</p>
        {results && <><p className="font-bold">Codificación: {results.filter((row) => row.correct).length} de {results.length} filas correctas.</p>{exercise.rows!.map((row, index) => <section key={index} className="space-y-2 rounded-xl border border-[#b4c5af] bg-white p-4"><h3 className="font-bold">Fila {index + 1}: {results[index].correct ? "codificación correcta" : "revisá la codificación"}</h3><p>Tu respuesta: {results[index].entered.join(" · ") || "sin códigos"}. Clave: <strong>{row.codes.join(" · ")}</strong>.</p>{results[index].messages.map((message, i) => <p key={i} className="text-[#834021]">{message}</p>)}<p className="leading-7">Por qué: {row.explanation}</p></section>)}</>}
        {exercise.phenomenon && <section className="space-y-3 rounded-xl bg-white p-4"><h3 className="font-bold">Nombre escrito: {nameCorrect ? "coincide con la clave" : "no coincide con la clave"}</h3><p>Tu nombre: «{written[0]}». Clave: <strong>{exercise.phenomenon.names[0]}</strong>.</p><p>Dato decisivo: {exercise.phenomenon.clue}</p><p>Para distinguirlo: {exercise.phenomenon.confusion}</p>{!nameCorrect && <p>La comparación reconoce los nombres indicados por la clave; una paráfrasis no reconocida requiere revisión manual. La app la deja pendiente, sin afirmar haber evaluado el significado de tu texto.</p>}</section>}
        {exercise.fields?.map((field) => <section key={field.label}><h3 className="font-bold">{field.label}</h3><p className="leading-7">{field.guide}</p></section>)}
        {exercise.criteria.length > 0 && <fieldset className="space-y-4"><legend className="mb-3 text-xl">Compará tu fundamento con cada criterio</legend>{exercise.criteria.map((criterion, index) => <section key={index} className="space-y-2 rounded-xl bg-white p-4"><h3 className="font-bold">{index + 1}. {criterion.label}</h3><p>{criterion.guidance}</p><p className="text-[#834021]">Confusión a revisar: {criterion.confusion}</p><div className="flex flex-wrap gap-2">{[true, false].map((value) => <button key={String(value)} className={secondary} disabled={recorded} aria-pressed={reviews[index] === value} onClick={() => setReviews((prev) => prev.map((review, i) => i === index ? value : review))}>{value ? "Lo incluí" : "Me faltó o lo confundí"}<span className="sr-only"> · criterio {index + 1}</span></button>)}</div></section>)}</fieldset>}
        {reviews.some((value) => value === false) && <div><h3 className="font-bold">Para reforzar en tu próxima respuesta</h3><ul className="list-disc space-y-2 pl-5">{exercise.criteria.filter((_, i) => reviews[i] === false).map((criterion) => <li key={criterion.label}>{criterion.guidance}</li>)}</ul></div>}
        <p className="text-sm">Fuente: {question.source}</p>
        {!recorded ? <button className={primary} disabled={!criteriaReady} onClick={save}>Guardar revisión</button> : <><p role="status" className="font-bold">{mastered ? "Actividad lograda según la clave y tu revisión." : "Actividad guardada como pendiente de repaso."}</p><button className={primary} onClick={onNext}>{last ? "Ver resultados" : "Siguiente pregunta →"}</button></>}
      </div>}
      {exercise.rows && <details className="rounded-xl border border-[#d8d4ca] p-4"><summary className="cursor-pointer font-bold">Consultar glosario de códigos (ayuda opcional)</summary><p className="my-3 text-sm">Consultarlo convierte este intento en práctica guiada. Las claves siguen el apunte; no equivalen a otros sistemas de Rorschach.</p><dl className="space-y-3">{Object.entries(determinantGuide).map(([code, meaning]) => <div key={code}><dt className="font-bold">{code}</dt><dd>{meaning}</dd></div>)}</dl></details>}
    </div>
  </article>;
}
