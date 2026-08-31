/**
 * Formatea el título crudo de un evento para mostrarlo en pantalla, sin
 * tocar lo que se guardó en `events.title` — la ingesta sigue guardando lo
 * que publica cada fuente tal cual, esto es puramente de presentación.
 *
 * Reglas pedidas por Juan (2026-08-29, revisadas el 2026-08-31):
 * - Concierto: "Artista | Gira", o solo "Artista" si no hay gira.
 * - Varios artistas de cartel se separan con " & ", no con "|": la barra
 *   es para lo que viene *después* del artista.
 * - Fiesta: el nombre completo del ciclo, sin partir nada.
 * - El ruido de la sala —"en Bogotá", "llega al Teatro X"— no es parte del
 *   nombre de nadie y se quita.
 *
 * Lo que NO se hace acá: adivinar. Cuando el título no alcanza para saber
 * si "ACÚSTICO" es parte del nombre de la banda o el formato del show, o
 * cuándo un guion separa dos artistas en vez de un artista y su gira, la
 * respuesta se cura a mano con evidencia en `titulosCurados.ts`. Las reglas
 * de este archivo se mantienen estrechas a propósito.
 */

import { GRAFIAS, TITULOS } from "@/lib/titulosCurados";

// ---------------------------------------------------------------------------
// Limpieza de texto
// ---------------------------------------------------------------------------

/** Unifica los signos que cada sala escribe distinto, para que las reglas y
 *  las listas curadas no tengan que contemplar cada variante. El apóstrofo
 *  se normaliza al tipográfico porque el título es texto de display. */
function unificarSignos(texto: string): string {
  return texto
    .replace(/[´`‘’ʼ]/g, "’")
    .replace(/[–—―]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function sinAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/** Clave de comparación: sin acentos, sin mayúsculas, sin signos raros.
 *  Es lo que usan las listas curadas para engancharse con lo que publica
 *  la fuente sin depender de cómo lo escribió. */
export function claveDeTitulo(texto: string): string {
  return sinAcentos(unificarSignos(texto)).toLocaleLowerCase("es-CO");
}

const GRAFIAS_POR_CLAVE = new Map(
  GRAFIAS.map((g) => [claveDeTitulo(g.comoLoPublican), g.nombre]),
);
const TITULOS_POR_CLAVE = new Map(TITULOS.map((t) => [claveDeTitulo(t.comoLoPublican), t]));

// ---------------------------------------------------------------------------
// Mayúsculas
// ---------------------------------------------------------------------------

// Conectores en español e inglés que se dejan en minúscula cuando no abren
// el título, para que "Fiesta de la Salsa" no quede "Fiesta De La Salsa".
const CONECTORES = new Set([
  "de", "del", "la", "las", "el", "los", "y", "o", "en", "a", "con", "para",
  "por", "un", "una", "al", "e", "of", "the", "and", "in", "on", "at", "to",
  "for",
]);

const TIENE_MINUSCULA = /\p{Ll}/u;
const TIENE_MAYUSCULA = /\p{Lu}/u;
const TIENE_LETRA = /\p{L}/u;
const TIENE_DIGITO = /\d/;

function capitalizar(palabra: string): string {
  return palabra
    .toLocaleLowerCase("es-CO")
    .replace(/\p{L}/u, (letra) => letra.toLocaleUpperCase("es-CO"));
}

/**
 * "ROBBIE WILLIAMS" -> "Robbie Williams", pero "Lucho Al Attaque" se queda
 * como está.
 *
 * La regla es asimétrica a propósito: **solo sube mayúsculas, nunca las
 * baja**, salvo que la fuente esté gritando el título entero. Una sala que
 * escribe en mayúscula sostenida no está diciendo nada sobre el nombre del
 * artista, así que ahí sí se rearma todo; pero si escribió "Lucho Al
 * Attaque" con la 'A' grande, esa mayúscula es información y bajarla sería
 * inventar. El caso que lo enseñó al revés: "Todos tus muertos" —minúsculas
 * que sí hay que subir— y "El plan de la mariposa".
 *
 * @param grita si el título completo del que sale este fragmento viene en
 *   mayúscula sostenida. Se calcula sobre el título entero y no sobre el
 *   fragmento, para que "BRITPOP" dentro de "ROBBIE WILLIAMS | BRITPOP" se
 *   trate como grito y no como sigla.
 */
export function tituloCaso(texto: string, grita = esGrito(texto)): string {
  const palabras = unificarSignos(texto).split(" ").filter(Boolean);
  const gritadas = grita ? palabras.map(() => true) : marcarRafagasEnMayuscula(palabras);

  return palabras
    .map((palabra, indice) => {
      // Una palabra que mezcla letras y dígitos es una estilización, no una
      // palabra gritada: "MADE4RAP", "A-1". Rearmarla la arruina.
      if (TIENE_DIGITO.test(palabra) && TIENE_LETRA.test(palabra)) return palabra;

      // Mayúscula puesta a mano por la fuente: se respeta.
      if (!gritadas[indice] && TIENE_MAYUSCULA.test(palabra)) return palabra;

      const base = palabra.toLocaleLowerCase("es-CO");
      if (indice > 0 && CONECTORES.has(base)) return base;
      return capitalizar(palabra);
    })
    .join(" ");
}

/** ¿La fuente escribió esto en mayúscula sostenida? */
export function esGrito(texto: string): boolean {
  return TIENE_LETRA.test(texto) && !TIENE_MINUSCULA.test(texto);
}

/**
 * Marca las palabras que forman parte de una ráfaga en mayúscula dentro de
 * un título que por lo demás está en caja mixta: "Shing02, SPIN MASTER A-1
 * y Sam Nakamura". Dos o más mayúsculas seguidas son la fuente gritando un
 * pedazo; una sola y aislada es una sigla que hay que dejar quieta (WWE).
 */
function marcarRafagasEnMayuscula(palabras: string[]): boolean[] {
  const sostenida = palabras.map(
    (p) => TIENE_LETRA.test(p) && !TIENE_DIGITO.test(p) && !TIENE_MINUSCULA.test(p),
  );
  return sostenida.map(
    (esta, i) => esta && (sostenida[i - 1] === true || sostenida[i + 1] === true),
  );
}

// ---------------------------------------------------------------------------
// Ruido de sala y de ciudad
// ---------------------------------------------------------------------------

// Lo que antecede al nombre de una sala o de la ciudad cuando la sala lo
// pega al título: "AKRIILA EN BOGOTÁ", "Blonde Redhead llega al Teatro
// Jorge Eliécer Gaitán", "Shing02 ... en vivo en Bogota".
const ANCLA_DE_LUGAR =
  /\s+(?:lleg(?:a|an)\s+a(?:l)?|en\s+vivo\s+en|en\s+directo\s+en|desde|en)\s+(?:el\s+|la\s+|los\s+|las\s+)?/giu;

// Lo que introduce la gira cuando viene después del lugar: "llega a Bogotá
// con el Ronroco Tour".
const ANTES_DE_LA_GIRA = /^con\s+(?:el\s+|la\s+|los\s+|las\s+)?/iu;

const CIUDAD = ["bogota", "colombia"];

/** El vocabulario que cuenta como "lugar" para este evento: la ciudad y las
 *  palabras del nombre de su sala. Fuera de esa lista no se borra nada — sin
 *  esto, "en vivo" o "en concierto" se llevarían medio título por delante. */
function palabrasDeLugar(sala: string | undefined): Set<string> {
  const palabras = new Set(CIUDAD);
  for (const palabra of claveDeTitulo(sala ?? "").split(" ")) {
    if (palabra) palabras.add(palabra);
  }
  return palabras;
}

function claveDePalabra(palabra: string): string {
  return claveDeTitulo(palabra).replace(/[^\p{L}\p{N}]/gu, "");
}

/** Cuántas palabras seguidas nombran el lugar. Deja pasar conectores en el
 *  medio ("Teatro Libre de Bogotá") pero exige al menos una palabra que sí
 *  nombre el lugar, y no se lleva los conectores del final: en "llega a
 *  Bogotá con el Ronroco Tour", el "con el" abre la gira, no cierra el
 *  lugar. */
function largoDeLaRafagaDeLugar(palabras: string[], lugar: Set<string>): number {
  let fin = 0;
  let ultimoConcreto = -1;
  while (fin < palabras.length) {
    const clave = claveDePalabra(palabras[fin]);
    if (lugar.has(clave)) ultimoConcreto = fin;
    else if (!CONECTORES.has(clave)) break;
    fin += 1;
  }
  return ultimoConcreto + 1;
}

type SinRuido = { cuerpo: string; cola: string };

/**
 * Parte el título en lo que queda después de quitarle el lugar (`cuerpo`) y
 * lo que venía detrás del lugar (`cola`), que casi siempre es la gira:
 * "Todo copas en Latino Power Bogota 20 Años" -> "Todo copas" + "20 Años".
 */
function quitarRuidoDeLugar(titulo: string, sala: string | undefined): SinRuido {
  const lugar = palabrasDeLugar(sala);
  const palabras = titulo.split(" ");

  // 1. El lugar anunciado con preposición, en cualquier punto del título.
  for (const coincidencia of titulo.matchAll(ANCLA_DE_LUGAR)) {
    const indice = coincidencia.index;
    if (indice === undefined || indice === 0) continue;
    const antes = titulo.slice(0, indice).trim();
    const resto = titulo.slice(indice + coincidencia[0].length).trim();
    if (!antes || !resto) continue;

    const restoEnPalabras = resto.split(" ");
    const largo = largoDeLaRafagaDeLugar(restoEnPalabras, lugar);
    if (largo === 0) continue;

    const cola = restoEnPalabras.slice(largo).join(" ").replace(ANTES_DE_LA_GIRA, "");
    return { cuerpo: antes, cola: cola.trim() };
  }

  // 2. El lugar pegado al final sin preposición: "MADE4RAP BOGOTÁ".
  let fin = palabras.length;
  while (fin > 1 && lugar.has(claveDeTitulo(palabras[fin - 1]))) fin -= 1;
  if (fin < palabras.length) return { cuerpo: palabras.slice(0, fin).join(" "), cola: "" };

  return { cuerpo: titulo, cola: "" };
}

/** El año suelto al final, que es como el Movistar Arena desambigua sus
 *  fichas ("Alvaro Diaz 2026", "WWE Bogota 2026") y no parte del nombre.
 *  No se toca si el título ya trae separador: ahí el año está dentro del
 *  nombre de la gira ("… | Sickening Latin America Tour 2026"). */
function quitarAnioFinal(titulo: string): string {
  if (SEPARADOR_DE_GIRA.test(titulo)) return titulo;
  const palabras = titulo.split(" ");
  if (palabras.length < 2 || !/^20\d\d$/.test(palabras[palabras.length - 1])) return titulo;
  return palabras.slice(0, -1).join(" ");
}

/** "BloodbathBloodbath" -> "Bloodbath". Es un defecto de render de la
 *  fuente, no una estilización. Solo se colapsa cuando el corte deja ver la
 *  costura —minúscula pegada a mayúscula—, para no romper un nombre que
 *  repite a propósito: "PABLOPABLO" es "PABLO"+"PABLO" y no se toca. */
function colapsarNombreDuplicado(titulo: string): string {
  if (titulo.length % 2 !== 0) return titulo;
  const mitad = titulo.length / 2;
  const izquierda = titulo.slice(0, mitad);
  if (izquierda !== titulo.slice(mitad)) return titulo;
  const costura = TIENE_MINUSCULA.test(izquierda.slice(-1)) && TIENE_MAYUSCULA.test(izquierda[0]);
  return costura ? izquierda : titulo;
}

// ---------------------------------------------------------------------------
// Artista, artistas y gira
// ---------------------------------------------------------------------------

// Separadores que en la práctica separan "artista" de "gira/subtítulo":
// "ROBBIE WILLIAMS | BRITPOP", "AKRIILA - TOUR LUCY", "Inspector: 30
// Aniversario". El guion exige espacios alrededor para no partir "Jay-Z".
//
// Ojo: un guion también puede separar dos artistas ("Lenny Tavarez – J
// quiles"). No hay señal honesta en el texto para distinguir los dos casos
// —"BRITPOP" y "J quiles" se ven igual—, así que el caso frecuente (gira)
// es la regla y el otro se cura por título en `titulosCurados.ts`.
const SEPARADOR_DE_GIRA = /\s*[|:]\s*|\s+-+\s+/;

// "Festival Orígenes presenta Sara Curruchich y Humazapas": el ciclo
// anuncia y los artistas vienen después. Se invierte para que el cartel
// quede primero, que es lo que la plataforma promueve.
const PRESENTA = /^(.+?)\s+presentan?\s+(.+)$/iu;

/** Parte un título en artista + gira por el primer separador que
 *  encuentre. Si no hay separador, o si algún lado queda vacío, el título
 *  entero se trata como el nombre del artista — no hay gira que inventar. */
export function partirArtistaYGira(titulo: string): {
  artista: string;
  gira: string | null;
} {
  const limpio = unificarSignos(titulo);
  const coincidencia = limpio.match(SEPARADOR_DE_GIRA);
  if (!coincidencia || coincidencia.index === undefined) {
    return { artista: limpio, gira: null };
  }

  const antes = limpio.slice(0, coincidencia.index).trim();
  const despues = limpio.slice(coincidencia.index + coincidencia[0].length).trim();
  if (!antes || !despues) return { artista: limpio, gira: null };

  return { artista: antes, gira: despues };
}

/**
 * Separa un cartel de varios artistas: "Mukangu/Atake Mapale/ Los Yoryis",
 * "Shing02, SPIN MASTER A-1 y Sam Nakamura".
 *
 * Conservador a propósito. La barra solo parte si todos los pedazos quedan
 * con 4 caracteres o más, que es lo que salva a "AC/DC". Y la "y" solo
 * parte cuando el título ya venía marcado como lista por una coma o una
 * barra: sin ese requisito, "10 AÑOS Y NO AZARAN" se convertiría en dos
 * artistas inexistentes.
 */
export function partirArtistas(texto: string, esCartel = false): string[] {
  let piezas = [texto.trim()];

  if (texto.includes("/")) {
    const porBarra = texto.split("/").map((p) => p.trim());
    if (porBarra.length > 1 && porBarra.every((p) => p.length >= 4)) piezas = porBarra;
  }

  if (texto.includes(",")) {
    piezas = piezas.flatMap((p) => p.split(",").map((q) => q.trim())).filter(Boolean);
  }

  if (piezas.length > 1 || esCartel) {
    piezas = piezas.flatMap((p) => p.split(/\s+(?:y|e|and)\s+/iu).map((q) => q.trim()));
  }

  return piezas.filter(Boolean);
}

function nombreDeArtista(texto: string, grita: boolean): string {
  const formateado = tituloCaso(texto, grita);
  return GRAFIAS_POR_CLAVE.get(claveDeTitulo(formateado)) ?? formateado;
}

// ---------------------------------------------------------------------------
// Entrada pública
// ---------------------------------------------------------------------------

type EventoConTitulo = { title: string; event_type?: string | null };

/**
 * El título tal como se muestra en la cartelera, el mapa y el detalle.
 *
 * @param sala nombre de la sala del evento, si se conoce. Sirve para poder
 *   quitar el "en <sala>" que varias fuentes le pegan al título. Sin él se
 *   quita igual el nombre de la ciudad, que es el caso más común.
 */
export function tituloParaMostrar(evento: EventoConTitulo, sala?: string): string {
  const crudo = unificarSignos(evento.title);

  const curado = TITULOS_POR_CLAVE.get(claveDeTitulo(crudo));
  if (curado) return unir(curado.artistas, curado.gira);

  const grita = esGrito(crudo);
  const esFiesta = evento.event_type === "fiesta";

  // El año va antes que el lugar: en "WWE Bogota 2026" la ciudad queda al
  // descubierto recién cuando se quita el año. En una fiesta no se quita —
  // ahí el año puede ser el nombre de la edición.
  const base = colapsarNombreDuplicado(crudo);
  const { cuerpo, cola } = quitarRuidoDeLugar(esFiesta ? base : quitarAnioFinal(base), sala);

  // Una fiesta no tiene artista de cartel que separar de una gira: el
  // nombre del ciclo es todo el título. Solo se le quita el ruido de sala.
  if (esFiesta) return tituloCaso(quitarPuntoFinal(`${cuerpo} ${cola}`.trim()), grita);

  const anuncio = cuerpo.match(PRESENTA);
  const { artista, gira } = anuncio
    ? { artista: anuncio[2], gira: anuncio[1] }
    : partirArtistaYGira(cuerpo);

  const artistas = partirArtistas(artista, anuncio !== null).map((a) =>
    nombreDeArtista(quitarPuntoFinal(a), grita),
  );
  const giraFinal = gira ?? (cola || null);

  return unir(artistas, giraFinal && tituloCaso(quitarPuntoFinal(giraFinal), grita));
}

/** "Poder Femenino Noches Bomm." -> sin el punto colgando. No toca las
 *  abreviaturas ("Vol. 4"), que nunca quedan al final. */
function quitarPuntoFinal(texto: string): string {
  return texto.replace(/\.\s*$/, "").trim();
}

function unir(artistas: string[], gira: string | null | undefined): string {
  const cartel = artistas.join(" & ");
  return gira ? `${cartel} | ${gira}` : cartel;
}
