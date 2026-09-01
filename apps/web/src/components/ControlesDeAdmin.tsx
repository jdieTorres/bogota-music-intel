"use client";

/**
 * Editar o borrar el evento desde su propia página, sin pasar por la lista.
 *
 * Es el caso de uso que la pantalla de moderación no cubre bien: uno está
 * mirando la cartelera como cualquier visitante, ve algo mal, y tiene que
 * poder arreglarlo ahí mismo en vez de buscar el evento entre 48 en otra
 * pestaña.
 *
 * **No aparece para nadie más que un admin**, y eso lo decide la base: se
 * le pregunta a `es_admin()`. Mientras no conteste que sí, el componente no
 * renderiza nada. Aun si alguien forzara que se mostrara, las políticas RLS
 * y la función `borrar_evento()` rechazan la escritura — esto es una
 * comodidad de interfaz, no el control de acceso.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { borrar } from "@/lib/admin/eventos";
import { esAdmin } from "@/lib/admin/sesion";

export function ControlesDeAdmin({ eventoId, titulo }: { eventoId: string; titulo: string }) {
  const [puede, setPuede] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let vigente = true;
    esAdmin()
      .then((resultado) => {
        if (vigente) setPuede(resultado);
      })
      .catch(() => {
        // Sin sesión la llamada falla, que es el caso normal de un
        // visitante: no hay nada que mostrar ni nada que avisar.
      });
    return () => {
      vigente = false;
    };
  }, []);

  if (!puede) return null;

  async function borrarlo() {
    setOcupado(true);
    setError(null);
    try {
      await borrar(eventoId, motivo.trim());
      // A la cartelera: la página de este evento ya no existe.
      router.push("/");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setOcupado(false);
    }
  }

  return (
    <aside className="mt-8 rounded-lg border border-dashed border-border p-4">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">
        Solo tú ves esto
      </p>

      {!confirmando ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="/admin"
            className="rounded-md border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:text-foreground"
          >
            Editar en moderación
          </a>
          <button
            onClick={() => setConfirmando(true)}
            className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs text-red-400 transition-colors hover:text-red-300"
          >
            Borrar evento
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-sm">Borrar «{titulo}» para siempre</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Se borra el evento y las filas crudas de sus fuentes, y queda bloqueado para
            que el cron no lo vuelva a traer.{" "}
            <strong className="text-foreground">No se puede deshacer.</strong> Para solo
            sacarlo de la cartelera sin borrarlo, usá &ldquo;Quitar de la cartelera&rdquo;
            en moderación.
          </p>
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Por qué se borra (queda registrado)"
            className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button
              disabled={ocupado || motivo.trim().length < 5}
              onClick={borrarlo}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {ocupado ? "Borrando…" : "Borrar definitivamente"}
            </button>
            <button
              onClick={() => setConfirmando(false)}
              className="rounded-md border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
