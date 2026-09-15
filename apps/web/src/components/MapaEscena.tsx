"use client";

// maplibre-gl 6 dejó de exponer un export default: todo se importa por nombre.
import {
  AttributionControl,
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  getWorkerUrl,
  setWorkerUrl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { IconNota, IconoDeTipo, MARCA_SALA_SVG } from "@/components/icons";
import type { SalaEnMapa } from "@/lib/venues";

// maplibre-gl 6 resuelve su worker con `import.meta.url` y descarta el valor si
// no es una URL http(s). Turbopack no le da una, así que el mapa se queda sin
// worker: dibuja canvas, marcadores y controles, pero nunca pide una tesela y
// queda en negro, sin error en consola. `scripts/copiar-worker-maplibre.mjs`
// deja el worker en public/ y aquí se le indica dónde está.
//
// Se pregunta primero para no pisar una resolución nativa, si algún día
// Turbopack o maplibre arreglan el caso.
//
// ⚠️ El síntoma de arriba —canvas y marcadores sin teselas, sin error en
// consola— tiene una segunda causa, y no está en este archivo: una pestaña
// oculta. Chrome no le da frames de `requestAnimationFrame`, MapLibre no
// renderiza, y como las teselas se piden durante el render, nunca se piden.
// Antes de sospechar del worker, mirar `document.visibilityState`.
if (!getWorkerUrl()) {
  setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
}

// OpenFreeMap sirve tiles de OpenStreetMap sin API key ni límite de uso.
// El estilo no trae el campo `attribution`, así que la atribución a OSM
// (obligatoria por la licencia ODbL) se agrega a mano más abajo.
// OpenFreeMap publica cinco estilos y todos responden 200 (verificado
// 2026-08-27): liberty y bright son claros y muy detallados (111 y 119
// capas, prácticamente el mismo diseño con las capas renombradas),
// positron es gris casi blanco y minimalista (55), dark es casi negro y
// fiord un azul grisáceo oscuro.
//
// Elegido con Juan el 2026-08-27 mirando los cuatro en el navegador. El
// mapa claro es deliberado y va contra la paleta oscura del resto del
// sitio: un mapa casi negro leía como un hueco, no como un mapa. Es la
// primera decisión del trabajo de look & feel, así que si más adelante la
// paleta cambia, esto se revisa junto con ella y no por su cuenta.
const ESTILO = "https://tiles.openfreemap.org/styles/liberty";
const ATRIBUCION =
  '<a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> · ' +
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';

function fechaCorta(iso: string | null): string {
  // "Sin fecha" y no "Fecha por confirmar": lo segundo suena a que el dato
  // viene en camino, y casi nunca es así — la fuente no la publicó y punto.
  // Era la última superviviente de esa frase en todo el sitio.
  if (!iso) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

/**
 * Panel debajo del mapa con el detalle de la sala tocada: foto, dirección
 * y sus eventos. Reemplaza al popup de MapLibre que había antes —un popup
 * flotante compite por espacio en pantallas chicas, y acá se pidió
 * explícitamente el panel debajo del mapa.
 */
function PanelSala({ sala, alCerrar }: { sala: SalaEnMapa; alCerrar: () => void }) {
  return (
    <div className="mt-4 overflow-hidden rounded-sm border border-border bg-surface">
      <div className="relative aspect-[16/9] w-full bg-background sm:aspect-[21/9]">
        {sala.photo_url ? (
          // ⚠️ `unoptimized` es obligatorio acá, no una optimización de más.
          //
          // Los afiches llegan de un puñado de fuentes conocidas y por eso la
          // lista blanca de `images.remotePatterns` les funciona. **La foto de
          // la sala la pega Juan a mano en /admin**, desde el sitio de cada
          // sala o su Instagram, así que el host es distinto casi siempre.
          // `next/image` no degrada ante un host que no esté en la lista:
          // lanza y tumba la página — comprobado, 500 sin esto y 200 con esto.
          // Sin `unoptimized`, cada foto nueva costaría editar
          // `next.config.ts` y volver a desplegar.
          //
          // Y no reabre el agujero que la lista blanca cierra: el riesgo era
          // que nuestro servidor descargue y sirva cualquier URL, y acá no
          // descarga nada — la imagen la pide el navegador de quien mira.
          <Image
            src={sala.photo_url}
            alt=""
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, 1024px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <IconNota className="h-10 w-10" />
          </div>
        )}
      </div>

      <div className="p-4 sm:p-5">
        {/* Hasta el 2026-09-15 el panel no tenía salida: `salaSeleccionada`
            nunca volvía a `null`, así que una vez abierto se quedaba abierto.
            Dice "Cerrar" y no lleva un aspa: el set de íconos es propio y
            dibujar uno nuevo pide mirar antes sus medidas compartidas, y un
            glifo de texto haciendo de ícono es justo lo que la iconografía de
            este sitio no usa. De paso, la palabra da un área de toque que un
            aspa de 16px no daría. */}
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            {sala.name}
          </h2>
          <button
            type="button"
            onClick={alCerrar}
            className="-mr-2 -mt-1 shrink-0 rounded-sm px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
          >
            Cerrar
          </button>
        </div>
        {sala.address && <p className="mt-1 text-sm text-muted">{sala.address}</p>}

        {sala.eventos.length === 0 ? (
          // El hueco se dice en voz alta, como en el resto del sitio: la sala
          // existe y está en la escena, solo que hoy no tiene nada anunciado.
          <p className="mt-4 border-t border-border pt-4 text-sm italic text-muted">
            Sin nada anunciado por ahora.
          </p>
        ) : (
        <ul className="mt-4 space-y-1 border-t border-border pt-4">
          {sala.eventos.map((evento) => (
            <li key={evento.id}>
              <Link
                href={`/evento/${evento.id}`}
                className="flex items-baseline gap-3 rounded-sm px-2 py-1.5 -mx-2 transition-colors hover:bg-surface-hover"
              >
                <span className="shrink-0 font-mono text-xs text-muted">
                  {fechaCorta(evento.starts_at)}
                </span>
                {/* Con nombre para lectores de pantalla: el panel de una sala
                    mezcla conciertos, fiestas y festivales, así que acá el
                    tipo no se deduce de nada más. `self-center` porque el
                    ícono no tiene línea base con la que alinearse. */}
                <IconoDeTipo
                  tipo={evento.event_type}
                  conNombre
                  className="h-4 w-4 shrink-0 self-center opacity-80"
                />
                <span className="truncate text-sm">{evento.title}</span>
              </Link>
            </li>
          ))}
        </ul>
        )}
      </div>
    </div>
  );
}

export function MapaEscena({ salas }: { salas: SalaEnMapa[] }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [salaSeleccionada, setSalaSeleccionada] = useState<SalaEnMapa | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contenedor.current || salas.length === 0) return;

    const mapa = new MapLibreMap({
      container: contenedor.current,
      style: ESTILO,
      center: [-74.07, 4.65],
      zoom: 11,
      attributionControl: false,
    });

    mapa.addControl(
      new AttributionControl({ compact: true, customAttribution: ATRIBUCION }),
    );
    mapa.addControl(new NavigationControl({ showCompass: false }), "top-right");

    const limites = new LngLatBounds();
    for (const sala of salas) {
      // Un <button> de verdad y no un <div role="button">: hasta el
      // 2026-09-07 era un div sin tabindex, así que no recibía foco y el
      // mapa entero no se podía usar sin mouse.
      //
      // El manejador de teclado de abajo NO sobra, aunque un <button> se
      // active solo con Enter y Espacio: MapLibre se traga el keydown en el
      // contenedor del mapa —verificado en el navegador, el evento no llega
      // ni a `window`— y con él la activación nativa. Escuchar en el propio
      // marcador corre antes que eso. Si algún día se quita el listener por
      // "redundante", el mapa vuelve a quedar sin teclado y en silencio.
      const marcador = document.createElement("button");
      marcador.type = "button";
      // Una sala sin nada anunciado lleva el mismo pin, atenuado. Se ve que
      // está y se ve que hoy no suena: si fuera idéntico, tocarla y encontrar
      // el panel vacío se sentiría roto.
      marcador.className =
        sala.eventos.length > 0
          ? "marcador-sala"
          : "marcador-sala marcador-sala--sin-eventos";
      // El punto verde pasó a ser la marca del masthead: Juan pidió que el
      // mismo ícono que identifica al sitio identifique a cada sala. Va como
      // cadena y con colores fijos — el porqué de las dos cosas está en
      // `MARCA_SALA_SVG`.
      marcador.innerHTML = MARCA_SALA_SVG;
      marcador.setAttribute(
        "aria-label",
        sala.eventos.length === 0
          ? `${sala.name}, sin nada anunciado`
          : `${sala.name}, ${sala.eventos.length} ${sala.eventos.length === 1 ? "evento" : "eventos"}`,
      );

      // El globo que aparece al apuntar el pin: nombre y dirección, nada
      // más. El detalle sigue en el panel de abajo; esto solo contesta
      // "¿cuál es esta?" sin obligar a hacer clic.
      //
      // Se arma con `createElement` y `textContent` —no con una plantilla de
      // HTML como el popup de 2026-08-29, que necesitaba su propio
      // `escaparHtml`—: el nombre y la dirección los escribe una persona en
      // /admin, y acá no hay nada que escapar porque nunca se interpretan
      // como marcado.
      //
      // `aria-hidden` porque no aporta nada al lector de pantalla: el nombre
      // ya está en el `aria-label` de arriba, y quien navega con teclado
      // llega igual al panel, que trae la dirección y los eventos.
      const globo = document.createElement("span");
      globo.className = "marcador-sala__globo";
      globo.setAttribute("aria-hidden", "true");

      const nombre = document.createElement("span");
      nombre.className = "marcador-sala__nombre";
      nombre.textContent = sala.name;

      // Siempre se dibuja, aunque venga vacía: el CSS le reserva la altura
      // para que el globo no cambie de tamaño entre una sala y otra. Sin
      // texto de relleno — una sala sin dirección muestra el hueco.
      const direccion = document.createElement("span");
      direccion.className = "marcador-sala__direccion";
      direccion.textContent = sala.address ?? "";

      globo.append(nombre, direccion);
      marcador.append(globo);
      // El panel debajo del mapa es la única forma de ver el detalle: el
      // click reemplaza al popup flotante que había antes.
      marcador.addEventListener("click", () => setSalaSeleccionada(sala));
      marcador.addEventListener("keydown", (evento) => {
        if (evento.key !== "Enter" && evento.key !== " ") return;
        evento.preventDefault();
        setSalaSeleccionada(sala);
      });

      new Marker({ element: marcador })
        .setLngLat([sala.longitude, sala.latitude])
        .addTo(mapa);

      limites.extend([sala.longitude, sala.latitude]);
    }

    // Encuadra todas las salas. Con una sola, fitBounds haría un zoom
    // extremo, así que en ese caso se centra con un zoom razonable.
    if (salas.length === 1) {
      mapa.setCenter([salas[0].longitude, salas[0].latitude]);
      mapa.setZoom(14);
    } else {
      // Arriba se deja más aire que en los otros tres lados: el globo del
      // hover sale hacia arriba y mide unos 68px con la puntita y lo que el
      // pin crece al escalar. Con 60 parejo, el pin más al norte quedaba a
      // 53px del borde y el contenedor —que recorta para redondear las
      // esquinas— le comía la primera línea al globo.
      //
      // ⚠️ Esto cubre el encuadre inicial, que es el que ve todo el mundo.
      // Si el lector arrastra el mapa y deja un pin pegado al borde de
      // arriba, su globo se sigue recortando; resolverlo pide voltear el
      // globo hacia abajo, y eso ya no es CSS.
      mapa.fitBounds(limites, {
        padding: { top: 76, bottom: 60, left: 60, right: 60 },
        maxZoom: 14,
        animate: false,
      });
    }

    return () => mapa.remove();
  }, [salas]);

  /**
   * Tocar un pin tiene que producir un cambio visible.
   *
   * ⚠️ **No lo producía.** El mapa ocupa `60vh` y arranca debajo del
   * encabezado de la página, así que el panel nacía fuera de pantalla: medido
   * en un viewport de 900, aparecía en `top: 974` con la página sin
   * desplazar. La bajada dice "Toca un punto para ver qué viene", uno tocaba
   * y no pasaba nada — el módulo parecía roto sin estarlo, que es la versión
   * en interfaz del fallo que se ve igual que un éxito.
   *
   * `block: "nearest"` y no `"start"`: si el panel ya se ve, no se mueve
   * nada. Y sin desplazamiento suave para quien pidió menos movimiento.
   */
  useEffect(() => {
    if (!salaSeleccionada) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panel.current?.scrollIntoView({
      block: "nearest",
      behavior: quieto ? "auto" : "smooth",
    });
  }, [salaSeleccionada]);

  return (
    <div>
      <div
        ref={contenedor}
        className="h-[60vh] min-h-[380px] w-full overflow-hidden rounded-sm border border-border bg-surface"
      />
      {salaSeleccionada && (
        <div ref={panel}>
          <PanelSala
            sala={salaSeleccionada}
            alCerrar={() => setSalaSeleccionada(null)}
          />
        </div>
      )}
    </div>
  );
}
