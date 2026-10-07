"use client";

import { useState, useSyncExternalStore } from "react";
import { questions, subjects, questionTypeLabels, type Question, type Subject } from "@/data";
import { selectQuestions, subjectProgress, type Mode, type Progress } from "@/lib/study";
import { useProgress } from "@/lib/progress-store";
import { FocusHeading, Session } from "./study-session";

const primary = "button button-primary";
const secondary = "button button-secondary";
const subjectHref = (id: string) => `#subject/${encodeURIComponent(id)}`;
const subscribeRoute = (listener: () => void) => {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
};
const readRoute = () => window.location.hash;

export default function Home() {
  const hash = useSyncExternalStore(subscribeRoute, readRoute, () => "");
  const [, screen, id] = /^#(subject|session)\/([\w-]+)$/.exec(hash) ?? [];
  const subject = subjects.find((item) => item.id === id);
  const [sessionPlan, setSessionPlan] = useState<{ subjectId: string; questions: Question[] } | null>(null);
  const { progress, warning } = useProgress();
  function start(selected: Question[]) {
    if (!subject || !selected.length) return;
    setSessionPlan({ subjectId: subject.id, questions: selected });
    window.history.pushState(null, "", `#session/${subject.id}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
  return <main id="contenido" className="min-h-screen px-4 py-5 sm:px-8 md:py-8">
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 flex items-center justify-between gap-4 border-b border-[#d8d4ca] pb-5">
        <a href="#library" className="flex items-center gap-3" aria-label="Núcleo — Todas las materias">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25342b] font-bold text-white">N</span>
          <span className="font-bold">Núcleo<span className="block text-xs font-normal text-[#526056]">Psicología · UNC</span></span>
        </a>
        <a href="#library" className={secondary}>Todas las materias</a>
      </header>
      {warning && <p role="status" className="mb-6 rounded-xl bg-[#fff0d7] p-4">{warning}</p>}
      {!subject ? <Library progress={progress} /> : screen === "session"
        ? <Session key={subject.id} subject={subject} bank={sessionPlan?.subjectId === subject.id ? sessionPlan.questions : selectQuestions(subject.id)} />
        : <SubjectHome key={subject.id} subject={subject} progress={progress} onStart={start} />}
      <footer className="mt-12 border-t border-[#d8d4ca] py-5 text-sm text-[#526056]">Tu progreso se guarda en este navegador. No se sincroniza entre dispositivos.</footer>
    </div>
  </main>;
}

function ProgressBar({ percent }: { percent: number }) {
  return <progress aria-label="Preguntas recorridas" value={percent} max={100} className="h-2 w-full" />;
}

function Library({ progress }: { progress: Progress }) {
  const realSubjects = subjects.filter((subject) => !subject.demo);
  const realQuestions = questions.filter((question) => realSubjects.some((subject) => subject.id === question.subjectId));
  const reviewed = realQuestions.filter((question) => progress[question.id]).length;
  return <div className="space-y-10">
    <section className="grid items-end gap-8 lg:grid-cols-[1fr_300px]">
      <div><p className="eyebrow mb-3">Biblioteca de estudio</p><FocusHeading className="text-5xl leading-[1.02] tracking-[-0.05em] md:text-7xl">Elegí una materia.<br /><em className="text-[#5d765a]">Entrá en ritmo.</em></FocusHeading><p className="mt-5 max-w-xl leading-7 text-[#526056]">Practicá a tu manera: elegí un tema, respondé preguntas y revisá lo que necesitás reforzar.</p></div>
      <aside className="rounded-3xl bg-[#25342b] p-6 text-[#f7f3ea]"><p className="text-xs uppercase tracking-widest text-[#cbd7c7]">Tu recorrido</p><p className="mt-4 text-4xl">{reviewed} <span className="text-base">/ {realQuestions.length} preguntas</span></p><p className="mt-4 text-sm text-[#cbd7c7]">{realSubjects.length} materia con contenido · {subjects.length - realSubjects.length} demos</p></aside>
    </section>
    <section aria-labelledby="materias"><h2 id="materias" className="mb-4 text-2xl">Tus materias</h2><div className="grid gap-5 md:grid-cols-2">
      {subjects.map((subject) => {
        const stats = subjectProgress(subject.id, progress);
        return <a key={subject.id} href={subjectHref(subject.id)} className="subject-card rounded-3xl border border-[#ded9cf] bg-[#fbfaf7] p-6">
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="eyebrow mb-3">{subject.demo ? "Demo · sin contenido de cátedra" : "Contenido del resumen"}</p><h3 className="text-3xl tracking-tight sm:text-4xl">{subject.name}</h3></div><span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold" style={{ backgroundColor: subject.soft, color: subject.accent }}>{subject.mark}</span></div>
          <p className="mt-5 text-sm leading-6 text-[#526056]">{subject.description}</p>
          <p className="mt-4 text-sm text-[#526056]">{subject.questionTypes.map((type) => questionTypeLabels[type]).join(" · ")}</p>
          <div className="mt-6"><ProgressBar percent={stats.percent} /><p className="mt-2 text-sm">{subject.demo ? "Explorar demostración" : `${stats.reviewed} de ${stats.total} recorridas · ${stats.percent}%`} <span aria-hidden="true">→</span></p></div>
        </a>;
      })}
    </div></section>
  </div>;
}

function SubjectHome({ subject, progress, onStart }: { subject: Subject; progress: Progress; onStart: (bank: Question[]) => void }) {
  const [mode, setMode] = useState<Mode>("all");
  const [topic, setTopic] = useState("all");
  const selected = selectQuestions(subject.id, mode, topic);
  const stats = subjectProgress(subject.id, progress);
  return <div className="space-y-8">
    <section className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 rounded-3xl p-6 md:p-9" style={{ backgroundColor: subject.soft }}>
        <p className="eyebrow mb-4">{subject.demo ? "Demostración del recorrido" : "Tu materia prioritaria"}</p>
        <FocusHeading className="text-4xl tracking-[-0.04em] sm:text-6xl">{subject.name}</FocusHeading>
        <p className="mt-6 max-w-xl text-lg leading-8 text-[#526056]">{subject.description}</p>
        {subject.demo && <p className="mt-4 font-bold">Estos ejercicios prueban la interfaz; no son material para el parcial.</p>}
      </div>
      <aside className="rounded-3xl bg-[#25342b] p-7 text-[#f7f3ea]"><p className="text-sm">{subject.demo ? "Recorrido de prueba" : "Tu avance"}</p><p className="my-5 text-6xl">{stats.percent}%</p><ProgressBar percent={stats.percent} /><p className="mt-3 text-sm">{stats.reviewed} de {stats.total} preguntas recorridas</p><p className="mt-3 text-sm text-[#cbd7c7]">{stats.mastered} resueltas o autoevaluadas como logradas. Recorrer no implica dominar.</p></aside>
    </section>
    <section className="panel" aria-labelledby="preparar"><h2 id="preparar" className="text-3xl">Prepará tu sesión</h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="font-bold" htmlFor="mode">Forma de practicar<select id="mode" value={mode} onChange={(event) => setMode(event.target.value as Mode)}><option value="all">Todas las modalidades</option>{subject.questionTypes.map((type) => <option key={type} value={type}>{questionTypeLabels[type]}</option>)}</select></label>
        <label className="font-bold" htmlFor="topic">Tema<select id="topic" value={topic} onChange={(event) => setTopic(event.target.value)}><option value="all">Todos los temas</option>{subject.topics.map((name) => <option key={name}>{name}</option>)}</select></label>
      </div>
      <p role="status" className="my-5 text-[#526056]">{selected.length ? `${selected.length} preguntas en esta sesión. Desarrollo e imágenes se revisan con una guía de autoevaluación.` : "Todavía no hay preguntas para esta combinación. Elegí otro tema o modalidad."}</p>
      <button className={primary} disabled={!selected.length} onClick={() => onStart(selected)}>{subject.demo ? "Probar sesión" : "Empezar sesión"} →</button>
    </section>
    <section aria-labelledby="temas"><h2 id="temas" className="mb-4 text-2xl">Práctica por tema</h2><div className="grid gap-3 sm:grid-cols-2">
      {subject.topics.map((name) => {
        const bank = selectQuestions(subject.id, "all", name);
        return <button key={name} className="panel text-left" disabled={!bank.length} onClick={() => onStart(bank)}><span className="block text-xl">{name} →</span><span className="mt-2 block text-sm text-[#526056]">{bank.length} preguntas · {bank.filter((question) => progress[question.id]).length} recorridas</span></button>;
      })}
    </div></section>
  </div>;
}
