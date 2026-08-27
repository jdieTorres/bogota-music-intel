import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Cartelera de Bogotá",
    template: "%s · Cartelera de Bogotá",
  },
  description:
    "Los conciertos de la escena bogotana en un solo lugar, recogidos directamente de las carteleras de cada sala.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-CO"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-border">
          <div className="mx-auto flex max-w-5xl items-baseline justify-between gap-4 px-5 py-5">
            <Link href="/" className="group flex items-baseline gap-2">
              <span className="text-lg font-semibold tracking-tight">
                Cartelera de Bogotá
              </span>
              <span className="hidden text-xs text-muted sm:inline">
                escena en vivo
              </span>
            </Link>
            <nav className="flex items-baseline gap-4 text-sm">
              <Link
                href="/"
                className="text-muted transition-colors hover:text-foreground"
              >
                Cartelera
              </Link>
              <Link
                href="/mapa"
                className="text-muted transition-colors hover:text-foreground"
              >
                Mapa
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-border">
          <div className="mx-auto max-w-5xl px-5 py-8 text-xs leading-relaxed text-muted">
            <p>
              Cartelera recogida automáticamente de los sitios oficiales de cada
              sala. Confirmá fecha, hora y precio en el enlace de boletería antes
              de comprar.
            </p>
            <p className="mt-2">
              Proyecto personal ·{" "}
              <a
                href="https://github.com/jdieTorres/bogota-music-intel"
                className="underline underline-offset-4 transition-colors hover:text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                código en GitHub
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
