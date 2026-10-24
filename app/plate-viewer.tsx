"use client";

import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import type { MediaAsset } from "@/data";
import type { Region } from "@/lib/proyectivas-types";
import { plateSources } from "@/content/proyectivas-plates";

const secondary = "button button-secondary";
const colors = ["#005a9c", "#a72c22", "#276626"];
const clamp = (n: number) => Math.min(1, Math.max(0, n));
export function PlateViewer({ media, plate, initialRegions = [] }: { media: MediaAsset; plate: number; initialRegions?: Region[] }) {
  const [regions, setRegions] = useState<Region[][]>(() => initialRegions.length ? initialRegions.map((region) => [region]) : [[]]);
  const [active, setActive] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [showMarks, setShowMarks] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [draft, setDraft] = useState<Region | null>(null);
  const [zoom, setZoom] = useState(false);
  const [scale, setScale] = useState(100);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState("");
  const start = useRef<{ x: number; y: number } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const width = media.width!, height = media.height!;
  const transform = ["", `translate(${height} 0) rotate(90)`, `translate(${width} ${height}) rotate(180)`, `translate(0 ${width}) rotate(270)`][rotation];
  useEffect(() => { if (zoom) dialog.current?.showModal(); else dialog.current?.close(); }, [zoom]);
  function point(event: PointerEvent<SVGSVGElement>) {
    const group = event.currentTarget.querySelector<SVGGElement>("g[data-plane]")!;
    const matrix = group.getScreenCTM();
    if (!matrix) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return { x: clamp(p.x / width), y: clamp(p.y / height) };
  }
  function begin(event: PointerEvent<SVGSVGElement>) {
    if (!drawing || failed || event.button !== 0) return;
    start.current = point(event); setDraft(null);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }
  function move(event: PointerEvent<SVGSVGElement>) {
    if (!start.current) return;
    const end = point(event); if (!end) return;
    setDraft({ x: Math.min(start.current.x, end.x), y: Math.min(start.current.y, end.y), width: Math.abs(start.current.x - end.x), height: Math.abs(start.current.y - end.y) });
  }
  function end(event: PointerEvent<SVGSVGElement>) {
    const first = start.current, last = point(event); start.current = null; setDraft(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!first || !last) return;
    const rectangle = { x: Math.min(first.x, last.x), y: Math.min(first.y, last.y), width: Math.abs(first.x - last.x), height: Math.abs(first.y - last.y) };
    if (rectangle.width < .01 || rectangle.height < .01) { setMessage("La marca es muy pequeña: arrastrá para encerrar un área."); return; }
    setRegions((previous) => previous.map((list, index) => index === active ? [...list.slice(-4), rectangle] : list));
    setMessage(`Marca agregada al área ${active + 1}.`);
  }
  function restore() { setRegions(initialRegions.length ? initialRegions.map((r) => [r]) : [[]]); setMessage("Marcas iniciales restauradas."); }
  function controls() { return <div className="space-y-3">
    <div className="flex flex-wrap gap-2"><button className={secondary} onClick={() => setRotation((value) => (value + 1) % 4)}>Girar 90°</button><button className={secondary} aria-pressed={showMarks} onClick={() => setShowMarks((value) => !value)}>{showMarks ? "Ocultar marcas" : "Mostrar marcas"}</button><button className={secondary} aria-pressed={drawing} disabled={failed} onClick={() => { setDrawing((value) => !value); setShowMarks(true); }}>Marcar área</button></div>
    <div className="flex flex-wrap gap-2">{regions.map((_, index) => <button key={index} className={secondary} aria-pressed={active === index} onClick={() => setActive(index)}>Área de respuesta {index + 1}</button>)}</div>
    <p className="text-sm text-[#526056]">Posición: {rotation * 90}°. Se muestra el área de respuesta {active + 1}; cambiá el área activa para ver otra fila. {drawing ? "Arrastrá con mouse o dedo para agregar un cuadro al área activa. También podés usar los controles numéricos." : "Las marcas son referencias didácticas aproximadas, no un localizador normado ni una corrección automática de localización."}</p>
  </div>; }
  function canvas() { return <svg role="img" aria-label={`Lámina ${plate} con áreas de referencia`} viewBox={`0 0 ${rotation % 2 ? height : width} ${rotation % 2 ? width : height}`} className="block h-auto w-full bg-white" style={{ touchAction: drawing ? "none" : "auto", cursor: drawing ? "crosshair" : "default" }} onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={() => { start.current = null; setDraft(null); }}>
    <g data-plane="true" transform={transform}>
      <image href={media.src} width={width} height={height} onError={() => setFailed(true)} />
      {showMarks && regions.flatMap((list, index) => index === active ? list.map((r, mark) => <g key={`${index}-${mark}`} pointerEvents="none"><rect x={r.x * width} y={r.y * height} width={r.width * width} height={r.height * height} stroke={colors[index % colors.length]} fill="none" strokeWidth="3" vectorEffect="non-scaling-stroke" /><rect x={r.x * width} y={r.y * height} width="27" height="26" fill={colors[index % colors.length]} /><text x={r.x * width + 7} y={r.y * height + 19} fontFamily="Arial" fontSize="19" fill="white">{index + 1}</text></g>) : [])}
      {draft && <rect x={draft.x * width} y={draft.y * height} width={draft.width * width} height={draft.height * height} fill="none" stroke={colors[active % colors.length]} strokeWidth="3" strokeDasharray="6 4" vectorEffect="non-scaling-stroke" />}
    </g>
  </svg>; }
  const latest = regions[active].at(-1) ?? { x: .25, y: .25, width: .25, height: .25 };
  return <figure className="my-6 space-y-4 min-w-0">
    {controls()}
    {failed ? <p role="alert" className="rounded-xl bg-[#fff0d7] p-4">No se pudo cargar la lámina {plate}. Volvé a cargar la página para trabajar con su imagen. No evalúes su aspecto desde este error.</p> : canvas()}
    <div className="flex flex-wrap gap-2"><button className={secondary} disabled={failed} onClick={() => { setScale(100); setZoom(true); }}>Ampliar lámina</button><button className={secondary} onClick={() => { setRegions((prev) => prev.map((list, i) => i === active ? list.slice(0, -1) : list)); setMessage("Se quitó la última marca del área activa."); }}>Deshacer marca</button><button className={secondary} onClick={restore}>Restaurar marcas</button></div>
    {drawing && <fieldset className="rounded-xl border border-[#d8d4ca] p-3"><legend>Último cuadro del área {active + 1} · Coordenadas en %</legend><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{(["x", "y", "width", "height"] as const).map((key) => <label key={key} htmlFor={`${id}-${key}`} className="text-sm">{{ x: "Izquierda", y: "Arriba", width: "Ancho", height: "Alto" }[key]}<input id={`${id}-${key}`} type="number" min="0" max="100" value={Math.round(latest[key] * 100)} onChange={(e) => {
      const next = { ...latest, [key]: clamp(Number(e.target.value) / 100) }; next.width = Math.min(next.width, 1 - next.x); next.height = Math.min(next.height, 1 - next.y);
      setRegions((prev) => prev.map((list, i) => i === active ? [...list.slice(0, -1), next] : list));
    }} /></label>)}</div></fieldset>}
    <p role="status" className="text-sm">{message}</p>
    <figcaption className="text-sm leading-6 text-[#526056]">{media.caption}<span className="block">{media.credit}</span><a className="underline" href={plateSources.find((item) => item.plate === plate)!.source} target="_blank" rel="noreferrer">Fuente y licencia de la lámina {plate}</a><span className="block">Las marcas quedan en esta actividad y se reinician al salir. No se alteran los píxeles de la imagen.</span></figcaption>
    <dialog ref={dialog} aria-label="Lámina ampliada" className="image-dialog" onCancel={() => setZoom(false)} onClose={() => setZoom(false)}>
      <div className="sticky top-0 z-10 space-y-3 bg-[#fbfaf7] pb-3"><button autoFocus className={secondary} onClick={() => setZoom(false)}>Cerrar lámina</button>{controls()}<label className="block">Ampliación: {scale}%<input className="block w-full" type="range" min="100" max="300" step="25" value={scale} onChange={(e) => setScale(Number(e.target.value))} /></label></div>
      <div className="overflow-auto" style={{ maxHeight: "65dvh" }}><div style={{ width: `${scale}%` }}>{canvas()}</div></div>
      <p className="mt-3 text-sm">Ampliación de la reproducción original; no añade resolución ni garantiza equivalencia de color con una lámina física.</p>
    </dialog>
  </figure>;
}
