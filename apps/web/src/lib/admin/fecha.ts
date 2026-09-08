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
