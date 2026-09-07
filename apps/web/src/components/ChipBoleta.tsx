/**
 * El chip de borde punteado: un talón de boleta.
 *
 * Salió del mockup interactivo del look & feel del 2026-08-28, donde estaba
 * anotado como "chips con borde punteado estilo boleta", y es de las pocas
 * piezas de aquel tratamiento ilustrado que sobrevive al rediseño del
 * 2026-09-07 — porque no es decoración: **el borde punteado es la perforación
 * de una boleta**, así que el elemento dice de qué habla el dato que lleva
 * adentro.
 *
 * Por eso lleva el precio y no cualquier cosa. Estuvo un rato con el conteo
 * de la página ("36 conciertos en 10 salas") y ahí no significaba nada; el
 * precio es literalmente lo que va impreso en el talón.
 */
export function ChipBoleta({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block whitespace-nowrap rounded-full border border-dashed border-border px-2.5 py-0.5 font-mono text-xs text-muted">
      {children}
    </span>
  );
}
