import type { MetadataRoute } from "next";

import { getArtistasPublicados } from "@/lib/artists";
import { getEnCartelera, getEnCarteleraSinFecha } from "@/lib/events";
import { urlDelSitio } from "@/lib/sitio";

// Mismo medio hora que las páginas: el cron corre una vez al día, y un
// sitemap que se rearma en cada visita haría cuatro consultas por robot.
export const revalidate = 60;

/** Las cinco públicas. `/admin` no entra: no es para lectores. */
const RUTAS_FIJAS = ["/", "/fiestas", "/festivales", "/mapa", "/directorio"];

/**
 * El mapa del sitio para los buscadores.
 *
 * **Solo lo que hoy está en cartelera, no todo lo publicado.** Un toque que
 * ya pasó conserva su ficha —quien tenga el enlace la sigue abriendo— pero
 * ofrecérsela a Google sería pedirle que indexe una lista que crece para
 * siempre con páginas que ya no le sirven a nadie. La lista se poda sola:
 * sale de las mismas consultas que arma la cartelera.
 *
 * **No lleva `lastModified`.** La base no guarda cuándo se tocó por última
 * vez cada ficha, y `starts_at` es la fecha del show, no la de la edición:
 * ponerla ahí sería inventar un dato que el buscador se cree.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fijas = RUTAS_FIJAS.map((ruta) => ({ url: urlDelSitio(ruta) }));

  try {
    const [proximos, sinFecha, artistas] = await Promise.all([
      getEnCartelera(),
      getEnCarteleraSinFecha(),
      getArtistasPublicados(),
    ]);

    return [
      ...fijas,
      ...[...proximos, ...sinFecha].map((evento) => ({
        url: urlDelSitio(`/evento/${evento.id}`),
      })),
      ...artistas.map((artista) => ({
        url: urlDelSitio(`/artista/${artista.slug}`),
      })),
    ];
  } catch (error) {
    // El free tier de Supabase pausa el proyecto tras una semana sin uso, y
    // el CI construye contra credenciales de relleno. En los dos casos vale
    // más un sitemap con las cinco fijas que un build caído.
    console.error("Fallo al armar el sitemap:", error);
    return fijas;
  }
}
