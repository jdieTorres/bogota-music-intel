import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
      "Copiá apps/web/.env.example a .env.local y completá los valores del proyecto Supabase.",
  );
}

// Clave publicable. Sin sesión es solo lectura: RLS permite SELECT público
// sobre venues, events y lo publicado de canonical_events, y bloquea toda
// escritura. Con la sesión de un admin (ver `admin.ts` y la tabla `admins`)
// el mismo cliente puede leer la cola y publicar — quién puede hacerlo lo
// decide la base, no el frontend. El pipeline de scraping sigue escribiendo
// aparte con la service role key.
export const supabase = createClient(url, key);
