import Link from "next/link";

/**
 * Conciertos y fiestas, separados.
 *
 * Por qué dos rutas y no dos pestañas de JavaScript: la cartelera se
 * prerenderiza y se revalida cada 30 minutos. Meter la pestaña activa en un
 * `searchParams` volvería la ruta dinámica y perdería ese caché. Con una
 * ruta por pestaña las dos siguen siendo estáticas, cada una tiene su
 * propio enlace para compartir, y `<Link>` las precarga sola: se navega
 * igual de rápido que con una pestaña de verdad.
 *
 * Es un componente de servidor: la pestaña activa llega por prop desde la
 * página, así que no hace falta `usePathname` ni JavaScript en el cliente.
 */
export type Pestana = "conciertos" | "fiestas";

const PESTANAS: { id: Pestana; etiqueta: string; href: string }[] = [
  { id: "conciertos", etiqueta: "Conciertos", href: "/" },
  { id: "fiestas", etiqueta: "Fiestas", href: "/fiestas" },
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
