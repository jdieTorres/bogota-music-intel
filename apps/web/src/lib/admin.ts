/**
 * La cola de moderación: lo que el scraping propuso y todavía no publicó
 * nadie.
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

/**
 * Lo que espera revisión: los borradores, y lo ya publicado cuya fuente se
 * movió después. Ordenado por fecha del evento porque lo urgente es lo que
 * está por pasar, no lo que entró primero.
 *
 * Un evento sin fecha va al final: no se sabe cuándo es, así que no puede
 * ser lo más urgente.
 */
export async function getCola(): Promise<EventoEnCola[]> {
  const { data, error } = await supabase
    .from("canonical_events")
    .select(CAMPOS)
    .or("status.eq.borrador,change_detected_at.not.is.null")
    .order("starts_at", { ascending: true, nullsFirst: false });

  if (error) throw new Error(`No se pudo cargar la cola: ${error.message}`);
  return (data ?? []) as unknown as EventoEnCola[];
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
 * Lo vi y no va. No borra nada: la fila cruda se queda y el canónico queda
 * en `descartado`, así que la decisión es reversible y deja rastro. Borrar
 * de verdad no serviría — el cron traería el evento de vuelta mañana.
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
