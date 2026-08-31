import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ControlesDeAdmin } from "@/components/ControlesDeAdmin";

import { type Evento, getEvento, nombreDelVenue } from "@/lib/events";
import { fechaLarga, horaDeEvento } from "@/lib/fechas";
import { tituloParaMostrar } from "@/lib/tituloEvento";

export const revalidate = 1800;

export async function generateMetadata(
  props: PageProps<"/evento/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const evento = await getEvento(id);
  if (!evento) return { title: "Evento no encontrado" };

  const titulo = tituloParaMostrar(evento, nombreDelVenue(evento));
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
  const titulo = tituloParaMostrar(evento, venue);

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
          {titulo}
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

      <Procedencia evento={evento} />

      <ControlesDeAdmin eventoId={evento.id} titulo={titulo} />
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

/**
 * De dónde salió lo que se está mostrando.
 *
 * No es un pie de página decorativo: es la diferencia entre "esto lo publica
 * la sala" y "esto lo verificamos nosotros". Un evento cargado a mano no
 * tiene cartelera oficial a la que remitir —por eso existe, justamente: los
 * toques que no se publican en ningún lado— así que afirmar que sí la tiene
 * sería exactamente el tipo de dato inventado que el proyecto no permite.
 *
 * Por lo mismo, "revisado a mano" solo se dice cuando `reviewed_at` existe.
 * Los 51 eventos de la mudanza inicial se publicaron sin que nadie los
 * mirara, y decir lo contrario sería la misma mentira en la otra dirección.
 */
function Procedencia({ evento }: { evento: Evento }) {
  const fuentes = evento.events ?? [];
  const revisado = evento.reviewed_at !== null;

  // El hostname y no el slug interno (`rockal_live`): al lector le sirve
  // saber que el dato salió de royalcenter.com.co, no cómo llamamos a esa
  // fuente en el código.
  const dominio = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  return (
    <p className="mt-10 border-t border-border pt-5 text-xs leading-relaxed text-muted">
      {fuentes.length === 0 ? (
        <>Evento verificado y cargado a mano{evento.evidence ? `: ${evento.evidence}` : ""}.</>
      ) : (
        <>
          Datos recogidos de{" "}
          {fuentes.map((fuente, i) => (
            <span key={fuente.source_url}>
              {i > 0 && " y de "}
              <a
                href={fuente.source_url}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4 transition-colors hover:text-foreground"
              >
                {fuentes.length > 1
                  ? dominio(fuente.source_url)
                  : "la cartelera oficial de la sala"}
              </a>
            </span>
          ))}
          {revisado ? ", y revisados a mano." : "."}
        </>
      )}{" "}
      Confirmá los detalles antes de comprar: la programación puede cambiar
      después de la última actualización.
    </p>
  );
}
