"use client";

/**
 * El precio, como control en vez de como campo de texto libre.
 *
 * Era un `<input>` plano y eso obligaba a escribir a mano una cadena que
 * después nadie podía interpretar: así convivieron en la base "$34",
 * "$107,000 COP", "Entrada libre" y "Entrada con costo", cuatro formas de
 * decir cosas distintas en la misma columna.
 *
 * Los seis modos son los estados que ya existían en los datos, no una lista
 * inventada. El que más importa es la diferencia entre **Sin dato** ("no
 * sabemos si cuesta") y **Con costo** ("cuesta, no sabemos cuánto"): es la
 * regla de siempre de no colapsar "no sé" con "confirmado que no".
 */

import { CAMPO, Rotulo } from "@/components/admin/ui";
import { formatearPrecio, type ClasePrecio, type PrecioEvento } from "@/lib/precio";

/** El modo que ve el admin. `"sin_dato"` es `price_kind = null` en la base:
 *  un `<button>` no puede tener valor null, igual que el `<select>` de tipo. */
type Modo = ClasePrecio | "sin_dato";

const MODOS: { modo: Modo; etiqueta: string; ayuda: string }[] = [
  { modo: "sin_dato", etiqueta: "Sin dato", ayuda: "No sabemos si cuesta. No sale nada." },
  { modo: "gratis", etiqueta: "Gratis", ayuda: "Sale como “Entrada libre”." },
  { modo: "unico", etiqueta: "Único", ayuda: "Un solo precio para todo el mundo." },
  { modo: "rango", etiqueta: "Rango", ayuda: "Varía por localidad, o el festival vende varias boletas." },
  { modo: "desde", etiqueta: "Desde", ayuda: "Sabés el más barato y no el techo." },
  { modo: "con_costo", etiqueta: "Con costo", ayuda: "Cuesta, pero la fuente no publicó cuánto." },
];

export function CampoDePrecio({
  valor,
  alCambiar,
}: {
  valor: PrecioEvento;
  alCambiar: (valor: PrecioEvento) => void;
}) {
  const modo: Modo = valor.price_kind ?? "sin_dato";
  const activo = MODOS.find((m) => m.modo === modo) ?? MODOS[0];
  const vistaPrevia = formatearPrecio(valor);

  /** Cambiar de modo conserva los montos que siguen teniendo sentido.
   *  Pasar de "único" a "rango" no debería borrar lo que ya escribiste. */
  function cambiarModo(nuevo: Modo) {
    if (nuevo === "sin_dato" || nuevo === "con_costo") {
      alCambiar({ price_kind: nuevo === "sin_dato" ? null : nuevo, price_min: null, price_max: null });
      return;
    }
    if (nuevo === "gratis") {
      alCambiar({ price_kind: "gratis", price_min: 0, price_max: 0 });
      return;
    }
    const min = valor.price_min || null;
    if (nuevo === "unico") alCambiar({ price_kind: "unico", price_min: min, price_max: min });
    if (nuevo === "desde") alCambiar({ price_kind: "desde", price_min: min, price_max: null });
    if (nuevo === "rango")
      alCambiar({ price_kind: "rango", price_min: min, price_max: valor.price_max || null });
  }

  function cambiarMonto(campo: "price_min" | "price_max", pesos: number | null) {
    const siguiente = { ...valor, [campo]: pesos };
    // Un precio único es el mismo número en los dos extremos: se mantiene solo
    // para que el rango guardado sea siempre coherente.
    if (siguiente.price_kind === "unico") siguiente.price_max = siguiente.price_min;
    alCambiar(siguiente);
  }

  const pideMinimo = modo === "unico" || modo === "rango" || modo === "desde";
  const pideMaximo = modo === "rango";
  // El techo por debajo del piso se lee como un precio normal y nadie lo nota;
  // la base lo rechaza, así que conviene decirlo antes de intentar guardar.
  const rangoInvertido =
    modo === "rango" &&
    valor.price_min !== null &&
    valor.price_max !== null &&
    valor.price_max < valor.price_min;

  return (
    <div>
      <Rotulo>$</Rotulo>

      <div className="flex flex-wrap gap-1.5">
        {MODOS.map(({ modo: m, etiqueta }) => (
          <button
            key={m}
            type="button"
            onClick={() => cambiarModo(m)}
            aria-pressed={m === modo}
            className={
              m === modo
                ? "rounded-md border border-accent bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
                : "rounded-md border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:text-foreground"
            }
          >
            {etiqueta}
          </button>
        ))}
      </div>

      {(pideMinimo || pideMaximo) && (
        <div className="mt-2 flex gap-2">
          {pideMinimo && (
            <MontoEnPesos
              etiqueta={modo === "unico" ? "Precio" : "Desde"}
              pesos={valor.price_min}
              alCambiar={(p) => cambiarMonto("price_min", p)}
            />
          )}
          {pideMaximo && (
            <MontoEnPesos
              etiqueta="Hasta"
              pesos={valor.price_max}
              alCambiar={(p) => cambiarMonto("price_max", p)}
            />
          )}
        </div>
      )}

      <p className="mt-1.5 text-xs leading-relaxed text-muted">
        {activo.ayuda}{" "}
        {vistaPrevia ? (
          <>
            Se verá: <span className="font-medium text-foreground">{vistaPrevia}</span>
          </>
        ) : null}
      </p>

      {rangoInvertido && (
        <p className="mt-1 text-xs text-red-400">
          El techo no puede ser menor que el piso.
        </p>
      )}
    </div>
  );
}

/**
 * Un monto en pesos, escrito con separador de miles a medida que se teclea.
 *
 * Se escribe en pesos y no en lucas a propósito: es como lo publica la
 * boletería, así que copiarlo no obliga a hacer una división mental. La
 * conversión a lucas se ve en la vista previa, que es donde importa.
 */
function MontoEnPesos({
  etiqueta,
  pesos,
  alCambiar,
}: {
  etiqueta: string;
  pesos: number | null;
  alCambiar: (pesos: number | null) => void;
}) {
  return (
    <label className="flex-1">
      <span className="mb-1 block text-xs text-muted">{etiqueta}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted">$</span>
        <input
          // `inputMode` en vez de `type="number"`: el number nativo rechaza los
          // puntos de miles y sube flechitas que acá no sirven de nada.
          inputMode="numeric"
          value={pesos === null ? "" : pesos.toLocaleString("es-CO")}
          onChange={(e) => alCambiar(soloDigitos(e.target.value))}
          placeholder="33.900"
          className={CAMPO}
        />
      </div>
    </label>
  );
}

/** Lo que se teclea, leído como pesos. Se ignoran los separadores para que
 *  pegar "$33.900 COP" desde la boletería funcione sin limpiarlo a mano. */
function soloDigitos(texto: string): number | null {
  const digitos = texto.replace(/\D/g, "");
  return digitos ? Number(digitos) : null;
}
