import type { Metadata } from "next";

import { Cartelera, EstadoVacio, SinConexion } from "@/components/Cartelera";
import { EncabezadoDePagina } from "@/components/EncabezadoDePagina";
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
    // `max-w-5xl`: el riel de fechas ocupa 7rem de la izquierda, así que la
    // columna de toques queda en una medida de lectura sana aunque el
    // contenedor sea ancho. Con `max-w-3xl` el riel se comía un tercio.
    <div className="mx-auto max-w-5xl px-5 pb-16">
      <EncabezadoDePagina
        titulo="Festivales"
        bajada={
          "Varios días y decenas de artistas, sin uno solo de cartel. Los gratuitos del Distrito, los “al Parque”, son de los pocos escenarios grandes donde la escena local toca en igualdad de condiciones."
        }
      />

      <PestanasCartelera
        activa="festivales"
        conteo={
          proximos.length > 0
            ? `${proximos.length} ${proximos.length === 1 ? "festival" : "festivales"} en ${salas.size} ${salas.size === 1 ? "escenario" : "escenarios"}`
            : undefined
        }
      />

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
