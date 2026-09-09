/**
 * El directorio de la escena, del lado público.
 *
 * Mismo reparto que en el resto del sitio: acá vive el acceso a datos y en
 * `directorio.ts` el criterio. Y la misma doble cerradura de `events.ts`: se
 * pide `status = 'publicado'` aunque RLS ya lo garantice, para que un cambio
 * futuro en las políticas no empiece a publicar borradores en silencio.
 */

import { supabase } from "@/lib/supabase";
import type { Plataforma } from "@/lib/enlaces-de-audio";
import type { SenalDeArtista } from "@/lib/directorio";

export type Track = {
  id: string;
  titulo: string;
  anio: number | null;
  plataforma: Plataforma;
  idExterno: string;
  /**
   * La carátula, si el artista publicó una.
   *
   * En null el disco lleva una etiqueta compuesta con el nombre y el título.
   * No se recorta un fotograma del video para fingir una carátula que nadie
   * hizo: el hueco se dice, no se disimula.
   */
  caratulaUrl: string | null;
};

/** Una fecha del artista que ya está en la cartelera. */
export type ToqueDelArtista = {
  eventoId: string;
  titulo: string;
  startsAt: string | null;
  datePrecision: string;
  sala: string | null;
};

export type Artista = {
  id: string;
  slug: string;
  nombre: string;
  /**
   * De dónde es, como hecho consultable.
   *
   * ⚠️ **No dice si es de la escena.** Eso lo dice estar en el directorio, y
   * lo decide una persona. Confundir el hecho con el criterio fue lo que
   * costó la baja de MusicBrainz: clasificaba bien la nacionalidad y la
   * pantalla decía "de la escena local", que es otra cosa.
   */
  origen: string | null;
  bio: string | null;
  fotoUrl: string | null;
  /** La página en Bandcamp: el disco completo, y donde el artista cobra. */
  bandcampUrl: string | null;
  links: Record<string, string>;
  tracks: Track[];
};

const PUBLICADO = "publicado";

const CAMPOS = `
  id, slug, nombre, origen_ciudad, origen_pais, bio, foto_url,
  bandcamp_url, links,
  tracks ( id, orden, titulo, anio, plataforma, id_externo, caratula_url )
`;

type FilaDeArtista = {
  id: string;
  slug: string;
  nombre: string;
  origen_ciudad: string | null;
  origen_pais: string | null;
  bio: string | null;
  foto_url: string | null;
  bandcamp_url: string | null;
  links: Record<string, string> | null;
  tracks: {
    id: string;
    orden: number;
    titulo: string;
    anio: number | null;
    plataforma: Plataforma;
    id_externo: string;
    caratula_url: string | null;
  }[];
};

/**
 * Compone el origen para pantalla, y **solo con lo que hay**.
 *
 * "Bogotá, Colombia" cuando están los dos; "Lima" o "Perú" cuando está uno;
 * null cuando no hay ninguno. Rellenar el país porque "casi todos son de acá"
 * sería inventar el dato justo en el campo donde más tienta.
 */
function origenParaLaVista(ciudad: string | null, pais: string | null): string | null {
  const piezas = [ciudad, pais].filter((p): p is string => Boolean(p && p.trim()));
  return piezas.length ? piezas.join(", ") : null;
}

function paraLaVista(fila: FilaDeArtista): Artista {
  return {
    id: fila.id,
    slug: fila.slug,
    nombre: fila.nombre,
    origen: origenParaLaVista(fila.origen_ciudad, fila.origen_pais),
    bio: fila.bio,
    fotoUrl: fila.foto_url,
    bandcampUrl: fila.bandcamp_url,
    links: fila.links ?? {},
    // El embed no garantiza el orden; el tracklist de una contratapa sí lo
    // tiene, y es el que puso Juan.
    tracks: [...(fila.tracks ?? [])]
      .sort((a, b) => a.orden - b.orden)
      .map((t) => ({
        id: t.id,
        titulo: t.titulo,
        anio: t.anio,
        plataforma: t.plataforma,
        idExterno: t.id_externo,
        caratulaUrl: t.caratula_url,
      })),
  };
}

export async function getArtistasPublicados(): Promise<Artista[]> {
  const { data, error } = await supabase
    .from("artists")
    .select(CAMPOS)
    .eq("status", PUBLICADO)
    .order("nombre");

  if (error) throw new Error(`No se pudo cargar el directorio: ${error.message}`);
  return ((data ?? []) as unknown as FilaDeArtista[]).map(paraLaVista);
}

type FilaDeCartel = {
  artist_id: string;
  canonical_events: {
    id: string;
    title: string;
    starts_at: string | null;
    date_precision: string;
    status: string;
    venues: { name: string } | null;
  } | null;
};

/**
 * Los toques de cada artista publicado: es lo que alimenta las dos señales
 * fuertes de recomendación y los enlaces a la cartelera.
 *
 * Se trae de una sola consulta para todo el directorio porque el catálogo es
 * chico y una consulta por artista sería peor de todas las maneras.
 */
async function getCarteles(): Promise<Map<string, ToqueDelArtista[]>> {
  const { data, error } = await supabase
    .from("event_artists")
    .select(
      `artist_id, canonical_events ( id, title, starts_at, date_precision, status, venues ( name ) )`,
    )
    .order("orden");

  if (error) throw new Error(`No se pudieron cargar los carteles: ${error.message}`);

  const porArtista = new Map<string, ToqueDelArtista[]>();
  for (const fila of (data ?? []) as unknown as FilaDeCartel[]) {
    const evento = fila.canonical_events;
    if (!evento || evento.status !== PUBLICADO) continue;
    const toques = porArtista.get(fila.artist_id) ?? [];
    toques.push({
      eventoId: evento.id,
      titulo: evento.title,
      startsAt: evento.starts_at,
      datePrecision: evento.date_precision,
      sala: evento.venues?.name ?? null,
    });
    porArtista.set(fila.artist_id, toques);
  }
  return porArtista;
}


/**
 * Los géneros de un artista salen de los eventos donde tocó.
 *
 * **No hay columna de género en `artists`, y es a propósito.** El género ya lo
 * escribe una persona sobre el evento; repetirlo en el artista daría dos
 * lugares donde decir lo mismo y un día dirían cosas distintas. Que la
 * recomendación sea más gruesa por eso es correcto: es exactamente lo que se
 * sabe.
 */
async function getGenerosPorEvento(): Promise<Map<string, string[]>> {
  const { data, error } = await supabase
    .from("canonical_events")
    .select("id, generos")
    .eq("status", PUBLICADO);

  if (error) throw new Error(`No se pudieron cargar los géneros: ${error.message}`);
  return new Map(
    ((data ?? []) as { id: string; generos: string[] | null }[]).map((e) => [e.id, e.generos ?? []]),
  );
}

export type Directorio = {
  artistas: Artista[];
  /** Los toques de cada artista, por id de artista. */
  toques: Map<string, ToqueDelArtista[]>;
  /** Las señales listas para `recomendar()`, por slug. */
  senales: Map<string, SenalDeArtista>;
};

/**
 * Todo el directorio de una sentada.
 *
 * Las tres consultas van juntas y no repartidas por página porque las tres
 * páginas del módulo necesitan lo mismo: la ficha de un artista quiere las
 * señales de **todos** los demás para poder recomendar. Pedirlas por separado
 * traería los carteles dos veces.
 *
 * Las señales se arman acá y no en `directorio.ts` porque acá sí se habla con
 * la base. Lo que cruza la frontera son datos planos, y por eso el criterio se
 * prueba sin credenciales.
 */
export async function getDirectorio(): Promise<Directorio> {
  const [artistas, carteles, generosPorEvento] = await Promise.all([
    getArtistasPublicados(),
    getCarteles(),
    getGenerosPorEvento(),
  ]);

  const senales = artistas.map((artista) => {
    const toques = carteles.get(artista.id) ?? [];
    const generos = new Set<string>();
    for (const toque of toques) {
      for (const genero of generosPorEvento.get(toque.eventoId) ?? []) generos.add(genero);
    }
    return {
      slug: artista.slug,
      nombre: artista.nombre,
      carteles: toques.map((t) => ({ eventoId: t.eventoId, startsAt: t.startsAt })),
      salas: [...new Set(toques.map((t) => t.sala).filter((s): s is string => Boolean(s)))],
      generos: [...generos],
    };
  });

  return {
    artistas,
    toques: carteles,
    senales: new Map(senales.map((s) => [s.slug, s])),
  };
}
