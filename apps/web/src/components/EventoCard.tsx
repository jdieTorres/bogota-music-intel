import Image from "next/image";
import Link from "next/link";

import { IconNota } from "@/components/icons";
import { type Evento, nombreDelVenue } from "@/lib/events";
import { horaDeEvento } from "@/lib/fechas";

export function EventoCard({ evento }: { evento: Evento }) {
  const hora = horaDeEvento(evento.starts_at, evento.date_precision);
  const venue = nombreDelVenue(evento);

  return (
    <li>
      <Link
        href={`/evento/${evento.id}`}
        className="group flex gap-4 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent/60 hover:bg-surface-hover sm:gap-5 sm:p-4"
      >
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-background sm:h-24 sm:w-24">
          {evento.image_url ? (
            <Image
              src={evento.image_url}
              alt=""
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted">
              <IconNota className="h-7 w-7" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <h3 className="text-balance font-medium leading-snug transition-colors group-hover:text-accent">
            {evento.title}
          </h3>
          <p className="truncate text-sm text-muted">{venue}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {hora && <span className="font-mono">{hora}</span>}
            {evento.price_text && <span>{evento.price_text}</span>}
            {evento.category && (
              <span className="rounded-full border border-border px-2 py-0.5">
                {evento.category}
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}
