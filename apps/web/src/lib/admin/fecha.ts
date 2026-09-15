/**
 * La fecha y la hora de un evento, partidas en dos campos.
 *
 * **Por qué dos y no un `datetime-local`.** Un solo campo obliga a las dos
 * cosas: el navegador devuelve cadena vacía mientras falte cualquiera de las
 * dos mitades, así que escribir la fecha sin la hora no guardaba **nada** y
 * el evento quedaba sin fecha sin que nadie lo notara. Y eso choca de frente
 * con esta escena: un afiche casi siempre anuncia el día, y muy seguido no
 * anuncia la hora.
 *
 * Vive fuera de los componentes para poder probarse: acá no se importa React
 * ni Supabase.
 */

// Colombia es UTC-5 todo el año, sin horario de verano. Se convierte a mano y
// no con la zona del navegador: el admin podría estar en otro huso, y una
// hora corrida cinco horas es el error que este proyecto ya cometió dos veces.
const DESFASE_BOGOTA = "-05:00";
const DESFASE_MS = 5 * 60 * 60 * 1000;

/**
 * Parte un instante guardado en los dos campos, en hora de Bogotá.
 *
 * ⚠️ **La hora vuelve vacía cuando es medianoche**, y no es una pérdida: esa
 * medianoche *significa* "la fuente no publicó hora". Es la misma convención
 * que lee `tieneHoraPublicada` para que la cartelera no muestre "12:00 a. m.".
 * Devolverla como "00:00" haría que al guardar de nuevo pareciera una hora
 * que alguien escribió.
 */
export function aCamposDeFecha(iso: string | null) {
  if (!iso) return { fecha: "", hora: "" };
  const local = new Date(new Date(iso).getTime() - DESFASE_MS).toISOString();
  const hora = local.slice(11, 16);
  return { fecha: local.slice(0, 10), hora: hora === "00:00" ? "" : hora };
}

/**
 * Arma el instante a guardar.
 *
 * Sin fecha no hay evento fechado: devuelve null y el evento queda "sin
 * fecha", que la cartelera muestra en su propia sección. Con fecha y sin
 * hora usa medianoche de Bogotá, que es como el resto del sistema dice
 * "solo se sabe el día".
 */
export function desdeCamposDeFecha(fecha: string, hora: string): string | null {
  if (!fecha) return null;
  return `${fecha}T${hora || "00:00"}:00${DESFASE_BOGOTA}`;
}

/**
 * El año que le corresponde a un afiche que solo imprime día y mes.
 *
 * ⚠️ **Esto infiere un dato que la fuente no dijo, y es una excepción
 * deliberada** a la regla de no inventar. La pidió Juan el 2026-09-15 con un
 * argumento del oficio: los flyers de esta escena casi nunca imprimen el año
 * porque dan por hecho el que corre, y devolver `null` estaba perdiendo la
 * fecha entera de eventos cuyo día y mes sí se sabían. Un hueco honesto vale
 * más que un dato falso, pero acá el hueco costaba más que la inferencia — y
 * a diferencia del cron, esto pasa por sus ojos antes de publicarse.
 *
 * Lo que se conserva de la regla: **queda dicho en las notas del evento**, así
 * que nadie lee después una fecha completa creyendo que el afiche la traía.
 *
 * La regla: el año que deja la fecha en el futuro próximo. Un afiche anuncia
 * algo que va a pasar, así que "15 de enero" leído en septiembre es de enero
 * del año entrante, no de hace ocho meses.
 *
 * **Con siete días de gracia hacia atrás**, porque el otro caso real es
 * cargar el flyer del toque de anoche: sin ese margen, un afiche del sábado
 * cargado el lunes se guardaría con un año de más.
 */
const DIAS_DE_GRACIA = 7;

export function anioParaDiaYMes(mesDia: string, hoy = new Date()): number | null {
  const m = /^(\d{2})-(\d{2})$/.exec(mesDia);
  if (!m) return null;
  const mes = Number(m[1]);
  const dia = Number(m[2]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;

  // El "hoy" se lee en hora de Bogotá y no en la del navegador: el admin
  // podría estar en otro huso, y acá un día de diferencia cambia el año.
  const enBogota = new Date(hoy.getTime() - DESFASE_MS);
  const anio = enBogota.getUTCFullYear();

  const candidata = Date.UTC(anio, mes - 1, dia);
  const limite = Date.UTC(
    enBogota.getUTCFullYear(),
    enBogota.getUTCMonth(),
    enBogota.getUTCDate() - DIAS_DE_GRACIA,
  );

  return candidata >= limite ? anio : anio + 1;
}

/** "09-20" más el año inferido, listo para el campo de fecha. */
export function fechaConAnioInferido(
  mesDia: string,
  hoy = new Date(),
): string | null {
  const anio = anioParaDiaYMes(mesDia, hoy);
  if (anio === null) return null;
  return `${anio}-${mesDia}`;
}
