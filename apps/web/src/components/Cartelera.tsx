import { EventoCard } from "@/components/EventoCard";
import { priorizarLocales } from "@/lib/editorial";
import { type Evento, agruparPorDia } from "@/lib/events";
import { esHoy, tituloDeDia } from "@/lib/fechas";

/**
 * El listado por día, compartido por las dos pestañas.
 *
 * Conciertos y fiestas se ven igual y se agrupan igual; lo único que cambia
 * es qué eventos llegan acá y qué decir cuando no hay ninguno.
 */
export function Cartelera({
  proximos,
  sinFecha,
  vacio,
}: {
  proximos: Evento[];
  sinFecha: Evento[];
  vacio: React.ReactNode;
}) {
  const porDia = agruparPorDia(proximos);

  if (porDia.size === 0 && sinFecha.length === 0) return <>{vacio}</>;

  return (
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
            {/* Dentro del día, los toques locales van primero. En la
                pestaña de fiestas no cambia nada: ninguna afirma un origen,
                porque no hay un artista de cartel del cual afirmarlo. */}
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
  );
}

export function SinConexion() {
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

export function EstadoVacio({
  titulo,
  detalle,
}: {
  titulo: string;
  detalle: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border px-6 py-16 text-center">
      <p className="font-medium">{titulo}</p>
      <p className="mt-2 text-sm text-muted">{detalle}</p>
    </div>
  );
}
