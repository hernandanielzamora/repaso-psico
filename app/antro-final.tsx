"use client";

import { useState } from "react";
import type { Question } from "@/data";
import { recordReview } from "@/lib/progress-store";
import { writtenOutcome, writtenRatingLabels, type WrittenRating } from "@/lib/antro";
import { FocusHeading } from "./study-session";
import { WrittenReview } from "./written-review";

export function AntroFinal({ bank }: { bank: Question[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<"write" | "review" | "results">("write");
  const [index, setIndex] = useState(0);
  const [reviews, setReviews] = useState<Record<string, WrittenRating[]>>({});
  const question = bank[index];
  const answered = bank.filter((item) => answers[item.id]?.trim()).length;
  const pending = bank.filter((item) => !writtenOutcome(reviews[item.id] ?? []));
  if (!question) return <p>No hay consignas. <a href="#subject/antro">Volver a Antropología</a></p>;
  function download() {
    const content = bank.map((item, i) => `${i + 1}. ${item.prompt}\n\nMI RESPUESTA\n${answers[item.id] ?? ""}\n\nGUÍA\n${item.explanation}\n\nREVISIÓN GUIADA\n${item.writtenCriteria!.map((criterion, j) => `${writtenRatingLabels[reviews[item.id][j]]}: ${criterion.expected}\n${reviews[item.id][j] === "achieved" ? "Punto logrado según autoevaluación." : criterion.guidance}`).join("\n\n")}\n\nFuente: ${item.source}`).join("\n\n----------------\n\n");
    const url = URL.createObjectURL(new Blob([`Simulacro didáctico de Antropología · autoevaluación, sin nota oficial\n\n${content}`], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "antro-final-revision.txt"; anchor.click(); URL.revokeObjectURL(url);
  }
  return <div className="mx-auto max-w-4xl space-y-6">
    <a href="#subject/antro" className="button button-secondary">← Volver a Antropología</a>
    {stage === "write" ? <section className="panel space-y-6">
      <FocusHeading className="text-4xl">Simulacro integrador de final</FocusHeading>
      <p>Seis consignas: una por unidad y una transversal. Tiempo sugerido: 120 minutos, a tu ritmo. Desarrollá conceptos, atribuídos a sus autores, explicá relaciones y fundamentá el análisis de los casos. Todas tienen el mismo lugar en esta práctica; no se calcula una nota de cátedra.</p>
      <p className="text-sm text-[#526056]">Las guías se abren después de entregar las seis respuestas. Podés desplazarte y editar antes de entregar. Los textos no se guardan al recargar o salir; el progreso se registra durante la revisión.</p>
      <nav className="flex flex-wrap gap-2" aria-label="Consignas del simulacro">{bank.map((item, i) => <button key={item.id} className="button button-secondary" aria-pressed={index === i} onClick={() => setIndex(i)}>Consigna {i + 1}{answers[item.id]?.trim() ? " · escrita" : ""}</button>)}</nav>
      <p className="eyebrow">Consigna {index + 1} de {bank.length} · {question.finalOnly ? "Cruce entre unidades" : `Unidad ${question.unit!.slice(1)}`}</p>
      <h2 className="text-2xl leading-9">{question.prompt}</h2>
      <label className="block font-bold" htmlFor="final-answer">Tu respuesta a la consigna {index + 1}</label>
      <textarea id="final-answer" rows={12} maxLength={20000} value={answers[question.id] ?? ""} onChange={(event) => setAnswers((previous) => ({ ...previous, [question.id]: event.target.value }))} />
      <p role="status">{answered} de {bank.length} respuestas escritas. {answered < bank.length && "Completá todas para entregar."}</p>
      <div className="flex flex-wrap gap-3"><button className="button button-secondary" disabled={index === 0} onClick={() => setIndex(index - 1)}>← Anterior</button><button className="button button-secondary" disabled={index === bank.length - 1} onClick={() => setIndex(index + 1)}>Siguiente consigna →</button><button className="button button-primary" disabled={answered !== bank.length} onClick={() => { setIndex(0); setStage("review"); }}>Entregar y revisar</button></div>
    </section> : stage === "review" ? <section className="panel space-y-6" key={question.id}>
      <p className="eyebrow">Revisión · Consigna {index + 1} de {bank.length}</p>
      <FocusHeading className="text-3xl">{question.prompt}</FocusHeading>
      <div><h2 className="mb-2 text-xl">Tu respuesta entregada</h2><p className="whitespace-pre-wrap rounded-xl bg-[#f4f1eb] p-4">{answers[question.id]}</p></div>
      <div className="space-y-4 rounded-xl bg-[#eaf0e6] p-5"><h2 className="text-2xl">Respuesta orientativa</h2><p className="leading-7">{question.explanation}</p><p className="text-sm">Fuente: {question.source}</p><WrittenReview question={question} onComplete={(ratings) => { setReviews((previous) => ({ ...previous, [question.id]: ratings })); recordReview(question.id, writtenOutcome(ratings)); }} /></div>
      <button className="button button-primary" disabled={!reviews[question.id]} onClick={() => index === bank.length - 1 ? setStage("results") : setIndex(index + 1)}>{index === bank.length - 1 ? "Ver balance del simulacro" : "Revisar siguiente consigna →"}</button>
    </section> : <section className="panel space-y-6">
      <FocusHeading className="text-4xl">Balance del simulacro</FocusHeading>
      <p>{bank.length - pending.length} de {bank.length} respuestas logradas según tu revisión. {pending.length} para reforzar. Este balance refleja tus marcas por criterio; no es una corrección automática ni una nota oficial.</p>
      {bank.map((item, i) => <details key={item.id} className="rounded-xl border border-[#ded9cf] p-4"><summary className="cursor-pointer font-bold">Consigna {i + 1} · {writtenOutcome(reviews[item.id]) ? "Lograda" : "Para reforzar"} · {item.topic}</summary><div className="mt-4 space-y-3"><p>{item.prompt}</p><p className="whitespace-pre-wrap">{answers[item.id]}</p><ul className="list-disc space-y-3 pl-5">{item.writtenCriteria!.map((criterion, j) => <li key={j}><strong>{writtenRatingLabels[reviews[item.id][j]]}:</strong> {criterion.expected}{reviews[item.id][j] !== "achieved" && <p>{criterion.guidance}</p>}</li>)}</ul><p className="text-sm">Fuente: {item.source}</p></div></details>)}
      <button className="button button-primary" onClick={download}>Descargar respuestas y devolución</button>
      <p>Para repasar las dificultades, volvé a la materia y activá «Solo pendientes de repaso». La biblioteca conserva las revisiones de cada pregunta.</p>
    </section>}
  </div>;
}
