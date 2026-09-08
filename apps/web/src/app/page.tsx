import { Cartelera, EstadoVacio, SinConexion } from "@/components/Cartelera";
import { EncabezadoDePagina } from "@/components/EncabezadoDePagina";
import { PestanasCartelera } from "@/components/PestanasCartelera";
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

  // Ya vienen deduplicados: el evento canónico es la unidad publicada, y
  // quién se une a quién lo decidió una persona en la cola de revisión.
  const proximos = crudos;
  const salas = new Set(proximos.map(nombreDelVenue));

  return (
    // `max-w-5xl`: el riel de fechas ocupa 7rem de la izquierda, así que la
    // columna de toques queda en una medida de lectura sana aunque el
    // contenedor sea ancho. Con `max-w-3xl` el riel se comía un tercio.
    <div className="mx-auto max-w-5xl px-5 pb-16">
      <EncabezadoDePagina
        titulo="Qué suena en Bogotá"
        bajada="Los toques de las salas de la ciudad, recogidos directamente de la cartelera de cada una."
      />

      <PestanasCartelera
        activa="toques"
        conteo={
          proximos.length > 0
            ? `${proximos.length} ${proximos.length === 1 ? "toque" : "toques"} en ${salas.size} ${salas.size === 1 ? "sala" : "salas"}`
            : undefined
        }
      />

      <Cartelera
        proximos={proximos}
        sinFecha={sinFecha}
        vacio={
          <EstadoVacio
            titulo="No hay toques en cartelera"
            detalle="El recolector corre todos los días a las 9:00 a. m. Si acabás de montar el proyecto, corré el scraper para poblar la base."
          />
        }
      />
    </div>
  );
}
