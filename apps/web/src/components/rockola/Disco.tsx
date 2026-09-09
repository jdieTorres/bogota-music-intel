import Image from "next/image";

import type { TrackEnCola } from "@/components/rockola/Rockola";

/**
 * El disco.
 *
 * **Gira solo mientras suena** — el CSS está en `globals.css` y el porqué
 * también: una rotación permanente sería decoración, y atada al estado pasa a
 * ser el indicador de si hay algo sonando.
 *
 * ⚠️ **La carátula no se recorta en círculo.** Un cuadrado recortado a
 * redondo se lee como el avatar de cualquier reproductor de música; acá la
 * carátula es la **etiqueta central**, que es donde va en un disco de verdad
 * y deja ver los surcos alrededor.
 *
 * Y cuando no hay carátula, la etiqueta se compone con letras sobre uno de
 * cuatro colores ácidos. No es un marcador de posición a la espera de una
 * imagen: es el hueco dicho en voz alta, con la forma que tendría un sello
 * impreso. Fingir una carátula con un fotograma del video sería inventar un
 * dato que nadie publicó.
 */

const ETIQUETAS = [
  "var(--etiqueta-a)",
  "var(--etiqueta-b)",
  "var(--etiqueta-c)",
  "var(--etiqueta-d)",
];

/**
 * Qué color le toca a este track.
 *
 * Sale de su identificador y no de `Math.random`: el sello de una canción
 * tiene que ser el mismo cada vez que suena. Uno que cambia en cada carga deja
 * de ser una etiqueta y pasa a ser un parpadeo.
 */
function colorDeEtiqueta(id: string | undefined): string {
  if (!id) return ETIQUETAS[0];
  let suma = 0;
  for (let i = 0; i < id.length; i++) suma = (suma + id.charCodeAt(i)) % 1024;
  return ETIQUETAS[suma % ETIQUETAS.length];
}

export function Disco({
  track,
  sonando,
  lado,
  className = "",
}: {
  track: TrackEnCola | null;
  sonando: boolean;
  /** El diámetro en píxeles. */
  lado: number;
  className?: string;
}) {
  return (
    <div
      className={"relative shrink-0 " + className}
      style={{ width: lado, height: lado }}
      aria-hidden
    >
      <div
        className="disco h-full w-full rounded-full"
        data-sonando={sonando ? "si" : "no"}
        style={{
          // Los surcos: anillos finísimos a muy bajo contraste. Un vinilo con
          // surcos dibujados a la vista se convierte en una ilustración, y el
          // sitio ya descartó una vez el tratamiento ilustrado.
          background:
            "repeating-radial-gradient(circle at 50% 50%, #1a1a1a 0 2px, #101010 2px 3px), #141414",
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full"
          // 48% y no 42: con la etiqueta chica el sello se perdía contra los
          // surcos y el disco leía como un punto negro. Un sello de verdad
          // ocupa casi la mitad del diámetro.
          style={{ width: "48%", height: "48%" }}
        >
          {track?.caratulaUrl ? (
            <Image
              src={track.caratulaUrl}
              alt=""
              fill
              // Las pega Juan a mano desde cualquier host, igual que las fotos
              // de sala: no pasan por el optimizador.
              unoptimized
              className="object-cover"
              sizes="240px"
            />
          ) : (
            <EtiquetaCompuesta track={track} lado={lado} />
          )}
        </div>

        {/* El agujero. Del color del papel y no negro: es un hueco por el que
            se ve el plato, no una mancha. */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background"
          style={{ width: "7%", height: "7%" }}
        />
      </div>
    </div>
  );
}

/**
 * La etiqueta cuando el track no trae carátula.
 *
 * ⚠️ **Por debajo de cierto tamaño no lleva texto, y es a propósito.** El
 * sello mide el 48% del disco: en el de 64 px de la bandeja móvil eso son 30
 * px, donde "Nicolás y los Fumadores" no entra ni recortado — salía partido a
 * la mitad y parecía roto. Un sello de 45 rpm visto de lejos tampoco se lee:
 * es una mancha de color, y eso es exactamente lo que hace acá. El nombre y
 * el título están al lado, en texto de verdad.
 */
function EtiquetaCompuesta({ track, lado }: { track: TrackEnCola | null; lado: number }) {
  const fondo = colorDeEtiqueta(track?.id);
  const cabeElTexto = lado >= 140;

  if (!cabeElTexto) {
    return <div className="h-full w-full" style={{ background: fondo }} />;
  }

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-[5%] px-[9%] text-center leading-none"
      style={{ background: fondo, color: "var(--etiqueta-tinta)" }}
    >
      <span
        className="line-clamp-2 font-display font-extrabold uppercase leading-[1.1] tracking-[0.06em]"
        style={{ fontSize: Math.round(lado * 0.052) }}
      >
        {track?.artistaNombre ?? ""}
      </span>
      {/* El filete que en una etiqueta impresa separa el sello del título. */}
      <span className="h-px w-1/3 shrink-0" style={{ background: "currentColor", opacity: 0.45 }} />
      <span
        className="line-clamp-2 font-mono leading-[1.2]"
        style={{ fontSize: Math.round(lado * 0.042) }}
      >
        {track?.titulo ?? ""}
      </span>
    </div>
  );
}

/**
 * La funda con el disco asomando: la composición de la ficha del artista.
 *
 * El disco **sale por detrás de la funda al empezar a sonar**. Es el gesto que
 * hace una persona al poner un disco, y es la razón de que la funda siga
 * siendo un cuadrado: si la carátula se recortara a círculo no habría de
 * dónde salir.
 */
export function FundaConDisco({
  track,
  sonando,
  lado,
}: {
  track: TrackEnCola | null;
  sonando: boolean;
  lado: number;
}) {
  return (
    <div className="relative" style={{ width: lado * 1.5, height: lado }}>
      <div
        className="absolute left-0 top-0 transition-transform duration-500"
        style={{
          transitionTimingFunction: "var(--ease-salida)",
          // Asoma media funda. Salir del todo dejaría la carátula tapada por
          // el disco, que es al revés de lo que hace una funda.
          transform: sonando ? `translateX(${lado * 0.5}px)` : "translateX(0)",
        }}
      >
        <Disco track={track} sonando={sonando} lado={lado} />
      </div>

      {/* La funda va encima del disco: es la que lo guarda. */}
      <div
        className="absolute left-0 top-0 overflow-hidden rounded-sm border border-border"
        style={{ width: lado, height: lado }}
      >
        {track?.caratulaUrl ? (
          <Image
            src={track.caratulaUrl}
            alt={`Carátula de ${track.titulo}`}
            fill
            unoptimized
            // `object-contain` como los afiches: las carátulas llegan en
            // proporciones distintas y recortar por el centro se come el
            // nombre del disco.
            className="object-contain"
            sizes="320px"
          />
        ) : (
          // Sin carátula, la funda toma el mismo color que la etiqueta: las
          // dos son el mismo sello, una impresa en grande.
          <div
            className="flex h-full w-full flex-col justify-between p-5"
            style={{ background: colorDeEtiqueta(track?.id), color: "var(--etiqueta-tinta)" }}
          >
            <span className="text-pretty font-display text-xl font-extrabold uppercase leading-[1.05] tracking-tight">
              {track?.artistaNombre ?? ""}
            </span>
            <span className="font-mono text-xs">{track?.titulo ?? ""}</span>
          </div>
        )}
      </div>
    </div>
  );
}
