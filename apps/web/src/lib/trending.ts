import { supabase } from "@/lib/supabase";

/** Las dos fuentes del radar, complementarias y no redundantes:
 *  - deezer_editorial: qué ES música colombiana (editorial "Música
 *    colombiana" de Deezer). Mezcla nacionalidades a propósito.
 *  - lastfm_geo: qué se ESCUCHA en Colombia (geo.gettopartists). Es
 *    popularidad real, sin filtrar por origen.
 *  Ver services/api/bogota_music_intel/radar.py para el detalle. */
export type FuenteTendencia = "deezer_editorial" | "lastfm_geo";

export type ArtistaTendencia = {
  source: FuenteTendencia;
  rank: number;
  artist_name: string;
  external_id: string | null;
  image_url: string | null;
  metric: number | null;
  /** null = origen sin resolver. Igual que en events, no se colapsa con
   *  "confirmado internacional" (false). */
  is_local: boolean | null;
  captured_at: string;
};

const CAMPOS =
  "source, rank, artist_name, external_id, image_url, metric, is_local, captured_at";

// Cuántas filas recientes traer antes de quedarse solo con la foto más
// nueva de cada fuente. Con --limit 50 por fuente en el CLI, 250 cubre una
// corrida entera con margen sin traer historial de más.
const VENTANA_RECIENTE = 250;

/** Solo la foto más reciente de cada fuente: el radar es "ahora", no un
 *  historial (todavía) — la tabla guarda foto a foto para eso más
 *  adelante, pero el frontend hoy solo lee la última. */
export async function getTendencias(): Promise<ArtistaTendencia[]> {
  const { data, error } = await supabase
    .from("trending_artists")
    .select(CAMPOS)
    .order("captured_at", { ascending: false })
    .order("rank", { ascending: true })
    .limit(VENTANA_RECIENTE);

  if (error) throw new Error(`No se pudo cargar el radar de tendencias: ${error.message}`);

  const filas = (data ?? []) as ArtistaTendencia[];

  const masReciente = new Map<FuenteTendencia, string>();
  for (const fila of filas) {
    if (!masReciente.has(fila.source)) masReciente.set(fila.source, fila.captured_at);
  }

  return filas
    .filter((fila) => fila.captured_at === masReciente.get(fila.source))
    .sort((a, b) => a.rank - b.rank);
}

export function porFuente(
  artistas: ArtistaTendencia[],
): Record<FuenteTendencia, ArtistaTendencia[]> {
  return {
    deezer_editorial: artistas
      .filter((a) => a.source === "deezer_editorial")
      .sort((a, b) => a.rank - b.rank),
    lastfm_geo: artistas
      .filter((a) => a.source === "lastfm_geo")
      .sort((a, b) => a.rank - b.rank),
  };
}
