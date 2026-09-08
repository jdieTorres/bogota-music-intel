"use client";

import { GENEROS_SUGERIDOS } from "@/lib/admin/generos";

/** Los átomos visuales que comparten las dos secciones de moderación.
 *  Viven aparte para que eventos y salas se vean iguales sin copiar clases. */

export const BOTON =
  "rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90";
export const BOTON_TENUE =
  "rounded-md border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:text-foreground";
export const BOTON_ROJO =
  "rounded-md border border-red-500/40 px-3 py-1.5 text-xs text-red-400 transition-colors hover:text-red-300";
// Sin `outline-none`: apagaba el anillo del navegador y lo reemplazaba solo
// con un cambio de color de borde. El anillo lo pone la regla global de
// `globals.css`; el borde se queda como refuerzo, que en un campo de texto
// se agradece también al hacer click.
export const CAMPO =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent";

export function Marco({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">{children}</div>;
}

export function Etiqueta({ children, acento }: { children: React.ReactNode; acento?: boolean }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wide ${
        acento ? "border-accent text-accent" : "border-border text-muted"
      }`}
    >
      {children}
    </span>
  );
}


export function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block font-mono text-[11px] uppercase tracking-widest text-muted">
      {children}
    </span>
  );
}

/**
 * Campo de URL de imagen con vista previa.
 *
 * **La vista previa es el punto, no un adorno.** Una URL pegada a mano falla
 * de maneras que el texto no delata: el sitio de la sala sirve la foto solo a
 * quien viene de su propia página, la de Instagram caduca a los días, o el
 * enlace copiado apunta a la página que contiene la imagen y no a la imagen.
 * Los tres casos se guardan sin error y se descubren después, cuando alguien
 * abre el mapa. Acá se ven antes de guardar.
 *
 * Va con `<img>` y no con `next/image` a propósito: el optimizador de Next
 * exige que el host esté en `images.remotePatterns`, y el sentido de este
 * campo es justamente que la URL pueda venir de cualquier lado.
 */
export function CampoDeImagen({
  valor,
  alCambiar,
  ayuda,
}: {
  valor: string | null;
  alCambiar: (v: string | null) => void;
  ayuda?: React.ReactNode;
}) {
  const url = valor?.trim() ?? "";
  // No se valida "que parezca una URL de imagen" por la extensión: media
  // internet sirve fotos desde rutas sin extensión. Lo que contesta de
  // verdad si la URL sirve es cargarla, y eso es lo que hace la vista previa.
  const esHttps = url === "" || url.startsWith("https://");

  return (
    <div>
      <Rotulo>Foto de la sala</Rotulo>
      <input
        value={url}
        onChange={(e) => alCambiar(e.target.value.trim() || null)}
        placeholder="https://…"
        className={CAMPO}
      />
      {ayuda && <p className="mt-1 text-xs text-muted">{ayuda}</p>}
      {!esHttps && (
        <p className="mt-1 text-xs text-red-400">
          Tiene que empezar en https:// — una imagen por http la bloquea el navegador.
        </p>
      )}
      {url !== "" && esHttps && (
        <div className="mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            className="aspect-[16/9] w-full max-w-sm rounded-md border border-border object-cover"
            onError={(e) => {
              e.currentTarget.hidden = true;
              e.currentTarget.nextElementSibling?.removeAttribute("hidden");
            }}
            onLoad={(e) => {
              e.currentTarget.hidden = false;
              e.currentTarget.nextElementSibling?.setAttribute("hidden", "");
            }}
          />
          <p hidden className="text-xs text-red-400">
            Esa URL no carga. Probala abriéndola sola en una pestaña: si ahí se ve,
            el sitio no permite mostrarla desde otro lado y hace falta otra.
          </p>
        </div>
      )}
    </div>
  );
}

/** "03 sep 26". Se arma por partes porque `es-CO` interpone "de" entre
 *  ellas ("03 de sept de 26") y en una columna angosta eso parte el
 *  renglón en dos líneas. */
export function fechaCompacta(iso: string | null): string {
  if (!iso) return "sin fecha";
  const partes = new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    day: "2-digit",
    month: "short",
    year: "2-digit",
  }).formatToParts(new Date(iso));
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${valor("day")} ${valor("month").replace(".", "")} ${valor("year")}`;
}


/**
 * La fecha y la hora, en dos campos separados.
 *
 * **Eran un solo `datetime-local` hasta el 2026-09-08, y era un bug.** Ese
 * control exige las dos mitades: mientras falte la hora devuelve cadena
 * vacía, así que escribir solo el día no guardaba nada y el evento quedaba
 * sin fecha sin aviso. En esta escena eso es el caso común, no el raro: el
 * afiche anuncia el día y muy seguido no anuncia la hora.
 *
 * Separados, cada dato entra por su cuenta y el hueco de la hora es un hueco
 * de verdad — que la cartelera ya sabe mostrar sin inventar "12:00 a. m.".
 *
 * La conversión a hora de Bogotá vive en `lib/admin/fecha.ts`, aparte y con
 * pruebas.
 */
export function CampoDeFechaYHora({
  fecha,
  hora,
  alCambiar,
}: {
  fecha: string;
  hora: string;
  alCambiar: (campos: { fecha: string; hora: string }) => void;
}) {
  return (
    <>
      <label>
        <Rotulo>Fecha</Rotulo>
        <input
          type="date"
          value={fecha}
          onChange={(e) => alCambiar({ fecha: e.target.value, hora })}
          className={CAMPO}
        />
      </label>
      <label>
        <Rotulo>Hora</Rotulo>
        <input
          type="time"
          value={hora}
          onChange={(e) => alCambiar({ fecha, hora: e.target.value })}
          className={CAMPO}
        />
        <p className="mt-1 text-xs text-muted">
          Si el afiche no la anuncia, déjala vacía: el evento se guarda con la fecha
          y la cartelera no muestra ninguna hora.
        </p>
      </label>
    </>
  );
}


/**
 * El campo de género, compartido por la carga a mano y la ficha de la cola.
 *
 * Escribe en `category`, que es la misma columna que llena el scraper. No
 * hace falta una columna aparte —la regla de "las ediciones del admin van
 * en columnas propias" es para `events`, el crudo que el cron reescribe—:
 * `canonical_events` es justamente la copia editable, y lo que se escribe
 * acá sobrevive a las corridas del cron.
 *
 * Es opcional. Vacío significa "no lo sé", que es el hueco honesto de
 * siempre; el chip simplemente no sale.
 */
export function CampoDeGenero({
  valor,
  alCambiar,
}: {
  valor: string | null;
  alCambiar: (valor: string | null) => void;
}) {
  return (
    <label>
      <Rotulo>Género (opcional)</Rotulo>
      <input
        value={valor ?? ""}
        onChange={(e) => alCambiar(e.target.value || null)}
        list="generos-sugeridos"
        placeholder="Salsa, Rock/Punk/Metal…"
        className={CAMPO}
      />
      <datalist id="generos-sugeridos">
        {GENEROS_SUGERIDOS.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>
      {/* Por qué esto importa: la fuente escribe acá su taxonomía —"Conciertos"
          en visitbogota, "Música" en Idartes— y eso no es un género. La
          cartelera esconde esos valores (`generoVisible`), así que si el campo
          dice uno de esos, el evento sale sin chip hasta que lo corrijas. */}
      <span className="mt-1 block text-xs leading-relaxed text-muted">
        Sale como chip al lado del título. &ldquo;Conciertos&rdquo;,
        &ldquo;Música&rdquo; y &ldquo;Otro&rdquo; no se muestran: son la etiqueta
        de la fuente, no un género.
      </span>
    </label>
  );
}
