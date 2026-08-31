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

import { IconNota } from "@/components/icons";
import type { SalaEnMapa } from "@/lib/venues";
import { tituloParaMostrar } from "@/lib/tituloEvento";

// maplibre-gl 6 resuelve su worker con `import.meta.url` y descarta el valor si
// no es una URL http(s). Turbopack no le da una, así que el mapa se queda sin
// worker: dibuja canvas, marcadores y controles, pero nunca pide una tesela y
// queda en negro, sin error en consola. `scripts/copiar-worker-maplibre.mjs`
// deja el worker en public/ y aquí se le indica dónde está.
//
// Se pregunta primero para no pisar una resolución nativa, si algún día
// Turbopack o maplibre arreglan el caso.
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
  if (!iso) return "Fecha por confirmar";
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
function PanelSala({ sala }: { sala: SalaEnMapa }) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
      <div className="relative aspect-[16/9] w-full bg-background sm:aspect-[21/9]">
        {sala.photo_url ? (
          <Image
            src={sala.photo_url}
            alt=""
            fill
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
        <h2 className="font-display text-xl font-semibold tracking-tight">
          {sala.name}
        </h2>
        {sala.address && <p className="mt-1 text-sm text-muted">{sala.address}</p>}

        <ul className="mt-4 space-y-1 border-t border-border pt-4">
          {sala.eventos.map((evento) => (
            <li key={evento.id}>
              <Link
                href={`/evento/${evento.id}`}
                className="flex items-baseline gap-3 rounded-md px-2 py-1.5 -mx-2 transition-colors hover:bg-surface-hover"
              >
                <span className="shrink-0 font-mono text-xs text-muted">
                  {fechaCorta(evento.starts_at)}
                </span>
                <span className="truncate text-sm">{tituloParaMostrar(evento, sala.name)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function MapaEscena({ salas }: { salas: SalaEnMapa[] }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [salaSeleccionada, setSalaSeleccionada] = useState<SalaEnMapa | null>(null);

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
      const marcador = document.createElement("div");
      marcador.className = "marcador-sala";
      marcador.setAttribute("role", "button");
      marcador.setAttribute("aria-label", `${sala.name}, ${sala.eventos.length} eventos`);
      // El panel debajo del mapa es la única forma de ver el detalle: el
      // click reemplaza al popup flotante que había antes.
      marcador.addEventListener("click", () => setSalaSeleccionada(sala));

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
      mapa.fitBounds(limites, { padding: 60, maxZoom: 14, animate: false });
    }

    return () => mapa.remove();
  }, [salas]);

  return (
    <div>
      <div
        ref={contenedor}
        className="h-[60vh] min-h-[380px] w-full overflow-hidden rounded-lg border border-border bg-surface"
      />
      {salaSeleccionada && <PanelSala sala={salaSeleccionada} />}
    </div>
  );
}
