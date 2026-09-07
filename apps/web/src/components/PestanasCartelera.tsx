import Link from "next/link";

import {
  IconConcierto,
  IconFestival,
  IconFiesta,
} from "@/components/icons";

/**
 * La barra de sección: las tres pestañas a la izquierda, el conteo a la
 * derecha, un filete debajo.
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
 *
 * El conteo vive acá y no en el encabezado desde el rediseño del
 * 2026-09-07: suelto bajo la bajada era una línea de versalitas
 * monoespaciadas flotando sola, el adorno más genérico de la página. En el
 * extremo opuesto de las pestañas dice de qué tamaño es lo que se está
 * mirando, justo donde uno elige qué mirar.
 */
export type Pestana = "conciertos" | "fiestas" | "festivales";

// El orden no es alfabético ni casual: va de lo más frecuente a lo más
// esporádico. Los conciertos son la cartelera de todas las semanas; las
// fiestas, de todos los fines de semana; los festivales, varios por año.
const PESTANAS: {
  id: Pestana;
  etiqueta: string;
  href: string;
  Icono: (props: { className?: string }) => React.ReactElement;
}[] = [
  { id: "conciertos", etiqueta: "Conciertos", href: "/", Icono: IconConcierto },
  { id: "fiestas", etiqueta: "Fiestas", href: "/fiestas", Icono: IconFiesta },
  {
    id: "festivales",
    etiqueta: "Festivales",
    href: "/festivales",
    Icono: IconFestival,
  },
];

export function PestanasCartelera({
  activa,
  conteo,
}: {
  activa: Pestana;
  /** "36 conciertos en 10 salas". Se omite cuando no hay nada que contar. */
  conteo?: string;
}) {
  return (
    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 border-b border-border pb-3">
      {/* El ícono va acá y no en cada fila de la cartelera: dentro de una
          pestaña todos los eventos son del mismo tipo, así que repetirlo por
          fila no informaría nada. Donde sí decide es al elegir qué mirar. */}
      <nav className="flex gap-5 sm:gap-7" aria-label="Tipo de evento">
        {PESTANAS.map(({ id, etiqueta, href, Icono }) => {
          const esActiva = id === activa;
          return (
            <Link
              key={id}
              href={href}
              aria-current={esActiva ? "page" : undefined}
              className={
                "font-display text-lg font-semibold tracking-tight transition-colors " +
                (esActiva
                  ? "text-foreground"
                  : "text-muted hover:text-foreground")
              }
            >
              <span className="flex items-center gap-2">
                {/* La pestaña inactiva baja el ícono a media tinta para que
                    la fila no parezca tres botones del mismo peso. */}
                <Icono
                  className={
                    "h-5 w-5 shrink-0 transition-opacity " +
                    (esActiva ? "" : "opacity-55")
                  }
                />
                {etiqueta}
              </span>
              {/* El subrayado de la activa es un bloque de acento debajo de
                  la palabra y no un `border-b`: así el filete de la barra
                  sigue corrido y el acento se ve encima, no en vez de. */}
              {esActiva && <span className="mt-1 block h-0.5 bg-accent" />}
            </Link>
          );
        })}
      </nav>

      {conteo && (
        <p className="font-mono text-xs text-muted">{conteo}</p>
      )}
    </div>
  );
}
