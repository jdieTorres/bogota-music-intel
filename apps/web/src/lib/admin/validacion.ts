/**
 * Qué le falta a una ficha de artista, dicho antes de que lo diga la base.
 *
 * La base ya lo impide —`artista_publicado_necesita_evidencia` es una
 * restricción de verdad y sigue siendo la garantía—, pero su mensaje es para
 * quien lee logs: llegaba entero a la pantalla, arriba del todo, lejos del
 * campo que había que llenar. **Esto no reemplaza la restricción, la
 * traduce**, y de paso permite llevar el cursor al campo.
 *
 * Criterio puro: sin Supabase, así que se prueba sin credenciales.
 */

export type Falta = {
  /** El campo al que hay que llevar a quien está escribiendo. */
  campo: "nombre" | "evidencia";
  mensaje: string;
};

type Ficha = {
  nombre?: string | null;
  evidencia?: string | null;
};

const vacio = (valor: string | null | undefined) => !valor || !valor.trim();

/** Lo mínimo para que la fila exista. Un borrador puede estar a medias: es
 *  para lo que existe, y exigirle evidencia obligaría a inventarla para no
 *  perder lo ya escrito. */
export function faltaParaGuardar(ficha: Ficha): Falta | null {
  if (vacio(ficha.nombre)) {
    return { campo: "nombre", mensaje: "Ponle nombre al artista antes de guardar." };
  }
  return null;
}

/**
 * Lo que exige publicar, en el orden en que los campos están en pantalla.
 *
 * Devuelve **una** falta y no la lista: se lleva el cursor a un solo campo, y
 * enumerar cuatro problemas a la vez no ayuda a resolver el primero.
 */
export function faltaParaPublicar(ficha: Ficha): Falta | null {
  const deGuardar = faltaParaGuardar(ficha);
  if (deGuardar) return deGuardar;

  if (vacio(ficha.evidencia)) {
    return {
      campo: "evidencia",
      mensaje:
        "Para publicar hace falta la evidencia: de dónde salió lo que dice la ficha. " +
        "Un enlace a su Instagram, su Bandcamp o la nota donde lo cuentan.",
    };
  }
  return null;
}
