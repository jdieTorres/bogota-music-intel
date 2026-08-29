import type { Metadata } from "next";

import { SinConexion } from "@/components/Cartelera";
import { TendenciaCard } from "@/components/TendenciaCard";
import { getTendencias, porFuente } from "@/lib/trending";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Tendencias",
  description: "Qué se escucha en Colombia, según Last.fm.",
};

export default async function Page() {
  let artistas: Awaited<ReturnType<typeof getTendencias>>;
  try {
    artistas = await getTendencias();
  } catch (error) {
    console.error("Fallo al cargar el radar de tendencias:", error);
    return <SinConexion />;
  }

  const { lastfm_geo: masEscuchados } = porFuente(artistas);

  if (masEscuchados.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
        <div className="rounded-lg border border-dashed border-border px-6 py-16 text-center">
          <p className="font-medium">Todavía no hay datos del radar</p>
          <p className="mt-2 text-sm text-muted">
            Corré <code>python -m bogota_music_intel.radar_cli</code> para
            traer la primera foto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
      <section className="mb-8 sm:mb-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Radar de tendencias
        </h1>
        <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted">
          Lo más escuchado en Colombia, según Last.fm — oyentes reales por
          país, no un chart editorial.
        </p>
        <p className="mt-3 max-w-2xl text-pretty text-xs text-muted">
          El otro eje planeado —qué ES música colombiana, según la
          editorial de Deezer— está pausado: esa API responde distinto
          según el país de quien pregunta, y desde el servidor que corre la
          ingesta no devuelve lo que promete. Vuelve cuando haya una forma
          confiable de traerlo.
        </p>
      </section>

      <ul className="space-y-2">
        {masEscuchados.map((artista) => (
          <TendenciaCard
            key={`${artista.source}-${artista.rank}`}
            artista={artista}
          />
        ))}
      </ul>
    </div>
  );
}
