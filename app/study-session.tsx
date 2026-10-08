"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { questionTypeLabels, type Question, type Subject } from "@/data";
import { recordReview } from "@/lib/progress-store";

const primary = "button button-primary";
const secondary = "button button-secondary";
const subjectHref = (id: string) => `#subject/${encodeURIComponent(id)}`;

export function FocusHeading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, []);
  return <h1 ref={ref} tabIndex={-1} className={className}>{children}</h1>;
}

type Result = { question: Question; mastered: boolean };

export function Session({ subject, bank, context }: { subject: Subject; bank: Question[]; context?: string }) {
  const [queue, setQueue] = useState(bank);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [round, setRound] = useState(0);
  const [finished, setFinished] = useState(false);
  function record(question: Question, mastered: boolean) {
    setResults((previous) => [...previous, { question, mastered }]);
    recordReview(question.id, mastered);
  }
  function restart(next: Question[]) {
    setQueue(next); setIndex(0); setResults([]); setFinished(false); setRound((value) => value + 1);
  }
  const pending = results.filter((result) => !result.mastered).map((result) => result.question);
  const objective = results.filter((result) => result.question.options?.length);
  const written = results.filter((result) => !result.question.options?.length);
  if (!queue.length) return <div className="panel"><FocusHeading>No hay preguntas disponibles</FocusHeading><a className={secondary} href={subjectHref(subject.id)}>Volver a la materia</a></div>;
  return <div className="mx-auto max-w-4xl">
    <a className={`${secondary} mb-6`} href={subjectHref(subject.id)}>← Volver a la materia</a>
    {context && <p className="mb-5 text-sm font-bold text-[#526056]">{context}</p>}
    {subject.demo && <p className="mb-5 rounded-xl bg-[#fff0d7] p-4">Demo: ejercicios para probar el recorrido, sin contenido de cátedra.</p>}
    {finished ? <section className="panel space-y-6">
      <FocusHeading className="text-4xl">Sesión completada</FocusHeading><p>Revisaste {results.length} preguntas de {subject.name}.</p>
      {objective.length > 0 && <p className="text-xl">Elección de respuestas: <strong>{objective.filter((result) => result.mastered).length} de {objective.length} correctas</strong>.</p>}
      {written.length > 0 && <p className="text-xl">Autoevaluación: <strong>{written.filter((result) => result.mastered).length} de {written.length} logradas</strong>.</p>}
      <p>{pending.length ? `${pending.length} preguntas para reforzar.` : "Completaste este recorrido. Podés repetirlo o elegir otro tema."}</p>
      {!!pending.length && <ul className="list-disc space-y-2 pl-5">{pending.map((question) => <li key={question.id}>{question.prompt}</li>)}</ul>}
      <div className="flex flex-wrap gap-3">{!!pending.length && <button className={primary} onClick={() => restart(pending)}>Repasar pendientes</button>}<button className={secondary} onClick={() => restart(bank)}>Repetir sesión</button><a className={secondary} href={subjectHref(subject.id)}>Elegir otra práctica</a></div>
    </section> : <>
      <div className="mb-5 flex flex-wrap justify-between gap-2 text-sm text-[#526056]"><span>{subject.name}</span><span>Pregunta {index + 1} de {queue.length}</span></div>
      <QuestionCard key={`${round}-${index}-${queue[index].id}`} question={queue[index]} last={index === queue.length - 1} onRecord={record} onNext={() => index + 1 === queue.length ? setFinished(true) : setIndex(index + 1)} />
    </>}
  </div>;
}

function QuestionCard({ question, last, onRecord, onNext }: { question: Question; last: boolean; onRecord: (question: Question, mastered: boolean) => void; onNext: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [assessment, setAssessment] = useState<boolean | null>(null);
  const [zoom, setZoom] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const recorded = useRef(false);
  const feedback = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const hasOptions = !!question.options?.length;
  const oral = question.type === "flashcard";
  const correct = selected === question.answer;
  useEffect(() => { if (revealed) feedback.current?.focus({ preventScroll: false }); }, [revealed]);
  useEffect(() => { if (zoom) dialog.current?.showModal(); else dialog.current?.close(); }, [zoom]);
  function record(mastered: boolean) {
    if (recorded.current) return;
    recorded.current = true;
    onRecord(question, mastered);
  }
  function reveal() {
    if (revealed || (hasOptions ? selected === null : !oral && !answer.trim())) return;
    setRevealed(true);
    if (hasOptions) record(correct);
  }
  function assess(mastered: boolean) {
    if (assessment !== null) return;
    setAssessment(mastered); record(mastered);
  }
  return <article className="overflow-hidden rounded-3xl border border-[#ded9cf] bg-[#fbfaf7]">
    <div className="border-b border-[#ded9cf] p-5 sm:p-8">
      <p className="eyebrow mb-4">{question.unit && `Unidad ${question.unit.slice(1)} · `}{questionTypeLabels[question.type]} · {question.topic} · {question.difficulty}{question.finalOnly && " · Integradora de final"}</p>
      <FocusHeading className="text-3xl leading-tight tracking-tight sm:text-4xl">{question.prompt}</FocusHeading>
      {question.media && <figure className="mt-6">
        {imageFailed ? <p role="status" className="rounded-xl bg-[#fff0d7] p-4">No se pudo cargar la imagen. Descripción: {question.media.alt}</p> : <button aria-label="Ampliar imagen" className="block w-full rounded-2xl bg-[#f4f1eb] p-2" onClick={() => setZoom(true)}><Image src={question.media.src} alt={question.media.alt} width={question.media.width ?? 800} height={question.media.height ?? 480} onError={() => setImageFailed(true)} className="mx-auto h-auto max-h-96 w-full object-contain" /><span className="mt-2 block text-sm underline">Ampliar imagen</span></button>}
        <figcaption className="mt-3 text-sm leading-6 text-[#526056]">{question.media.caption}{question.media.credit && <span className="block">{question.media.credit}</span>}</figcaption>
        <dialog ref={dialog} onCancel={() => setZoom(false)} onClose={() => setZoom(false)} aria-label="Imagen ampliada" className="image-dialog"><button autoFocus className={`${secondary} mb-4`} onClick={() => setZoom(false)}>Cerrar imagen</button><Image src={question.media.src} alt={question.media.alt} width={question.media.width ?? 800} height={question.media.height ?? 480} className="h-auto w-full" /></dialog>
      </figure>}
    </div>
    <div className="space-y-5 p-5 sm:p-8">
      {hasOptions ? <fieldset disabled={revealed} className="space-y-3"><legend className="mb-3 font-bold">Elegí una respuesta</legend>{question.options!.map((option, optionIndex) => <label key={optionIndex} className={`option ${selected === optionIndex ? "option-selected" : ""} ${revealed && optionIndex === question.answer ? "option-correct" : ""} ${revealed && selected === optionIndex && !correct ? "option-incorrect" : ""}`}><input type="radio" name={question.id} checked={selected === optionIndex} onChange={() => setSelected(optionIndex)} /><span><span className="mr-2 font-bold">{String.fromCharCode(65 + optionIndex)}.</span>{option}{revealed && optionIndex === question.answer && <strong className="mt-2 block">Respuesta correcta</strong>}{revealed && selected === optionIndex && !correct && <strong className="mt-2 block">Tu respuesta — incorrecta</strong>}</span></label>)}</fieldset>
        : oral ? <p className="rounded-xl bg-[#e3eee1] p-5 leading-7">Respondé en voz alta o mentalmente, sin mirar el material. Después compará con la guía y marcá si lo pudiste explicar. No se graba audio.</p>
          : <div><label htmlFor="written-answer" className="mb-3 block font-bold">Tu respuesta</label><textarea id="written-answer" rows={7} maxLength={20000} value={answer} readOnly={revealed} onChange={(event) => setAnswer(event.target.value)} placeholder="Explicalo con tus palabras antes de consultar la guía…" /><p className="mt-2 text-sm text-[#526056]">La revisión es una autoevaluación con criterios; no una corrección automática. El texto no se guarda al salir de la sesión.</p></div>}
      {!revealed ? <button className={primary} disabled={hasOptions ? selected === null : !oral && !answer.trim()} onClick={reveal}>{hasOptions ? "Comprobar respuesta" : "Ver guía de respuesta"}</button>
        : <div ref={feedback} tabIndex={-1} className="space-y-4 rounded-2xl bg-[#eaf0e6] p-5">
          <h2 className="text-2xl">{hasOptions ? correct ? "¡Correcto!" : "Respuesta incorrecta" : "Guía de autoevaluación"}</h2>
          <p className="leading-7">{question.explanation}</p>
          {question.rubric && <div><h3 className="mb-2 font-bold">Criterios para revisar tu respuesta</h3><ul className="list-disc space-y-2 pl-5">{question.rubric.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul></div>}
          <p className="text-sm text-[#526056]">Fuente: {question.source}</p>
          {!hasOptions && <div><p className="mb-3 font-bold">¿Cómo te fue al comparar con la guía?</p><div className="flex flex-wrap gap-3"><button disabled={assessment !== null} aria-pressed={assessment === true} className={secondary} onClick={() => assess(true)}>Lo pude explicar</button><button disabled={assessment !== null} aria-pressed={assessment === false} className={secondary} onClick={() => assess(false)}>Necesito repasar</button></div>{assessment !== null && <p role="status" className="mt-3">Autoevaluación registrada: {assessment ? "lograda" : "para repasar"}.</p>}</div>}
          <button className={primary} disabled={!hasOptions && assessment === null} onClick={onNext}>{last ? "Ver resultados" : "Siguiente pregunta →"}</button>
        </div>}
    </div>
  </article>;
}
