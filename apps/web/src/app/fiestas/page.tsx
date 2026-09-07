import type { Metadata } from "next";

import { Cartelera, EstadoVacio, SinConexion } from "@/components/Cartelera";
import { EncabezadoDePagina } from "@/components/EncabezadoDePagina";
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
    // `max-w-5xl`: el riel de fechas ocupa 7rem de la izquierda, así que la
    // columna de toques queda en una medida de lectura sana aunque el
    // contenedor sea ancho. Con `max-w-3xl` el riel se comía un tercio.
    <div className="mx-auto max-w-5xl px-5 pb-16">
      <EncabezadoDePagina
        titulo="Fiestas y ciclos"
        bajada="Las noches que programan las salas: sin artista de cartel, pero escena local igual que un toque."
      />

      <PestanasCartelera
        activa="fiestas"
        conteo={
          proximas.length > 0
            ? `${proximas.length} ${proximas.length === 1 ? "fiesta" : "fiestas"} en ${salas.size} ${salas.size === 1 ? "sala" : "salas"}`
            : undefined
        }
      />

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
