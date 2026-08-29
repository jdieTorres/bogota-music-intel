import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getEvento, nombreDelVenue } from "@/lib/events";
import { fechaLarga, horaDeEvento } from "@/lib/fechas";
import { tituloParaMostrar } from "@/lib/tituloEvento";

export const revalidate = 1800;

export async function generateMetadata(
  props: PageProps<"/evento/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const evento = await getEvento(id);
  if (!evento) return { title: "Evento no encontrado" };

  const titulo = tituloParaMostrar(evento);
  return {
    title: titulo,
    description: evento.description ?? `${titulo} en ${nombreDelVenue(evento)}, Bogotá.`,
  };
}

export default async function Page(props: PageProps<"/evento/[id]">) {
  const { id } = await props.params;
  const evento = await getEvento(id);
  if (!evento) notFound();

  const hora = horaDeEvento(evento.starts_at, evento.date_precision);
  const venue = nombreDelVenue(evento);

  return (
    <article className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
      <Link
        href="/"
        className="font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-foreground"
      >
        ← Cartelera
      </Link>

      <header className="mt-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {tituloParaMostrar(evento)}
        </h1>
        <p className="mt-3 text-lg text-muted">{venue}</p>
      </header>

      {evento.image_url && (
        <div className="relative mt-8 aspect-[3/2] w-full overflow-hidden rounded-lg bg-surface">
          <Image
            src={evento.image_url}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-contain"
            priority
          />
        </div>
      )}

      <dl className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
        <Dato etiqueta="Fecha">
          {evento.starts_at ? (
            <span className="inline-block first-letter:uppercase">
              {fechaLarga(evento.starts_at)}
            </span>
          ) : (
            "Por confirmar"
          )}
        </Dato>
        <Dato etiqueta="Hora">{hora ?? "Por confirmar"}</Dato>
        <Dato etiqueta="Lugar">{venue}</Dato>
        <Dato etiqueta="Precio">{evento.price_text ?? "Sin publicar"}</Dato>
        {evento.category && <Dato etiqueta="Género">{evento.category}</Dato>}
      </dl>

      {evento.description && (
        <p className="mt-8 text-pretty leading-relaxed text-muted">
          {evento.description}
        </p>
      )}

      {evento.ticket_url && (
        <a
          href={evento.ticket_url}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-3 font-medium text-background transition-opacity hover:opacity-90"
        >
          Ver boletería ↗
        </a>
      )}

      <p className="mt-10 border-t border-border pt-5 text-xs leading-relaxed text-muted">
        Datos recogidos de{" "}
        <a
          href={evento.source_url}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-4 transition-colors hover:text-foreground"
        >
          la cartelera oficial de la sala
        </a>
        . Confirmá los detalles ahí antes de comprar: la programación puede
        cambiar después de la última actualización.
      </p>
    </article>
  );
}

function Dato({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface px-4 py-3">
      <dt className="font-mono text-[11px] uppercase tracking-widest text-muted">
        {etiqueta}
      </dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}
