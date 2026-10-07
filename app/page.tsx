"use client";

import { useEffect, useMemo, useState } from "react";
import { questions, topics, type Question, type Topic } from "@/data";

type Mode = "choice" | "development";
const modeLabels: Record<Mode, string> = { choice: "Elección múltiple", development: "Desarrollo" };

export default function Home() {
  const [mode, setMode] = useState<Mode>("choice");
  const [topic, setTopic] = useState<Topic | "Todas">("Todas");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [completed, setCompleted] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = window.localStorage.getItem("nucleo-progress");
    return saved ? ((JSON.parse(saved) as { completed?: string[] }).completed ?? []) : [];
  });
  const [streak, setStreak] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = window.localStorage.getItem("nucleo-progress");
    return saved ? ((JSON.parse(saved) as { streak?: number }).streak ?? 0) : 0;
  });

  useEffect(() => {
    window.localStorage.setItem("nucleo-progress", JSON.stringify({ completed, streak }));
  }, [completed, streak]);

  const available = useMemo(() => questions.filter((question) => question.type === mode && (topic === "Todas" || question.topic === topic)), [mode, topic]);
  const question = available[currentIndex % Math.max(available.length, 1)];
  const progress = Math.round((completed.length / questions.length) * 100);

  function resetCard() { setSelected(null); setShowAnswer(false); setWrittenAnswer(""); }
  function chooseMode(nextMode: Mode) { setMode(nextMode); setCurrentIndex(0); resetCard(); }
  function chooseTopic(nextTopic: Topic | "Todas") { setTopic(nextTopic); setCurrentIndex(0); resetCard(); }
  function markComplete() {
    if (!question || completed.includes(question.id)) return;
    setCompleted((current) => [...current, question.id]);
    setStreak((current) => current + 1);
  }
  function nextQuestion() { markComplete(); setCurrentIndex((current) => current + 1); resetCard(); }
  const isCorrect = selected === question?.answer;

  return (
    <main className="min-h-screen px-5 py-6 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex items-start justify-between gap-6">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#5d765a]"><span className="h-2 w-2 rounded-full bg-[#e78b5c]" /> Núcleo de estudio</div>
            <h1 className="max-w-2xl text-[2.7rem] leading-[0.95] tracking-[-0.04em] text-[#20231f] sm:text-4xl md:text-6xl">Pensar bien también se entrena.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#667066]">Repaso activo para Psicología Experimental: RMf, estadística y tES, construido a partir del resumen de la unidad.</p>
          </div>
          <div className="hidden rounded-2xl border border-[#d8d4ca] bg-[#fbfaf7] px-4 py-3 text-right sm:block"><div className="text-2xl font-bold text-[#5d765a]">{streak}</div><div className="text-xs uppercase tracking-wider text-[#8b9189]">tarjetas resueltas</div></div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[220px_1fr]">
          <aside className="space-y-5">
            <div className="rounded-2xl bg-[#25342b] p-5 text-[#f7f3ea] shadow-[0_18px_50px_rgba(37,52,43,0.12)]"><div className="mb-2 text-xs uppercase tracking-[0.16em] text-[#b8c8b3]">Tu recorrido</div><div className="flex items-end gap-2"><strong className="text-4xl leading-none">{progress}%</strong><span className="pb-1 text-sm text-[#b8c8b3]">cubierto</span></div><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#4d6352]"><div className="h-full rounded-full bg-[#e8ae74] transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-4 text-sm leading-5 text-[#cbd7c7]">La app guarda tu avance en este dispositivo.</p></div>
            <nav className="rounded-2xl border border-[#d8d4ca] bg-[#fbfaf7] p-3"><div className="px-3 pb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8b9189]">Modo</div>{(["choice", "development"] as Mode[]).map((item) => <button key={item} onClick={() => chooseMode(item)} className={`mb-1 flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition ${mode === item ? "bg-[#e1eadf] font-bold text-[#31513a]" : "text-[#656d65] hover:bg-[#f0eee8]"}`}>{modeLabels[item]} <span>{mode === item ? "●" : "○"}</span></button>)}</nav>
            <div className="rounded-2xl border border-[#d8d4ca] bg-[#fbfaf7] p-4 text-sm leading-6 text-[#697269]"><strong className="text-[#303b31]">Método sugerido</strong><p className="mt-1">Respondé antes de mirar la explicación. En desarrollo, escribí primero y usá la rúbrica después.</p></div>
          </aside>

          <section className="min-w-0">
            <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex flex-wrap gap-2"><button onClick={() => chooseTopic("Todas")} className={`rounded-full px-3 py-1.5 text-xs font-bold ${topic === "Todas" ? "bg-[#e78b5c] text-white" : "bg-[#e8e5dd] text-[#727970]"}`}>Todos</button>{topics.map((item) => <button key={item} onClick={() => chooseTopic(item)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${topic === item ? "bg-[#e78b5c] text-white" : "bg-[#e8e5dd] text-[#727970]"}`}>{item}</button>)}</div><span className="text-sm text-[#8b9189]">{available.length} tarjetas en este recorrido</span></div>
            {question ? <StudyCard question={question} selected={selected} showAnswer={showAnswer} writtenAnswer={writtenAnswer} isCorrect={isCorrect} onSelect={setSelected} onWrittenAnswer={setWrittenAnswer} onReveal={() => { setShowAnswer(true); markComplete(); }} onNext={nextQuestion} /> : <div className="rounded-3xl bg-white p-10">No hay preguntas para este filtro.</div>}
          </section>
        </section>
        <footer className="mt-10 flex flex-col gap-2 border-t border-[#d8d4ca] pt-5 text-xs text-[#899087] sm:flex-row sm:justify-between"><span>Contenido base: Aparicio (2012), González-García et al. (2014) y Hemmerich et al. (2020).</span><span>Versión local · progreso en tu navegador</span></footer>
      </div>
    </main>
  );
}

function StudyCard({ question, selected, showAnswer, writtenAnswer, isCorrect, onSelect, onWrittenAnswer, onReveal, onNext }: { question: Question; selected: number | null; showAnswer: boolean; writtenAnswer: string; isCorrect: boolean; onSelect: (value: number) => void; onWrittenAnswer: (value: string) => void; onReveal: () => void; onNext: () => void }) {
  return <article className="overflow-hidden rounded-3xl border border-[#dfdbd1] bg-white shadow-[0_20px_70px_rgba(63,58,45,0.08)]"><div className="border-b border-[#eeeae1] px-5 py-5 sm:px-6 md:px-10"><div className="mb-8 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.15em] text-[#8b9189]"><span>{question.topic} · {question.difficulty}</span><span>{question.type === "choice" ? "01 / 02" : "02 / 02"}</span></div><h2 className="max-w-3xl text-2xl leading-tight tracking-[-0.025em] text-[#20231f] md:text-4xl">{question.prompt}</h2></div><div className="px-5 py-6 sm:px-6 md:px-10 md:py-8">{question.type === "choice" ? <div className="grid gap-3">{question.options?.map((option, index) => <button key={option} disabled={showAnswer} onClick={() => onSelect(index)} className={`flex min-h-14 items-start gap-4 rounded-2xl border p-4 text-left text-base transition ${selected === index ? (showAnswer ? (isCorrect ? "border-[#86a783] bg-[#e7f0e5]" : "border-[#dd9878] bg-[#fff0e8]") : "border-[#5d765a] bg-[#eef4ec]") : "border-[#e7e4dc] hover:border-[#aebaaa] hover:bg-[#fbfaf7]"}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">{String.fromCharCode(65 + index)}</span><span>{option}</span></button>)}</div> : <textarea value={writtenAnswer} onChange={(event) => onWrittenAnswer(event.target.value)} disabled={showAnswer} placeholder="Escribí tu respuesta con tus palabras..." className="min-h-48 w-full resize-y rounded-2xl border border-[#dcd8cf] bg-[#fbfaf7] p-5 text-base leading-7 outline-none transition placeholder:text-[#aaa9a1] focus:border-[#7f9c7d]" />}{!showAnswer ? <button onClick={onReveal} disabled={question.type === "choice" ? selected === null : writtenAnswer.trim().length < 10} className="mt-6 min-h-12 w-full rounded-full bg-[#25342b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#3b5842] disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto">{question.type === "choice" ? "Comprobar respuesta" : "Ver criterios y explicación"}</button> : <><div className="mt-6 rounded-2xl bg-[#f1f5ef] p-5"><div className="mb-2 flex items-center gap-2 font-bold text-[#31513a]">{question.type === "choice" ? (isCorrect ? "Correcto" : "Revisemos la idea") : "Pauta de corrección"}</div><p className="text-base leading-7 text-[#465247]">{question.explanation}</p>{question.rubric && <ul className="mt-4 grid gap-2 text-sm leading-5 text-[#637063]">{question.rubric.map((item) => <li key={item}>□ {item}</li>)}</ul>}<p className="mt-4 border-t border-[#d9e4d6] pt-3 text-xs font-bold uppercase tracking-wider text-[#819080]">{question.source}</p></div><button onClick={onNext} className="mt-3 min-h-12 w-full rounded-full border border-[#c9cfc7] px-5 py-3 text-sm font-bold text-[#405443] transition hover:bg-[#f4f6f2] sm:mt-3 sm:w-auto">Siguiente tarjeta →</button></>}</div></article>;
}
