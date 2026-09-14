/**
 * Las notas de contratapa con formato: qué se permite y cómo se lee en plano.
 *
 * **Las notas son el único texto del sitio que no salió de otra parte**, y
 * desde el 2026-09-13 se escriben con una barra de formato en `/admin`. Lo
 * que se guarda es HTML, y este módulo decide **qué HTML**.
 *
 * ⚠️ **La lista blanca no es el control de acceso.** Quien escribe acá ya
 * pasó por RLS: sin estar en `admins` la base no acepta la escritura. La
 * lista está para otra cosa —para que pegar desde un correo o un documento no
 * arrastre fuentes, colores y tamaños que rompan la tipografía del sitio— y
 * de paso deja fuera lo que nunca debería llegar a una página.
 *
 * Lo pegado se limpia **al escribir** (`limpiarHtml`, que necesita el
 * navegador). Lo de acá es criterio puro y por eso se prueba sin credenciales
 * y corre igual en el servidor, donde lo usa la tarjeta de compartir.
 */

/** Lo que la barra produce, y nada más. */
export const ETIQUETAS_PERMITIDAS = new Set([
  "P",
  "BR",
  "STRONG",
  "B",
  "EM",
  "I",
  "U",
  "S",
  "UL",
  "OL",
  "LI",
  "A",
]);

/** Un enlace que se puede seguir sin sorpresas. */
export function enlaceSeguro(href: string): boolean {
  return /^https?:\/\//i.test(href.trim());
}

/**
 * De todo el `style` de un elemento, solo sobrevive la alineación.
 *
 * Es lo único que la barra escribe como estilo —`execCommand("justifyCenter")`
 * y compañía— y lo único que no rompe la identidad visual de la página.
 */
export function estiloPermitido(style: string): string | null {
  const alineacion = /(?:^|;)\s*text-align\s*:\s*(left|right|center|justify)\s*(?:;|$)/i.exec(
    style,
  );
  return alineacion ? `text-align: ${alineacion[1].toLowerCase()}` : null;
}

/**
 * ¿Esto lo escribió el editor, o es una nota de antes?
 *
 * Las notas anteriores al editor son texto plano con saltos de línea, y se
 * siguen pintando así. Pasarlas por el pintor de HTML las dejaría en un solo
 * bloque, sin los párrafos que quien las escribió sí puso.
 */
export function esHtml(texto: string): boolean {
  return /<(p|br|strong|b|em|i|u|s|ul|ol|li|a)\b[^>]*>/i.test(texto);
}

const ENTIDADES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/**
 * El texto sin marcas, para donde no se puede pintar HTML.
 *
 * Lo pide la tarjeta de compartir: un `<strong>` colado en el `og:description`
 * sale como texto literal en el chat de quien recibe el enlace.
 *
 * No usa el navegador a propósito —corre en el servidor, armando metadatos—
 * así que quita las etiquetas con una pasada de texto. Para resumir alcanza;
 * **para pintar no**, y por eso esto no es un sanitizador.
 */
export function aTextoPlano(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTIDADES[e.toLowerCase()] ?? e)
    .replace(/\s+/g, " ")
    .trim();
}
