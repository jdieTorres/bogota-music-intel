import Link from "next/link";

/**
 * El 404 del sitio entero.
 *
 * ⚠️ **No es solo de eventos.** Atiende igual a `/evento/<id>` y a
 * `/artista/<slug>` que no existen —los dos llaman a `notFound()`— y a
 * cualquier dirección inventada. Hasta el 2026-09-15 decía "No encontramos
 * ese evento", así que a quien llegaba por un enlace viejo de un artista le
 * hablaba de otra cosa.
 *
 * El texto nombra las dos causas reales y no las inventa: un toque que ya
 * pasó y salió de la cartelera, o un enlace mal copiado. No promete que la
 * página vaya a aparecer.
 */
export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">404</p>
      {/* `font-display` como el resto de los títulos del sitio: era el único
          h1 que no lo llevaba. */}
      <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">
        No encontramos esa página
      </h1>
      <p className="mt-3 text-muted">
        Puede que el toque ya haya pasado y haya salido de la cartelera, o que el
        enlace venga incompleto.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-sm bg-accent px-5 py-3 font-medium text-background transition-opacity hover:opacity-90"
      >
        Ver la cartelera
      </Link>
    </div>
  );
}
