"use client";

/**
 * La carcasa de la moderación: quién entra, y cuál de las dos secciones se
 * está viendo.
 *
 * El scraping propone acá y nada llega a la cartelera sin pasar por esta
 * pantalla — ni los eventos ni, desde el 2026-08-31, las salas.
 *
 * Quién puede entrar no lo decide este archivo: lo decide RLS contra la
 * tabla `admins`. Si alguien llega acá sin permiso ve la pantalla, pero la
 * base no le devuelve ni le acepta nada.
 */

import { useCallback, useEffect, useState } from "react";

import { FormularioDeEvento } from "@/components/admin/FormularioDeEvento";
import { ModeracionDeEventos } from "@/components/admin/ModeracionDeEventos";
import { ModeracionDeSalas } from "@/components/admin/ModeracionDeSalas";
import { BOTON, BOTON_TENUE, CAMPO, Marco } from "@/components/admin/ui";
import { esAdmin } from "@/lib/admin/sesion";
import { supabase } from "@/lib/supabase";

type Seccion = "eventos" | "salas";

export default function AdminPage() {
  const [sesion, setSesion] = useState<"cargando" | "fuera" | "sin-permiso" | "dentro">(
    "cargando",
  );
  const [seccion, setSeccion] = useState<Seccion>("eventos");
  const [creandoEvento, setCreandoEvento] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const revisar = useCallback(async (haySesion: boolean) => {
    if (!haySesion) {
      setSesion("fuera");
      return;
    }
    setSesion((await esAdmin()) ? "dentro" : "sin-permiso");
  }, []);

  // Se escucha la sesión en vez de leerla una vez: Supabase emite el estado
  // inicial al suscribirse, así que esto cubre el arranque, y además la
  // pantalla reacciona sola al entrar y al salir sin que nadie la refresque.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => {
      void revisar(Boolean(s));
    });
    return () => data.subscription.unsubscribe();
  }, [revisar]);

  if (sesion === "cargando") {
    return (
      <Marco>
        <p className="text-muted">Cargando…</p>
      </Marco>
    );
  }

  if (sesion === "fuera") return <Ingreso />;

  if (sesion === "sin-permiso") {
    return (
      <Marco>
        <p className="text-muted">
          Esta cuenta no está en la lista de admins. Pedile a quien administre el
          proyecto que la agregue.
        </p>
        <button onClick={() => void supabase.auth.signOut()} className={BOTON_TENUE}>
          Salir
        </button>
      </Marco>
    );
  }

  return (
    <Marco>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-4">
          {(["eventos", "salas"] as Seccion[]).map((cual) => (
            <button
              key={cual}
              onClick={() => {
                setSeccion(cual);
                setCreandoEvento(false);
              }}
              className={`font-display text-3xl font-semibold tracking-tight transition-colors ${
                seccion === cual ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {cual === "eventos" ? "Eventos" : "Salas"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {seccion === "eventos" && !creandoEvento && (
            <button onClick={() => setCreandoEvento(true)} className={BOTON_TENUE}>
              + Nuevo evento
            </button>
          )}
          <button onClick={() => void supabase.auth.signOut()} className={BOTON_TENUE}>
            Salir
          </button>
        </div>
      </div>

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      {seccion === "salas" ? (
        <ModeracionDeSalas setError={setError} />
      ) : creandoEvento ? (
        <FormularioDeEvento
          setError={setError}
          alCrear={() => {
            setCreandoEvento(false);
            // Sube la versión para que la lista se vuelva a pedir y el
            // borrador recién creado aparezca en "Por revisar".
            setVersion((v) => v + 1);
          }}
        />
      ) : (
        <ModeracionDeEventos key={version} setError={setError} />
      )}
    </Marco>
  );
}

function Ingreso() {
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setEntrando(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: clave,
    });
    setEntrando(false);
    // Si entra bien no hace falta hacer nada: `onAuthStateChange` lo ve.
    if (error) setError(error.message);
  }

  return (
    <Marco>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Moderación</h1>
      <form onSubmit={entrar} className="mt-8 max-w-sm space-y-4">
        <input
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="Correo"
          autoComplete="username"
          required
          className={CAMPO}
        />
        <input
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          placeholder="Contraseña"
          autoComplete="current-password"
          required
          className={CAMPO}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" disabled={entrando} className={`${BOTON} bg-accent text-background`}>
          {entrando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </Marco>
  );
}

/**
 * Un renglón del listado. Muestra lo justo para decidir si hay que entrar:
 * cuándo, cómo se va a ver publicado, dónde, y qué reclama atención.
 *
 * El título es el que se va a publicar, no el crudo de la sala: desde el
 * 2026-08-31 la normalización corre en la ingesta, así que lo que se ve acá
 * es literalmente lo que ve el visitante. Antes no era así y editar a
 * ciegas era fácil.
 */
/** "03 sep 26". Se arma por partes porque `es-CO` interpone "de" entre
 *  ellas ("03 de sept de 26") y en una columna angosta eso parte el
 *  renglón en dos líneas. */
