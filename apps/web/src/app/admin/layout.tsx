import type { Metadata } from "next";

/**
 * Existe solo para decir que la moderación no se indexa.
 *
 * La pantalla es un componente de cliente, y ahí no se pueden exportar
 * metadatos: tienen que resolverse en el servidor antes de que se renderice.
 * Este envoltorio no dibuja nada.
 *
 * El `noindex` es lo que de verdad mantiene a `/admin` fuera de Google —el
 * `robots.txt` no sirve para eso, ver `app/robots.ts`—. Los datos no
 * dependen de esto: quién puede leer la cola lo decide RLS contra la tabla
 * `admins`, no que la página sea difícil de encontrar.
 */
export const metadata: Metadata = {
  title: "Moderación",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return children;
}
