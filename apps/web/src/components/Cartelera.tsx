import { EventoCard } from "@/components/EventoCard";
import { priorizarLocales } from "@/lib/editorial";
import { type Evento, agruparPorDia } from "@/lib/events";
import { esHoy, piezasDeDia } from "@/lib/fechas";

/**
 * El riel de fechas: la columna izquierda de cada día.
 *
 * Es el cambio de estructura del rediseño del 2026-09-07. Antes la fecha era
 * un encabezado gris pegajoso encima de una pila de tarjetas, del mismo peso
 * que el nombre de la sala. Pero la fecha es el eje sobre el que se lee una
 * cartelera —uno viene a ver qué hay el sábado, no a leer de arriba abajo— y
 * en columna se puede barrer con la vista sin leer nada.
 *
 * Es la estructura de una cartelera impresa, y es lo que separa esto de una
 * lista de resultados.
 */
function RielDeFecha({ dia }: { dia: string }) {
  const { diaSemana, numero, mes } = piezasDeDia(dia);
  const hoy = esHoy(dia);

  return (
    // `sticky` a partir de `md`: la fecha acompaña al día mientras se
    // recorren sus toques y se suelta al llegar al siguiente. En móvil no
    // hay columna, así que se muestra en línea arriba de la lista.
    <div className="md:sticky md:top-24 md:self-start">
      <div className="flex items-baseline gap-2 md:block">
        <span className="font-display text-4xl font-bold leading-none tracking-tight md:text-5xl">
          {numero}
        </span>
        <span className="font-display text-base font-semibold uppercase leading-none tracking-wide text-muted md:mt-1 md:block">
          {diaSemana} {mes}
        </span>
        {hoy && (
          // El sello sale una sola vez en toda la cartelera, así que no
          // alcanza a volverse un tic.
          <span className="rounded-full bg-accent px-2 py-0.5 font-hand text-base leading-tight text-background md:mt-2 md:inline-block">
            hoy
          </span>
        )}
      </div>
    </div>
  );
}

/** Un día: su riel de fecha y sus toques. */
function DiaDeCartelera({ dia, eventos }: { dia: string; eventos: Evento[] }) {
  return (
    <section className="grid gap-3 border-t border-border pt-6 md:grid-cols-[7rem_1fr] md:gap-8">
      <RielDeFecha dia={dia} />
      <ul>
        {/* Dentro del día, los toques locales van primero. En la pestaña de
            fiestas no cambia nada: ninguna afirma un origen, porque no hay un
            artista de cartel del cual afirmarlo. */}
        {priorizarLocales(eventos).map((evento) => (
          <EventoCard key={evento.id} evento={evento} />
        ))}
      </ul>
    </section>
  );
}

/**
 * El listado por día, compartido por las tres pestañas.
 *
 * Conciertos, fiestas y festivales se ven igual y se agrupan igual; lo único
 * que cambia es qué eventos llegan acá y qué decir cuando no hay ninguno.
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
    <div className="space-y-8">
      {[...porDia.entries()].map(([dia, eventos]) => (
        <DiaDeCartelera key={dia} dia={dia} eventos={eventos} />
      ))}

      {sinFecha.length > 0 && (
        <section className="grid gap-3 border-t border-border pt-6 md:grid-cols-[7rem_1fr] md:gap-8">
          <div className="md:sticky md:top-24 md:self-start">
            <p className="font-display text-base font-semibold uppercase leading-tight tracking-wide text-muted">
              Sin fecha
            </p>
            <p className="mt-1 text-xs text-muted">
              La sala los anunció sin fecha publicada.
            </p>
          </div>
          <ul>
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
    <div className="mx-auto max-w-3xl px-5 py-24">
      <h1 className="font-display text-3xl font-bold tracking-tight">
        La cartelera no está disponible
      </h1>
      <p className="mt-3 max-w-md text-pretty text-muted">
        No pudimos conectarnos a la base de datos. Si el proyecto estuvo varios
        días sin visitas, puede tardar unos segundos en despertar: recarga la
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
    <div className="border-t border-border py-16">
      <p className="font-display text-xl font-semibold tracking-tight">{titulo}</p>
      <p className="mt-2 max-w-md text-sm text-muted">{detalle}</p>
    </div>
  );
}
