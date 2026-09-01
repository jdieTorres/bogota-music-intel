import {
  SOLO_CONCIERTOS,
  SOLO_FESTIVALES,
  SOLO_FIESTAS,
  generoVisible,
} from "@/lib/editorial";
import { supabase } from "@/lib/supabase";

export type DatePrecision = "day" | "month" | "unknown";

export type EventoVenue = {
  slug: string;
  name: string;
  city: string;
};

/** null = todavía sin clasificar. No es lo mismo que "no es música": un
 *  evento sin clasificar se sigue mostrando. */
export type TipoEvento = "music" | "fiesta" | "festival" | "not_music" | null;

/** De dónde salió el evento. Un `manual` no tiene página de sala a la que
 *  remitir al lector, y por eso la base le exige `evidence`. */
export type OrigenEvento = "scraper" | "manual";

/** La página de la que salió el dato. Un evento puede tener varias: el
 *  mismo show publicado por la sala y por el promotor. */
export type FuenteEvento = {
  source: string;
  source_url: string;
};

export type Evento = {
  id: string;
  title: string;
  starts_at: string | null;
  ends_at: string | null;
  date_precision: DatePrecision;
  description: string | null;
  price_text: string | null;
  ticket_url: string | null;
  image_url: string | null;
  /**
   * El género a mostrar, ya filtrado.
   *
   * **La columna cruda es `category` y no se expone acá a propósito.** Guarda
   * cosas distintas según la fuente: un género en Rockal Live ("Pop"), una
   * taxonomía en visitbogota ("Conciertos"), una disciplina en Idartes
   * ("Música"). Mostrarla tal cual pone "Género: Conciertos" en la pestaña de
   * conciertos, que fue justo lo que pasó el 2026-09-01.
   *
   * Se filtró primero en cada componente y se olvidó uno —la página de
   * detalle—, así que ahora se filtra al leer: si el tipo no trae el valor
   * crudo, ningún componente puede equivocarse con él.
   */
  genero: string | null;
  event_type: TipoEvento;
  /** null = no se pudo resolver el origen del artista. Distinto de false,
   *  que es un internacional confirmado. */
  is_local: boolean | null;
  origin: OrigenEvento;
  /** De dónde salió el dato cuando no hay página de sala que lo respalde. */
  evidence: string | null;
  /** Cuándo lo revisó una persona. `null` significa que nadie lo hizo —los
   *  51 de la mudanza inicial están así— y por eso la página no puede
   *  afirmar que fue revisado. */
  reviewed_at: string | null;
  venues: EventoVenue | null;
  /** Las filas crudas de las que cuelga este evento. Vacío si lo cargó el
   *  admin a mano. */
  events: FuenteEvento[];
};

const CAMPOS = `
  id, title, starts_at, ends_at, date_precision, description,
  price_text, category, ticket_url, image_url,
  event_type, is_local, origin, evidence, reviewed_at,
  venues ( slug, name, city ),
  events ( source, source_url )
`;

/**
 * Solo lo publicado. Se pide explícitamente **además** de que RLS ya lo
 * garantice: la política de la base es la defensa real —la publishable key
 * no puede leer un borrador ni queriendo— y este filtro es la segunda
 * cerradura, para que un cambio futuro en las políticas no empiece a
 * publicar borradores sin que nadie lo note.
 */
const PUBLICADO = "publicado";


/** Inicio del día de hoy en Bogotá, en UTC. Un evento que empieza a las 8pm
 *  sigue siendo "de hoy" a las 11pm, así que se corta por día y no por hora. */
function inicioDeHoyEnBogota(): string {
  const ahora = new Date();
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);
  // Bogotá es UTC-5 todo el año (Colombia no usa horario de verano).
  return `${partes}T00:00:00-05:00`;
}

/** Lo próximo de una pestaña, en orden cronológico. El filtro editorial es
 *  lo único que cambia entre conciertos y fiestas.
 *
 *  Ya no hace falta deduplicar acá: el evento canónico ES la unidad
 *  deduplicada, y quién se une a quién lo decidió una persona en la cola de
 *  revisión, no una heurística en el navegador. */
async function proximos(filtroEditorial: string): Promise<Evento[]> {
  const { data, error } = await supabase
    .from("canonical_events")
    .select(CAMPOS)
    .eq("status", PUBLICADO)
    .or(filtroEditorial)
    .gte("starts_at", inicioDeHoyEnBogota())
    .order("starts_at", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar los eventos: ${error.message}`);
  return (data ?? []).map(conGenero);
}

/** Deriva `genero` y suelta la columna cruda, para que no llegue a la vista. */
function conGenero(fila: Record<string, unknown>): Evento {
  const { category, ...resto } = fila as { category: string | null };
  return { ...resto, genero: generoVisible(category) } as unknown as Evento;
}

/** Los que la fuente publicó sin fecha reconocible. Se muestran aparte en
 *  vez de descartarlos: existen, solo que hay que confirmar cuándo son. */
async function sinFecha(filtroEditorial: string): Promise<Evento[]> {
  const { data, error } = await supabase
    .from("canonical_events")
    .select(CAMPOS)
    .eq("status", PUBLICADO)
    .or(filtroEditorial)
    .is("starts_at", null)
    .order("title", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar los eventos: ${error.message}`);
  return (data ?? []).map(conGenero);
}

export const getEventosProximos = () => proximos(SOLO_CONCIERTOS);
export const getEventosSinFecha = () => sinFecha(SOLO_CONCIERTOS);
export const getFiestasProximas = () => proximos(SOLO_FIESTAS);
export const getFiestasSinFecha = () => sinFecha(SOLO_FIESTAS);
export const getFestivalesProximos = () => proximos(SOLO_FESTIVALES);
export const getFestivalesSinFecha = () => sinFecha(SOLO_FESTIVALES);

export async function getEvento(id: string): Promise<Evento | null> {
  const { data, error } = await supabase
    .from("canonical_events")
    .select(CAMPOS)
    .eq("status", PUBLICADO)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar el evento: ${error.message}`);
  return data ? conGenero(data as Record<string, unknown>) : null;
}

/** El nombre de la sala, o el hueco honesto si todavía no se le asignó
 *  una. Puede pasar con un evento cargado a mano en un lugar que la base
 *  todavía no conoce: mejor decir que falta que inventar un nombre. */
export function nombreDelVenue(evento: Evento): string {
  return evento.venues?.name ?? "Sala por confirmar";
}

/** Agrupa por día calendario de Bogotá, conservando el orden cronológico. */
export function agruparPorDia(eventos: Evento[]): Map<string, Evento[]> {
  const grupos = new Map<string, Evento[]>();
  for (const evento of eventos) {
    if (!evento.starts_at) continue;
    const clave = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(evento.starts_at));
    const grupo = grupos.get(clave);
    if (grupo) grupo.push(evento);
    else grupos.set(clave, [evento]);
  }
  return grupos;
}
