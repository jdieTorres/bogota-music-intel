import Image from "next/image";
import Link from "next/link";

import { ChipBoleta } from "@/components/ChipBoleta";
import { IconNota, IconoDeTipo } from "@/components/icons";
import { type Evento, nombreDelVenue } from "@/lib/events";
import { horaDeEvento } from "@/lib/fechas";

/**
 * Una entrada de la cartelera.
 *
 * ⚠️ `is_local` se compara contra `true` a propósito, no se evalúa la verdad
 * del valor. Tiene tres estados y solo uno es "sí": un `null` es "todavía no
 * lo sabemos", no "no es local". Marcar solo el `true` deja que la ausencia
 * de marca no afirme nada, que es la única lectura honesta mientras media
 * cola está sin resolver. El orden dentro del día ya distingue al `false`,
 * en `priorizarLocales`.
 */
export function EventoCard({ evento }: { evento: Evento }) {
  const hora = horaDeEvento(evento.starts_at, evento.date_precision);
  const venue = nombreDelVenue(evento);
  const esLocal = evento.is_local === true;

  return (
    // Fila con filete arriba, no tarjeta. La tarjeta con borde y esquinas
    // redondeadas hacía que cada toque leyera como un widget suelto; el
    // filete los lee como lo que son, entradas seguidas de una cartelera.
    // `scroll-mt-24` deja aire al llegar tabulando desde el riel de fechas.
    <li className="scroll-mt-24 border-t border-border first:border-t-0">
      <Link
        href={`/evento/${evento.id}`}
        className="group -mx-3 flex items-start gap-4 rounded-sm px-3 py-4 transition-colors hover:bg-surface-hover sm:gap-5"
      >
        {/* El afiche es el único activo visual que las fuentes publican de
            forma consistente: las fotos de sala no las publica ninguna.
            `object-contain` porque recortar por el centro se come el nombre
            del artista y la fecha, que es donde quien hizo el flyer puso la
            información, y los afiches llegan en proporciones distintas de
            cada fuente sin una que se pueda dar por buena. */}
        {/* Sin fondo cuando hay afiche: los afiches llegan en proporciones
            distintas de cada fuente, y una caja clara detrás de uno vertical
            se ve como un recuadro roto en vez de como un afiche. Sin fondo,
            el afiche se posa sobre el papel. El fondo se reserva para el
            hueco, que sí necesita ocupar un lugar. */}
        <div
          className={
            "relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-sm sm:w-20 " +
            (evento.image_url ? "" : "bg-surface")
          }
        >
          {evento.image_url ? (
            <Image
              src={evento.image_url}
              alt=""
              fill
              sizes="80px"
              className="object-contain"
            />
          ) : (
            // `text-muted/80` y no /50: como gráfico le corresponden 3:1 de
            // contraste y /50 daba 2.10 sobre el papel.
            <div className="flex h-full items-center justify-center text-muted/80">
              <IconNota className="h-6 w-6" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {/* El ícono de tipo, desde el 2026-09-08 y a pedido de Juan. Antes
              solo estaba en la pestaña, con el argumento de que dentro de una
              pestaña todos los eventos son del mismo tipo; sigue siendo
              cierto, y aun así el ícono acá hace un trabajo que la pestaña no
              hace: la fila se vuelve reconocible fuera de su lista —en la
              ficha, en el panel de una sala, al volver de otra pestaña— sin
              tener que leer nada.

              A 18px y sin nombre para lectores de pantalla: la pestaña activa
              ya lo dijo, y repetirlo en cada una de las filas es ruido. */}
          <h3 className="flex items-start gap-2 font-display text-lg font-semibold leading-tight tracking-tight transition-colors group-hover:text-accent sm:text-xl">
            <IconoDeTipo
              tipo={evento.event_type}
              className="mt-0.5 h-[18px] w-[18px] shrink-0 opacity-80"
            />
            <span className="text-pretty">{evento.title}</span>
          </h3>

          <p className="truncate text-sm text-muted">
            {venue}
            {evento.generos.map((genero) => (
              <span key={genero}>
                {" · "}
                <span className="text-accent-2">{genero}</span>
              </span>
            ))}
          </p>

          {esLocal && (
            // Manuscrito y no un chip más: la marca de escena local tiene que
            // leerse como algo anotado al margen, no como otra etiqueta de la
            // fila de datos. Es lo único en todo el sitio que usa el magenta.
            <p className="font-hand text-base leading-none text-accent-3">
              de la escena local
            </p>
          )}

          {/* En pantalla angosta no hay columna derecha, así que hora y
              precio vuelven acá. */}
          {(hora || evento.precio) && (
            <p className="mt-1 flex flex-wrap items-center gap-2 sm:hidden">
              {hora && <span className="font-mono text-xs text-muted">{hora}</span>}
              {evento.precio && <ChipBoleta>{evento.precio}</ChipBoleta>}
            </p>
          )}
        </div>

        {/* La columna derecha desaparece entera cuando faltan los dos datos,
            que hoy es la mayoría de los eventos publicados. Un hueco limpio
            dice la verdad; un guión o un "por confirmar" en cada fila haría
            ver rota una cartelera que no lo está. */}
        {(hora || evento.precio) && (
          <div className="hidden shrink-0 flex-col items-end gap-1.5 pt-0.5 text-right sm:flex">
            {hora && <span className="font-mono text-sm text-foreground">{hora}</span>}
            {evento.precio && <ChipBoleta>{evento.precio}</ChipBoleta>}
          </div>
        )}
      </Link>
    </li>
  );
}
