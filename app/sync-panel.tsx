"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { activateCloud, cloudError, pauseCloud, syncNow, useCloudState } from "@/lib/cloud-store";
import { cloudConfigured, ensureCloudUser, getCloudClient } from "@/lib/supabase-client";
import { parsePairingInput } from "@/lib/sync-data";

type Link = { id: string; token: string; expiresAt: string; url: string; image: string };
const secondary = "button button-secondary", primary = "button button-primary";

export function SyncPanel() {
  const cloud = useCloudState();
  const [link, setLink] = useState<Link | null>(null);
  const [incoming, setIncoming] = useState("");
  const [action, setAction] = useState("");
  const [message, setMessage] = useState("");
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    function readLink() {
      const token = /^#vincular\/([a-f0-9]{64})$/.exec(location.hash)?.[1];
      if (!token) return;
      setIncoming(token); if (details.current) details.current.open = true;
      history.replaceState(null, "", `${location.pathname}${location.search}#library`);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      details.current?.scrollIntoView({ block: "start" });
    }
    readLink(); window.addEventListener("hashchange", readLink);
    return () => window.removeEventListener("hashchange", readLink);
  }, []);
  useEffect(() => {
    if (!link) return;
    let ended = false, checking = false;
    async function check() {
      if (ended || checking) return;
      if (Date.parse(link!.expiresAt) <= Date.now()) { ended = true; setLink(null); setMessage("El QR venció. Generá otro para vincular."); return; }
      if (!navigator.onLine || document.hidden) return;
      checking = true;
      try {
        const { data, error } = await getCloudClient().rpc("study_link_status", { p_id: link!.id });
        if (ended) return;
        if (error) throw error;
        if (data === "confirmed") { ended = true; setLink(null); setMessage("Dispositivo vinculado. Se combinaron los avances."); await syncNow(); }
        else if (["expired", "cancelled", "unavailable"].includes(data)) { ended = true; setLink(null); setMessage("El vínculo ya no está disponible. Podés generar uno nuevo."); }
      } catch { if (!ended) setMessage("Esperando conexión para comprobar la vinculación. El QR conserva su vencimiento."); }
      finally { checking = false; }
    }
    const timer = setInterval(() => { void check(); }, 3000);
    return () => { ended = true; clearInterval(timer); };
  }, [link]);

  async function createLink() {
    setAction("create"); setMessage("");
    try {
      await activateCloud(); await ensureCloudUser();
      const { data, error } = await getCloudClient().rpc("study_create_link");
      if (error) throw error;
      if (!data || !/^[a-f0-9]{64}$/.test(data.token) || !Number.isFinite(Date.parse(data.expiresAt))) throw new Error("Invalid link");
      const url = `${location.origin}${location.pathname}#vincular/${data.token}`;
      const image = await QRCode.toDataURL(url, { width: 320, margin: 2, errorCorrectionLevel: "M" });
      setLink({ ...data, url, image });
      setMessage("Escaneá este QR con el otro dispositivo y confirmá allí. Vence a los 5 minutos y se usa una sola vez.");
    } catch (error) { setMessage(cloudError(error)); }
    finally { setAction(""); }
  }
  async function confirmLink() {
    const token = parsePairingInput(incoming, location.origin);
    if (!token) { setMessage("Pegá un código válido o un enlace de vinculación de esta misma app."); return; }
    setAction("confirm"); setMessage("");
    try {
      await activateCloud(); await ensureCloudUser();
      const { error } = await getCloudClient().rpc("study_confirm_link", { p_token: token });
      if (error) throw error;
      setIncoming(""); setMessage("Vinculación confirmada. Ambos dispositivos comparten el progreso."); await syncNow();
    } catch (error) { setMessage(cloudError(error)); }
    finally { setAction(""); }
  }
  async function cancelLink() {
    if (!link) return;
    setAction("cancel");
    try {
      const { error } = await getCloudClient().rpc("study_cancel_link", { p_id: link.id });
      if (error) throw error;
      setLink(null); setMessage("Vínculo cancelado.");
    } catch (error) { setMessage(cloudError(error)); }
    finally { setAction(""); }
  }
  return <details ref={details} className="mb-7 rounded-2xl border border-[#d8d4ca] bg-[#fbfaf7] p-4 sm:p-6">
    <summary className="cursor-pointer font-bold">Sincronizar dispositivos <span className="ml-2 text-sm font-normal text-[#526056]">{cloud.active ? cloud.phase === "synced" ? "· Conectado" : "· Avances pendientes o conexión en curso" : "· Guardado local"}</span></summary>
    <div className="mt-5 space-y-5">
      <h2 className="text-2xl">Tu progreso en teléfono y computadora</h2>
      <p>Sin correo ni contraseña. Activá la sincronización en tus dispositivos y vinculalos una vez. Se comparten las preguntas revisadas de todas las materias; los textos en curso y las marcas de láminas siguen locales.</p>
      <p role="status" className="rounded-xl bg-[#eaf0e6] p-3">{cloud.message}{cloud.active && <span className="block text-sm">{cloud.devices} dispositivos en el perfil · {cloud.pending} revisiones por enviar.{cloud.lastSync && ` Última conexión: ${new Date(cloud.lastSync).toLocaleTimeString("es-AR")}.`}</span>}</p>
      {!cloudConfigured && <p>Falta configurar Supabase para esta versión de la app. Podés seguir estudiando con guardado local.</p>}
      <div className="flex flex-wrap gap-3">{cloud.active ? <><button className={secondary} disabled={cloud.phase === "syncing" || !!action} onClick={() => { void syncNow(); }}>Sincronizar ahora</button><button className={secondary} disabled={!!action} onClick={pauseCloud}>Pausar sincronización</button></> : <button className={primary} disabled={!cloudConfigured || !!action} onClick={() => { void activateCloud(); }}>Activar sincronización</button>}</div>
      <section className="space-y-3 border-t border-[#d8d4ca] pt-4"><h3 className="font-bold">1. Mostrá un QR en el dispositivo que querés agregar</h3><p className="text-sm">Por ejemplo, mostralo en la computadora y escanealo con el teléfono que ya tiene tu progreso. Al confirmar se combinan los avances, sin reemplazar uno por otro.</p><button className={secondary} disabled={!cloudConfigured || !!action} onClick={() => { void createLink(); }}>{action === "create" ? "Generando QR…" : "Mostrar QR para vincular este dispositivo"}</button>
        {link && <div className="space-y-3 rounded-xl border border-[#d8d4ca] p-4"><Image src={link.image} alt="QR temporal para vincular este dispositivo" width={320} height={320} className="mx-auto h-auto max-w-full" unoptimized /><p>Usalo solo con tus dispositivos. Vence a las {new Date(link.expiresAt).toLocaleTimeString("es-AR")}.</p><label className="block text-sm">Enlace de vinculación (también podés copiarlo)<input readOnly type="text" value={link.url} onFocus={(event) => event.target.select()} /></label><button className={secondary} disabled={!!action} onClick={() => { void cancelLink(); }}>Cancelar vínculo</button></div>}
      </section>
      <section className="space-y-3 border-t border-[#d8d4ca] pt-4"><h3 className="font-bold">2. Confirmá desde el dispositivo que ya tiene tu progreso</h3><p className="text-sm">Al escanear el QR, este campo se completa. También podés pegar el enlace. Confirmar permite que el otro dispositivo lea y actualice tu progreso; hacelo únicamente si el QR es tuyo.</p><label className="block">Enlace o código recibido<input type="text" autoComplete="off" maxLength={2048} value={incoming} onChange={(event) => setIncoming(event.target.value)} /></label><button className={primary} disabled={!cloudConfigured || !!action || !incoming.trim()} onClick={() => { void confirmLink(); }}>{action === "confirm" ? "Vinculando…" : "Confirmar vínculo con mi progreso"}</button></section>
      {message && <p role="status" className="rounded-xl bg-[#fff0d7] p-3">{message}</p>}
      <p className="text-sm text-[#526056]">Se guarda automáticamente tras cada revisión y se comprueban cambios cada 15 segundos mientras la app está visible. Si estás sin conexión, los envíos quedan pendientes. Para que el navegador conserve el acceso, evitá el modo incógnito. Si se borran los datos de todos los dispositivos, un perfil anónimo no tiene recuperación por correo.</p>
    </div>
  </details>;
}
