/**
 * Qué le falta a un cambio de contraseña, y qué quiso decir Supabase cuando
 * lo rechaza.
 *
 * **Por qué existe esta pantalla.** Hasta el 2026-09-16 el único admin no
 * tenía forma de cambiar su contraseña: el sitio solo sabía `signInWithPassword`,
 * el dashboard de Supabase no deja escribir una nueva —solo mandar un correo—
 * y ese correo apuntaba a la `Site URL`, que seguía en `http://localhost:3000`.
 * Con un solo administrador eso es un punto de fallo: se descubrió intentando
 * usarlo.
 *
 * Mismo reparto que `validacion.ts`: **la garantía es el servidor y esto lo
 * traduce.** El largo mínimo y la lista de contraseñas filtradas los juzga
 * Supabase con su configuración; acá solo va lo que el servidor no puede
 * saber —que las dos copias coincidan— y la traducción de lo que responde.
 *
 * Criterio puro: sin Supabase, así que se prueba sin credenciales.
 */

export type FaltaDeClave = {
  /** El campo al que hay que llevar a quien está escribiendo. */
  campo: "clave" | "confirmacion";
  mensaje: string;
};

/**
 * Lo único que el servidor no puede comprobar.
 *
 * Supabase recibe **una** contraseña, así que un dedazo al escribirla se
 * guarda sin error y aparece después, al intentar entrar — y para entonces ya
 * no hay sesión con la que arreglarlo. La confirmación existe por eso, no por
 * costumbre.
 *
 * ⚠️ **El mínimo de caracteres no se replica acá.** Vive en la configuración
 * del proyecto y puede cambiar sin que nadie toque el repo; una copia local se
 * desincroniza y empieza a rechazar contraseñas que el servidor aceptaría.
 */
export function faltaParaCambiarClave(
  clave: string,
  confirmacion: string,
): FaltaDeClave | null {
  if (!clave.trim()) {
    return { campo: "clave", mensaje: "Escribe la contraseña nueva." };
  }
  if (clave !== confirmacion) {
    return {
      campo: "confirmacion",
      mensaje: "Las dos no coinciden. Escríbela otra vez igual.",
    };
  }
  return null;
}

/**
 * Lo que dijo Supabase, en español y sin jerga.
 *
 * ⚠️ **Lo que no reconoce se devuelve entero, nunca reemplazado por un "algo
 * salió mal".** Un mensaje raro en inglés es peor que uno en español y mucho
 * mejor que uno que esconde la causa: es la regla de no inventar un dato,
 * aplicada a los errores. Ante la duda, se muestra el hueco.
 */
export function mensajeDeSupabase(mensaje: string | undefined | null): string {
  const dicho = (mensaje ?? "").trim();
  if (!dicho) return "No se pudo cambiar la contraseña, y el servidor no dijo por qué.";

  // El aviso de la protección que Juan activó el 2026-09-16. Sin traducir
  // habla de "data breach" y parece que algo se hubiera roto, cuando es
  // justamente la protección haciendo su trabajo.
  if (/data breach|pwned|leaked/i.test(dicho)) {
    return (
      "Esa contraseña aparece en filtraciones conocidas, así que Supabase no la acepta. " +
      "Elige otra: no es que esté mal escrita."
    );
  }

  // Se conserva el número que diga el servidor en vez de escribir uno fijo:
  // el mínimo se configura en el panel y acá no se sabe cuál es.
  const largo = dicho.match(/at least (\d+) characters?/i);
  if (largo) return `La contraseña necesita al menos ${largo[1]} caracteres.`;

  if (/different from the old password/i.test(dicho)) {
    return "Esa es la contraseña que ya tenías. La nueva tiene que ser distinta.";
  }

  return dicho;
}
