/**
 * Lo que se leyó de un afiche, y cómo se interpreta.
 *
 * **Vive aparte de `carga-de-afiche.ts` por el mismo motivo que
 * `editorial.ts` vive aparte de `events.ts`:** acá no se abre conexión a
 * Supabase, así que se puede probar sin credenciales. La subida y la llamada
 * al lector están del otro lado.
 */

/** Lo que el modelo pudo leer. Todo puede faltar, y faltar es la respuesta
 *  correcta cuando el afiche no lo dice. */
export type CamposDelAfiche = {
  titulo: string | null;
  artistas: string[];
  fecha_local: string | null;
  hora_local: string | null;
  sala_nombre: string | null;
  precio_texto: string | null;
  boleteria_url: string | null;
  genero: string | null;
  notas: string | null;
};

/**
 * Busca la sala leída entre las que ya existen.
 *
 * **Nunca crea una.** El slug de una sala tiene que coincidir con el que
 * genera `python-slugify` en la ingesta, o el día que un scraper la publique
 * la crearía de nuevo y los eventos quedarían repartidos entre las dos
 * copias. Si no hay coincidencia devuelve null y Juan elige o la crea con el
 * formulario de salas, que sí replica esa regla.
 *
 * La comparación es exacta sobre texto normalizado, sin parecido difuso: un
 * afiche que dice "Teatro Libre" no debe engancharse solo con "Teatro Libre
 * Sede Centro" ni con el de Chapinero.
 */
export function salaQueCoincide(
  leida: string | null,
  salas: { id: string; name: string }[],
): string | null {
  if (!leida) return null;
  const normalizar = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const objetivo = normalizar(leida);
  return salas.find((s) => normalizar(s.name) === objetivo)?.id ?? null;
}

/**
 * ¿Lo pegado es solo un enlace?
 *
 * ⚠️ **Un enlace no sirve, y no es una limitación técnica sino la regla.**
 * Instagram, Tuboleta, Bandsintown y Songkick bloquean el rastreo en su
 * `robots.txt`. Si el admin pega una URL y nuestro servidor la va a buscar,
 * sigue siendo nuestro agente entrando donde no lo dejan — que el dato caiga
 * en una cola en vez de publicarse no cambia qué tenemos permitido pedir.
 * Por eso la vía es **pegar el contenido, no el enlace**: si el texto ya lo
 * copió una persona, no hay robot.
 *
 * Se detecta acá y no en el servidor para no gastar una llamada paga en algo
 * que ya se sabe que no va a dar nada: el modelo tampoco puede abrir la URL,
 * así que devolvería todos los campos vacíos y parecería que falló.
 */
export function esSoloUnEnlace(texto: string): boolean {
  const limpio = texto.trim();
  if (!limpio) return false;
  // Una sola "palabra" que arranca como URL: no hay contenido que leer.
  return /^\S+$/.test(limpio) && /^(https?:\/\/|www\.)/i.test(limpio);
}
