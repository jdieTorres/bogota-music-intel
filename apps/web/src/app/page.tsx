import { Cartelera, EstadoVacio, SinConexion } from "@/components/Cartelera";
import { PestanasCartelera } from "@/components/PestanasCartelera";
import { unificarDuplicados } from "@/lib/dedupe";
import {
  type Evento,
  getEventosProximos,
  getEventosSinFecha,
  nombreDelVenue,
} from "@/lib/events";

// La cartelera se actualiza una vez al día vía GitHub Actions; media hora de
// caché mantiene la página rápida sin quedar desactualizada.
export const revalidate = 1800;

export default async function Page() {
  let crudos: Evento[];
  let sinFecha: Evento[];
  try {
    [crudos, sinFecha] = await Promise.all([
      getEventosProximos(),
      getEventosSinFecha(),
    ]);
  } catch (error) {
    // El free tier de Supabase pausa el proyecto tras una semana sin uso y
    // se reactiva con el primer request. Sin este catch, un build de Vercel
    // durante la pausa tumba el despliegue entero en vez de degradarse.
    console.error("Fallo al cargar la cartelera:", error);
    return <SinConexion />;
  }

  // La sala y el promotor publican el mismo show por separado.
  const proximos = unificarDuplicados(crudos);
  const salas = new Set(proximos.map(nombreDelVenue));

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <section className="mb-8 sm:mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Qué suena en Bogotá
        </h1>
        <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted">
          Conciertos de las salas de la ciudad, recogidos directamente de la
          cartelera de cada una.
        </p>
        {proximos.length > 0 && (
          <p className="mt-5 font-mono text-xs uppercase tracking-widest text-muted">
            {proximos.length} {proximos.length === 1 ? "concierto" : "conciertos"} ·{" "}
            {salas.size} {salas.size === 1 ? "sala" : "salas"}
          </p>
        )}
      </section>

      <PestanasCartelera activa="conciertos" />

      <Cartelera
        proximos={proximos}
        sinFecha={sinFecha}
        vacio={
          <EstadoVacio
            titulo="No hay conciertos en cartelera"
            detalle="El recolector corre todos los días a las 9:00 a. m. Si acabás de montar el proyecto, corré el scraper para poblar la base."
          />
        }
      />
    </div>
  );
}
