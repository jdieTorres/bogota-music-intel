/**
 * Moderación de **salas**.
 *
 * Hasta el 2026-08-31 una sala nacía sola: `upsert_venues` la crea en cuanto
 * un evento scrapeado la nombra, con el nombre tal como lo publica la
 * fuente. Eso hizo que "Teatro Libre de Bogotá Sala Centro" entrara con el
 * nombre que le pone Rockal Live y no con el que usa el teatro, y por eso
 * existe `nombres_de_salas.py`. Ahora la sala nueva espera aprobación.
 *
 * Es otro ciclo de vida que el de los eventos, y por eso es otro módulo: un
 * evento caduca y una sala no; un evento se borra y se bloquea para que no
 * vuelva, una sala se aprueba una vez y queda.
 */

import { slugDeSala } from "@/lib/admin/slug";
import { supabase } from "@/lib/supabase";

export type EstadoSala = "borrador" | "publicado" | "descartado";

export type SalaEnModeracion = {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string | null;
  website_url: string | null;
  photo_url: string | null;
  latitude: number | null;
  longitude: number | null;
  status: EstadoSala;
  source_type: string;
  reviewed_at: string | null;
  /** Cuántos eventos la nombran. Es lo que dice si vale la pena aprobarla. */
  canonical_events: { count: number }[];
};

const CAMPOS = `
  id, slug, name, city, address, website_url, photo_url,
  latitude, longitude, status, source_type, reviewed_at,
  canonical_events ( count )
`;

export type PestañaDeSala = "borrador" | "publicado";

export async function getSalas(estado: PestañaDeSala): Promise<SalaEnModeracion[]> {
  const { data, error } = await supabase
    .from("venues")
    .select(CAMPOS)
    .eq("status", estado)
    .order("name");

  if (error) throw new Error(`No se pudieron cargar las salas: ${error.message}`);
  return (data ?? []) as unknown as SalaEnModeracion[];
}

export type CorreccionDeSala = Partial<
  Pick<
    SalaEnModeracion,
    "name" | "city" | "address" | "website_url" | "photo_url" | "latitude" | "longitude"
  >
>;

function revisada() {
  return { reviewed_at: new Date().toISOString() };
}

/** Aprueba la sala: a partir de acá sale en el mapa. */
export async function aprobarSala(id: string, correccion: CorreccionDeSala) {
  const { error } = await supabase
    .from("venues")
    .update({ ...correccion, ...revisada(), status: "publicado" })
    .eq("id", id);
  if (error) throw new Error(`No se pudo aprobar: ${error.message}`);
}

export async function guardarSala(id: string, correccion: CorreccionDeSala) {
  const { error } = await supabase
    .from("venues")
    .update({ ...correccion, ...revisada() })
    .eq("id", id);
  if (error) throw new Error(`No se pudo guardar: ${error.message}`);
}

/** Un evento que hoy cuelga de esta sala. Lo que hay que mirar antes de bajarla. */
export type EventoDeLaSala = {
  id: string;
  title: string;
  starts_at: string | null;
  status: string;
};

/**
 * Qué eventos tiene la sala, para poder advertir antes de descartarla.
 *
 * Se piden todos y no solo los publicados: al decidir si una sala se baja,
 * saber que además tiene cuatro borradores en la cola cambia la decisión.
 */
export async function getEventosDeLaSala(id: string): Promise<EventoDeLaSala[]> {
  const { data, error } = await supabase
    .from("canonical_events")
    .select("id, title, starts_at, status")
    .eq("venue_id", id)
    .neq("status", "descartado")
    .order("starts_at", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar sus eventos: ${error.message}`);
  return data ?? [];
}

/**
 * La saca del mapa sin borrarla, y baja sus eventos de la cartelera.
 *
 * **No hay borrado de salas y es a propósito.** Una sala la referencian sus
 * eventos por `venue_id`; borrarla los dejaría sin lugar, y además el
 * scraper la volvería a crear en la corrida siguiente en cuanto un evento
 * la nombre. `descartado` es la respuesta correcta: deja de mostrarse, la
 * fila queda, y si algún día vuelve a servir se aprueba de nuevo.
 *
 * ⚠️ **Va por RPC y no por un `update` de acá.** Bajar la sala y devolver sus
 * eventos a la cola tienen que pasar juntos: hasta el 2026-09-09 solo pasaba
 * lo primero, y los eventos se quedaban en la cartelera diciendo "Sala por
 * confirmar" sobre una sala que sí se sabía. Dos updates desde el navegador
 * pueden cortarse por la mitad; la función no.
 *
 * Devuelve cuántos eventos bajó, para poder decirlo.
 */
export async function descartarSala(id: string): Promise<number> {
  const { data, error } = await supabase.rpc("descartar_sala", { sala_id: id });
  if (error) throw new Error(`No se pudo descartar: ${error.message}`);
  return (data as number) ?? 0;
}

export type SalaNueva = {
  name: string;
  city?: string;
  address?: string | null;
  website_url?: string | null;
  photo_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

/**
 * Carga una sala a mano. Nace **publicada**: la está creando la misma
 * persona que aprobaría el borrador, así que hacerla pasar por la cola sería
 * pedirle que se apruebe a sí misma.
 *
 * Sin coordenadas la sala aparece bajo "sin ubicar" en el mapa, que es el
 * hueco honesto de siempre — mejor eso que un pin en el lugar equivocado.
 */
export async function crearSala(sala: SalaNueva) {
  const { data, error } = await supabase
    .from("venues")
    .insert({
      slug: slugDeSala(sala.name),
      name: sala.name.trim(),
      city: sala.city?.trim() || "Bogotá",
      address: sala.address?.trim() || null,
      website_url: sala.website_url?.trim() || null,
      photo_url: sala.photo_url?.trim() || null,
      latitude: sala.latitude ?? null,
      longitude: sala.longitude ?? null,
      source_type: "manual",
      status: "publicado",
      reviewed_at: new Date().toISOString(),
    })
    .select("id, name")
    .single();

  if (error) throw new Error(`No se pudo crear la sala: ${error.message}`);
  return data as { id: string; name: string };
}

/** Las salas aprobadas, para elegir al cargar un evento a mano. */
export async function getSalasPublicadas(): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase
    .from("venues")
    .select("id, name")
    .eq("status", "publicado")
    .order("name");
  if (error) throw new Error(`No se pudieron cargar las salas: ${error.message}`);
  return data ?? [];
}
