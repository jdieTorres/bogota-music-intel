/**
 * Cuánto vive en el CDN una página antes de volver a preguntarle a la base.
 *
 * ⚠️ **Las rutas NO importan esta constante, y no es un descuido.** Next lee
 * `export const revalidate` con análisis estático en tiempo de build, sin
 * ejecutar el módulo, así que exige un **literal**: escribir
 * `export const revalidate = REVALIDAR_SEGUNDOS` rompe el build entero con
 * «Invalid segment configuration export detected». Se intentó el 2026-09-16 y
 * por eso el número está repetido a mano en las ocho rutas.
 *
 * Su propia documentación lo dice, y es más estricto de lo que parece: «the
 * revalidate value needs to be statically analyzable. For example
 * `revalidate = 600` is valid, but `revalidate = 60 * 10` is not»
 * (`node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`).
 * Ni una multiplicación pasa.
 *
 * **Lo que sí impide que se desvíen es `cache.test.ts`**, que lee los ocho
 * archivos y falla si alguno dice otra cosa. Es la misma lección que dejó
 * `inicioDeHoyEnBogota()` copiada cuatro veces: el problema nunca fue repetir
 * un valor, sino que **nadie se entera cuando una copia se desvía**. Cuando la
 * plataforma obliga a duplicar, lo que hace falta es algo que avise.
 *
 * ⚠️ **Está en 60 a propósito, y es temporal** (2026-09-16). El caché existe
 * para que mil visitantes no sean mil consultas a Supabase; con el sitio recién
 * desplegado y sin tráfico no protege de nada y sí estorba: Juan publicó un
 * evento desde `/admin` y no salía en la cartelera porque el CDN seguía
 * sirviendo una copia anterior. Con media hora, publicar y comprobar dejan de
 * ser el mismo gesto.
 *
 * **Cuándo vuelve a subir**: el día que el sitio tenga visitantes de verdad.
 * Ahí el cálculo se invierte —el caché empieza a ahorrar consultas reales— y 60
 * segundos pasa a ser regenerar de más. Anotado en `ESTADO.md` con esa
 * condición para que no se lea como un descuido.
 *
 * ⚠️ **Bajarlo no elimina la espera del todo.** Cuando la copia caduca, Next
 * entrega igual la vencida a quien llega y regenera en paralelo, así que quien
 * recarga **después** es el primero que ve lo nuevo. Con 60 segundos eso deja
 * de importar; con 1800 era media hora de confusión.
 */
export const REVALIDAR_SEGUNDOS = 60;

/** Las rutas que declaran `revalidate`, para que el test las compruebe todas.
 *  Una ruta nueva que lo declare y no esté acá se escapa del chequeo — por eso
 *  el test también falla si encuentra alguna que falte en esta lista. */
export const RUTAS_CON_REVALIDATE = [
  "src/app/page.tsx",
  "src/app/fiestas/page.tsx",
  "src/app/festivales/page.tsx",
  "src/app/mapa/page.tsx",
  "src/app/directorio/page.tsx",
  "src/app/evento/[id]/page.tsx",
  "src/app/artista/[slug]/page.tsx",
  "src/app/sitemap.ts",
];
