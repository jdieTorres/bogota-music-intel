/**
 * Cargar un evento desde su afiche: la subida y la llamada al lector.
 *
 * **Por qué existe.** Las salas de escena chica —Ace of Spades, Boro Room,
 * The Bonfire— no publican cartelera: difunden por Instagram, que bloquea el
 * rastreo en su `robots.txt`. La vía para esas es "pegar, no traer": si el
 * admin pega el contenido, no hay robot entrando donde no lo dejan. Desde
 * que las fuentes masivas salieron del registry (2026-09-08), este es el
 * camino principal por el que entra la escena.
 *
 * **Propone, no publica.** Lo que sale de acá prellena el formulario de
 * carga a mano; el evento entra como borrador a la misma cola de siempre.
 *
 * La interpretación de lo leído —fechas, salas— está en `afiche.ts`, que no
 * importa Supabase y por eso se puede probar sin credenciales.
 */

import type { CamposDelAfiche } from "@/lib/admin/afiche";
import { supabase } from "@/lib/supabase";

const BUCKET = "afiches";

/**
 * Sube el afiche y devuelve su URL pública.
 *
 * Sube con la sesión del admin: quién puede escribir en el bucket lo decide
 * `es_admin()` en las políticas de Storage, no este archivo.
 */
export async function subirAfiche(archivo: File): Promise<string> {
  const extension = archivo.name.split(".").pop()?.toLowerCase() ?? "jpg";
  // El nombre no se reusa nunca: dos afiches distintos con el mismo nombre de
  // archivo se pisarían, y el segundo cambiaría el afiche del primer evento.
  const ruta = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(ruta, archivo);
  if (error) throw new Error(`No se pudo subir el afiche: ${error.message}`);

  return supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
}

/** Manda el afiche (o el texto) a leer. La clave de la API vive en el
 *  servidor; acá solo se pasa la sesión para que el route sepa quién pide. */
export async function leerAfiche(
  entrada: { imagenUrl: string } | { texto: string },
): Promise<CamposDelAfiche> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("La sesión venció. Vuelve a entrar.");

  const respuesta = await fetch("/api/afiche", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(entrada),
  });

  const cuerpo = await respuesta.json();
  if (!respuesta.ok) throw new Error(cuerpo.error ?? "No se pudo leer el afiche.");
  return cuerpo.campos as CamposDelAfiche;
}
