"use client";

import { useRef, useState } from "react";

import { BORDE_EN_FALTA, BOTON_AZUL, BOTON_TENUE, Aviso, CAMPO, Rotulo } from "@/components/admin/ui";
import { faltaParaCambiarClave, mensajeDeSupabase, type FaltaDeClave } from "@/lib/admin/clave";
import { supabase } from "@/lib/supabase";

/**
 * Cambiar la contraseña del admin, desde adentro y con la sesión ya abierta.
 *
 * **Por qué no es el correo de recuperación.** Ese camino necesita una
 * pantalla que reciba el token del enlace, y hasta el 2026-09-16 no existía:
 * el correo llevaba a la `Site URL` y ahí no pasaba nada. Con sesión abierta
 * no hace falta token — `updateUser` alcanza—, así que esto resuelve el caso
 * común sin montar el flujo entero de recuperación. **El caso de "olvidé la
 * contraseña" sigue sin cubrirse**, y ese sí necesita la pantalla del token.
 *
 * Va plegado detrás de un botón y no abierto: se usa una vez cada mucho, y
 * dos campos de contraseña permanentes en la cabecera de moderación pesan
 * todos los días para servir un día.
 */
export function CambioDeClave() {
  const [abierto, setAbierto] = useState(false);
  const [clave, setClave] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [falta, setFalta] = useState<FaltaDeClave | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const campoClave = useRef<HTMLInputElement>(null);
  const campoConfirmacion = useRef<HTMLInputElement>(null);

  function cerrar() {
    setAbierto(false);
    setClave("");
    setConfirmacion("");
    setFalta(null);
    setError(null);
    setListo(false);
  }

  async function cambiar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setListo(false);

    // Lo que falta se dice en el campo que falta y se lleva el foco hasta él,
    // igual que en la ficha de artista.
    const pendiente = faltaParaCambiarClave(clave, confirmacion);
    setFalta(pendiente);
    if (pendiente) {
      (pendiente.campo === "clave" ? campoClave : campoConfirmacion).current?.focus();
      return;
    }

    setGuardando(true);
    const { error: fallo } = await supabase.auth.updateUser({ password: clave });
    setGuardando(false);

    if (fallo) {
      setError(mensajeDeSupabase(fallo.message));
      campoClave.current?.focus();
      return;
    }

    // No se cierra solo: el aviso de que quedó hecha es lo único que confirma
    // que la contraseña nueva es la que sirve de ahora en adelante, y cerrar
    // la pantalla se lo llevaría por delante.
    setClave("");
    setConfirmacion("");
    setListo(true);
  }

  if (!abierto) {
    return (
      <button onClick={() => setAbierto(true)} className={BOTON_TENUE}>
        Cambiar contraseña
      </button>
    );
  }

  return (
    // `order-last` y `w-full`: desplegado es un panel alto, y entre los otros
    // dos botones empujaba «Salir» a una línea propia debajo. Pidiendo el
    // ancho entero baja solo a su fila y los botones se quedan juntos arriba;
    // `max-w-sm` y `ml-auto` lo devuelven a su tamaño y a su lado.
    <form
      onSubmit={cambiar}
      className="order-last ml-auto w-full max-w-sm space-y-3 rounded-md border border-border bg-surface p-4"
    >
      <Rotulo>Contraseña nueva</Rotulo>

      <div>
        <input
          ref={campoClave}
          type="password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          autoComplete="new-password"
          placeholder="La nueva"
          className={`${CAMPO} ${falta?.campo === "clave" ? BORDE_EN_FALTA : ""}`}
        />
        {falta?.campo === "clave" && <Aviso>{falta.mensaje}</Aviso>}
      </div>

      <div>
        <input
          ref={campoConfirmacion}
          type="password"
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          autoComplete="new-password"
          placeholder="Otra vez, para confirmar"
          className={`${CAMPO} ${falta?.campo === "confirmacion" ? BORDE_EN_FALTA : ""}`}
        />
        {falta?.campo === "confirmacion" && <Aviso>{falta.mensaje}</Aviso>}
      </div>

      {error && (
        <p role="alert" className="text-xs leading-relaxed text-danger">
          {error}
        </p>
      )}
      {listo && (
        <p role="status" className="text-xs leading-relaxed text-accent">
          Lista. La próxima vez que entres, usa la nueva.
        </p>
      )}

      <div className="flex items-center gap-3">
        {/* Azul y no verde: guardar no publica nada, y el verde de la marca se
            gasta en la acción que decide algo. */}
        <button type="submit" disabled={guardando} className={BOTON_AZUL}>
          {guardando ? "Cambiando…" : "Cambiar"}
        </button>
        <button type="button" onClick={cerrar} className={BOTON_TENUE}>
          {listo ? "Cerrar" : "Cancelar"}
        </button>
      </div>
    </form>
  );
}
