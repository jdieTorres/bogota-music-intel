/**
 * Moderación de **eventos**: lo que el scraping propuso y todavía no
 * publicó nadie, más lo publicado que hay que poder corregir.
 *
 * Las salas tienen su propio módulo (`salas.ts`) desde el 2026-08-31, y no
 * es solo orden: son dos ciclos de vida distintos. Un evento caduca —pasa,
 * y deja de importar—, una sala no; un evento se borra y se bloquea para
 * que no vuelva, una sala se aprueba una vez y queda.
 *
 * Todo lo de acá corre con la sesión del admin en el navegador, no con la
 * service role key. Quién puede escribir lo decide RLS contra la tabla
 * `admins` (migración `20260831020000_admin.sql`), no este archivo: si estas
 * funciones se llamaran sin sesión de admin, la base las rechaza.
 */

import { supabase } from "@/lib/supabase";

export type EstadoCanonico = "borrador" | "publicado" | "descartado";

/** Un campo que la fuente movió después de que el admin aprobó. */
export type CambioDeOrigen = { antes: unknown; ahora: unknown };

/** La fila cruda de la que cuelga el evento, para poder contrastar. */
export type FuenteCruda = {
  source: string;
  source_url: string;
  title: string;
  starts_at: string | null;
  price_text: string | null;
};

export type EventoEnCola = {
  id: string;
  status: EstadoCanonico;
  origin: "scraper" | "manual";
  title: string | null;
  starts_at: string | null;
  description: string | null;
  price_text: string | null;
  category: string | null;
  ticket_url: string | null;
  image_url: string | null;
  event_type: "music" | "fiesta" | "not_music" | null;
  is_local: boolean | null;
  evidence: string | null;
  source_snapshot: Record<string, unknown> | null;
  change_detail: Record<string, CambioDeOrigen> | null;
  change_detected_at: string | null;
  suggested_duplicate_of: string | null;
  venues: { slug: string; name: string } | null;
  events: FuenteCruda[];
};

const CAMPOS = `
  id, status, origin, title, starts_at, description, price_text, category,
  ticket_url, image_url, event_type, is_local, evidence, source_snapshot,
  change_detail, change_detected_at, suggested_duplicate_of,
  venues ( slug, name ),
  events ( source, source_url, title, starts_at, price_text )
`;

/** Los campos que el admin puede corregir a mano. */
export type Correccion = Partial<
  Pick<
    EventoEnCola,
    | "title"
    | "starts_at"
    | "description"
    | "price_text"
    | "category"
    | "ticket_url"
    | "event_type"
    | "is_local"
    | "evidence"
  >
>;

/** Las tres pestañas de la pantalla. */
export type Pestaña = "cola" | "publicados" | "pasados";

/** Inicio del día de hoy en Bogotá, en UTC. Igual que en la cartelera: se
 *  corta por día y no por hora, porque un show de las 8 p. m. sigue siendo
 *  de hoy a las 11. */
function inicioDeHoyEnBogota(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return `${partes}T00:00:00-05:00`;
}

async function consultar(
  armar: (q: ReturnType<typeof consultaBase>) => ReturnType<typeof consultaBase>,
): Promise<EventoEnCola[]> {
  const { data, error } = await armar(consultaBase());
  if (error) throw new Error(`No se pudo cargar: ${error.message}`);
  return (data ?? []) as unknown as EventoEnCola[];
}

function consultaBase() {
  return supabase.from("canonical_events").select(CAMPOS);
}

/**
 * Lo que hay en cada pestaña, y por qué son tres y no una:
 *
 * - `cola`: lo que **pide una decisión**. Borradores que trajo el cron, más
 *   lo publicado cuya fuente se movió. Es lo único que caduca.
 * - `publicados`: lo que **está en la cartelera ahora**, para corregir o
 *   sacar algo que ya se aprobó.
 * - `pasados`: lo que **ya ocurrió**. Se separa porque no se toca casi
 *   nunca y mezclarlo con lo vigente haría que la lista útil se pierda.
 *
 * Todo va ordenado por fecha del evento; lo pasado al revés, que es como se
 * busca (lo más reciente primero). Un evento sin fecha va al final: no se
 * sabe cuándo es, así que no puede ser lo más urgente.
 */
export async function getEventos(pestaña: Pestaña): Promise<EventoEnCola[]> {
  const hoy = inicioDeHoyEnBogota();

  if (pestaña === "cola") {
    return consultar((q) =>
      q
        .or("status.eq.borrador,change_detected_at.not.is.null")
        .order("starts_at", { ascending: true, nullsFirst: false }),
    );
  }
  if (pestaña === "publicados") {
    return consultar((q) =>
      q
        .eq("status", "publicado")
        .or(`starts_at.gte.${hoy},starts_at.is.null`)
        .order("starts_at", { ascending: true, nullsFirst: false }),
    );
  }
  return consultar((q) =>
    q.lt("starts_at", hoy).order("starts_at", { ascending: false }),
  );
}

/** Un evento suelto, para editarlo desde su propia página. */
export async function getEvento(id: string): Promise<EventoEnCola | null> {
  const { data, error } = await consultaBase().eq("id", id).maybeSingle();
  if (error) throw new Error(`No se pudo cargar el evento: ${error.message}`);
  return (data as unknown as EventoEnCola) ?? null;
}

function revisado() {
  return { reviewed_at: new Date().toISOString() };
}

/** Publica el evento con las correcciones que haya hecho el admin. */
export async function publicar(id: string, correccion: Correccion) {
  const { error } = await supabase
    .from("canonical_events")
    .update({
      ...correccion,
      ...revisado(),
      status: "publicado",
      published_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(`No se pudo publicar: ${error.message}`);
}

/**
 * Lo vi y no va. **No borra nada**: la fila cruda se queda y el canónico
 * queda en `descartado`, así que la decisión es reversible y deja rastro.
 *
 * Es el camino que conviene por defecto. `borrar()` es el otro caso —
 * cuando el evento no tiene que volver nunca— y ese sí es irreversible.
 */
export async function descartar(id: string) {
  const { error } = await supabase
    .from("canonical_events")
    .update({ ...revisado(), status: "descartado" })
    .eq("id", id);
  if (error) throw new Error(`No se pudo descartar: ${error.message}`);
}

/** Guarda correcciones sin cambiar el estado. */
export async function guardar(id: string, correccion: Correccion) {
  const { error } = await supabase
    .from("canonical_events")
    .update({ ...correccion, ...revisado() })
    .eq("id", id);
  if (error) throw new Error(`No se pudo guardar: ${error.message}`);
}

/**
 * Resuelve un cambio que hizo la sala después de la aprobación.
 *
 * Las dos respuestas actualizan `source_snapshot` con los valores nuevos, y
 * eso es lo que hace que el evento deje de volver a la cola: el snapshot es
 * "lo que ya vi de la fuente", no "lo que muestro". La diferencia entre
 * aceptar y rechazar es solo si esos valores además se copian a lo que se
 * muestra.
 *
 * Rechazar no es ignorar: es decir "vi que la sala cambió esto y me quedo
 * con mi versión". Si no se actualizara el snapshot, el mismo cambio
 * volvería a aparecer en cada corrida del cron para siempre.
 */
export async function resolverCambio(evento: EventoEnCola, aceptar: boolean) {
  const cambios = evento.change_detail ?? {};
  const nuevos = Object.fromEntries(
    Object.entries(cambios).map(([campo, valor]) => [campo, valor.ahora]),
  );

  const { error } = await supabase
    .from("canonical_events")
    .update({
      ...(aceptar ? nuevos : {}),
      source_snapshot: { ...(evento.source_snapshot ?? {}), ...nuevos },
      change_detail: null,
      change_detected_at: null,
      ...revisado(),
    })
    .eq("id", evento.id);
  if (error) throw new Error(`No se pudo resolver el cambio: ${error.message}`);
}

/**
 * Borra el evento de verdad y lo bloquea para que no vuelva.
 *
 * **No es lo mismo que descartar.** Descartar deja la fila en `descartado`
 * y es reversible. Borrar elimina el canónico y sus filas crudas, y anota
 * `(source, source_event_id)` en `blocked_source_events` para que la
 * ingesta no lo vuelva a guardar.
 *
 * Ese bloqueo no es un extra: sin él, borrar no sirve de nada. Las filas
 * crudas se vuelven a scrapear y el cron abre un borrador nuevo en la
 * corrida siguiente — pasó el 2026-08-31 al soltar el canónico de WWE.
 *
 * Las tres cosas van dentro de una función de Postgres para que ocurran
 * juntas o ninguna: si se hicieran en tres llamadas desde acá, una caída
 * en el medio podría dejar filas crudas sin bloquear, que es el peor
 * estado — el evento vuelve mañana y nadie se acuerda de por qué.
 */
export async function borrar(id: string, motivo: string) {
  const { error } = await supabase.rpc("borrar_evento", {
    canonico_id: id,
    motivo,
  });
  if (error) throw new Error(`No se pudo borrar: ${error.message}`);
}

export type EventoNuevo = {
  title: string;
  venue_id: string;
  starts_at: string | null;
  price_text?: string | null;
  ticket_url?: string | null;
  event_type: "music" | "fiesta" | "not_music" | null;
  is_local: boolean | null;
  /** Obligatoria: la base rechaza un `origin = 'manual'` sin evidencia. */
  evidence: string;
};

/**
 * Carga un evento a mano.
 *
 * Es la razón de ser de toda la fase: el scraping solo ve las salas que
 * publican su propia cartelera, y el toque local en un bar chico —anunciado
 * por una historia de Instagram y nada más— es invisible para el pipeline.
 * Sin esto la plataforma tiene un sesgo de cobertura en contra de justo lo
 * que dice promover.
 *
 * Nace como **borrador**, igual que lo que trae el cron. No es desconfianza:
 * es que el evento aparezca en la misma cola, con la misma revisión final y
 * el mismo botón de publicar, en vez de tener dos caminos distintos hacia la
 * cartelera. Un camino que se salta la cola es un camino que nadie revisa.
 *
 * El título **no pasa por el normalizador**: lo estás escribiendo vos, ya en
 * la forma en que querés que salga. Normalizarlo encima sería pisarte.
 */
export async function crearEvento(evento: EventoNuevo) {
  const { data, error } = await supabase
    .from("canonical_events")
    .insert({
      ...evento,
      status: "borrador",
      origin: "manual",
      date_precision: "day",
    })
    .select("id")
    .single();

  if (error) throw new Error(`No se pudo crear el evento: ${error.message}`);
  return data as { id: string };
}

/**
 * Confirma que un borrador es el mismo show que un canónico que ya existe.
 *
 * Las filas crudas del borrador pasan a colgar del canónico y el borrador
 * desaparece. No se pierde nada: el canónico queda con más fuentes, que es
 * justamente lo que le permite tomar el título de una y el precio de otra.
 *
 * Va por una función de Postgres y no por tres llamadas desde acá porque
 * cortarse por la mitad dejaría filas crudas apuntando a un canónico
 * borrado, o dos canónicos para el mismo show. Esa función además deja la
 * foto de origen en null a propósito, y la ingesta la rearma en la corrida
 * siguiente con las fuentes nuevas — si no, el canónico aparecería marcado
 * como "la fuente cambió" sin que ninguna sala hubiera tocado nada.
 */
export async function unificarDuplicado(borradorId: string, canonicoId: string) {
  const { error } = await supabase.rpc("unificar_duplicado", {
    borrador_id: borradorId,
    canonico_id: canonicoId,
  });
  if (error) throw new Error(`No se pudo unificar: ${error.message}`);
}

/** "No, son dos shows distintos". Solo borra la sugerencia; el borrador
 *  sigue su camino normal hacia publicarse. */
export async function descartarSugerencia(id: string) {
  const { error } = await supabase
    .from("canonical_events")
    .update({ suggested_duplicate_of: null })
    .eq("id", id);
  if (error) throw new Error(`No se pudo descartar la sugerencia: ${error.message}`);
}
