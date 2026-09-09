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

/** Los publicados, para vincular el cartel de un evento. */
export async function getArtistasPublicados(): Promise<{ id: string; nombre: string }[]> {
  const { data, error } = await supabase
    .from("artists")
    .select("id, nombre")
    .eq("status", "publicado")
    .order("nombre");
  if (error) throw new Error(`No se pudieron cargar los artistas: ${error.message}`);
  return data ?? [];
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
