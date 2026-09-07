/**
 * El encabezado de las cuatro páginas públicas.
 *
 * Existe porque las cuatro tenían el mismo bloque copiado, y cualquier
 * ajuste de identidad había que hacerlo cuatro veces.
 *
 * Del rediseño del 2026-09-07: se le quitó el trazo a mano que subrayaba el
 * titular. Era el elemento más decorativo de la página y el que más peleaba
 * con lo "profesional" que pidió Juan; lo cercano lo dan el afiche, la
 * etiqueta manuscrita del masthead y la marca de escena local, que además
 * significan algo. El titular solo necesita escala.
 */
export function EncabezadoDePagina({
  titulo,
  bajada,
}: {
  titulo: string;
  bajada: string;
}) {
  return (
    <section className="pt-10 pb-8 sm:pt-16 sm:pb-10">
      <h1 className="max-w-3xl text-balance font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
        {titulo}
      </h1>
      <p className="mt-5 max-w-lg text-pretty leading-relaxed text-muted">
        {bajada}
      </p>
    </section>
  );
}
