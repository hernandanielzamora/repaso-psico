"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  questionTypeLabels,
  questions,
  subjects,
  type Question,
  type QuestionType,
  type SubjectId,
} from "@/data";

type StudyMode = QuestionType;

const modeLabels: Record<StudyMode, string> = questionTypeLabels;

export default function Home() {
  const [subjectId, setSubjectId] = useState<SubjectId>(subjects[0].id);
  const [mode, setMode] = useState<StudyMode>("choice");
  const [topic, setTopic] = useState<string | "Todas">("Todas");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [completed, setCompleted] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = window.localStorage.getItem("nucleo-progress");
    return saved ? ((JSON.parse(saved) as { completed?: string[] }).completed ?? []) : [];
  });
  const [resolved, setResolved] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = window.localStorage.getItem("nucleo-progress");
    return saved ? ((JSON.parse(saved) as { resolved?: number }).resolved ?? 0) : 0;
  });

  const subject = subjects.find((item) => item.id === subjectId) ?? subjects[0];

  useEffect(() => {
    window.localStorage.setItem("nucleo-progress", JSON.stringify({ completed, resolved }));
  }, [completed, resolved]);

  const available = useMemo(
    () => questions.filter((item) => (item.subjectId ?? subjects[0].id) === subjectId && item.type === mode && (topic === "Todas" || item.topic === topic)),
    [mode, subjectId, topic]
  );
  const question = available[currentIndex % Math.max(available.length, 1)];
  const progress = Math.round((completed.length / questions.length) * 100);

  function resetCard() {
    setSelected(null);
    setShowAnswer(false);
    setWrittenAnswer("");
  }

  function changeSubject(nextSubjectId: SubjectId) {
    setSubjectId(nextSubjectId);
    setCurrentIndex(0);
    setTopic("Todas");
    resetCard();
  }

  function changeMode(nextMode: StudyMode) {
    setMode(nextMode);
    setCurrentIndex(0);
    resetCard();
  }

  function changeTopic(nextTopic: string | "Todas") {
    setTopic(nextTopic);
    setCurrentIndex(0);
    resetCard();
  }

  function markComplete() {
    if (!question || completed.includes(question.id)) return;
    setCompleted((current) => [...current, question.id]);
    setResolved((current) => current + 1);
  }

  function nextQuestion() {
    markComplete();
    setCurrentIndex((current) => current + 1);
    resetCard();
  }

  const isCorrect = selected === question?.answer;

  return (
    <main className="min-h-screen px-5 py-6 md:px-10 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-start justify-between gap-6 md:mb-10">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#5d765a]">
              <span className="h-2 w-2 rounded-full bg-[#e78b5c]" /> Núcleo de estudio
            </div>
            <h1 className="max-w-2xl text-[2.7rem] leading-[0.95] tracking-[-0.04em] text-[#20231f] sm:text-4xl md:text-6xl">
              Pensar bien también se entrena.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#667066]">
              Repaso activo con preguntas, imágenes y explicaciones para cada materia.
            </p>
          </div>
          <div className="hidden rounded-2xl border border-[#d8d4ca] bg-[#fbfaf7] px-4 py-3 text-right sm:block">
            <div className="text-2xl font-bold text-[#5d765a]">{resolved}</div>
            <div className="text-xs uppercase tracking-wider text-[#8b9189]">tarjetas resueltas</div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-5">
            <div className="rounded-2xl bg-[#25342b] p-5 text-[#f7f3ea] shadow-[0_18px_50px_rgba(37,52,43,0.12)]">
              <div className="mb-2 text-xs uppercase tracking-[0.16em] text-[#b8c8b3]">Tu recorrido</div>
              <div className="flex items-end gap-2">
                <strong className="text-4xl leading-none">{progress}%</strong>
                <span className="pb-1 text-sm text-[#b8c8b3]">cubierto</span>
              </div>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#4d6352]"><div className="h-full rounded-full bg-[#e8ae74] transition-all" style={{ width: `${progress}%` }} /></div>
              <p className="mt-4 text-sm leading-5 text-[#cbd7c7]">El avance se guarda en este dispositivo.</p>
            </div>

            <div className="rounded-2xl border border-[#d8d4ca] bg-[#fbfaf7] p-3">
              <label htmlFor="subject" className="px-3 pb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8b9189]">Materia</label>
              <select id="subject" value={subjectId} onChange={(event) => changeSubject(event.target.value as SubjectId)} className="mt-2 w-full rounded-xl border border-[#d8d4ca] bg-white px-3 py-3 text-sm font-bold text-[#31513a] outline-none focus:border-[#7f9c7d]">
                {subjects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <p className="px-3 pt-3 text-sm leading-5 text-[#697269]">{subject.description}</p>
            </div>

            <nav className="rounded-2xl border border-[#d8d4ca] bg-[#fbfaf7] p-3">
              <div className="px-3 pb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8b9189]">Tipo de pregunta</div>
              {subject.questionTypes.map((item) => <button key={item} onClick={() => changeMode(item)} className={`mb-1 flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition ${mode === item ? "bg-[#e1eadf] font-bold text-[#31513a]" : "text-[#656d65] hover:bg-[#f0eee8]"}`}>{modeLabels[item]} <span>{mode === item ? "●" : "○"}</span></button>)}
            </nav>

            <div className="rounded-2xl border border-[#d8d4ca] bg-[#fbfaf7] p-4 text-sm leading-6 text-[#697269]"><strong className="text-[#303b31]">Método sugerido</strong><p className="mt-1">Respondé antes de mirar la explicación. En desarrollo, escribí primero y usá la rúbrica después.</p></div>
          </aside>

          <section className="min-w-0">
            <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2">{(["Todas", ...subject.topics]).map((item) => <button key={item} onClick={() => changeTopic(item)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${topic === item ? "bg-[#e78b5c] text-white" : "bg-[#e8e5dd] text-[#727970]"}`}>{item === "Todas" ? "Todos" : item}</button>)}</div>
              <span className="text-sm text-[#8b9189]">{available.length} tarjetas en este recorrido</span>
            </div>
            {question ? <StudyCard question={question} selected={selected} showAnswer={showAnswer} writtenAnswer={writtenAnswer} isCorrect={isCorrect} onSelect={setSelected} onWrittenAnswer={setWrittenAnswer} onReveal={() => { setShowAnswer(true); markComplete(); }} onNext={nextQuestion} /> : <EmptyState subject={subject} mode={mode} />}
          </section>
        </section>

        <footer className="mt-10 flex flex-col gap-2 border-t border-[#d8d4ca] pt-5 text-xs text-[#899087] sm:flex-row sm:justify-between"><span>{subject.name} · contenido versionado con fuentes.</span><span>Versión local · progreso en tu navegador</span></footer>
      </div>
    </main>
  );
}

function EmptyState({ subject, mode }: { subject: { name: string }; mode: QuestionType }) {
  return <div className="rounded-3xl border border-dashed border-[#cfcac0] bg-[#fbfaf7] p-8 text-center"><h2 className="text-xl text-[#303b31]">Todavía no hay tarjetas de {questionTypeLabels[mode].toLowerCase()} para {subject.name}.</h2><p className="mt-2 text-sm leading-6 text-[#697269]">El tipo ya está contemplado en el modelo de contenido y se puede activar cuando carguemos sus preguntas.</p></div>;
}

function StudyCard({ question, selected, showAnswer, writtenAnswer, isCorrect, onSelect, onWrittenAnswer, onReveal, onNext }: { question: Question; selected: number | null; showAnswer: boolean; writtenAnswer: string; isCorrect: boolean; onSelect: (value: number) => void; onWrittenAnswer: (value: string) => void; onReveal: () => void; onNext: () => void }) {
  const isMultipleChoice = question.type === "choice" || question.type === "true-false";
  return <article className="overflow-hidden rounded-3xl border border-[#dfdbd1] bg-white shadow-[0_20px_70px_rgba(63,58,45,0.08)]"><div className="border-b border-[#eeeae1] px-5 py-5 sm:px-6 md:px-10"><div className="mb-8 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-[0.15em] text-[#8b9189]"><span>{question.topic} · {question.difficulty}</span><span>{isMultipleChoice ? "01 / 02" : "02 / 02"}</span></div>{question.media && <MediaPreview media={question.media} />}<h2 className="max-w-3xl text-2xl leading-tight tracking-[-0.025em] text-[#20231f] md:text-4xl">{question.prompt}</h2></div><div className="px-5 py-6 sm:px-6 md:px-10 md:py-8">{isMultipleChoice ? <div className="grid gap-3">{question.options?.map((option, index) => <button key={option} disabled={showAnswer} onClick={() => onSelect(index)} className={`flex min-h-14 items-start gap-4 rounded-2xl border p-4 text-left text-base transition ${selected === index ? (showAnswer ? (isCorrect ? "border-[#86a783] bg-[#e7f0e5]" : "border-[#dd9878] bg-[#fff0e8]") : "border-[#5d765a] bg-[#eef4ec]") : "border-[#e7e4dc] hover:border-[#aebaaa] hover:bg-[#fbfaf7]"}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">{String.fromCharCode(65 + index)}</span><span>{option}</span></button>)}</div> : <textarea value={writtenAnswer} onChange={(event) => onWrittenAnswer(event.target.value)} disabled={showAnswer} placeholder="Escribí tu respuesta con tus palabras..." className="min-h-48 w-full resize-y rounded-2xl border border-[#dcd8cf] bg-[#fbfaf7] p-5 text-base leading-7 outline-none transition placeholder:text-[#aaa9a1] focus:border-[#7f9c7d]" />}{!showAnswer ? <button onClick={onReveal} disabled={isMultipleChoice ? selected === null : writtenAnswer.trim().length < 10} className="mt-6 min-h-12 w-full rounded-full bg-[#25342b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#3b5842] disabled:cursor-not-allowed disabled:opacity-35 sm:w-auto">{isMultipleChoice ? "Comprobar respuesta" : "Ver criterios y explicación"}</button> : <><div className="mt-6 rounded-2xl bg-[#f1f5ef] p-5"><div className="mb-2 flex items-center gap-2 font-bold text-[#31513a]">{isMultipleChoice ? (isCorrect ? "Correcto" : "Revisemos la idea") : "Pauta de corrección"}</div><p className="text-base leading-7 text-[#465247]">{question.explanation}</p>{question.rubric && <ul className="mt-4 grid gap-2 text-sm leading-5 text-[#637063]">{question.rubric.map((item) => <li key={item}>□ {item}</li>)}</ul>}<p className="mt-4 border-t border-[#d9e4d6] pt-3 text-xs font-bold uppercase tracking-wider text-[#819080]">{question.source}</p></div><button onClick={onNext} className="mt-3 min-h-12 w-full rounded-full border border-[#c9cfc7] px-5 py-3 text-sm font-bold text-[#405443] transition hover:bg-[#f4f6f2] sm:w-auto">Siguiente tarjeta →</button></>}</div></article>;
}

function MediaPreview({ media }: { media: NonNullable<Question["media"]> }) {
  return <figure className="mb-6 overflow-hidden rounded-2xl border border-[#dedbd2] bg-[#f6f4ef]"><Image src={media.src} alt={media.alt} width={media.width ?? 1200} height={media.height ?? 900} className="max-h-[26rem] w-full object-contain" />{(media.caption || media.credit) && <figcaption className="space-y-1 px-4 py-3 text-sm leading-5 text-[#697269]">{media.caption && <div>{media.caption}</div>}{media.credit && <div className="text-xs text-[#8b9189]">{media.credit}</div>}</figcaption>}</figure>;
}
