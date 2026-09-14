import type { Metadata } from "next";

/**
 * Quién es el sitio cuando alguien pega un enlace en un chat, y de dónde
 * cuelgan las direcciones absolutas que piden WhatsApp, Google y compañía.
 *
 * Vive aparte del layout porque lo usan tres cosas distintas que no se ven
 * entre sí: los metadatos de cada página, `robots.ts` y `sitemap.ts`.
 */

export const NOMBRE_DEL_SITIO = "Cartelera de Bogotá";

export const DESCRIPCION_DEL_SITIO =
  "Los toques de la escena bogotana en un solo lugar, recogidos directamente de las carteleras de cada sala.";

/**
 * La URL pública, en orden de quién manda:
 *
 *   1. `NEXT_PUBLIC_SITIO_URL` — lo que se configure en Vercel. Es la única
 *      que sigue siendo cierta el día que haya dominio propio.
 *   2. `VERCEL_PROJECT_PRODUCTION_URL` — el dominio de producción del
 *      proyecto, que la propia plataforma inyecta. Red de seguridad por si
 *      falta la anterior.
 *   3. localhost, que es donde corre esto cuando no hay ninguna de las dos.
 *
 * **No hay un dominio escrito a mano a propósito**: hasta que esto no esté
 * desplegado nadie sabe cuál es, y uno inventado sería peor que no tener
 * ninguno — las tarjetas de compartir saldrían apuntando a un sitio que no
 * existe, y el sitemap le daría a Google una lista de direcciones muertas.
 *
 * ⚠️ El punto 2 **no está comprobado desplegado**, que es el único lugar
 * donde se puede comprobar. Al desplegar, lo seguro es configurar el punto 1.
 */
export const SITIO_URL = new URL(
  process.env.NEXT_PUBLIC_SITIO_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
);

/** Una dirección de este sitio, absoluta. La piden `robots.ts` y `sitemap.ts`,
 *  que escriben archivos sueltos y no pasan por `metadataBase`. */
export const urlDelSitio = (ruta: string) => new URL(ruta, SITIO_URL).toString();

type MetadatosDePagina = {
  /** El título de la pestaña, sin el nombre del sitio: lo agrega la plantilla
   *  del layout. Se omite solo en la portada, que es el sitio entero. */
  titulo?: string;
  descripcion: string;
  /** La ruta de esta página, relativa: `metadataBase` la completa. */
  ruta: string;
  /** El afiche del evento o la foto del artista, que es lo que se ve en el
   *  chat. `null` cuando no hay: **una imagen de relleno diría que este
   *  evento tiene afiche y no lo tiene**. */
  imagen?: { url: string; alt: string } | null;
};

/**
 * Los metadatos de una página, incluidos los de compartir.
 *
 * ⚠️ **Existe por una trampa de Next: los metadatos se mezclan en un solo
 * nivel.** Una página que define `title` pero no `openGraph` **hereda entero
 * el `openGraph` del layout**, así que el enlace compartido saldría con el
 * título del sitio en vez del suyo — y en pantalla no se nota, porque la
 * pestaña del navegador sí muestra el título correcto. Por eso `title` y
 * `og:title` se escriben juntos, acá, y ninguna página arma su `openGraph`
 * a mano.
 *
 * `og:title` va **sin** el nombre del sitio aunque la pestaña sí lo lleve:
 * en la tarjeta del chat el nombre ya va por su lado (`og:site_name`), y
 * repetirlo come el ancho que necesita el nombre del toque.
 */
export function metadatosDePagina({
  titulo,
  descripcion,
  ruta,
  imagen,
}: MetadatosDePagina): Metadata {
  return {
    ...(titulo ? { title: titulo } : {}),
    description: descripcion,
    alternates: { canonical: ruta },
    openGraph: {
      type: "website",
      siteName: NOMBRE_DEL_SITIO,
      locale: "es_CO",
      url: ruta,
      title: titulo ?? NOMBRE_DEL_SITIO,
      description: descripcion,
      images: imagen ? [{ url: imagen.url, alt: imagen.alt }] : undefined,
    },
  };
}
