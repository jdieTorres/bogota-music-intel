/**
 * Quién está moderando. Lo contesta la base, no el frontend.
 *
 * Vive aparte porque lo usan los dos módulos de moderación —eventos y
 * salas— y también los controles que aparecen dentro de la cartelera.
 */

import { supabase } from "@/lib/supabase";

/** ¿La sesión actual puede moderar? */
export async function esAdmin(): Promise<boolean> {
  const { data } = await supabase.rpc("es_admin");
  return Boolean(data);
}
