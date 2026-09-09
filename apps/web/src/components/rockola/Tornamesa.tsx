"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Disco } from "@/components/rockola/Disco";
import { Reproductor } from "@/components/rockola/reproductores";
import { useRockola } from "@/components/rockola/Rockola";
import { IconParar, IconPausa, IconPlay, IconSiguiente } from "@/components/icons";

/**
 * La bandeja: lo que suena, fijo abajo, en todas las páginas.
 *
 * **No es un mueble dibujado.** Nada de madera, cromo ni luces de neón: lo
 * que se emula de una rockola es cómo se comporta —se encola, la cola se ve,
 * el cambio de track es un relevo y no un corte—, no cómo se ve. El sistema
 * de forma es el mismo del resto del sitio: filete arriba, casi nada
 * redondeado, el verde en su 5%.
 *
 * **Solo existe cuando hay algo puesto.** Quien vino a mirar la cartelera no
 * carga con una barra vacía, y la rockola no cuesta un byte hasta el primer
 * play.
 */
export function Tornamesa() {
  const { cola, indice, actual, sonando, acuse, alternar, siguiente, parar } = useRockola();

  const barra = useRef<HTMLDivElement>(null);
  // El alto real de la bandeja, para reservarlo al final del documento.
  //
  // Se mide en vez de escribirse a mano porque cambia: el reproductor de
  // YouTube mide 200 px de alto por obligación y el de SoundCloud 166, y
  // encima el acuse aparece y desaparece. Un valor fijo taparía el pie de
  // página en la mitad de los casos, que es el bug clásico de las barras
  // fijas.
  const [alto, setAlto] = useState(0);

  useEffect(() => {
    const nodo = barra.current;
    if (!nodo) return;
    const observador = new ResizeObserver(([entrada]) => setAlto(entrada.contentRect.height));
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [actual]);

  if (!actual) return null;

  const porSonar = cola.slice(indice + 1);

  return (
    <>
      {/* Empuja el final del documento para que el pie no quede debajo de la
          bandeja. Solo existe mientras hay algo puesto. */}
      <div style={{ height: alto }} aria-hidden />

      <div
        ref={barra}
        // `entrar-bandeja`: sube desde abajo en vez de aparecer de golpe. Un
        // elemento que se materializa donde antes no había nada se lee como un
        // fallo de pintado; entrar por el borde dice de dónde viene y qué es.
        className="entrar-bandeja fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface"
      >
        {/* El acuse de la última acción. Va arriba del todo, en su propia
            franja, porque tiene que verse sin quitarle el sitio a nada: es lo
            que contesta "¿me oyó?" cuando se encola algo mientras suena otro. */}
        {acuse && (
          <p
            role="status"
            className="border-b border-border bg-surface-hover px-5 py-2 text-center font-mono text-xs text-muted"
          >
            {acuse}
          </p>
        )}

        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-5 px-5 py-4 sm:flex-nowrap sm:gap-7">
          {/* ⚠️ El reproductor va primero y sin nada encima. Sus políticas
              exigen que se vea con un lado mínimo y prohíben taparlo; los
              controles de acá van al lado, que sí está permitido. */}
          <Reproductor
            plataforma={actual.plataforma}
            idExterno={actual.idExterno}
            sonando={sonando}
            alTerminar={siguiente}
          />

          {/* En móvil todo esto baja a su propia línea: el reproductor ocupa
              356 px de ancho y en una pantalla de 390 no queda sitio al lado.
              Y adentro vuelve a partirse, porque disco + título + tres botones
              en 350 px dejaban al título en noventa píxeles. */}
          <div className="flex w-full min-w-0 flex-wrap items-center gap-4 sm:w-auto sm:flex-1 sm:flex-nowrap sm:gap-5">
            {/* El disco creció de 64 a 112: a 64 competía con los íconos por
                ser lo más pequeño de la barra, y es lo único que dice de un
                vistazo si hay algo sonando. */}
            <Disco track={actual} sonando={sonando} lado={112} className="hidden sm:block" />
            <Disco track={actual} sonando={sonando} lado={64} className="sm:hidden" />

            {/* El relevo: al cambiar de track el bloque entra de nuevo en vez
                de parpadear. La clave por id es lo que lo dispara. */}
            <div key={actual.id} className="relevo min-w-0 flex-1 basis-40">
              <p className="truncate font-display text-lg font-bold leading-tight tracking-tight sm:text-2xl">
                {actual.titulo}
              </p>
              <p className="mt-1 truncate text-sm text-muted sm:text-base">
                <Link
                  href={`/artista/${actual.artistaSlug}`}
                  className="transition-colors hover:text-accent"
                >
                  {actual.artistaNombre}
                </Link>
                {actual.anio && <span className="font-mono text-xs"> · {actual.anio}</span>}
              </p>

              {porSonar.length > 0 && (
                <p className="mt-2.5 truncate font-mono text-xs text-muted">
                  <span className="uppercase tracking-widest text-accent">Sigue</span>{" "}
                  {porSonar.map((t) => t.titulo).join(" · ")}
                </p>
              )}
            </div>

            {/* En móvil, su propia fila y alineados a la derecha. Es la
                misma cesión que hace la navegación del masthead: lo que baja
                es el control, no el nombre de lo que suena. */}
            <div className="flex w-full shrink-0 items-center justify-end gap-1.5 sm:w-auto sm:justify-start">
              <BotonDeControl
                alPulsar={alternar}
                nombre={sonando ? "Pausar" : "Reanudar"}
                destacado
              >
                {sonando ? <IconPausa className="h-6 w-6" /> : <IconPlay className="h-6 w-6" />}
              </BotonDeControl>

              <BotonDeControl
                alPulsar={siguiente}
                nombre="Siguiente"
                inactivo={porSonar.length === 0}
              >
                <IconSiguiente className="h-6 w-6" />
              </BotonDeControl>

              <BotonDeControl alPulsar={parar} nombre="Parar">
                <IconParar className="h-6 w-6" />
              </BotonDeControl>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Un control de la bandeja.
 *
 * El `scale(0.97)` al oprimir no es adorno: sin él el botón no acusa recibo
 * hasta que el audio arranca, y entre el click y el sonido hay medio segundo
 * en el que la interfaz parece no haber oído nada.
 *
 * `destacado` es para play y pausa. Los tres pesaban lo mismo, y el que se usa
 * diez veces más que los otros costaba lo mismo de encontrar.
 */
function BotonDeControl({
  children,
  nombre,
  alPulsar,
  inactivo = false,
  destacado = false,
}: {
  children: React.ReactNode;
  nombre: string;
  alPulsar: () => void;
  inactivo?: boolean;
  destacado?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={alPulsar}
      disabled={inactivo}
      aria-label={nombre}
      title={nombre}
      className={
        "rounded-full p-3 transition-[transform,background-color,color] duration-150 active:scale-[0.97] disabled:opacity-30 " +
        (destacado
          ? "bg-accent text-background hover:opacity-90"
          : "text-foreground hover:bg-surface-hover disabled:hover:bg-transparent")
      }
      style={{ transitionTimingFunction: "var(--ease-salida)" }}
    >
      {children}
    </button>
  );
}
