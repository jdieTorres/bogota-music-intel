import Link from "next/link";

/**
 * Conciertos, fiestas y festivales, separados.
 *
 * Por qué una ruta por pestaña y no pestañas de JavaScript: la cartelera se
 * prerenderiza y se revalida cada 30 minutos. Meter la pestaña activa en un
 * `searchParams` volvería la ruta dinámica y perdería ese caché. Con una
 * ruta por pestaña las tres siguen siendo estáticas, cada una tiene su
 * propio enlace para compartir, y `<Link>` las precarga sola: se navega
 * igual de rápido que con una pestaña de verdad.
 *
 * Es un componente de servidor: la pestaña activa llega por prop desde la
 * página, así que no hace falta `usePathname` ni JavaScript en el cliente.
 */
export type Pestana = "conciertos" | "fiestas" | "festivales";

// El orden no es alfabético ni casual: va de lo más frecuente a lo más
// esporádico. Los conciertos son la cartelera de todas las semanas; las
// fiestas, de todos los fines de semana; los festivales, varios por año.
const PESTANAS: { id: Pestana; etiqueta: string; href: string }[] = [
  { id: "conciertos", etiqueta: "Conciertos", href: "/" },
  { id: "fiestas", etiqueta: "Fiestas", href: "/fiestas" },
  { id: "festivales", etiqueta: "Festivales", href: "/festivales" },
];

export function PestanasCartelera({ activa }: { activa: Pestana }) {
  return (
    <nav className="mb-8 flex gap-1 border-b border-border" aria-label="Tipo de evento">
      {PESTANAS.map(({ id, etiqueta, href }) => {
        const esActiva = id === activa;
        return (
          <Link
            key={id}
            href={href}
            aria-current={esActiva ? "page" : undefined}
            className={
              "-mb-px border-b-2 px-4 py-2 text-sm transition-colors " +
              (esActiva
                ? "border-accent font-medium text-foreground"
                : "border-transparent text-muted hover:text-foreground")
            }
          >
            {etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
