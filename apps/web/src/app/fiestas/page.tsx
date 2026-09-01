import type { Metadata } from "next";

import { Cartelera, EstadoVacio, SinConexion } from "@/components/Cartelera";
import { PestanasCartelera } from "@/components/PestanasCartelera";
import {
  type Evento,
  getFiestasProximas,
  getFiestasSinFecha,
  nombreDelVenue,
} from "@/lib/events";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Fiestas",
  description:
    "Las noches y ciclos de las salas de Bogotá: la escena local que no se anuncia con un artista de cartel.",
};

export default async function Page() {
  let crudos: Evento[];
  let sinFecha: Evento[];
  try {
    [crudos, sinFecha] = await Promise.all([
      getFiestasProximas(),
      getFiestasSinFecha(),
    ]);
  } catch (error) {
    console.error("Fallo al cargar las fiestas:", error);
    return <SinConexion />;
  }

  const proximas = crudos;
  const salas = new Set(proximas.map(nombreDelVenue));

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <section className="mb-8 sm:mb-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Fiestas y ciclos
        </h1>
        <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted">
          Las noches que programan las salas: sin artista de cartel, pero
          escena local igual que un toque.
        </p>
        {proximas.length > 0 && (
          <p className="mt-5 font-mono text-xs uppercase tracking-widest text-muted">
            {proximas.length} {proximas.length === 1 ? "fiesta" : "fiestas"} ·{" "}
            {salas.size} {salas.size === 1 ? "sala" : "salas"}
          </p>
        )}
      </section>

      <PestanasCartelera activa="fiestas" />

      <Cartelera
        proximos={proximas}
        sinFecha={sinFecha}
        vacio={
          <EstadoVacio
            titulo="Todavía no hay fiestas en cartelera"
            detalle={
              // Es un estado esperable, no un error: una fiesta se reconoce
              // por su nombre de ciclo y esa lista se cura a mano, así que
              // arranca corta y crece. Eso se explica acá y no en pantalla:
              // al lector el nombre de un archivo nuestro no le dice nada.
              "Las noches y ciclos de las salas van y vienen. Cuando alguna anuncie la próxima, aparece acá."
            }
          />
        }
      />
    </div>
  );
}
