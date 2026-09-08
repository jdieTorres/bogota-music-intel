import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChipBoleta } from "@/components/ChipBoleta";
import { ControlesDeAdmin } from "@/components/ControlesDeAdmin";
import { IconNota, IconoDeTipo } from "@/components/icons";

import { type Evento, getEvento, nombreDelVenue } from "@/lib/events";
import { fechaLarga, horaDeEvento } from "@/lib/fechas";

export const revalidate = 1800;

export async function generateMetadata(
  props: PageProps<"/evento/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const evento = await getEvento(id);
  if (!evento) return { title: "Evento no encontrado" };

  const titulo = evento.title;
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
  const titulo = evento.title;

  return (
    <article className="mx-auto max-w-5xl px-5 pb-16 pt-8">
      <Link
        href="/"
        className="text-sm text-muted transition-colors hover:text-foreground"
      >
        ← Volver a la cartelera
      </Link>

      {/* Dos columnas y no una pila: el afiche a lo ancho de la página dejaba
          dos bandas enormes arriba y abajo —los afiches llegan verticales— y
          empujaba todos los datos abajo del pliegue. Al lado, el afiche se ve
          entero y la ficha se lee de una. En móvil se apila. */}
      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,22rem)_1fr] md:gap-12">
        <div className="md:sticky md:top-8 md:self-start">
          {evento.image_url ? (
            // Sin fondo: los afiches llegan en proporciones distintas de
            // cada fuente, y una caja clara detrás de uno vertical se ve como
            // un recuadro roto en vez de como un afiche.
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm">
              <Image
                src={evento.image_url}
                alt=""
                fill
                sizes="(max-width: 768px) 100vw, 352px"
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center rounded-sm bg-surface text-muted">
              <IconNota className="h-12 w-12" />
            </div>
          )}

          {evento.ticket_url && (
            <a
              href={evento.ticket_url}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-sm bg-accent px-5 py-3 font-medium text-background transition-opacity hover:opacity-90"
            >
              Ver boletería ↗
            </a>
          )}
        </div>

        <div className="min-w-0">
          <header>
            {/* La marca de local no puede desaparecer al abrir el evento: es
                la señal que ordena toda la cartelera, y si solo vive en la
                fila parece un adorno del listado en vez de un dato del
                evento.

                ⚠️ Contra `true` a propósito: `is_local` tiene tres estados y
                un `null` es "todavía no lo sabemos", no "no es local". Ver el
                mismo comentario en `EventoCard`. */}
            {evento.is_local === true && (
              <p className="font-hand text-xl leading-none text-accent-3">
                de la escena local
              </p>
            )}
            {/* Acá el ícono sí lleva nombre para lectores de pantalla: la
                ficha no dice en ningún lado qué tipo de evento es —no hay
                pestaña activa que lo diga— así que el dibujo es la única
                señal, y una señal que solo existe en el dibujo deja fuera a
                quien no lo ve. */}
            <h1 className="mt-2 flex items-start gap-3 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              <IconoDeTipo
                tipo={evento.event_type}
                conNombre
                className="mt-1 h-7 w-7 shrink-0 sm:mt-1.5 sm:h-8 sm:w-8"
              />
              <span className="text-balance">{titulo}</span>
            </h1>
            <p className="mt-3 text-lg text-muted">
              {venue}
              {evento.genero && (
                <>
                  {" · "}
                  <span className="text-accent-2">{evento.genero}</span>
                </>
              )}
            </p>
          </header>

          <dl className="mt-8 border-t border-border">
            <Dato etiqueta="Fecha">
              {evento.starts_at ? (
                <span className="inline-block first-letter:uppercase">
                  {fechaLarga(evento.starts_at)}
                </span>
              ) : (
                <SinDato>La fuente no publicó fecha</SinDato>
              )}
            </Dato>
            <Dato etiqueta="Hora">
              {hora ?? <SinDato>La fuente no publicó hora</SinDato>}
            </Dato>
            <Dato etiqueta="Precio">
              {evento.precio ? (
                <ChipBoleta>{evento.precio}</ChipBoleta>
              ) : (
                <SinDato>La fuente no publicó precio</SinDato>
              )}
            </Dato>
          </dl>

          {evento.description && (
            <p className="mt-8 max-w-prose text-pretty leading-relaxed text-muted">
              {evento.description}
            </p>
          )}
        </div>
      </div>

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
    // Fila con filete, no celda con fondo. La rejilla de celdas tintadas
    // leía como un panel de administración; una ficha de datos se lee mejor
    // como una lista de dos columnas.
    <div className="flex items-baseline gap-4 border-b border-border py-2.5">
      <dt className="w-20 shrink-0 text-sm text-muted">{etiqueta}</dt>
      <dd className="min-w-0 flex-1 text-sm">{children}</dd>
    </div>
  );
}

/**
 * El hueco, dicho en voz alta.
 *
 * "Por confirmar" y "Sin publicar" sonaban a que el dato existe y está en
 * camino. La mayoría de las veces no: la sala nunca lo publicó, y decir
 * quién no lo publicó es más honesto y además le dice al lector dónde
 * buscarlo. Es la misma regla que impide mostrar "12:00 a. m." cuando la
 * fuente solo dio la fecha.
 *
 * Va en cursiva y con el gris completo, no atenuado: `text-muted/70` daba
 * 2.99 de contraste sobre el papel y esto es texto de cuerpo, que necesita
 * 4.5. La cursiva es la que hace la diferencia con un dato real, no el
 * desvanecido.
 */
function SinDato({ children }: { children: React.ReactNode }) {
  return <span className="text-muted italic">{children}</span>;
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
