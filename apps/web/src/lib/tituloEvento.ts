/**
 * Formatea el título crudo de un evento para mostrarlo en pantalla, sin
 * tocar lo que se guardó en `events.title` — la ingesta sigue guardando lo
 * que publica cada fuente tal cual, esto es puramente de presentación.
 *
 * Reglas pedidas por Juan (2026-08-29):
 * - Concierto: "Nombre Artista" o, si el título trae separador, "Nombre
 *   Artista | Nombre Gira". Sin gira detectada, se muestra solo el artista.
 * - Fiesta: el nombre completo del evento, en el mismo formato de mayúsculas.
 * - Todo en "Primera Letra Mayúscula De Cada Palabra", menos los conectores
 *   (de, la, y…), que van en minúscula salvo que abran el título.
 */

// Separadores que en la práctica separan "artista" de "gira/subtítulo" en
// los títulos reales de las salas: "ROBBIE WILLIAMS | BRITPOP",
// "AKRIILA - TOUR LUCY", "Inspector: 30 Aniversario". Deliberadamente NO
// se separa por "/", porque puede ser parte del propio nombre ("AC/DC").
// El guion exige espacios alrededor para no partir nombres como "Jay-Z".
const SEPARADOR = /\s*[|:]\s*|\s+[-–—]+\s+/;

// Conectores en español e inglés que se dejan en minúscula cuando no abren
// el título, para que "Fiesta de la Salsa" no quede "Fiesta De La Salsa".
const CONECTORES = new Set([
  "de",
  "del",
  "la",
  "las",
  "el",
  "los",
  "y",
  "o",
  "en",
  "a",
  "con",
  "para",
  "por",
  "un",
  "una",
  "al",
  "e",
  "of",
  "the",
  "and",
  "in",
  "on",
  "at",
  "to",
  "for",
]);

/** "ROBBIE WILLIAMS" -> "Robbie Williams". Capitaliza la primera letra de
 *  cada palabra y deja el resto en minúscula, salvo los conectores (que
 *  siempre van en minúscula excepto si abren el título). */
export function tituloCaso(texto: string): string {
  const palabras = texto.trim().split(/\s+/).filter(Boolean);
  return palabras
    .map((palabra, indice) => {
      const base = palabra.toLocaleLowerCase("es-CO");
      if (indice > 0 && CONECTORES.has(base)) return base;
      return base.replace(/\p{L}/u, (letra) => letra.toLocaleUpperCase("es-CO"));
    })
    .join(" ");
}

/** Parte un título en artista + gira por el primer separador que
 *  encuentre. Si no hay separador, o si algún lado queda vacío, el título
 *  entero se trata como el nombre del artista — no hay gira que inventar. */
export function partirArtistaYGira(titulo: string): {
  artista: string;
  gira: string | null;
} {
  const coincidencia = titulo.match(SEPARADOR);
  if (!coincidencia || coincidencia.index === undefined) {
    return { artista: titulo.trim(), gira: null };
  }

  const antes = titulo.slice(0, coincidencia.index).trim();
  const despues = titulo.slice(coincidencia.index + coincidencia[0].length).trim();
  if (!antes || !despues) return { artista: titulo.trim(), gira: null };

  return { artista: antes, gira: despues };
}

type EventoConTitulo = { title: string; event_type?: string | null };

/** El título tal como se muestra en la cartelera, el mapa y el detalle. */
export function tituloParaMostrar(evento: EventoConTitulo): string {
  if (evento.event_type === "fiesta") return tituloCaso(evento.title);

  const { artista, gira } = partirArtistaYGira(evento.title);
  const artistaFormateado = tituloCaso(artista);
  return gira ? `${artistaFormateado} | ${tituloCaso(gira)}` : artistaFormateado;
}
