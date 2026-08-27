"use client";

// maplibre-gl 6 dejó de exponer un export default: todo se importa por nombre.
import {
  AttributionControl,
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

import type { SalaEnMapa } from "@/lib/venues";

// OpenFreeMap sirve tiles de OpenStreetMap sin API key ni límite de uso.
// El estilo no trae el campo `attribution`, así que la atribución a OSM
// (obligatoria por la licencia ODbL) se agrega a mano más abajo.
const ESTILO = "https://tiles.openfreemap.org/styles/dark";
const ATRIBUCION =
  '<a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> · ' +
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';

function escaparHtml(texto: string): string {
  return texto.replace(
    /[&<>"']/g,
    (caracter) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[caracter] as string,
  );
}

function contenidoDelPopup(sala: SalaEnMapa): string {
  const proximos = sala.eventos.slice(0, 3);
  const restantes = sala.eventos.length - proximos.length;

  const items = proximos
    .map((evento) => {
      const fecha = evento.starts_at
        ? new Intl.DateTimeFormat("es-CO", {
            timeZone: "America/Bogota",
            day: "numeric",
            month: "short",
          }).format(new Date(evento.starts_at))
        : "";
      return `<li style="margin-bottom:4px">
        <a href="/evento/${evento.id}" style="color:#f2f2f4;text-decoration:none">
          <span style="color:#9b9baa;font-variant-numeric:tabular-nums">${fecha}</span>
          ${escaparHtml(evento.title)}
        </a>
      </li>`;
    })
    .join("");

  return `<div style="font-family:inherit;min-width:190px;max-width:250px">
    <strong style="display:block;margin-bottom:2px">${escaparHtml(sala.name)}</strong>
    ${sala.address ? `<div style="color:#9b9baa;font-size:11px;margin-bottom:8px">${escaparHtml(sala.address)}</div>` : ""}
    <ul style="list-style:none;padding:0;margin:0;font-size:12px">${items}</ul>
    ${restantes > 0 ? `<div style="color:#9b9baa;font-size:11px;margin-top:6px">y ${restantes} más</div>` : ""}
  </div>`;
}

export function MapaEscena({ salas }: { salas: SalaEnMapa[] }) {
  const contenedor = useRef<HTMLDivElement>(null);

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
      marcador.style.cssText = [
        "width:14px",
        "height:14px",
        "border-radius:50%",
        "background:#ff4d3d",
        "border:2px solid #0b0b0e",
        "box-shadow:0 0 0 1px rgba(255,77,61,.5)",
        "cursor:pointer",
      ].join(";");
      marcador.setAttribute("role", "button");
      marcador.setAttribute("aria-label", `${sala.name}, ${sala.eventos.length} eventos`);

      new Marker({ element: marcador })
        .setLngLat([sala.longitude, sala.latitude])
        .setPopup(new Popup({ offset: 14 }).setHTML(contenidoDelPopup(sala)))
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
    <div
      ref={contenedor}
      className="h-[60vh] min-h-[380px] w-full overflow-hidden rounded-lg border border-border bg-surface"
    />
  );
}
