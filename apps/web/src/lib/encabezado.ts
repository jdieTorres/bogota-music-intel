/**
 * Cómo se escribe el encabezado de un toque de varias bandas.
 *
 * Vive aparte de `events.ts` por el mismo motivo que `editorial.ts`: acá no
 * se abre conexión a Supabase, así que se prueba sin credenciales. Es
 * criterio, no acceso a datos.
 *
 * **El problema que resuelve.** Hasta el 2026-09-15 un cartel de varias
 * bandas se publicaba como una frase: "Mukangu & Atake Mapalé & Los Yoryis".
 * Con tres nombres ya se lee mal y con cinco es ilegible, pero lo que de
 * verdad costaba es que **una frase no enlaza con nada**: el directorio no
 * puede saber que ahí hay tres artistas. Ahora la lista llega aparte y el
 * encabezado se compone de ella.
 *
 * ⚠️ **Plana, sin destacar a nadie.** El orden lo puso la sala al escribir los
 * nombres, o el modelo al leer el afiche — nadie verificó que el primero
 * encabece. Un cartel underground de cuatro bandas pares es normal, y pintar
 * al primero más grande afirmaría una jerarquía que nadie midió. La jerarquía
 * se gana cuando alguien arma el cartel a mano en `event_artists`, que sí
 * tiene un orden con dueño.
 */

import type { Evento } from "@/lib/events";

/**
 * Cuántos nombres caben en una fila de la cartelera antes de cortar.
 *
 * Tres y no dos: con dos, "Mukangu · Atake Mapalé +1" corta justo donde el
 * cartel se pone interesante. Y no más de tres porque la fila tiene una
 * altura fija y el cuarto nombre empuja la hora fuera de su sitio.
 */
export const EN_LA_CARTELERA = 3;

export type Encabezado = {
  /** Los nombres que se muestran, ya cortados. */
  artistas: string[];
  /** Cuántos quedaron fuera del corte. 0 si caben todos. */
  ocultos: number;
  gira: string | null;
};

/**
 * Las piezas del encabezado, o `null` si hay que mostrar `evento.title` tal
 * cual.
 *
 * Se devuelve `null` con cero o un artista, y no un encabezado de un nombre.
 * Con un solo artista el título ya dice exactamente eso, y componerlo de
 * nuevo desde la lista solo abre la posibilidad de que el título editado a
 * mano y la lista digan cosas distintas. Lo mismo vale para fiestas y
 * festivales, cuya lista está vacía a propósito: su título es el nombre del
 * ciclo, no un cartel.
 */
export function encabezado(
  evento: Pick<Evento, "title" | "artistas" | "gira">,
  tope = Number.POSITIVE_INFINITY,
): Encabezado | null {
  const artistas = evento.artistas ?? [];
  if (artistas.length < 2) return null;

  return {
    artistas: artistas.slice(0, tope),
    ocultos: Math.max(0, artistas.length - tope),
    gira: evento.gira,
  };
}

/**
 * El mismo encabezado en una sola línea de texto plano.
 *
 * Lo usa la tarjeta de compartir, que va dentro de una etiqueta `meta` y la
 * pinta el chat de quien la recibe. Sale de acá y no de `title` para que lo
 * que se ve en WhatsApp sea lo mismo que se ve en la página; si se leyera el
 * título, un cartel de varias bandas llegaría con el "&" encadenado que la
 * web ya no muestra.
 */
export function encabezadoEnTexto(
  evento: Pick<Evento, "title" | "artistas" | "gira">,
): string {
  const piezas = encabezado(evento);
  if (!piezas) return evento.title;

  const cartel = piezas.artistas.join(" · ");
  return piezas.gira ? `${cartel} | ${piezas.gira}` : cartel;
}

/**
 * El título que se guarda, armado desde la lista y la gira.
 *
 * **El formulario de carga manual ya no pide un título** (2026-09-15): lo
 * escribía a mano y después volvía a escribir los mismos nombres en «Quiénes
 * tocan», y con dos artistas o más la pantalla ni siquiera lo usaba. Lo notó
 * Juan: "veo cierta redundancia en los campos".
 *
 * `canonical_events.title` **se sigue guardando** y no es un resto: es lo que
 * lee la tarjeta de compartir cuando hay un solo artista, lo que el admin puede
 * corregir desde la cola, y lo que la cartelera muestra mientras la lista tenga
 * menos de dos nombres.
 *
 * Va con " & " y no con " · " a propósito: es el formato que produce la
 * ingesta, así que un evento cargado a mano y uno traído por el cron se guardan
 * igual. El punto medio es cosa de la pantalla, no del dato.
 */
export function tituloDesde(artistas: string[], gira: string | null): string {
  const cartel = artistas.map((a) => a.trim()).filter(Boolean).join(" & ");
  const g = gira?.trim();
  if (!cartel) return g ?? "";
  return g ? `${cartel} | ${g}` : cartel;
}

/**
 * El camino de vuelta: parte un título publicado en lista y gira.
 *
 * Lo usa la cola para poder editar un toque por sus dos campos cuando la
 * columna `artistas` viene vacía — los 113 canónicos anteriores al 2026-09-15
 * están así, y los que el admin escribió a mano también.
 *
 * ⚠️ **Es lo contrario de `tituloDesde` y no es su inversa exacta.** El " | "
 * es seguro: solo lo pone `_unir`. El " & " **no**: hay artistas cuyo nombre lo
 * lleva dentro. `Carlos Vives & La Provincia` está curado como **un** artista,
 * con evidencia, y esta función lo parte en dos — hay un test que lo deja
 * escrito.
 *
 * Se acepta porque el destino es un formulario y no la pantalla: quien lo abre
 * ve los chips antes de guardar y junta los dos si hace falta. Sería
 * inaceptable en la ingesta, que decide sin nadie mirando.
 */
export function desestructurarTitulo(titulo: string): {
  artistas: string[];
  gira: string | null;
} {
  const [cartel, ...resto] = titulo.split(" | ");
  return {
    artistas: cartel.split(" & ").map((a) => a.trim()).filter(Boolean),
    gira: resto.length > 0 ? resto.join(" | ").trim() || null : null,
  };
}

/** Un artista del directorio, para enlazar su nombre en el encabezado. */
export type FichaDeArtista = { nombre: string; slug: string };

/** Sin tildes y en minúsculas: la fuente escribe "Atake Mapale" donde la ficha
 *  dice "Atake Mapalé", y son el mismo. */
const plano = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/** Un pedazo del encabezado: texto suelto, o el nombre de alguien que tiene
 *  ficha y por eso lleva enlace. */
export type Trozo = { texto: string; slug?: string };

/**
 * Parte un texto en trozos, enlazando los nombres que tienen ficha.
 *
 * **Así el nombre del artista es el enlace**, en vez de repetirlo en un bloque
 * aparte debajo. Lo pidió Juan el 2026-09-15: en un toque, el título ya dice
 * quién toca, y un "En el cartel" debajo con los mismos nombres era decir dos
 * veces lo mismo. El bloque se queda para fiestas y festivales, donde el
 * título es el nombre del ciclo y los artistas no salen de él.
 *
 * Busca de mayor a menor largo para que un nombre contenido en otro no le robe
 * la coincidencia, y **cada ficha enlaza una sola vez**: si un nombre aparece
 * repetido, el segundo queda como texto. Compara sin tildes ni mayúsculas
 * porque la fuente y la ficha casi nunca las escriben igual.
 */
export function trozosConEnlaces(
  texto: string,
  fichas: FichaDeArtista[],
): Trozo[] {
  const porLargo = [...fichas].sort((a, b) => b.nombre.length - a.nombre.length);
  let trozos: Trozo[] = [{ texto }];

  for (const ficha of porLargo) {
    const buscado = plano(ficha.nombre);
    if (!buscado) continue;

    let yaEnlazada = false;
    trozos = trozos.flatMap((trozo): Trozo[] => {
      if (trozo.slug || yaEnlazada) return [trozo];
      const desde = plano(trozo.texto).indexOf(buscado);
      if (desde === -1) return [trozo];

      yaEnlazada = true;
      const antes = trozo.texto.slice(0, desde);
      const medio = trozo.texto.slice(desde, desde + ficha.nombre.length);
      const despues = trozo.texto.slice(desde + ficha.nombre.length);
      return [
        ...(antes ? [{ texto: antes }] : []),
        { texto: medio, slug: ficha.slug },
        ...(despues ? [{ texto: despues }] : []),
      ];
    });
  }

  return trozos;
}
