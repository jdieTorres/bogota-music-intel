"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import type { Plataforma } from "@/lib/enlaces-de-audio";

/**
 * La rockola: la cola y quién manda sobre ella.
 *
 * **Vive en el layout raíz y no en una página**, y esa es la decisión de
 * arquitectura que más se nota: la música sigue sonando mientras se recorre
 * el mapa y la cartelera. Montada dentro de una página, cambiar de artista
 * cortaría la canción.
 *
 * ⚠️ **Se encola, no se reemplaza.** Escoger un track mientras suena otro lo
 * pone **después**. Es lo que hace una rockola de bar y es lo contrario de lo
 * que hace un reproductor web, donde cada click pisa lo que estaba sonando.
 * Es el comportamiento que se quiso emular; el mueble de madera con luces no.
 */

export type TrackEnCola = {
  id: string;
  titulo: string;
  anio: number | null;
  plataforma: Plataforma;
  idExterno: string;
  caratulaUrl: string | null;
  artistaNombre: string;
  artistaSlug: string;
};

type EstadoDeLaRockola = {
  cola: TrackEnCola[];
  /** Cuál de la cola está puesto. -1 mientras no haya nada. */
  indice: number;
  sonando: boolean;
  /** El acuse de la última acción ("Va después de …"). Se borra solo. */
  acuse: string | null;
};

type ControlesDeLaRockola = EstadoDeLaRockola & {
  actual: TrackEnCola | null;
  /** Lo pone a sonar ya, sin perder lo que venía después. */
  poner: (track: TrackEnCola) => void;
  /** Lo manda al final de la cola. */
  encolar: (track: TrackEnCola) => void;
  ponerAlAzar: (candidatos: TrackEnCola[]) => void;
  alternar: () => void;
  siguiente: () => void;
  parar: () => void;
};

const Contexto = createContext<ControlesDeLaRockola | null>(null);

export function useRockola(): ControlesDeLaRockola {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("La rockola se usa dentro de su proveedor");
  return contexto;
}

export function ProveedorDeRockola({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<EstadoDeLaRockola>({
    cola: [],
    indice: -1,
    sonando: false,
    acuse: null,
  });

  // ⚠️ **La cola no se guarda en ningún lado, y es una decisión.** Vive en
  // memoria y nada más: recargar la ventana se lleva la música, igual que
  // apagar una rockola de bar. Recorrer el sitio sí la conserva, porque el
  // proveedor vive en el layout raíz y la navegación del App Router no lo
  // vuelve a montar — que es para lo que está ahí.
  //
  // Llegó a guardarse, y las dos formas estaban mal. En `localStorage`
  // —hasta el 2026-09-13— la cola era del sitio entero: abrir una segunda
  // pestaña hacía aparecer la bandeja ahí también, con la música de la
  // primera y en pausa. En `sessionStorage` el alcance era el correcto, pero
  // seguía resucitando al recargar, y una bandeja que vuelve sola después de
  // un F5 es la misma aparición en versión chica. Lo que el lector espera de
  // algo que suena es que deje de sonar cuando cierra o recarga.
  //
  // El contraste que ordena esto: **el tema sí se guarda** (`ThemeToggle`).
  // Una preferencia es del lector y lo sigue a todas partes; una sesión de
  // escucha es de acá y de ahora.

  // El acuse se borra solo. Es un mensaje de "ya te oí", no un estado.
  useEffect(() => {
    if (!estado.acuse) return;
    const reloj = window.setTimeout(
      () => setEstado((previo) => ({ ...previo, acuse: null })),
      4000,
    );
    return () => window.clearTimeout(reloj);
  }, [estado.acuse]);

  /**
   * Lo pone a sonar ya.
   *
   * ⚠️ **No vacía la cola: mete el track justo después del que suena y salta
   * ahí.** Vaciarla sería lo más fácil de escribir y lo peor de usar — quien
   * armó tres canciones y toca una cuarta no está pidiendo que se borren las
   * otras. Si el track ya estaba en la cola, salta al que ya está en vez de
   * meter un duplicado.
   */
  const poner = useCallback((track: TrackEnCola) => {
    setEstado((previo) => {
      const yaEsta = previo.cola.findIndex((t) => t.id === track.id);
      if (yaEsta !== -1) return { ...previo, indice: yaEsta, sonando: true, acuse: null };

      const cola = [...previo.cola];
      const donde = previo.indice + 1;
      cola.splice(donde, 0, track);
      return { cola, indice: donde, sonando: true, acuse: null };
    });
  }, []);

  const encolar = useCallback((track: TrackEnCola) => {
    setEstado((previo) => {
      // Si ya está en la cola no se duplica: se dice dónde va a sonar.
      const yaEsta = previo.cola.findIndex((t) => t.id === track.id);
      if (yaEsta !== -1) {
        return {
          ...previo,
          acuse: yaEsta === previo.indice ? "Ya está sonando" : "Ya está en la cola",
        };
      }

      const cola = [...previo.cola, track];
      // Con la cola vacía suena de una: encolar sobre nada sería no hacer nada.
      if (previo.indice === -1) {
        return { cola, indice: 0, sonando: true, acuse: null };
      }
      const ultimo = previo.cola[previo.cola.length - 1];
      return { ...previo, cola, acuse: `Va después de ${ultimo.titulo}` };
    });
  }, []);

  /**
   * La moneda: pone algo del directorio sin que haya que elegirlo.
   *
   * **No repite lo que está sonando.** Con un catálogo chico, un azar sin
   * memoria devuelve el mismo track dos veces seguidas y se siente roto en vez
   * de aleatorio.
   */
  const ponerAlAzar = useCallback((candidatos: TrackEnCola[]) => {
    setEstado((previo) => {
      const actual = previo.cola[previo.indice];
      const posibles = candidatos.filter((t) => t.id !== actual?.id);
      const elegidos = posibles.length ? posibles : candidatos;
      if (!elegidos.length) return previo;

      const track = elegidos[Math.floor(Math.random() * elegidos.length)];
      const yaEsta = previo.cola.findIndex((t) => t.id === track.id);
      if (yaEsta !== -1) return { ...previo, indice: yaEsta, sonando: true, acuse: null };

      // Suena ya, pero sin borrar lo que venía: mismo criterio que `poner`.
      const cola = [...previo.cola];
      const donde = previo.indice + 1;
      cola.splice(donde, 0, track);
      return { cola, indice: donde, sonando: true, acuse: null };
    });
  }, []);

  const alternar = useCallback(() => {
    setEstado((previo) => ({ ...previo, sonando: !previo.sonando }));
  }, []);

  const siguiente = useCallback(() => {
    setEstado((previo) => {
      const proximo = previo.indice + 1;
      // Al final de la cola se para y se queda en el último. No vuelve a
      // empezar: una rockola que se repite sola no la pidió nadie.
      if (proximo >= previo.cola.length) return { ...previo, sonando: false };
      return { ...previo, indice: proximo, sonando: true };
    });
  }, []);

  const parar = useCallback(() => {
    setEstado({ cola: [], indice: -1, sonando: false, acuse: null });
  }, []);

  const valor = useMemo<ControlesDeLaRockola>(
    () => ({
      ...estado,
      actual: estado.cola[estado.indice] ?? null,
      poner,
      encolar,
      ponerAlAzar,
      alternar,
      siguiente,
      parar,
    }),
    [estado, poner, encolar, ponerAlAzar, alternar, siguiente, parar],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
