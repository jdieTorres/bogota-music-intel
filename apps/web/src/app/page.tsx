import { EventoCard } from "@/components/EventoCard";
import { unificarDuplicados } from "@/lib/dedupe";
import { priorizarLocales } from "@/lib/editorial";
import {
  type Evento,
  agruparPorDia,
  getEventosProximos,
  getEventosSinFecha,
  nombreDelVenue,
} from "@/lib/events";
import { esHoy, tituloDeDia } from "@/lib/fechas";

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
  const porDia = agruparPorDia(proximos);
  const salas = new Set(proximos.map(nombreDelVenue));

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <section className="mb-10 sm:mb-14">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Qué suena en Bogotá
        </h1>
        <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted">
          Conciertos y funciones de las salas de la ciudad, recogidos
          directamente de la cartelera de cada una.
        </p>
        {proximos.length > 0 && (
          <p className="mt-5 font-mono text-xs uppercase tracking-widest text-muted">
            {proximos.length} {proximos.length === 1 ? "evento" : "eventos"} ·{" "}
            {salas.size} {salas.size === 1 ? "sala" : "salas"}
          </p>
        )}
      </section>

      {porDia.size === 0 && sinFecha.length === 0 ? (
        <EstadoVacio />
      ) : (
        <div className="space-y-10">
          {[...porDia.entries()].map(([dia, eventos]) => (
            <section key={dia}>
              <h2 className="sticky top-0 z-10 -mx-5 mb-3 bg-background/90 px-5 py-2 text-sm font-medium backdrop-blur">
                {/* first-letter (y no `capitalize`, que capitaliza cada
                    palabra: "Jueves, 27 De Agosto"). Necesita inline-block
                    porque ::first-letter no aplica a elementos inline. */}
                <span className="inline-block first-letter:uppercase">
                  {tituloDeDia(dia)}
                </span>
                {esHoy(dia) && (
                  <span className="ml-2 rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-background">
                    Hoy
                  </span>
                )}
              </h2>
              <ul className="space-y-2">
                {/* Dentro del día, los toques locales van primero. */}
                {priorizarLocales(eventos).map((evento) => (
                  <EventoCard key={evento.id} evento={evento} />
                ))}
              </ul>
            </section>
          ))}

          {sinFecha.length > 0 && (
            <section>
              <h2 className="mb-1 text-sm font-medium">Fecha por confirmar</h2>
              <p className="mb-3 text-xs text-muted">
                La sala anunció estos eventos sin fecha publicada.
              </p>
              <ul className="space-y-2">
                {priorizarLocales(sinFecha).map((evento) => (
                  <EventoCard key={evento.id} evento={evento} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function SinConexion() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        La cartelera no está disponible
      </h1>
      <p className="mx-auto mt-3 max-w-md text-pretty text-muted">
        No pudimos conectarnos a la base de datos. Si el proyecto estuvo varios
        días sin visitas, puede tardar unos segundos en despertar: recargá la
        página.
      </p>
    </div>
  );
}

function EstadoVacio() {
  return (
    <div className="rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <p className="font-medium">No hay eventos en cartelera</p>
      <p className="mt-2 text-sm text-muted">
        El recolector corre todos los días a las 9:00 a. m. Si acabás de montar
        el proyecto, corré el scraper para poblar la base.
      </p>
    </div>
  );
}
