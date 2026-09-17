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
function RielDeFecha({ dia, idTitulo }: { dia: string; idTitulo: string }) {
  const { diaSemana, numero, mes } = piezasDeDia(dia);
  const hoy = esHoy(dia);

  return (
    // `sticky` a partir de `md`: la fecha acompaña al día mientras se
    // recorren sus toques y se suelta al llegar al siguiente. En móvil no
    // hay columna, así que se muestra en línea arriba de la lista.
    <div className="md:sticky md:top-24 md:self-start">
      {/* Es un `h2` y no un `div` desde el 2026-09-15, y no se ve distinto:
          Tailwind ya deja los encabezados sin tamaño ni margen propios.
          El riel era la idea más propia de esta cartelera y **no existía en
          el árbol de encabezados** — la portada iba de un `h1` a veintiocho
          `h3` seguidos, así que para un lector de pantalla la agrupación por
          día simplemente no estaba. Lo que se barre con la vista tiene que
          poder barrerse también con el teclado. */}
      <h2 id={idTitulo} className="flex items-baseline gap-2 md:block">
        <span className="font-display text-4xl font-bold leading-none tracking-tight md:text-5xl">
          {numero}
        </span>
        <span className="font-display text-base font-semibold uppercase leading-none tracking-wide text-muted md:mt-1 md:block">
          {diaSemana} {mes}
        </span>
        {hoy && (
          // El sello sale una sola vez en toda la cartelera, así que no
          // alcanza a volverse un tic.
          <span className="rounded-full bg-accent px-2 py-0.5 font-etiqueta text-sm leading-tight text-background md:mt-2 md:inline-block">
            hoy
          </span>
        )}
      </h2>
    </div>
  );
}

/** Un día: su riel de fecha y sus toques. */
function DiaDeCartelera({ dia, eventos }: { dia: string; eventos: Evento[] }) {
  // Una `section` sin nombre accesible no se anuncia como región, así que el
  // `aria-labelledby` es lo que convierte el día en algo por donde saltar. El
  // `id` sirve además de ancla: `/#dia-2026-10-17` lleva a ese día.
  const idTitulo = `dia-${dia}`;

  return (
    // ⚠️ `minmax(0,1fr)` y no `1fr`, en los dos breakpoints. Una pista de
    // grid mide por defecto `auto`, y el mínimo de `auto` —igual que el de
    // `1fr`— es **el min-content de lo que lleva adentro**, no cero. El
    // renglón de sala y géneros va con `truncate`, o sea `nowrap`, así que su
    // min-content es la línea entera sin cortar: "Carrera 24 #72 - 31 ·
    // Midwest Emo · Math Rock · Screamo" mide 474 px y estiraba la columna a
    // 474 en una pantalla de 390. **La portada entera tenía scroll
    // horizontal por eso**, y se veía como si el diseño fuera más ancho que
    // el teléfono.
    //
    // Se confirmó midiendo, de dos maneras que tienen que dar lo mismo:
    // poniéndole `min-width: 0` a la lista, y quitándole el `nowrap` al
    // renglón. Las dos devolvieron el scroll a 390.
    <section
      aria-labelledby={idTitulo}
      className="grid grid-cols-[minmax(0,1fr)] gap-3 border-t border-border pt-6 md:grid-cols-[7rem_minmax(0,1fr)] md:gap-8"
    >
      <RielDeFecha dia={dia} idTitulo={idTitulo} />
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
        <section className="grid grid-cols-[minmax(0,1fr)] gap-3 border-t border-border pt-6 md:grid-cols-[7rem_minmax(0,1fr)] md:gap-8">
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
