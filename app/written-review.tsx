"use client";

import { useState } from "react";
import type { Question } from "@/data";
import { writtenOutcome, writtenRatingLabels, type WrittenRating } from "@/lib/antro";

export function WrittenReview({ question, onComplete }: { question: Question; onComplete: (ratings: WrittenRating[]) => void }) {
  const criteria = question.writtenCriteria ?? [];
  const [ratings, setRatings] = useState<(WrittenRating | "")[]>(criteria.map(() => ""));
  const [confirmed, setConfirmed] = useState(false);
  const [revision, setRevision] = useState("");
  const complete = ratings.every(Boolean);
  const mastered = complete && writtenOutcome(ratings as WrittenRating[]);
  return <div className="space-y-5">
    <p className="leading-7">Compará tu texto con la respuesta orientativa. En cada criterio, marcá lo que efectivamente escribiste. La devolución se construye con tus marcas; la aplicación no interpreta ni califica automáticamente el texto.</p>
    {criteria.map((criterion, index) => <div key={index} className="rounded-xl border border-[#c4cebf] bg-white p-4">
      <label className="block font-bold" htmlFor={`${question.id}-criterion-${index}`}>Criterio {index + 1}: {criterion.expected}</label>
      <select id={`${question.id}-criterion-${index}`} value={ratings[index]} disabled={confirmed} onChange={(event) => setRatings((previous) => previous.map((value, position) => position === index ? event.target.value as WrittenRating : value))}>
        <option value="">Compará y elegí una valoración</option>
        {Object.entries(writtenRatingLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      {ratings[index] && <p className="mt-3 leading-6"><strong>{ratings[index] === "achieved" ? "Punto logrado: " : ratings[index] === "partial" ? "Para completar: " : "Para corregir: "}</strong>{ratings[index] === "achieved" ? criterion.expected : criterion.guidance}</p>}
    </div>)}
    <button className="button button-secondary" disabled={!complete || confirmed} onClick={() => { setConfirmed(true); onComplete(ratings as WrittenRating[]); }}>Registrar revisión por criterios</button>
    {confirmed && <div role="status" className="space-y-3">
      <h3 className="text-xl font-bold">{mastered ? "Respuesta lograda según tu revisión" : "Respuesta para reforzar según tu revisión"}</h3>
      <p>{ratings.filter((rating) => rating === "achieved").length} de {criteria.length} criterios logrados. {mastered ? "Explicá ahora las relaciones sin mirar la guía para comprobar que podés sostener el argumento." : "Revisá las orientaciones de los criterios incompletos o incorrectos y volvé a los textos indicados en la fuente."}</p>
    </div>}
    {confirmed && <div><label htmlFor={`${question.id}-revision`} className="mb-2 block font-bold">Reescritura opcional</label><textarea id={`${question.id}-revision`} rows={5} maxLength={20000} value={revision} onChange={(event) => setRevision(event.target.value)} placeholder="Reformulá el argumento incorporando lo que faltaba…" /><p className="mt-2 text-sm">La reescritura queda en esta pantalla hasta avanzar. No modifica la revisión registrada.</p></div>}
  </div>;
}
