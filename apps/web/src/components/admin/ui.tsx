"use client";

/** Los átomos visuales que comparten las dos secciones de moderación.
 *  Viven aparte para que eventos y salas se vean iguales sin copiar clases. */

export const BOTON =
  "rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90";
export const BOTON_TENUE =
  "rounded-md border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:text-foreground";
export const BOTON_ROJO =
  "rounded-md border border-red-500/40 px-3 py-1.5 text-xs text-red-400 transition-colors hover:text-red-300";
export const CAMPO =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent";

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


// Bogotá es UTC-5 todo el año. Se convierte a mano y no con la zona horaria
// del navegador: el admin podría estar en otro lado, y una hora movida cinco
// horas es exactamente el error que este proyecto ya cometió dos veces.
const OFFSET_BOGOTA_MS = 5 * 60 * 60 * 1000;

export function aCampoDeFecha(iso: string | null): string {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() - OFFSET_BOGOTA_MS).toISOString().slice(0, 16);
}

export function desdeCampoDeFecha(valor: string): string | null {
  return valor ? `${valor}:00-05:00` : null;
}

