const TZ = "America/Bogota";

/** "jueves, 27 de agosto" — encabezado de cada día del calendario. */
export function tituloDeDia(claveISO: string): string {
  // claveISO viene como YYYY-MM-DD; el mediodía evita que el cambio de huso
  // corra la fecha un día hacia atrás al formatear.
  const fecha = new Date(`${claveISO}T12:00:00-05:00`);
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(fecha);
}

/**
 * ¿La fuente publicó hora, o solo fecha?
 *
 * Hay que mirarlo en hora de Bogotá, no en UTC: medianoche en Bogotá es
 * `T05:00:00Z`, y un show de las 8 p. m. se guarda como `T00:00:00Z` del día
 * siguiente. Buscar "T00:00:00" en el texto ISO da la respuesta invertida.
 */
export function tieneHoraPublicada(iso: string | null): boolean {
  if (!iso) return false;
  const hhmm = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
  return hhmm !== "00:00";
}

/** "8:00 p. m." — null si la fuente no publicó hora (solo fecha). */
export function horaDeEvento(iso: string | null, precision: string): string | null {
  if (!iso || precision !== "day") return null;
  // Mostrar "12:00 a. m." sería inventar una hora que nadie anunció.
  if (!tieneHoraPublicada(iso)) return null;
  const fecha = new Date(iso);

  return new Intl.DateTimeFormat("es-CO", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(fecha);
}

/**
 * La fecha partida en piezas, para el riel de fechas de la cartelera:
 * `{ diaSemana: "vie", numero: "11", mes: "sep" }`.
 *
 * Existe porque el riel apila las tres piezas con tamaños y pesos distintos,
 * y de una sola cadena formateada ("viernes, 11 de septiembre") no se pueden
 * separar sin partir texto a mano, que en español se rompe con los meses de
 * una palabra y con la coma del locale.
 *
 * ⚠️ El mediodía del mismo truco que `tituloDeDia` no es opcional: la clave
 * llega como `YYYY-MM-DD` y a medianoche el huso corre la fecha un día hacia
 * atrás al formatear. Colombia es UTC-5 todo el año.
 */
export function piezasDeDia(claveISO: string): {
  diaSemana: string;
  numero: string;
  mes: string;
} {
  const fecha = new Date(`${claveISO}T12:00:00-05:00`);
  const parte = (opciones: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("es-CO", { timeZone: TZ, ...opciones })
      .format(fecha)
      .replace(".", "");

  return {
    diaSemana: parte({ weekday: "short" }),
    numero: parte({ day: "numeric" }),
    mes: parte({ month: "short" }),
  };
}

export function esHoy(claveISO: string): boolean {
  const hoy = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return claveISO === hoy;
}

/** "27 ago" — etiqueta compacta para la ficha del evento. */
export function fechaCorta(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

/** "jueves, 27 de agosto de 2026" — fecha completa en el detalle. */
export function fechaLarga(iso: string): string {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * El inicio del día de hoy en Bogotá, como texto para la consulta.
 *
 * Un toque que empezó a las 8 p. m. sigue siendo "de hoy" a las 11, así que el
 * corte va por día y no por hora.
 *
 * ⚠️ **Esto se le pasa a PostgREST, que lo parsea como instante.** Para
 * comparar en TypeScript está `siguePorVenir`: dos cadenas ISO con husos
 * distintos no se pueden comparar como texto.
 *
 * Existe una copia de esto en `events.ts` y otra en `venues.ts`, las dos
 * anteriores a este archivo y marcadas como duplicadas a propósito. Lo nuevo
 * usa esta.
 */
export function inicioDeHoyEnBogota(): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  // Colombia es UTC-5 todo el año: no hay horario de verano que corregir.
  return `${partes}T00:00:00-05:00`;
}

/**
 * ¿Este toque todavía no ha pasado?
 *
 * ⚠️ **Compara instantes, nunca texto.** `starts_at` llega de la base con
 * huso `+00:00` y el corte del día se escribe con `-05:00`: comparadas como
 * cadenas, `"2026-10-13T01:00:00+00:00" >= "2026-09-09T00:00:00-05:00"`
 * responde sobre el orden de los caracteres y no sobre el orden de los
 * instantes. Es el mismo error de razonar sobre el texto ISO que este
 * proyecto ya cometió dos veces, con otra cara.
 *
 * El corte es el inicio del día en Bogotá, no "ahora": un show de las 8 p. m.
 * sigue estando por venir a las 9, para quien va saliendo.
 */
export function siguePorVenir(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() >= new Date(inicioDeHoyEnBogota()).getTime();
}
