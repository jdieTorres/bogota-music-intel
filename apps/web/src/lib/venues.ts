import { EN_CARTELERA } from "@/lib/editorial";
import { supabase } from "@/lib/supabase";

export type EventoEnSala = {
  id: string;
  title: string;
  starts_at: string | null;
  event_type: "music" | "fiesta" | "not_music" | null;
};

export type SalaEnMapa = {
  slug: string;
  name: string;
  address: string | null;
  photo_url: string | null;
  latitude: number;
  longitude: number;
  /** Eventos próximos en esta sala, ya ordenados por fecha. */
  eventos: EventoEnSala[];
};

export type SalaSinUbicar = {
  slug: string;
  name: string;
  cantidadEventos: number;
};

export type EscenaEnMapa = {
  salas: SalaEnMapa[];
  sinUbicar: SalaSinUbicar[];
};

function inicioDeHoyEnBogota(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return `${partes}T00:00:00-05:00`;
}

/**
 * Salas con al menos un evento próximo. Las que no tienen coordenadas no se
 * descartan: se devuelven aparte para listarlas bajo el mapa, porque un venue
 * sin geocodificar sigue siendo parte de la escena — solo que todavía no
 * sabemos dónde ponerlo.
 */
export async function getEscena(): Promise<EscenaEnMapa> {
  const { data, error } = await supabase
    .from("venues")
    .select(
      `slug, name, address, photo_url, latitude, longitude,
       canonical_events ( id, title, starts_at, event_type )`,
    )
    // Solo lo publicado, con la misma doble cerradura que la cartelera: RLS
    // ya lo garantiza y el filtro lo repite para que un cambio de políticas
    // no empiece a mostrar borradores en el mapa sin que nadie lo note.
    .eq("canonical_events.status", "publicado")
    // El mismo criterio editorial que la cartelera: sin esto el panel de una
    // sala sigue anunciando la obra de teatro que la home ya no muestra. Las
    // fiestas sí entran: acá no se separan de los conciertos, porque el mapa
    // contesta "dónde hay música esta noche" y una fiesta también cuenta.
    .or(EN_CARTELERA, { referencedTable: "canonical_events" })
    .gte("canonical_events.starts_at", inicioDeHoyEnBogota())
    .order("name");

  if (error) throw new Error(`No se pudo cargar el mapa: ${error.message}`);

  const salas: SalaEnMapa[] = [];
  const sinUbicar: SalaSinUbicar[] = [];

  for (const fila of data ?? []) {
    // Ya no hace falta unificar acá: el evento canónico es la unidad
    // deduplicada, así que Royal Center ya no muestra dos veces el mismo
    // show que la sala y el promotor publican por separado.
    const eventos = ((fila.canonical_events ?? []) as EventoEnSala[])
      .slice()
      .sort((a, b) => (a.starts_at ?? "").localeCompare(b.starts_at ?? ""));

    // Una sala sin eventos próximos no aporta al mapa de escena activa.
    if (eventos.length === 0) continue;

    if (fila.latitude == null || fila.longitude == null) {
      sinUbicar.push({
        slug: fila.slug,
        name: fila.name,
        cantidadEventos: eventos.length,
      });
      continue;
    }

    salas.push({
      slug: fila.slug,
      name: fila.name,
      address: fila.address,
      photo_url: fila.photo_url,
      latitude: fila.latitude,
      longitude: fila.longitude,
      eventos,
    });
  }

  return { salas, sinUbicar };
}
