import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Geist_Mono, Work_Sans } from "next/font/google";
import "./globals.css";

import { BrandMark } from "@/components/icons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProveedorDeRockola } from "@/components/rockola/Rockola";
import { Tornamesa } from "@/components/rockola/Tornamesa";
import { DESCRIPCION_DEL_SITIO, NOMBRE_DEL_SITIO, SITIO_URL } from "@/lib/sitio";

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

// ⚠️ Sin `weight`, a propósito: así next/font baja el archivo **variable** con
// todo el eje de pesos. Geist Mono escribe los datos tabulares en 400 y la
// etiqueta del masthead en 300 (`font-etiqueta` en `globals.css`), y fijar un
// peso acá dejaría ese 300 sin archivo que lo sostenga — el navegador lo
// fingiría estirando el 400, sin error y sin que se note en una captura.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Lo que se ve al pegar un enlace del sitio en un chat, que para una
// plataforma que existe para promover toques es el caso de uso principal.
//
// Lo de acá es el piso: cada página lo pisa con lo suyo llamando a
// `metadatosDePagina`, y el porqué de que eso tenga que pasar sí o sí —los
// metadatos se mezclan en un solo nivel— está en `src/lib/sitio.ts`.
//
// **No hay imagen por defecto, y es deliberado.** La tarjeta del sitio
// entero tendría que llevar la marca, y el nombre definitivo todavía no
// existe: hoy saldría un dibujo con un nombre que va a cambiar. Los enlaces
// que de verdad se comparten —un evento, un artista— sí llevan imagen, que
// es el afiche o la foto, y eso es un dato real y no una pieza de identidad.
export const metadata: Metadata = {
  metadataBase: SITIO_URL,
  title: {
    default: NOMBRE_DEL_SITIO,
    template: `%s · ${NOMBRE_DEL_SITIO}`,
  },
  description: DESCRIPCION_DEL_SITIO,
  openGraph: {
    type: "website",
    siteName: NOMBRE_DEL_SITIO,
    locale: "es_CO",
    url: "/",
    title: NOMBRE_DEL_SITIO,
    description: DESCRIPCION_DEL_SITIO,
  },
  // Va solo acá y en ninguna página: es el formato de la tarjeta, igual en
  // todo el sitio. Título, texto e imagen los toma de `openGraph`, así que
  // repetirlo por página solo abriría dos copias que se desfasan.
  twitter: { card: "summary_large_image" },
};

// Fija `data-theme` antes de que el navegador pinte, para que el modo
// guardado (o el oscuro por defecto, desde el 2026-09-16) salga bien en el
// primer frame.
//
// ⚠️ Escribe el atributo **siempre**, incluido el caso por defecto, aunque
// el CSS ya sirva oscuro sin él: el toggle lee ese atributo como fuente de
// verdad, y un `<html>` sin atributo lo dejaría adivinando.
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
      guardado === "claro" ? "claro" : "oscuro",
    );
  } catch (error) {
    document.documentElement.setAttribute("data-theme", "oscuro");
  }
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es-CO"
      suppressHydrationWarning
      className={`${workSans.variable} ${bricolage.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <ProveedorDeRockola>
        {/* Masthead: filete abajo y nada más. La barra con fondo propio y
            sombra es lenguaje de aplicación; una publicación se separa de su
            contenido con una línea. `z-20` porque el riel de fechas de la
            cartelera es sticky con `z-10` y tiene que pasar por debajo. */}
        <header className="relative z-20 border-b border-border">
          {/* ⚠️ Envuelve en móvil desde que la barra tiene tres destinos.
              Con "Directorio" adentro ya no caben en una línea de 390px, y lo
              que cedía era el nombre de marca, que se partía en dos —
              exactamente lo que se había evitado escondiendo "Cartelera" en
              móvil. Cede la navegación, que baja entera a su propia línea, y
              la marca se queda como está. En escritorio no cambia nada. */}
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-5 py-4">
            <Link href="/" className="group -my-2 flex items-center gap-3 py-2">
              <BrandMark className="h-11 w-11 shrink-0 sm:h-12 sm:w-12" />
              {/* En columna desde el 2026-09-16, a pedido de Juan: el nombre
                  crece y la etiqueta pasa a ser su subtítulo en vez de un
                  añadido a su derecha. Dos efectos que valen la pena
                  nombrar: la marca ocupa ahora dos líneas propias —así que
                  el ancho deja de ser lo que la limita, y por eso el nombre
                  puede crecer sin pelear con la navegación— y la etiqueta
                  **aparece también en móvil**, donde antes estaba escondida
                  justamente porque al lado del nombre no cabía. */}
              <span className="flex flex-col">
                {/* El bloque de marca está un 20% por encima de como quedó
                    al pasar a dos líneas (era 20/24), en dos pasadas de 10%
                    que pidió Juan. En móvil el tamaño cae justo en
                    `text-2xl`; en escritorio no hay escalón que sirva —el
                    siguiente es `text-3xl`, 30 px— así que ese va arbitrario
                    y redondeado al píxel: 28,8 exactos serían.

                    ⚠️ Los tres elementos del bloque crecen juntos, siempre:
                    ícono, nombre y subtítulo. Subir uno solo descuadra el
                    conjunto, y el ícono chico contra un nombre grande fue el
                    primer efecto que hubo que corregir acá. */}
                <span className="font-display text-2xl font-bold leading-none tracking-tight sm:text-[1.8125rem]">
                  Cartelera de Bogotá
                </span>
                {/* Sin ladeo desde el 2026-09-16, también decisión de Juan.
                    El −3° venía de cuando la letra era manuscrita y quería
                    leerse como una nota al margen; debajo del nombre y
                    alineada con él, la inclinación solo se veía como un
                    renglón torcido. */}
                <span className="mt-1.5 font-etiqueta text-sm leading-none text-accent-2 sm:text-[1.0625rem]">
                  escena en vivo
                </span>
              </span>
            </Link>
            <nav className="flex w-full items-center justify-end gap-5 text-sm sm:w-auto">
              {/* `-my-3 py-3` crece el área de toque sin mover el texto:
                  estos enlaces medían 20px de alto contra los 44 que pide
                  un objetivo táctil, y el masthead es lo que más se toca
                  desde el teléfono. */}
              {/* **Se muestra también en móvil desde el 2026-09-16**, y hasta
                  ese día no: iba escondido porque en 390 px compartía línea
                  con el nombre de marca y lo obligaba a partirse en dos. Ese
                  motivo se murió cuando la navegación pasó a su propia fila y
                  la marca a un bloque aparte, pero la clase se quedó — así
                  que en el teléfono la cartelera era el único destino sin
                  enlace en la barra, y **quien estaba en el directorio no
                  tenía cómo volver salvo tocando la marca**, que no dice a
                  dónde lleva. Lo vio Juan mirando el sitio en su teléfono.

                  Sigue apuntando al mismo sitio que la marca, y eso está
                  bien: una barra de navegación nombra sus destinos; un logo
                  no es un nombre. */}
              <Link
                href="/"
                className="-my-3 inline-block py-3 text-muted transition-colors hover:text-foreground"
              >
                Cartelera
              </Link>
              <Link
                href="/directorio"
                className="-my-3 inline-block py-3 text-muted transition-colors hover:text-foreground"
              >
                Directorio
              </Link>
              <Link
                href="/mapa"
                className="-my-3 inline-block py-3 text-muted transition-colors hover:text-foreground"
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
                className="-my-3 inline-block py-3 underline underline-offset-4 transition-colors hover:text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                código en GitHub
              </a>
            </p>
          </div>
        </footer>

        {/* La bandeja va acá, en el layout, y no dentro de una página: es lo
            que hace que la música siga sonando mientras se recorre el mapa y
            la cartelera. Montada en una página, cambiar de ruta cortaría la
            canción. No pinta nada hasta que alguien pone algo.

            El `pb` del footer no se toca: la bandeja tapa el final del
            desplazamiento solo mientras suena, y el propio componente reserva
            su alto cuando existe. */}
        <Tornamesa />
        </ProveedorDeRockola>
      </body>
    </html>
  );
}
