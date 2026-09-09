/**
 * La dirección que pega Juan → la plataforma y el identificador del track.
 *
 * Vive aparte del acceso a datos por el mismo motivo que `editorial.ts` y
 * `slug.ts`: acá no se abre conexión a Supabase, así que se prueba sin
 * credenciales. Es lógica, no acceso a datos.
 *
 * **Por qué hay dos plataformas y no una.** Se midió cuál servía y ninguna
 * gana sola. YouTube tiene la mayor cobertura del underground bogotano y
 * control completo por JavaScript, pero sus políticas exigen que el
 * reproductor mida al menos 200x200 y prohíben taparlo. SoundCloud da el
 * mismo control sin restricción de tamaño, con menos catálogo. Las dos
 * encadenan solas, que es lo que separa una rockola de una pared de
 * reproductores sueltos.
 *
 * **Y por qué faltan las otras dos.** Bandcamp es donde el underground de
 * esta ciudad publica de verdad, pero su reproductor no expone control por
 * JavaScript: no se puede encadenar, así que va en la ficha del artista como
 * el disco completo y no en la cola. Spotify sin sesión reproduce 30
 * segundos.
 */

export type Plataforma = "youtube" | "soundcloud";

export type EnlaceDeAudio = {
  plataforma: Plataforma;
  /**
   * En YouTube, el identificador de 11 caracteres del video. En SoundCloud,
   * la ruta `artista/track` — la plataforma no expone un id numérico sin
   * pasar por su API, y el widget acepta la dirección igual.
   */
  idExterno: string;
};

/**
 * El resultado de leer una dirección pegada a mano.
 *
 * Es un resultado y no un `EnlaceDeAudio | null` a propósito: cuando no se
 * reconoce, el formulario tiene que poder decir **por qué**. Un campo que se
 * queda vacío sin explicación se lee como un error del sistema, y acá casi
 * siempre es una dirección de una plataforma que no encadena — algo que se
 * arregla pegando otra cosa, no reintentando.
 */
export type LecturaDeEnlace =
  | { reconocido: true; enlace: EnlaceDeAudio }
  | { reconocido: false; motivo: string };

/** Los identificadores de video de YouTube son exactamente estos 11. */
const ID_DE_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;

export function leerEnlaceDeAudio(pegado: string): LecturaDeEnlace {
  const texto = pegado.trim();
  if (!texto) {
    return { reconocido: false, motivo: "Pega la dirección del track." };
  }

  let url: URL;
  try {
    // Sin esquema no es una dirección; se asume https antes de rendirse,
    // porque copiar de la barra del navegador a veces lo deja afuera.
    url = new URL(/^https?:\/\//i.test(texto) ? texto : `https://${texto}`);
  } catch {
    return {
      reconocido: false,
      motivo: "Eso no parece una dirección web.",
    };
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") {
    return desdeYoutube(url.pathname.slice(1));
  }

  if (host === "youtube.com" || host === "music.youtube.com" || host === "m.youtube.com") {
    const enParametro = url.searchParams.get("v");
    if (enParametro) return desdeYoutube(enParametro);

    // /embed/ID, /shorts/ID y /live/ID llevan el identificador en la ruta.
    const enRuta = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?]+)/);
    if (enRuta) return desdeYoutube(enRuta[1]);

    return {
      reconocido: false,
      motivo: "Esa dirección de YouTube no apunta a un video.",
    };
  }

  if (host === "on.soundcloud.com") {
    return {
      reconocido: false,
      motivo: "Ese es un enlace corto. Ábrelo y pega la dirección completa.",
    };
  }

  if (host === "soundcloud.com") {
    const partes = url.pathname.split("/").filter(Boolean);
    if (partes.length >= 2 && partes[1] === "sets") {
      return {
        reconocido: false,
        motivo: "Esa dirección es de un set. Pega la de un track suelto.",
      };
    }
    if (partes.length !== 2) {
      return {
        reconocido: false,
        motivo: "Esa dirección de SoundCloud no apunta a un track.",
      };
    }
    return {
      reconocido: true,
      enlace: { plataforma: "soundcloud", idExterno: partes.join("/") },
    };
  }

  // Las dos que se descartaron con motivo se dicen por su nombre: sin eso, el
  // formulario repetiría "no se reconoce" sobre una dirección que está
  // perfecta y solo es de la plataforma equivocada.
  if (host.endsWith("bandcamp.com")) {
    return {
      reconocido: false,
      motivo:
        "El reproductor de Bandcamp no se puede encadenar. Esa dirección va en el campo del disco completo.",
    };
  }
  if (host === "open.spotify.com" || host === "spotify.com") {
    return {
      reconocido: false,
      motivo: "Spotify solo deja sonar 30 segundos a quien no tiene sesión.",
    };
  }

  return {
    reconocido: false,
    motivo: "La rockola solo encadena YouTube y SoundCloud.",
  };
}

function desdeYoutube(candidato: string): LecturaDeEnlace {
  const id = candidato.split(/[?&#]/)[0];
  if (!ID_DE_YOUTUBE.test(id)) {
    return {
      reconocido: false,
      motivo: "Esa dirección de YouTube no apunta a un video.",
    };
  }
  return { reconocido: true, enlace: { plataforma: "youtube", idExterno: id } };
}

/** La página del track, para el enlace de "ver en …" y para verificarlo. */
export function direccionPublica(enlace: EnlaceDeAudio): string {
  return enlace.plataforma === "youtube"
    ? `https://www.youtube.com/watch?v=${enlace.idExterno}`
    : `https://soundcloud.com/${enlace.idExterno}`;
}

/**
 * La miniatura del track, si la plataforma la sirve en una dirección
 * predecible.
 *
 * ⚠️ **Devuelve null para SoundCloud y eso no es un pendiente.** Su carátula
 * solo se consigue preguntándole a su API, que pide clave. Inventar una
 * dirección que probablemente dé 404 sería peor que no mostrar nada.
 *
 * Y no es la carátula del track: es un fotograma del video. Sirve en el
 * formulario para confirmar que se pegó el video correcto, no para el disco.
 */
export function miniatura(enlace: EnlaceDeAudio): string | null {
  if (enlace.plataforma !== "youtube") return null;
  // `hqdefault` y no `maxresdefault`: el segundo no existe para todos los
  // videos y falla en silencio con una imagen rota.
  return `https://i.ytimg.com/vi/${enlace.idExterno}/hqdefault.jpg`;
}
