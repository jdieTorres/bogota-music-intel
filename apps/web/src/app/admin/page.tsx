"use client";

/**
 * La cola de moderación. El scraping propone acá y nada llega a la cartelera
 * sin pasar por esta pantalla.
 *
 * Lo que se ve son dos cosas distintas mezcladas en una lista, ordenadas por
 * fecha del evento: los **borradores** que trajo el cron y todavía nadie
 * miró, y lo ya **publicado cuya fuente se movió** después de la aprobación.
 * Van juntos porque las dos piden lo mismo —que alguien decida— y separarlos
 * en dos pantallas haría que la segunda no se mire nunca.
 *
 * Quién puede entrar no lo decide este archivo: lo decide RLS contra la
 * tabla `admins`. Si alguien llega acá sin permiso ve la pantalla, pero la
 * base no le devuelve ni le acepta nada.
 */

import { useCallback, useEffect, useState } from "react";

import {
  type Correccion,
  type EventoEnCola,
  type Pestaña,
  borrar,
  descartar,
  getEventos,
  guardar,
  publicar,
  resolverCambio,
} from "@/lib/admin";
import { supabase } from "@/lib/supabase";

// Bogotá es UTC-5 todo el año. Se convierte a mano y no con la zona horaria
// del navegador: el admin podría estar en otro lado, y una hora movida cinco
// horas es exactamente el error que este proyecto ya cometió dos veces.
const OFFSET_BOGOTA_MS = 5 * 60 * 60 * 1000;

function aCampoDeFecha(iso: string | null): string {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() - OFFSET_BOGOTA_MS).toISOString().slice(0, 16);
}

function desdeCampoDeFecha(valor: string): string | null {
  return valor ? `${valor}:00-05:00` : null;
}

export default function AdminPage() {
  const [sesion, setSesion] = useState<"cargando" | "fuera" | "sin-permiso" | "dentro">(
    "cargando",
  );
  const [cola, setCola] = useState<EventoEnCola[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pestaña, setPestaña] = useState<Pestaña>("cola");
  const [elegido, setElegido] = useState<string | null>(null);

  const cargar = useCallback(
    async (haySesion: boolean, cual: Pestaña) => {
      if (!haySesion) {
        setSesion("fuera");
        return;
      }
      const { data: esAdmin } = await supabase.rpc("es_admin");
      if (!esAdmin) {
        setSesion("sin-permiso");
        return;
      }
      try {
        setCola(await getEventos(cual));
        setSesion("dentro");
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [],
  );

  // Se escucha la sesión en vez de leerla una vez: Supabase emite el estado
  // inicial al suscribirse, así que esto cubre el arranque, y además la
  // pantalla reacciona sola al entrar y al salir sin que nadie la refresque.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      void cargar(Boolean(sesion), pestaña);
    });
    return () => data.subscription.unsubscribe();
  }, [cargar, pestaña]);

  const recargar = useCallback(() => void cargar(true, pestaña), [cargar, pestaña]);

  // Se busca en la lista en vez de guardar el objeto: así, después de
  // recargar, la ficha abierta muestra lo que quedó en la base y no una
  // copia de antes de guardar.
  const seleccionado = cola.find((e) => e.id === elegido) ?? null;

  if (sesion === "cargando") {
    return <Marco><p className="text-muted">Cargando…</p></Marco>;
  }

  if (sesion === "fuera") return <Ingreso />;

  if (sesion === "sin-permiso") {
    return (
      <Marco>
        <p className="text-muted">
          Esta cuenta no está en la lista de admins. Pedile a quien administre el
          proyecto que la agregue.
        </p>
        <button onClick={() => void supabase.auth.signOut()} className={BOTON_TENUE}>
          Salir
        </button>
      </Marco>
    );
  }

  return (
    <Marco>
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Moderación</h1>
        <button onClick={() => void supabase.auth.signOut()} className={BOTON_TENUE}>
          Salir
        </button>
      </div>

      <nav className="mt-6 flex gap-1 border-b border-border">
        {PESTAÑAS.map(([clave, rotulo]) => (
          <button
            key={clave}
            onClick={() => {
              setPestaña(clave);
              setElegido(null);
              void cargar(true, clave);
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

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      {seleccionado ? (
        <div className="mt-6">
          <button
            onClick={() => setElegido(null)}
            className="font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
          >
            ← Volver al listado
          </button>
          <div className="mt-4">
            <Ficha
              key={seleccionado.id}
              evento={seleccionado}
              alResolver={() => {
                setElegido(null);
                recargar();
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
    </Marco>
  );
}

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

const BOTON = "rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90";
const BOTON_TENUE =
  "rounded-md border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:text-foreground";
const CAMPO =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

function Marco({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">{children}</div>;
}

function Ingreso() {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEntrando(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: clave,
    });
    setEntrando(false);
    // Si entra bien no hace falta hacer nada: `onAuthStateChange` lo ve.
    if (error) setError(error.message);
  }

  return (
    <Marco>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Moderación</h1>
      <form onSubmit={entrar} className="mt-8 max-w-sm space-y-4">
        <input
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="Correo"
          autoComplete="username"
          required
          className={CAMPO}
        />
        <input
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          placeholder="Contraseña"
          autoComplete="current-password"
          required
          className={CAMPO}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={entrando} className={`${BOTON} bg-accent text-background`}>
          {entrando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </Marco>
  );
}

/**
 * Un renglón del listado. Muestra lo justo para decidir si hay que entrar:
 * cuándo, cómo se va a ver publicado, dónde, y qué reclama atención.
 *
 * El título es el que se va a publicar, no el crudo de la sala: desde el
 * 2026-08-31 la normalización corre en la ingesta, así que lo que se ve acá
 * es literalmente lo que ve el visitante. Antes no era así y editar a
 * ciegas era fácil.
 */
/** "03 sep 26". Se arma por partes porque `es-CO` interpone "de" entre
 *  ellas ("03 de sept de 26") y en una columna angosta eso parte el
 *  renglón en dos líneas. */
function fechaCompacta(iso: string | null): string {
  if (!iso) return "sin fecha";
  const partes = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).formatToParts(new Date(iso));
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${valor("day")} ${valor("month").replace(".", "")} ${valor("year")}`;
}

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
          className={`${BOTON_TENUE} border-red-500/40 text-red-400 hover:text-red-300 ${
            evento.status === "descartado" ? "ml-auto" : ""
          }`}
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

function Etiqueta({ children, acento }: { children: React.ReactNode; acento?: boolean }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${
        acento ? "border-accent text-accent" : "border-border text-muted"
      }`}
    >
      {children}
    </span>
  );
}

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted">
      {children}
    </span>
  );
}
