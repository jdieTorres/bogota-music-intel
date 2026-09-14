import type { MetadataRoute } from "next";

import { urlDelSitio } from "@/lib/sitio";

/**
 * Qué puede recorrer un buscador.
 *
 * ⚠️ **`/admin` no está bloqueado acá, y es a propósito.** Para que una
 * página no salga en Google lo que sirve es que ella diga `noindex`
 * (`app/admin/layout.tsx`), y para leer eso el buscador tiene que poder
 * entrar. Bloquearla acá haría lo contrario de lo que se busca: el buscador
 * no entraría, no vería el `noindex`, y podría listar la dirección igual si
 * alguien la enlaza desde otro sitio.
 *
 * `/api/` sí se bloquea: ahí no hay nada que un lector pueda leer.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: urlDelSitio("/sitemap.xml"),
  };
}
