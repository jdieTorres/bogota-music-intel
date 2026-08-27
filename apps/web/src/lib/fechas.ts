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

/** "8:00 p. m." — null si la fuente no publicó hora (solo fecha). */
export function horaDeEvento(iso: string | null, precision: string): string | null {
  if (!iso || precision !== "day") return null;
  const fecha = new Date(iso);
  // Las fuentes que solo publican fecha quedan a medianoche exacta; mostrar
  // "12:00 a. m." sería inventar una hora que nadie anunció.
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(fecha);
  if (partes === "00:00") return null;

  return new Intl.DateTimeFormat("es-CO", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(fecha);
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
