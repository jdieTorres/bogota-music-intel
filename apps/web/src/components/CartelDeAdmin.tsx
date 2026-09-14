"use client";

/**
 * El cartel del toque: quién tocó, armado desde la ficha del evento.
 *
 * **Va acá y no en `/admin` porque acá es donde se sabe.** Uno está mirando
 * el afiche y la descripción del toque —que es donde están los nombres— y
 * tiene que poder anotarlos sin abrir otra pantalla y buscar el evento entre
 * cuarenta. Es el mismo argumento por el que editar y borrar viven en esta
 * ficha.
 *
 * ⚠️ **Crear desde acá también vincula**, y esa es la mitad que importa. Un
 * artista suelto en el directorio no conecta nada: son los vínculos los que
 * dan "compartieron cartel" y "también ha tocado en", y los que enlazan la
 * cartelera con la ficha del artista.
 *
 * El artista nace **en borrador** (`crearArtista`), así que el vínculo no se
 * ve en público hasta que alguien lo publique — la política de lectura de
 * `event_artists` solo muestra los vínculos entre filas publicadas. Eso es
 * deseable: se anota el dato cuando se sabe, y se publica cuando la ficha
 * está lista.
 *
 * Crear son dos escrituras seguidas —el artista y el vínculo— y **no hay
 * transacción**. Si la segunda falla, queda el artista creado y sin vincular,
 * que es un estado sano: el error se ve, la lista se recarga, y el artista ya
 * aparece entre las sugerencias para vincularlo de un click. Al revés sería
 * imposible, porque el vínculo necesita un id que todavía no existiría.
 *
 * No comprueba la sesión: lo monta `ControlesDeAdmin`, que ya preguntó.
 */

import { useCallback, useEffect, useState } from "react";

import {
  type EnElCartel,
  crearArtista,
  desvincularDelCartel,
  getArtistasParaVincular,
  getCartelDelEvento,
  vincularAlCartel,
} from "@/lib/admin/artistas";
import { type ArtistaVinculable, sugerencias } from "@/lib/admin/cartel";

export function CartelDeAdmin({ eventoId }: { eventoId: string }) {
  const [cartel, setCartel] = useState<EnElCartel[]>([]);
  const [directorio, setDirectorio] = useState<ArtistaVinculable[]>([]);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // El error se atrapa acá dentro y no en el efecto: así el efecto solo
  // dispara la carga, que es sincronizar con un sistema externo, y no toca
  // el estado por su cuenta.
  const recargar = useCallback(async () => {
    try {
      const [puestos, todos] = await Promise.all([
        getCartelDelEvento(eventoId),
        getArtistasParaVincular(),
      ]);
      setCartel(puestos);
      setDirectorio(todos);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    }
  }, [eventoId]);

  useEffect(() => {
    // Mismo caso que en `ModeracionDeArtistas`: `recargar` es async y hace
    // `await` antes de tocar el estado, así que no hay ningún setState
    // síncrono acá dentro. La regla no puede verlo y marca un falso positivo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void recargar();
  }, [recargar]);

  const nombre = texto.trim();
  const propuestos = sugerencias(directorio, texto, cartel.map((a) => a.id));
  // Crear solo se ofrece si no hay uno con ese nombre exacto: el campo ya
  // propone el existente, y ofrecer las dos cosas invita al duplicado.
  const sePuedeCrear =
    nombre.length > 1 &&
    !directorio.some((a) => a.nombre.toLowerCase() === nombre.toLowerCase());

  async function hacer(accion: () => Promise<unknown>) {
    setOcupado(true);
    setError(null);
    try {
      await accion();
      await recargar();
      setTexto("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">Cartel</p>

      {cartel.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {cartel.map((artista) => (
            <li key={artista.id} className="flex items-center gap-2 text-sm">
              <a
                href={`/artista/${artista.slug}`}
                className="underline underline-offset-4 hover:text-accent"
              >
                {artista.nombre}
              </a>
              {artista.status === "borrador" && (
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                  borrador
                </span>
              )}
              <button
                disabled={ocupado}
                onClick={() => hacer(() => desvincularDelCartel(eventoId, artista.id))}
                className="text-xs text-muted transition-colors hover:text-foreground disabled:opacity-40"
              >
                quitar
              </button>
            </li>
          ))}
        </ul>
      ) : (
        // El hueco se dice en voz alta, como en el resto de la ficha.
        <p className="mt-2 text-sm text-muted">Todavía nadie en el cartel de este toque.</p>
      )}

      <input
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        disabled={ocupado}
        placeholder="Nombre del artista"
        className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent"
      />

      {(propuestos.length > 0 || sePuedeCrear) && (
        <ul className="mt-2 space-y-1">
          {propuestos.map((artista) => (
            <li key={artista.id}>
              <button
                disabled={ocupado}
                onClick={() =>
                  hacer(() => vincularAlCartel(eventoId, artista.id, cartel.length))
                }
                className="text-sm text-muted transition-colors hover:text-foreground disabled:opacity-40"
              >
                ↳ {artista.nombre}
                {artista.status === "borrador" && " · borrador"}
              </button>
            </li>
          ))}
          {sePuedeCrear && (
            <li>
              <button
                disabled={ocupado}
                onClick={() =>
                  hacer(async () => {
                    const creado = await crearArtista({ nombre });
                    await vincularAlCartel(eventoId, creado.id, cartel.length);
                  })
                }
                className="text-sm text-accent transition-opacity hover:opacity-80 disabled:opacity-40"
              >
                + Crear «{nombre}» y vincularlo
              </button>
            </li>
          )}
        </ul>
      )}

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

      {cartel.some((a) => a.status === "borrador") && (
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Los borradores no se ven en público hasta que completes su ficha —bio, tracks,
          foto— y los publiques en Artistas.
        </p>
      )}
    </div>
  );
}
