"use client";

/**
 * Moderación de eventos: tres listas y el editor de cada uno.
 *
 * Las tres pestañas responden preguntas distintas y por eso no son una sola
 * lista con filtros: "Por revisar" es lo que caduca (borradores del cron y
 * lo publicado cuya fuente se movió), "En la cartelera" es lo vigente para
 * corregir o sacar, y "Ya pasaron" es lo que casi no se toca. Mezcladas, lo
 * urgente se perdería entre 40 eventos que ya ocurrieron.
 */

import { useCallback, useEffect, useState } from "react";

import {
  BOTON,
  BOTON_ROJO,
  BOTON_TENUE,
  CAMPO,
  Etiqueta,
  Rotulo,
  aCampoDeFecha,
  desdeCampoDeFecha,
  fechaCompacta,
} from "@/components/admin/ui";
import {
  type Correccion,
  type EventoEnCola,
  type Pestaña,
  borrar,
  descartar,
  descartarSugerencia,
  getEvento,
  getEventos,
  guardar,
  publicar,
  resolverCambio,
  unificarDuplicado,
} from "@/lib/admin/eventos";

export function ModeracionDeEventos({
  setError,
}: {
  setError: (m: string | null) => void;
}) {
  const [cola, setCola] = useState<EventoEnCola[]>([]);
  const [pestaña, setPestaña] = useState<Pestaña>("cola");
  const [elegido, setElegido] = useState<string | null>(null);

  const cargar = useCallback(
    async (cual: Pestaña) => {
      try {
        setCola(await getEventos(cual));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [setError],
  );

  useEffect(() => {
    // `cargar` es async y hace `await` antes de tocar el estado, así que
    // no hay ningún setState síncrono dentro del efecto. La regla no puede
    // verlo desde acá y marca un falso positivo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar(pestaña);
  }, [cargar, pestaña]);

  // Se busca en la lista en vez de guardar el objeto: así, después de
  // recargar, la ficha abierta muestra lo que quedó en la base y no una
  // copia de antes de guardar.
  const seleccionado = cola.find((e) => e.id === elegido) ?? null;

  return (
    <>
      <nav className="mt-6 flex gap-1 border-b border-border">
        {PESTAÑAS.map(([clave, rotulo]) => (
          <button
            key={clave}
            onClick={() => {
              setPestaña(clave);
              setElegido(null);
            }}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
              pestaña === clave
                ? "border-accent text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {rotulo}
          </button>
        ))}
      </nav>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted">
        {cola.length} {cola.length === 1 ? "evento" : "eventos"}
      </p>

      {seleccionado ? (
        <div className="mt-6">
          <button onClick={() => setElegido(null)} className={VOLVER}>
            ← Volver al listado
          </button>
          <div className="mt-4">
            <Ficha
              key={seleccionado.id}
              evento={seleccionado}
              alResolver={() => {
                setElegido(null);
                void cargar(pestaña);
              }}
              setError={setError}
            />
          </div>
        </div>
      ) : cola.length === 0 ? (
        <p className="mt-10 text-muted">{VACIO[pestaña]}</p>
      ) : (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {cola.map((evento) => (
            <Renglon key={evento.id} evento={evento} alElegir={() => setElegido(evento.id)} />
          ))}
        </ul>
      )}
    </>
  );
}

export const VOLVER =
  "font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground";

// Tres listas y no una, porque piden cosas distintas: la cola caduca, lo
// publicado se corrige, y lo pasado casi no se toca. Mezclarlas haría que
// lo urgente se pierda entre 40 eventos que ya ocurrieron.
const PESTAÑAS: [Pestaña, string][] = [
  ["cola", "Por revisar"],
  ["publicados", "En la cartelera"],
  ["pasados", "Ya pasaron"],
];

const VACIO: Record<Pestaña, string> = {
  cola: "El cron no trajo nada nuevo y ninguna sala movió lo que ya está publicado.",
  publicados: "No hay nada publicado con fecha de hoy en adelante.",
  pasados: "Todavía no pasó ningún evento de los que están en la base.",
};

function Renglon({ evento, alElegir }: { evento: EventoEnCola; alElegir: () => void }) {
  return (
    <li>
      <button
        onClick={alElegir}
        className="flex w-full items-baseline gap-3 px-2 py-3 text-left transition-colors hover:bg-surface-hover"
      >
        <span className="w-20 shrink-0 font-mono text-xs text-muted">
          {fechaCompacta(evento.starts_at)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate">{evento.title ?? "(sin título)"}</span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {evento.venues?.name ?? "sala sin asignar"}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {evento.change_detail && <Etiqueta acento>cambió</Etiqueta>}
          {evento.status === "borrador" && <Etiqueta>borrador</Etiqueta>}
          {evento.origin === "manual" && <Etiqueta>a mano</Etiqueta>}
          {evento.event_type === "not_music" && <Etiqueta>no es música</Etiqueta>}
        </span>
      </button>
    </li>
  );
}

function Ficha({
  evento,
  alResolver,
  setError,
}: {
  evento: EventoEnCola;
  alResolver: () => void;
  setError: (m: string | null) => void;
}) {
  const [campos, setCampos] = useState<Correccion>({
    title: evento.title,
    starts_at: evento.starts_at,
    price_text: evento.price_text,
    category: evento.category,
    ticket_url: evento.ticket_url,
    event_type: evento.event_type,
    is_local: evento.is_local,
  });
  const [ocupado, setOcupado] = useState(false);
  const [borrando, setBorrando] = useState(false);

  const cambio = evento.change_detail;
  const editar = (parcial: Correccion) => setCampos((c) => ({ ...c, ...parcial }));

  async function accion(fn: () => Promise<void>) {
    setOcupado(true);
    setError(null);
    try {
      await fn();
      alResolver();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setOcupado(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Etiqueta>{evento.status}</Etiqueta>
        {evento.origin === "manual" && <Etiqueta>cargado a mano</Etiqueta>}
        {cambio && <Etiqueta acento>la fuente cambió</Etiqueta>}
        {evento.suggested_duplicate_of && <Etiqueta>posible duplicado</Etiqueta>}
        <span className="ml-auto text-xs text-muted">
          {evento.venues?.name ?? "sala sin asignar"}
        </span>
      </div>

      {evento.suggested_duplicate_of && (
        <PosibleDuplicado
          evento={evento}
          ocupado={ocupado}
          alUnificar={() =>
            accion(() => unificarDuplicado(evento.id, evento.suggested_duplicate_of!))
          }
          alRechazar={() => accion(() => descartarSugerencia(evento.id))}
        />
      )}

      {/* Lo que movió la sala, antes de nada: es la razón por la que este
          evento volvió a la cola y hay que poder verlo sin desplegar nada. */}
      {cambio && (
        <div className="mt-4 rounded-md border border-accent/40 bg-background p-3">
          <p className="text-xs text-muted">La sala cambió estos datos después de publicarlo:</p>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            {Object.entries(cambio).map(([campo, valor]) => (
              <li key={campo}>
                <span className="text-muted">{campo}:</span> {String(valor.antes)}{" "}
                <span className="text-accent">→ {String(valor.ahora)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <button
              disabled={ocupado}
              onClick={() => accion(() => resolverCambio(evento, true))}
              className={`${BOTON} bg-accent text-background`}
            >
              Tomar lo nuevo
            </button>
            <button
              disabled={ocupado}
              onClick={() => accion(() => resolverCambio(evento, false))}
              className={BOTON_TENUE}
            >
              Quedarme con lo mío
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <Rotulo>Título</Rotulo>
          <input
            value={campos.title ?? ""}
            onChange={(e) => editar({ title: e.target.value })}
            className={CAMPO}
          />
        </label>
        <label>
          <Rotulo>Fecha y hora (Bogotá)</Rotulo>
          <input
            type="datetime-local"
            value={aCampoDeFecha(campos.starts_at ?? null)}
            onChange={(e) => editar({ starts_at: desdeCampoDeFecha(e.target.value) })}
            className={CAMPO}
          />
        </label>
        <label>
          <Rotulo>Precio</Rotulo>
          <input
            value={campos.price_text ?? ""}
            onChange={(e) => editar({ price_text: e.target.value || null })}
            className={CAMPO}
          />
        </label>
        <label>
          <Rotulo>Qué es</Rotulo>
          <select
            value={campos.event_type ?? ""}
            onChange={(e) =>
              editar({ event_type: (e.target.value || null) as Correccion["event_type"] })
            }
            className={CAMPO}
          >
            <option value="">todavía no sé</option>
            <option value="music">concierto</option>
            <option value="fiesta">fiesta o ciclo</option>
            <option value="not_music">no es música</option>
          </select>
        </label>
        <label>
          <Rotulo>Artista local</Rotulo>
          <select
            value={campos.is_local === null ? "" : String(campos.is_local)}
            onChange={(e) =>
              editar({ is_local: e.target.value === "" ? null : e.target.value === "true" })
            }
            className={CAMPO}
          >
            <option value="">no se pudo resolver</option>
            <option value="true">sí, local</option>
            <option value="false">no, internacional</option>
          </select>
        </label>
      </div>

      {/* Contra qué contrastar: lo que publica cada fuente, tal cual. Sin
          esto habría que abrir la página de la sala en otra pestaña. */}
      {evento.events.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs text-muted">
            Ver lo que publica{evento.events.length > 1 ? "n las fuentes" : " la fuente"} (
            {evento.events.length})
          </summary>
          <ul className="mt-2 space-y-2 text-xs">
            {evento.events.map((fuente) => (
              <li key={fuente.source_url} className="rounded-md bg-background p-2">
                <a
                  href={fuente.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-accent underline underline-offset-4"
                >
                  {fuente.source}
                </a>
                <p className="mt-1">{fuente.title}</p>
                <p className="text-muted">
                  {fuente.starts_at ?? "sin fecha"} · {fuente.price_text ?? "sin precio"}
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        {evento.status === "publicado" ? (
          <button
            disabled={ocupado}
            onClick={() => accion(() => guardar(evento.id, campos))}
            className={`${BOTON} bg-accent text-background`}
          >
            Guardar cambios
          </button>
        ) : (
          <>
            <button
              disabled={ocupado || !campos.title}
              onClick={() => accion(() => publicar(evento.id, campos))}
              className={`${BOTON} bg-accent text-background disabled:opacity-40`}
              title={!campos.title ? "Sin título no se puede publicar" : undefined}
            >
              Publicar
            </button>
            <button
              disabled={ocupado}
              onClick={() => accion(() => guardar(evento.id, campos))}
              className={BOTON_TENUE}
            >
              Guardar sin publicar
            </button>
          </>
        )}

        {evento.status !== "descartado" && (
          <button
            disabled={ocupado}
            onClick={() => accion(() => descartar(evento.id))}
            className={`${BOTON_TENUE} ml-auto`}
            title="Lo saca de la cartelera pero no lo borra: se puede volver atrás"
          >
            {evento.status === "publicado" ? "Quitar de la cartelera" : "No va"}
          </button>
        )}
        <button
          disabled={ocupado}
          onClick={() => setBorrando(true)}
          className={`${BOTON_ROJO} ${evento.status === "descartado" ? "ml-auto" : ""}`}
        >
          Borrar
        </button>
      </div>

      {borrando && (
        <ConfirmarBorrado
          evento={evento}
          ocupado={ocupado}
          alCancelar={() => setBorrando(false)}
          alConfirmar={(motivo) => accion(() => borrar(evento.id, motivo))}
        />
      )}
    </div>
  );
}

/**
 * El paso intermedio antes de borrar. Pide un motivo y no solo un "sí",
 * por dos razones: la función de Postgres lo exige —un borrado que no
 * registra por qué no se puede auditar— y escribir una frase obliga a
 * mirar qué se está borrando, que es justo lo que un botón de confirmar
 * genérico no consigue.
 */
function ConfirmarBorrado({
  evento,
  ocupado,
  alCancelar,
  alConfirmar,
}: {
  evento: EventoEnCola;
  ocupado: boolean;
  alCancelar: () => void;
  alConfirmar: (motivo: string) => void;
}) {
  const [motivo, setMotivo] = useState("");
  const fuentes = evento.events.length;

  return (
    <div className="mt-4 rounded-md border border-red-500/40 bg-background p-4">
      <p className="text-sm font-medium">Borrar «{evento.title}» para siempre</p>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Esto no es lo mismo que quitarlo de la cartelera. Se borra el evento y{" "}
        {fuentes > 0 ? (
          <>
            {fuentes === 1 ? "la fila cruda de su fuente" : `las ${fuentes} filas crudas`}, y
            queda bloqueado para que el cron no lo vuelva a traer. Sin ese bloqueo volvería
            solo en la próxima corrida.
          </>
        ) : (
          <>no hay forma de recuperarlo: lo cargaste a mano, así que ninguna fuente lo tiene.</>
        )}{" "}
        <strong className="text-foreground">No se puede deshacer.</strong>
      </p>
      <input
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Por qué se borra (queda registrado)"
        className={`${CAMPO} mt-3`}
      />
      <div className="mt-3 flex gap-2">
        <button
          disabled={ocupado || motivo.trim().length < 5}
          onClick={() => alConfirmar(motivo.trim())}
          className={`${BOTON} bg-red-600 text-white disabled:opacity-40`}
          title={motivo.trim().length < 5 ? "Escribí el motivo primero" : undefined}
        >
          Borrar definitivamente
        </button>
        <button onClick={alCancelar} className={BOTON_TENUE}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

/**
 * "Esto se parece a algo que ya está publicado."
 *
 * La heurística de `deduplicacion.py` propone; acá se confirma. Se muestra
 * **el otro evento, no solo su id**: sin ver contra qué se está comparando,
 * confirmar es adivinar. Es toda la diferencia con lo que hacía `dedupe.ts`
 * en el frontend, que unía a ciegas y por eso Akriila perdía "Tour Lucy".
 */
function PosibleDuplicado({
  evento,
  ocupado,
  alUnificar,
  alRechazar,
}: {
  evento: EventoEnCola;
  ocupado: boolean;
  alUnificar: () => void;
  alRechazar: () => void;
}) {
  const [otro, setOtro] = useState<EventoEnCola | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let vigente = true;
    getEvento(evento.suggested_duplicate_of!)
      .then((e) => vigente && setOtro(e))
      .catch(() => vigente && setFallo(true));
    return () => {
      vigente = false;
    };
  }, [evento.suggested_duplicate_of]);

  return (
    <div className="mt-4 rounded-md border border-accent/40 bg-background p-3">
      <p className="text-xs text-muted">
        Esto se parece a un evento que ya existe. ¿Es el mismo show visto por dos fuentes?
      </p>

      {fallo ? (
        <p className="mt-2 text-xs text-red-400">
          No se pudo cargar el otro evento. Mejor no unificar a ciegas.
        </p>
      ) : otro ? (
        <div className="mt-2 space-y-1 rounded bg-surface p-2 text-xs">
          <p className="font-medium">{otro.title}</p>
          <p className="text-muted">
            {fechaCompacta(otro.starts_at)} · {otro.venues?.name ?? "sala sin asignar"} ·{" "}
            {otro.status}
          </p>
          <p className="text-muted">
            {otro.events.length === 0
              ? "cargado a mano"
              : `${otro.events.length} fuente(s): ${otro.events.map((f) => f.source).join(", ")}`}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted">Cargando el otro evento…</p>
      )}

      <p className="mt-2 text-xs leading-relaxed text-muted">
        Si los unís, las fuentes de este pasan al otro y este desaparece. El otro queda con
        más fuentes, así que vas a poder tomarle el título a una y el precio a otra.
      </p>

      <div className="mt-3 flex gap-2">
        <button
          disabled={ocupado || !otro}
          onClick={alUnificar}
          className={`${BOTON} bg-accent text-background disabled:opacity-40`}
          title={!otro ? "Esperá a ver contra qué se compara" : undefined}
        >
          Sí, es el mismo
        </button>
        <button disabled={ocupado} onClick={alRechazar} className={BOTON_TENUE}>
          No, son distintos
        </button>
      </div>
    </div>
  );
}
