import type { Metadata } from "next";

import { Cartelera, EstadoVacio, SinConexion } from "@/components/Cartelera";
import { PestanasCartelera } from "@/components/PestanasCartelera";
import {
  type Evento,
  getFestivalesProximos,
  getFestivalesSinFecha,
  nombreDelVenue,
} from "@/lib/events";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Festivales",
  description:
    "Los festivales de Bogotá: varios días y decenas de artistas, sin uno solo de cartel.",
};

export default async function Page() {
  let proximos: Evento[];
  let sinFecha: Evento[];
  try {
    [proximos, sinFecha] = await Promise.all([
      getFestivalesProximos(),
      getFestivalesSinFecha(),
    ]);
  } catch (error) {
    console.error("Fallo al cargar los festivales:", error);
    return <SinConexion />;
  }

  const salas = new Set(proximos.map(nombreDelVenue));

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <section className="mb-8 sm:mb-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Festivales
        </h1>
        <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted">
          Varios días y decenas de artistas, sin uno solo de cartel. Los
          gratuitos del Distrito —los &ldquo;al Parque&rdquo;— son de los pocos
          escenarios grandes donde la escena local toca en igualdad de
          condiciones.
        </p>
        {proximos.length > 0 && (
          <p className="mt-5 font-mono text-xs uppercase tracking-widest text-muted">
            {proximos.length} {proximos.length === 1 ? "festival" : "festivales"} ·{" "}
            {salas.size} {salas.size === 1 ? "escenario" : "escenarios"}
          </p>
        )}
      </section>

      <PestanasCartelera activa="festivales" />

      <Cartelera
        proximos={proximos}
        sinFecha={sinFecha}
        vacio={
          <EstadoVacio
            titulo="Todavía no hay festivales en cartelera"
            detalle={
              // Es un estado esperable, no un error, y el texto se lo dice al
              // lector sin explicarle cómo está hecho el sistema: cómo se
              // reconoce un festival por dentro no es asunto suyo. La nota
              // para quien mantiene esto va en el código, que es acá.
              "Bogotá los tiene repartidos por el año: los “al Parque” del Distrito, el Cordillera. Cuando se acerque el próximo, aparece acá."
            }
          />
        }
      />
    </div>
  );
}
