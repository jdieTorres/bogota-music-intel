import { SOLO_MUSICA } from "@/lib/editorial";
import { supabase } from "@/lib/supabase";

export type DatePrecision = "day" | "month" | "unknown";

export type EventoVenue = {
  slug: string;
  name: string;
  city: string;
};

/** null = todavía sin clasificar. No es lo mismo que "no es música": un
 *  evento sin clasificar se sigue mostrando. */
export type TipoEvento = "music" | "not_music" | null;

export type Evento = {
  id: string;
  source: string;
  title: string;
  starts_at: string | null;
  ends_at: string | null;
  date_precision: DatePrecision;
  description: string | null;
  price_text: string | null;
  category: string | null;
  ticket_url: string | null;
  source_url: string;
  image_url: string | null;
  venue_name_raw: string;
  event_type: TipoEvento;
  /** null = no se pudo resolver el origen del artista. Distinto de false,
   *  que es un internacional confirmado. */
  is_local: boolean | null;
  venues: EventoVenue | null;
};

const CAMPOS = `
  id, source, title, starts_at, ends_at, date_precision, description,
  price_text, category, ticket_url, source_url, image_url, venue_name_raw,
  event_type, is_local,
  venues ( slug, name, city )
`;


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

export async function getEventosProximos(): Promise<Evento[]> {
  const { data, error } = await supabase
    .from("events")
    .select(CAMPOS)
    .or(SOLO_MUSICA)
    .gte("starts_at", inicioDeHoyEnBogota())
    .order("starts_at", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar los eventos: ${error.message}`);
  return (data ?? []) as unknown as Evento[];
}

/** Eventos que la fuente publicó sin fecha reconocible. Se muestran aparte
 *  en vez de descartarlos: existen, solo que hay que confirmar cuándo son. */
export async function getEventosSinFecha(): Promise<Evento[]> {
  const { data, error } = await supabase
    .from("events")
    .select(CAMPOS)
    .or(SOLO_MUSICA)
    .is("starts_at", null)
    .order("title", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar los eventos: ${error.message}`);
  return (data ?? []) as unknown as Evento[];
}

export async function getEvento(id: string): Promise<Evento | null> {
  const { data, error } = await supabase
    .from("events")
    .select(CAMPOS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar el evento: ${error.message}`);
  return (data as unknown as Evento) ?? null;
}

export function nombreDelVenue(evento: Evento): string {
  return evento.venues?.name ?? evento.venue_name_raw;
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
