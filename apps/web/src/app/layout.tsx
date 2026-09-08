import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Caveat, Geist_Mono, Work_Sans } from "next/font/google";
import "./globals.css";

import { BrandMark } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Bricolage Grotesque es variable: se pide el rango de pesos completo que se
// usa en vez de instancias sueltas, y el navegador baja un solo archivo.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["600", "700"],
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
    "Los toques de la escena bogotana en un solo lugar, recogidos directamente de las carteleras de cada sala.",
};

// Fija `data-theme` antes de que el navegador pinte, para que el modo
// guardado (o "claro" por defecto) salga bien en el primer frame.
// `suppressHydrationWarning` en <html> es necesario porque este atributo lo
// pone este script, no React.
//
// ⚠️ Va como <script> crudo y NO con `next/script`. Se probó con
// `<Script strategy="beforeInteractive">` y no sirve para esto, por dos
// motivos que solo se ven mirando el HTML servido:
//
//   1. Next no lo emite como etiqueta ejecutable: lo encola en
//      `self.__next_s` y lo ejecuta su runtime al arrancar. O sea que el
//      tema depende del bundle de JS y no puede aplicarse antes del primer
//      pintado. En localhost no se nota —CSS y JS llegan en el mismo
//      milisegundo— pero en producción el bundle llega después.
//   2. La propia documentación de Next dice que `beforeInteractive` "no
//      bloquea la hidratación", que es justo la garantía que hace falta acá.
//
// Además tiraba un error de consola en cada navegación del cliente
// ("Scripts inside React components are never executed when rendering on
// the client"). Un <script> crudo en el <head> se ejecuta mientras el
// navegador parsea el HTML, que es exactamente lo que se necesita.
const SCRIPT_TEMA = `
(function () {
  try {
    var guardado = window.localStorage.getItem("bmi-theme");
    document.documentElement.setAttribute(
      "data-theme",
      guardado === "oscuro" ? "oscuro" : "claro",
    );
  } catch (error) {
    document.documentElement.setAttribute("data-theme", "claro");
  }
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-CO"
      suppressHydrationWarning
      className={`${workSans.variable} ${bricolage.variable} ${caveat.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        {/* Masthead: filete abajo y nada más. La barra con fondo propio y
            sombra es lenguaje de aplicación; una publicación se separa de su
            contenido con una línea. `z-20` porque el riel de fechas de la
            cartelera es sticky con `z-10` y tiene que pasar por debajo. */}
        <header className="relative z-20 border-b border-border">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
            <Link href="/" className="group flex items-center gap-2.5">
              <BrandMark className="h-7 w-7 shrink-0" />
              <span className="flex items-baseline gap-2">
                <span className="font-display text-base font-bold tracking-tight sm:text-lg">
                  Cartelera de Bogotá
                </span>
                {/* El único resto manuscrito del header, y va ladeado: es la
                    pizca de lo "cercano" que el resto del masthead no da. */}
                <span className="hidden origin-left -rotate-3 font-hand text-lg text-accent-2 sm:inline">
                  escena en vivo
                </span>
              </span>
            </Link>
            <nav className="flex items-center gap-5 text-sm">
              {/* En móvil no se muestra: va al mismo sitio que el logo, y dos
                  enlaces a la portada en una barra de 390px obligaban al
                  nombre de marca a partirse en dos líneas. */}
              <Link
                href="/"
                className="hidden text-muted transition-colors hover:text-foreground sm:inline"
              >
                Cartelera
              </Link>
              <Link
                href="/mapa"
                className="text-muted transition-colors hover:text-foreground"
              >
                Mapa
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="mt-16 border-t border-border">
          <div className="mx-auto max-w-5xl px-5 py-10 text-xs leading-relaxed text-muted">
            <p className="max-w-md">
              Cartelera recogida automáticamente de los sitios oficiales de cada
              sala. Confirma fecha, hora y precio en el enlace de boletería antes
              de comprar.
            </p>
            <p className="mt-3">
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
