import type { Metadata } from "next";

import { SinConexion } from "@/components/Cartelera";
import { TendenciaCard } from "@/components/TendenciaCard";
import { getTendencias, porFuente } from "@/lib/trending";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Tendencias",
  description:
    "Qué es música colombiana y qué se escucha en Colombia, según Deezer y Last.fm.",
};

export default async function Page() {
  let artistas: Awaited<ReturnType<typeof getTendencias>>;
  try {
    artistas = await getTendencias();
  } catch (error) {
    console.error("Fallo al cargar el radar de tendencias:", error);
    return <SinConexion />;
  }

  const { deezer_editorial: musicaColombiana, lastfm_geo: masEscuchados } =
    porFuente(artistas);

  if (musicaColombiana.length === 0 && masEscuchados.length === 0) {
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
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <section className="mb-8 sm:mb-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Radar de tendencias
        </h1>
        <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted">
          Dos preguntas distintas, no una: qué ES música colombiana según
          Deezer, y qué se ESCUCHA en Colombia según Last.fm. La segunda
          suele estar dominada por lo internacional — es justamente el
          contraste que interesa.
        </p>
      </section>

      <div className="grid gap-10 sm:grid-cols-2">
        <section>
          <h2 className="mb-1 text-sm font-medium">Música colombiana</h2>
          <p className="mb-3 text-xs text-muted">
            Editorial de Deezer. Mezcla nacionalidades a propósito: un
            artista local marcado &ldquo;Local&rdquo; es dato verificado, no
            todo lo que aparece acá lo es.
          </p>
          <ul className="space-y-2">
            {musicaColombiana.map((artista) => (
              <TendenciaCard
                key={`${artista.source}-${artista.rank}`}
                artista={artista}
              />
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-1 text-sm font-medium">Lo más escuchado en Colombia</h2>
          <p className="mb-3 text-xs text-muted">
            Oyentes reales por país, según Last.fm.
          </p>
          <ul className="space-y-2">
            {masEscuchados.map((artista) => (
              <TendenciaCard
                key={`${artista.source}-${artista.rank}`}
                artista={artista}
              />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
