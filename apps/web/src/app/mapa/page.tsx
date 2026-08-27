import type { Metadata } from "next";
import Link from "next/link";

import { MapaEscena } from "@/components/MapaEscena";
import { type EscenaEnMapa, getEscena } from "@/lib/venues";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Mapa de la escena",
  description:
    "Dónde está sonando Bogotá: las salas con programación activa, ubicadas en el mapa.",
};

export default async function Page() {
  let escena: EscenaEnMapa;
  try {
    escena = await getEscena();
  } catch (error) {
    console.error("Fallo al cargar el mapa:", error);
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          El mapa no está disponible
        </h1>
        <p className="mt-3 text-muted">
          No pudimos conectarnos a la base de datos. Recargá en unos segundos.
        </p>
      </div>
    );
  }

  const { salas, sinUbicar } = escena;
  const totalEventos = [...salas, ...sinUbicar].reduce(
    (suma, sala) =>
      suma + ("eventos" in sala ? sala.eventos.length : sala.cantidadEventos),
    0,
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Dónde está sonando la ciudad
        </h1>
        <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted">
          Las salas con programación activa, ubicadas en el mapa. Tocá un punto
          para ver qué viene.
        </p>
        {salas.length > 0 && (
          <p className="mt-5 font-mono text-xs uppercase tracking-widest text-muted">
            {salas.length} {salas.length === 1 ? "sala" : "salas"} en el mapa ·{" "}
            {totalEventos} {totalEventos === 1 ? "evento" : "eventos"}
          </p>
        )}
      </header>

      {salas.length > 0 ? (
        <MapaEscena salas={salas} />
      ) : (
        <div className="rounded-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="font-medium">Todavía no hay salas ubicadas</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Las coordenadas se asignan aparte del scraping. Corré{" "}
            <code className="font-mono text-xs">
              python -m bogota_music_intel.geocode_cli
            </code>{" "}
            para ubicarlas.
          </p>
        </div>
      )}

      {sinUbicar.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium">Salas sin ubicar</h2>
          <p className="mt-1 text-xs text-muted">
            Tienen programación, pero todavía no les asignamos coordenadas.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {sinUbicar.map((sala) => (
              <li
                key={sala.slug}
                className="rounded-full border border-border bg-surface px-3 py-1 text-xs"
              >
                {sala.name}{" "}
                <span className="text-muted">({sala.cantidadEventos})</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 border-t border-border pt-5 text-xs text-muted">
        <Link
          href="/"
          className="underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Ver la cartelera completa
        </Link>
      </p>
    </div>
  );
}
