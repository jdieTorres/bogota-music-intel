"use client";

/**
 * Cargar un evento a mano.
 *
 * Es la razón de ser de toda esta fase. El scraping solo ve las salas que
 * publican su propia cartelera: el toque local en un bar chico, anunciado
 * por una historia de Instagram y nada más, es invisible para el pipeline —
 * y promover ese toque es el propósito de la plataforma.
 *
 * La evidencia es obligatoria y la base la exige (`origin = 'manual'` sin
 * `evidence` no entra). No es burocracia: un evento cargado a mano no tiene
 * página de sala a la que remitir al lector, así que la única trazabilidad
 * que va a existir es lo que se escriba acá.
 */

import { useEffect, useState } from "react";

import { BOTON, CAMPO, Rotulo, desdeCampoDeFecha } from "@/components/admin/ui";
import { crearEvento } from "@/lib/admin/eventos";
import { getSalasPublicadas } from "@/lib/admin/salas";

export function FormularioDeEvento({
  setError,
  alCrear,
}: {
  setError: (m: string | null) => void;
  alCrear: () => void;
}) {
  const [salas, setSalas] = useState<{ id: string; name: string }[]>([]);
  const [titulo, setTitulo] = useState("");
  const [sala, setSala] = useState("");
  const [fecha, setFecha] = useState("");
  const [precio, setPrecio] = useState("");
  const [boleteria, setBoleteria] = useState("");
  const [tipo, setTipo] = useState<"music" | "fiesta" | "not_music" | "">("music");
  const [local, setLocal] = useState("");
  const [evidencia, setEvidencia] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    getSalasPublicadas()
      .then(setSalas)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [setError]);

  const listo = titulo.trim() && sala && evidencia.trim().length >= 10;

  async function crear() {
    setOcupado(true);
    setError(null);
    try {
      await crearEvento({
        title: titulo.trim(),
        venue_id: sala,
        starts_at: desdeCampoDeFecha(fecha),
        price_text: precio.trim() || null,
        ticket_url: boleteria.trim() || null,
        event_type: tipo || null,
        is_local: local === "" ? null : local === "true",
        evidence: evidencia.trim(),
      });
      alCrear();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setOcupado(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-surface p-4 sm:p-5">
      <h2 className="font-display text-lg font-semibold">Nuevo evento</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Entra como borrador, igual que lo que trae el cron: aparece en &ldquo;Por
        revisar&rdquo; y se publica desde ahí. Un camino que se salta la cola es un camino
        que nadie revisa.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <Rotulo>Título</Rotulo>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Artista | Gira"
            className={CAMPO}
          />
          {/* No pasa por el normalizador: lo estás escribiendo vos, ya en la
              forma en que querés que salga. Normalizarlo encima sería pisarte. */}
          <span className="mt-1 block text-xs text-muted">
            Se publica tal cual lo escribas. Varios artistas van con &ldquo;&amp;&rdquo;.
          </span>
        </label>

        <label>
          <Rotulo>Sala</Rotulo>
          <select value={sala} onChange={(e) => setSala(e.target.value)} className={CAMPO}>
            <option value="">elegí una…</option>
            {salas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-muted">
            ¿No está? Creala en la pestaña Salas.
          </span>
        </label>

        <label>
          <Rotulo>Fecha y hora (Bogotá)</Rotulo>
          <input
            type="datetime-local"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className={CAMPO}
          />
          <span className="mt-1 block text-xs text-muted">
            Vacío = &ldquo;fecha por confirmar&rdquo;.
          </span>
        </label>

        <label>
          <Rotulo>Precio</Rotulo>
          <input value={precio} onChange={(e) => setPrecio(e.target.value)} className={CAMPO} />
        </label>

        <label>
          <Rotulo>Boletería</Rotulo>
          <input
            value={boleteria}
            onChange={(e) => setBoleteria(e.target.value)}
            className={CAMPO}
          />
        </label>

        <label>
          <Rotulo>Qué es</Rotulo>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
            className={CAMPO}
          >
            <option value="music">concierto</option>
            <option value="fiesta">fiesta o ciclo</option>
            <option value="not_music">no es música</option>
            <option value="">todavía no sé</option>
          </select>
        </label>

        <label>
          <Rotulo>Artista local</Rotulo>
          <select value={local} onChange={(e) => setLocal(e.target.value)} className={CAMPO}>
            <option value="">no lo sé</option>
            <option value="true">sí, local</option>
            <option value="false">no, internacional</option>
          </select>
        </label>

        <label className="sm:col-span-2">
          <Rotulo>Evidencia (obligatoria)</Rotulo>
          <textarea
            value={evidencia}
            onChange={(e) => setEvidencia(e.target.value)}
            rows={3}
            placeholder="De dónde salió: el post del artista, el flyer, quién lo confirmó."
            className={CAMPO}
          />
          <span className="mt-1 block text-xs leading-relaxed text-muted">
            No hay página de sala a la que mandar al lector, así que esto es toda la
            trazabilidad que va a existir. La base lo exige.
          </span>
        </label>
      </div>

      <button
        disabled={ocupado || !listo}
        onClick={crear}
        className={`${BOTON} mt-5 bg-accent text-background disabled:opacity-40`}
        title={!listo ? "Faltan el título, la sala o la evidencia" : undefined}
      >
        {ocupado ? "Creando…" : "Crear borrador"}
      </button>
    </div>
  );
}
