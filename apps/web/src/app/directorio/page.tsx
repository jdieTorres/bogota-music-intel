import type { Metadata } from "next";

import { EncabezadoDePagina } from "@/components/EncabezadoDePagina";
import { BotonAlAzar } from "@/components/directorio/BotonAlAzar";
import {
  type ArtistaEnLista,
  ListaDelDirectorio,
} from "@/components/directorio/ListaDelDirectorio";
import type { TrackEnCola } from "@/components/rockola/Rockola";
import { type Directorio, getDirectorio } from "@/lib/artists";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Directorio de la escena",
  description:
    "Quién hace música en Bogotá, con lo que se puede escuchar de cada uno. Se llena a mano, artista por artista.",
};

export default async function Page() {
  let directorio: Directorio;
  try {
    directorio = await getDirectorio();
  } catch (error) {
    // El free tier de Supabase pausa el proyecto tras una semana sin uso.
    // Sin este catch, un build durante la pausa tumba el despliegue entero
    // en vez de degradarse.
    console.error("Fallo al cargar el directorio:", error);
    return (
      <div className="mx-auto max-w-5xl px-5 pb-16">
        <EncabezadoDePagina
          titulo="Directorio de la escena"
          bajada="No se pudo cargar el directorio en este momento. Vuelve a intentarlo en un rato."
        />
      </div>
    );
  }

  const { artistas, senales } = directorio;

  const enLista: ArtistaEnLista[] = artistas.map((artista) => {
    const senal = senales.get(artista.slug);
    return {
      slug: artista.slug,
      nombre: artista.nombre,
      fotoUrl: artista.fotoUrl,
      origen: artista.origen,
      generos: senal?.generos ?? [],
      salas: senal?.salas ?? [],
      cantidadDeTracks: artista.tracks.length,
    };
  });

  // Todo lo que se puede poner, para el botón de al azar. Se arma en el
  // servidor: el botón no tiene por qué saber de dónde salen los tracks.
  const tracks: TrackEnCola[] = artistas.flatMap((artista) =>
    artista.tracks.map((track) => ({
      ...track,
      artistaNombre: artista.nombre,
      artistaSlug: artista.slug,
    })),
  );

  return (
    <div className="mx-auto max-w-5xl px-5 pb-16">
      <EncabezadoDePagina
        titulo="Quién hace la escena"
        bajada="El directorio de artistas de Bogotá, con lo que se puede escuchar de cada uno. Se llena a mano, uno por uno, y esa es la gracia: ninguna base de datos global sabe quiénes son."
      />

      {artistas.length === 0 ? (
        // El vacío se dice sin explicar cómo está hecho el sistema por dentro.
        <p className="border-t border-border py-8 text-sm text-muted">
          El directorio todavía está en blanco. Va a empezar por quienes tocan en
          las salas de la escena.
        </p>
      ) : (
        <>
          <div className="pb-6">
            <BotonAlAzar tracks={tracks} />
          </div>
          <ListaDelDirectorio artistas={enLista} />
        </>
      )}
    </div>
  );
}
