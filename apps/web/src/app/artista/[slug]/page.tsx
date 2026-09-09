import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Contraportada } from "@/components/directorio/Contraportada";
import type { TrackEnCola } from "@/components/rockola/Rockola";
import { type Artista, type ToqueDelArtista, getDirectorio } from "@/lib/artists";
import { recomendar } from "@/lib/directorio";
import { fechaLarga, siguePorVenir } from "@/lib/fechas";

export const revalidate = 1800;

export async function generateMetadata(
  props: PageProps<"/artista/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  try {
    const { artistas } = await getDirectorio();
    const artista = artistas.find((a) => a.slug === slug);
    if (!artista) return { title: "Artista no encontrado" };
    return {
      title: artista.nombre,
      description: artista.bio ?? `${artista.nombre} en el directorio de la escena de Bogotá.`,
    };
  } catch {
    return { title: "Artista" };
  }
}

export default async function Page(props: PageProps<"/artista/[slug]">) {
  const { slug } = await props.params;

  const { artistas, toques, senales } = await getDirectorio();
  const artista = artistas.find((a) => a.slug === slug);
  if (!artista) notFound();

  const susToques = toques.get(artista.id) ?? [];
  const senal = senales.get(slug);
  const recomendaciones = senal ? recomendar(senal, [...senales.values()]) : [];

  const tracks: TrackEnCola[] = artista.tracks.map((track) => ({
    ...track,
    artistaNombre: artista.nombre,
    artistaSlug: artista.slug,
  }));

  const proximos = susToques.filter((t) => siguePorVenir(t.startsAt));

  return (
    <div className="mx-auto max-w-5xl px-5 pb-16">
      <Cabecera artista={artista} generos={senal?.generos ?? []} salas={senal?.salas ?? []} />

      <Contraportada tracks={tracks} bandcampUrl={artista.bandcampUrl} />

      {/* Las notas de contratapa. Es lo que escribe Juan, y es el material
          propio del proyecto: lo que separa esto de agregar lo que otros ya
          publicaron. Sin bio, el bloque no existe — un párrafo de relleno
          sería peor que el silencio. */}
      {artista.bio && (
        <section className="border-t border-border py-8">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            Notas
          </h2>
          <p className="mt-3 max-w-2xl whitespace-pre-line text-pretty leading-relaxed">
            {artista.bio}
          </p>
        </section>
      )}

      <Agenda proximos={proximos} pasados={susToques.filter((t) => !proximos.includes(t))} />

      {recomendaciones.length > 0 && (
        <section className="border-t border-border py-8">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            Suenan cerca
          </h2>
          <ul className="-mx-3 mt-3">
            {recomendaciones.map((r) => (
              <li key={r.slug} className="border-t border-border first:border-t-0">
                <Link
                  href={`/artista/${r.slug}`}
                  className="group -mx-3 flex items-baseline justify-between gap-4 rounded-sm px-3 py-3.5 transition-colors hover:bg-surface-hover"
                >
                  <span className="min-w-0 truncate font-display font-semibold tracking-tight transition-colors group-hover:text-accent">
                    {r.nombre}
                  </span>
                  {/* ⚠️ La razón siempre va a la vista. Sin ella la pantalla
                      estaría afirmando un parecido que nadie midió: no hay
                      motor de similitud sonora acá, hay hechos de la
                      cartelera. */}
                  <span className="shrink-0 text-right text-xs text-muted">{r.razon}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** El bloque de identidad: foto, nombre, origen, géneros y enlaces. */
function Cabecera({
  artista,
  generos,
  salas,
}: {
  artista: Artista;
  generos: string[];
  salas: string[];
}) {
  const enlaces = Object.entries(artista.links);

  return (
    <section className="flex flex-col gap-6 pt-10 pb-8 sm:flex-row sm:items-end sm:gap-8 sm:pt-16">
      {artista.fotoUrl && (
        <div className="relative aspect-square w-32 shrink-0 overflow-hidden rounded-sm sm:w-40">
          <Image
            src={artista.fotoUrl}
            alt={artista.nombre}
            fill
            // La pega Juan a mano desde cualquier host, igual que las fotos de
            // sala: no pasa por el optimizador.
            unoptimized
            className="object-cover"
            sizes="160px"
          />
        </div>
      )}

      <div className="min-w-0">
        <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
          {artista.nombre}
        </h1>

        <RielDeDatos origen={artista.origen} generos={generos} salas={salas} />

        {enlaces.length > 0 && (
          <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {enlaces.map(([nombre, url]) => (
              <a
                key={nombre}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-accent underline underline-offset-4 transition-colors hover:text-foreground"
              >
                {nombre}
              </a>
            ))}
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * Dónde toca y dónde tocó.
 *
 * Es el cruce con la cartelera y con el mapa: el dato que ni AOTY ni RYM
 * pueden tener, porque sale de la programación de esta ciudad.
 */
function Agenda({
  proximos,
  pasados,
}: {
  proximos: ToqueDelArtista[];
  pasados: ToqueDelArtista[];
}) {
  if (!proximos.length && !pasados.length) return null;

  return (
    <section className="border-t border-border py-8">
      {proximos.length > 0 && (
        <>
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            Toca
          </h2>
          <ul className="-mx-3 mt-3">
            {proximos.map((toque) => (
              <li key={toque.eventoId} className="border-t border-border first:border-t-0">
                <Link
                  href={`/evento/${toque.eventoId}`}
                  className="group -mx-3 flex items-baseline justify-between gap-4 rounded-sm px-3 py-3.5 transition-colors hover:bg-surface-hover"
                >
                  <span className="min-w-0 truncate font-display font-semibold tracking-tight transition-colors group-hover:text-accent">
                    {toque.sala ?? toque.titulo}
                  </span>
                  {/* La fecha se compone en hora de Bogotá con el helper de
                      siempre. Sin fecha publicada no se escribe nada. */}
                  {toque.startsAt && (
                    <span className="shrink-0 font-mono text-xs text-muted">
                      {fechaLarga(toque.startsAt)}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {pasados.length > 0 && (
        <p className={"text-sm text-muted" + (proximos.length ? " mt-6" : "")}>
          Ha tocado en{" "}
          {[...new Set(pasados.map((t) => t.sala).filter(Boolean))].join(", ") || "la ciudad"}.
        </p>
      )}
    </section>
  );
}

/**
 * Los datos duros del artista, en pares rótulo–valor.
 *
 * La forma viene de cómo zig-zag.fm presenta la ficha de un track: un riel
 * corto de pastillas etiquetadas en vez de una frase con puntos medios. Se
 * escanea mejor, y sobre todo **cada dato dice qué es**: "Bogotá" solo puede
 * ser el origen o la sala, y en una lista de artistas de otras ciudades eso
 * importa.
 *
 * ⚠️ **Lo que no consta no aparece.** Acá se omite en vez de dejar el rótulo
 * vacío, al revés que en `/admin`: allá el hueco es una invitación a llenarlo
 * y quien mira es quien puede hacerlo; en la página pública sería una lista de
 * lo que al proyecto le falta, y eso no es información para el lector.
 */
function RielDeDatos({
  origen,
  generos,
  salas,
}: {
  origen: string | null;
  generos: string[];
  salas: string[];
}) {
  const hay = origen || generos.length || salas.length;
  if (!hay) return null;

  return (
    <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-4">
      {origen && <Dato rotulo="Origen">{[origen]}</Dato>}
      {generos.length > 0 && (
        <Dato rotulo="Suena a" acento>
          {generos}
        </Dato>
      )}
      {salas.length > 0 && <Dato rotulo="Toca en">{salas}</Dato>}
    </dl>
  );
}

function Dato({
  rotulo,
  children,
  acento = false,
}: {
  rotulo: string;
  children: string[];
  acento?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[11px] uppercase tracking-widest text-muted">{rotulo}</dt>
      <dd className="mt-1.5 flex flex-wrap gap-1.5">
        {children.map((valor) => (
          <span
            key={valor}
            className={
              "rounded-full border px-2.5 py-1 text-sm " +
              (acento ? "border-accent-2/40 text-accent-2" : "border-border text-foreground")
            }
          >
            {valor}
          </span>
        ))}
      </dd>
    </div>
  );
}
