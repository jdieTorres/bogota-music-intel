import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. " +
      "Copiá apps/web/.env.example a .env.local y completá los valores del proyecto Supabase.",
  );
}

// Clave publicable: solo lectura. Las políticas RLS de la base permiten
// SELECT público sobre venues y events, y bloquean cualquier escritura —
// el pipeline de scraping escribe aparte con la service role key.
export const supabase = createClient(url, key);
