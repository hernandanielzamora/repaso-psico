"use client";

import { useState } from "react";
import { questionTypeLabels, type Question, type Subject } from "@/data";
import { buildSession, selectQuestions, type Mode, type Progress, type StudyScope } from "@/lib/study";
import { setExamUnits, useExamPreferences, type Exam } from "@/lib/exam-store";

export const examLabels: Record<Exam, string> = { first: "Primer parcial", second: "Segundo parcial", final: "Final" };

export function StudySetup({ subject, progress, onStart }: { subject: Subject; progress: Progress; onStart: (bank: Question[], context?: string) => void }) {
  const [mode, setMode] = useState<Mode>("all");
  const [topic, setTopic] = useState("all");
  const [exam, setExam] = useState<Exam>("final");
  const [limit, setLimit] = useState(subject.units ? "10" : "all");
  const [randomize, setRandomize] = useState(!!subject.units);
  const [onlyPending, setOnlyPending] = useState(false);
  const { preferences, warning } = useExamPreferences();
  const unitIds = exam === "final" ? subject.units?.map((unit) => unit.id) : preferences[subject.id]?.[exam] ?? [];
  const scope: StudyScope = subject.units ? { unitIds, includeFinalOnly: exam === "final" } : {};
  const pool = selectQuestions(subject.id, mode, topic, scope);
  const selected = onlyPending ? pool.filter((question) => progress[question.id]?.mastered === false) : pool;
  const count = limit === "all" ? selected.length : Math.min(Number(limit), selected.length);
  const context = subject.units ? `${examLabels[exam]} · ${unitIds?.map((id) => `U${id.slice(1)}`).join(", ") || "sin unidades seleccionadas"}` : undefined;

  function changeExam(value: Exam) { setExam(value); setTopic("all"); }
  function toggleUnit(id: string, checked: boolean) {
    if (exam === "final") return;
    setExamUnits(subject.id, exam, checked ? [...unitIds ?? [], id] : (unitIds ?? []).filter((unit) => unit !== id));
    setTopic("all");
  }
  function start(bank: Question[], label = context) {
    const prepared = buildSession(bank, limit === "all" ? bank.length : Number(limit), randomize);
    if (prepared.length) onStart(prepared, label);
  }

  return <>
    <section className="panel" aria-labelledby="preparar">
      <h2 id="preparar" className="text-3xl">Prepará tu sesión</h2>
      {subject.units && <div className="mt-6 space-y-5">
        <label htmlFor="exam" className="block font-bold">Estoy preparando<select id="exam" value={exam} onChange={(event) => changeExam(event.target.value as Exam)}>{Object.entries(examLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {exam === "final" ? <p className="text-[#526056]">El final incluye las cinco unidades y consignas integradoras. Podés acotar la práctica por tema o modalidad.</p> : <fieldset className="rounded-2xl border border-[#d8d4ca] p-4">
          <legend className="px-2 font-bold">Unidades de tu {exam === "first" ? "primer" : "segundo"} parcial</legend>
          <p className="mb-3 text-sm text-[#526056]">El PDF no indica el corte de los parciales. Marcá las unidades que entran según tu cátedra. Esta selección es personal y se guarda en este navegador.</p>
          <div className="grid gap-2 sm:grid-cols-2">{subject.units.map((unit) => <label key={unit.id} className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl bg-[#f4f1eb] p-3"><input className="mt-1 h-5 w-5 shrink-0 accent-[#31513a]" type="checkbox" checked={unitIds?.includes(unit.id) ?? false} onChange={(event) => toggleUnit(unit.id, event.target.checked)} /><span>{unit.name}<span className="block text-xs text-[#526056]">PDF: pp. {unit.pages[0]}–{unit.pages[1]}</span></span></label>)}</div>
        </fieldset>}
        {warning && <p role="status" className="rounded-xl bg-[#fff0d7] p-3">{warning}</p>}
      </div>}
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div><label className="font-bold" htmlFor="mode">Forma de practicar</label><select id="mode" value={mode} onChange={(event) => setMode(event.target.value as Mode)}><option value="all">Todas las modalidades</option>{subject.questionTypes.map((type) => <option key={type} value={type}>{questionTypeLabels[type]}</option>)}</select></div>
        <div><label className="font-bold" htmlFor="topic">Tema</label><select id="topic" value={topic} onChange={(event) => setTopic(event.target.value)}><option value="all">Todos los temas</option>{subject.topics.filter((name) => !subject.units || exam === "final" || name !== "Integración final").map((name) => <option key={name}>{name}</option>)}</select></div>
        {subject.units && <>
          <div><label className="font-bold" htmlFor="limit">Duración de la práctica</label><select id="limit" value={limit} onChange={(event) => setLimit(event.target.value)}><option value="10">Hasta 10 actividades</option><option value="20">Hasta 20 actividades</option><option value="all">Todas las disponibles</option></select></div>
          <div className="flex flex-col justify-center gap-3"><label className="flex min-h-11 cursor-pointer items-center gap-3"><input type="checkbox" className="h-5 w-5 accent-[#31513a]" checked={randomize} onChange={(event) => setRandomize(event.target.checked)} />Variar el orden en cada sesión</label><label className="flex min-h-11 cursor-pointer items-center gap-3"><input type="checkbox" className="h-5 w-5 accent-[#31513a]" checked={onlyPending} onChange={(event) => setOnlyPending(event.target.checked)} />Solo pendientes de repaso</label></div>
        </>}
      </div>
      <p role="status" className="my-5 text-[#526056]">{subject.units && !unitIds?.length ? "Seleccioná al menos una unidad para preparar este parcial." : selected.length ? `${count} ${subject.units ? "actividades" : "preguntas"} en esta sesión${subject.units ? ` de ${selected.length} disponibles` : ""}. Las respuestas escritas y orales se revisan con una guía de autoevaluación.` : onlyPending ? "No hay pendientes en esta selección. Desmarcá el filtro para practicar otras actividades." : "Todavía no hay preguntas para esta combinación. Elegí otro tema o modalidad."}</p>
      {onlyPending && <p className="mb-4 text-sm text-[#526056]">Pendientes: actividades cuyo último intento fue incorrecto o marcaste para repasar.</p>}
      <button className="button button-primary" disabled={!selected.length} onClick={() => start(selected)}>{subject.demo ? "Probar sesión" : "Empezar sesión"} →</button>
      {subject.units && <p className="mt-4 text-sm text-[#526056]">Las sesiones cortas distribuyen actividades entre las unidades elegidas. Son prácticas de estudio, no modelos oficiales de examen.</p>}
    </section>
    {subject.units ? <section aria-labelledby="unidades"><h2 id="unidades" className="mb-2 text-2xl">Práctica por unidad</h2><p className="mb-4 text-sm text-[#526056]">Acceso directo con todas las modalidades, dentro de las unidades de tu examen. Respeta la duración elegida y el filtro de pendientes.</p><div className="grid gap-3 sm:grid-cols-2">{subject.units.map((unit) => {
      const bank = selectQuestions(subject.id, "all", "all", { unitIds: unitIds?.includes(unit.id) ? [unit.id] : [], includeFinalOnly: false });
      const available = onlyPending ? bank.filter((question) => progress[question.id]?.mastered === false) : bank;
      return <button key={unit.id} className="panel text-left" disabled={!available.length} onClick={() => start(available, `${examLabels[exam]} · ${unit.name}`)}><span className="block text-xl">{unit.name} →</span><span className="mt-2 block text-sm text-[#526056]">pp. {unit.pages[0]}–{unit.pages[1]} · {available.length} actividades disponibles{!unitIds?.includes(unit.id) ? " · fuera de tu selección" : ""}</span></button>;
    })}</div></section> : <section aria-labelledby="temas"><h2 id="temas" className="mb-4 text-2xl">Práctica por tema</h2><div className="grid gap-3 sm:grid-cols-2">{subject.topics.map((name) => {
      const bank = selectQuestions(subject.id, "all", name);
      return <button key={name} className="panel text-left" disabled={!bank.length} onClick={() => start(bank)}><span className="block text-xl">{name} →</span><span className="mt-2 block text-sm text-[#526056]">{bank.length} preguntas · {bank.filter((question) => progress[question.id]).length} recorridas</span></button>;
    })}</div></section>}
  </>;
}
