/**
 * Moderación de **artistas**.
 *
 * Es otro ciclo de vida que el de las salas y el de los eventos, y por eso es
 * otro módulo. La diferencia de fondo: **acá no hay scraper que inserte**.
 * Ninguna API conoce al artista local emergente —se probaron cinco y la
 * búsqueda está cerrada—, así que todas las filas nacen de este formulario.
 * No hay cola de "lo trajo el cron y nadie lo miró": lo que hay es un
 * borrador que Juan dejó a medias.
 *
 * Por eso la evidencia es obligatoria para publicar y no solo para lo
 * manual: acá todo es manual.
 */

import type { ArtistaVinculable } from "@/lib/admin/cartel";
import { slugDeSala } from "@/lib/admin/slug";
import { supabase } from "@/lib/supabase";
import type { Plataforma } from "@/lib/enlaces-de-audio";

export type EstadoArtista = "borrador" | "publicado" | "descartado";

export type TrackEnModeracion = {
  id: string;
  artista_id: string;
  orden: number;
  titulo: string;
  anio: number | null;
  plataforma: Plataforma;
  id_externo: string;
  caratula_url: string | null;
};

export type ArtistaEnModeracion = {
  id: string;
  slug: string;
  nombre: string;
  origen_ciudad: string | null;
  origen_pais: string | null;
  bio: string | null;
  foto_url: string | null;
  bandcamp_url: string | null;
  links: Record<string, string>;
  evidencia: string | null;
  status: EstadoArtista;
  reviewed_at: string | null;
  tracks: TrackEnModeracion[];
};

const CAMPOS = `
  id, slug, nombre, origen_ciudad, origen_pais, bio, foto_url,
  bandcamp_url, links, evidencia, status, reviewed_at,
  tracks ( id, artista_id, orden, titulo, anio, plataforma, id_externo, caratula_url )
`;

export type PestañaDeArtista = "borrador" | "publicado";

export async function getArtistas(estado: PestañaDeArtista): Promise<ArtistaEnModeracion[]> {
  const { data, error } = await supabase
    .from("artists")
    .select(CAMPOS)
    .eq("status", estado)
    .order("nombre");

  if (error) throw new Error(`No se pudieron cargar los artistas: ${error.message}`);

  // El embed no garantiza el orden de los tracks; el tracklist sí lo tiene.
  const artistas = (data ?? []) as unknown as ArtistaEnModeracion[];
  for (const artista of artistas) {
    artista.tracks = (artista.tracks ?? []).sort((a, b) => a.orden - b.orden);
  }
  return artistas;
}

export type CorreccionDeArtista = Partial<
  Pick<
    ArtistaEnModeracion,
    | "nombre"
    | "origen_ciudad"
    | "origen_pais"
    | "bio"
    | "foto_url"
    | "bandcamp_url"
    | "links"
    | "evidencia"
  >
>;

function revisado() {
  return { reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() };
}

/**
 * Lo publica: a partir de acá sale en el directorio.
 *
 * ⚠️ **Publicar es el juicio editorial.** No hay una casilla de "es de la
 * escena" en ningún lado: estar acá lo es. Por eso la base exige evidencia
 * para pasar a publicado, y si falta el error viene de la constraint.
 */
export async function publicarArtista(id: string, correccion: CorreccionDeArtista) {
  const { error } = await supabase
    .from("artists")
    .update({ ...correccion, ...revisado(), status: "publicado" })
    .eq("id", id);
  if (error) throw new Error(`No se pudo publicar: ${error.message}`);
}

export async function guardarArtista(id: string, correccion: CorreccionDeArtista) {
  const { error } = await supabase
    .from("artists")
    .update({ ...correccion, ...revisado() })
    .eq("id", id);
  if (error) throw new Error(`No se pudo guardar: ${error.message}`);
}

/**
 * Lo saca del directorio sin borrarlo.
 *
 * Mismo criterio que con las salas: la fila queda. Un artista puede estar
 * enlazado desde el cartel de un evento, y borrarlo dejaría ese cartel
 * incompleto sin que nadie se entere.
 */
export async function descartarArtista(id: string) {
  const { error } = await supabase
    .from("artists")
    .update({ ...revisado(), status: "descartado" })
    .eq("id", id);
  if (error) throw new Error(`No se pudo descartar: ${error.message}`);
}

export type ArtistaNuevo = {
  nombre: string;
  origen_ciudad?: string | null;
  origen_pais?: string | null;
  evidencia?: string | null;
};

/**
 * Crea el artista. Nace **en borrador**, al revés que una sala cargada a
 * mano.
 *
 * No es una inconsistencia: una sala se carga completa de una sentada —tiene
 * nombre, dirección y punto—, y un artista no. La ficha que vale la pena
 * publicar necesita bio y tracks, y eso se escribe en varias pasadas. El
 * borrador es el estado real mientras tanto, y el directorio no muestra a
 * medias a nadie.
 */
export async function crearArtista(artista: ArtistaNuevo) {
  const { data, error } = await supabase
    .from("artists")
    .insert({
      slug: slugDeSala(artista.nombre),
      nombre: artista.nombre.trim(),
      origen_ciudad: artista.origen_ciudad?.trim() || null,
      origen_pais: artista.origen_pais?.trim() || null,
      evidencia: artista.evidencia?.trim() || null,
      status: "borrador",
    })
    .select("id, nombre")
    .single();

  if (error) throw new Error(`No se pudo crear el artista: ${error.message}`);
  return data as { id: string; nombre: string };
}

// --- El cartel: quién tocó en qué -----------------------------------------
//
// Se arma desde la ficha del toque, que es donde se sabe. La tabla
// `event_artists` existía desde el 2026-09-09 con sus políticas puestas y
// **sin una sola interfaz que la escribiera**; esto es lo que la llena.

/** Los que se pueden poner en un cartel: publicados **y borradores**.
 *
 *  ⚠️ Los borradores entran a propósito. Un artista creado desde otro toque
 *  nace en borrador, y si no se pudiera encontrar, el siguiente toque suyo
 *  crearía un duplicado que además chocaría contra el slug repetido. */
export async function getArtistasParaVincular(): Promise<ArtistaVinculable[]> {
  const { data, error } = await supabase
    .from("artists")
    .select("id, nombre, slug, status")
    .in("status", ["publicado", "borrador"])
    .order("nombre");
  if (error) throw new Error(`No se pudieron cargar los artistas: ${error.message}`);
  return (data ?? []) as ArtistaVinculable[];
}

export type EnElCartel = ArtistaVinculable & { orden: number };

/** Quién está en el cartel de este toque, en su orden. */
export async function getCartelDelEvento(eventoId: string): Promise<EnElCartel[]> {
  const { data, error } = await supabase
    .from("event_artists")
    .select("orden, artists ( id, nombre, slug, status )")
    .eq("canonical_event_id", eventoId)
    .order("orden");
  if (error) throw new Error(`No se pudo cargar el cartel: ${error.message}`);

  type Fila = { orden: number; artists: ArtistaVinculable | null };
  return ((data ?? []) as unknown as Fila[])
    .filter((f) => f.artists)
    .map((f) => ({ ...(f.artists as ArtistaVinculable), orden: f.orden }));
}

/** Suma al artista al final del cartel. */
export async function vincularAlCartel(eventoId: string, artistaId: string, orden: number) {
  const { error } = await supabase
    .from("event_artists")
    .insert({ canonical_event_id: eventoId, artist_id: artistaId, orden });
  if (error) throw new Error(`No se pudo vincular: ${error.message}`);
}

/** Lo saca del cartel. Borra el vínculo y nada más: ni el artista ni el
 *  evento se tocan, que es lo que hace reversible equivocarse al vincular. */
export async function desvincularDelCartel(eventoId: string, artistaId: string) {
  const { error } = await supabase
    .from("event_artists")
    .delete()
    .eq("canonical_event_id", eventoId)
    .eq("artist_id", artistaId);
  if (error) throw new Error(`No se pudo quitar del cartel: ${error.message}`);
}

// --- Los tracks -----------------------------------------------------------
//
// No tienen estado propio: un track se ve si su artista está publicado. Un
// track a medias no existe, se borra — y por eso acá sí hay borrado de
// verdad, al revés que con las salas y los artistas.

export type TrackNuevo = {
  artista_id: string;
  titulo: string;
  anio: number | null;
  plataforma: Plataforma;
  id_externo: string;
  caratula_url: string | null;
  orden: number;
};

export async function crearTrack(track: TrackNuevo) {
  const { error } = await supabase.from("tracks").insert({
    ...track,
    titulo: track.titulo.trim(),
    caratula_url: track.caratula_url?.trim() || null,
  });
  if (error) throw new Error(`No se pudo agregar el track: ${error.message}`);
}

export async function guardarTrack(
  id: string,
  correccion: Partial<Pick<TrackEnModeracion, "titulo" | "anio" | "caratula_url" | "orden">>,
) {
  const { error } = await supabase
    .from("tracks")
    .update({ ...correccion, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`No se pudo guardar el track: ${error.message}`);
}

export async function borrarTrack(id: string) {
  const { error } = await supabase.from("tracks").delete().eq("id", id);
  if (error) throw new Error(`No se pudo borrar el track: ${error.message}`);
}
