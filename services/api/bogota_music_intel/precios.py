"""El precio de un evento, como rango en vez de como cadena.

Casi ningún toque tiene un precio único: varía por localidad dentro de la sala,
y un festival vende varias clases de boleta. Un solo número afirma algo falso.

Cinco estados, y la diferencia entre los dos últimos es la de siempre —"no sé"
y "confirmado que no" no se colapsan:

    gratis      la entrada no cuesta
    unico       un solo precio
    rango       hay piso y techo
    desde       sabemos el piso, no el techo (`startingPrice` de Rockal Live)
    con_costo   sabemos que cuesta, no cuánto ('Entrada con costo' de Idartes)

Y `None` como clase significa que no sabemos ni siquiera si cuesta, que no es
lo mismo que `con_costo`.

**Los montos se guardan en pesos enteros, no en miles.** La conversión a
"lucas" es de presentación y vive en el frontend: guardar 33.9 obligaría a
decidir acá cuántos decimales sobreviven, que es una decisión de cómo se ve.
"""
from dataclasses import dataclass
from typing import Literal

ClasePrecio = Literal["gratis", "unico", "rango", "desde", "con_costo"]


@dataclass(frozen=True)
class Precio:
    kind: ClasePrecio
    min: int | None = None
    max: int | None = None

    def as_row(self) -> dict[str, object]:
        return {"price_kind": self.kind, "price_min": self.min, "price_max": self.max}


#: Lo que se guarda cuando la fuente no dice nada del precio.
SIN_DATO: dict[str, object] = {"price_kind": None, "price_min": None, "price_max": None}


def desde_montos(valores: list[int | float | str | None]) -> Precio | None:
    """Arma el precio a partir de los montos que publica una fuente.

    Es la entrada natural para las fuentes que exponen una lista —Latino Power
    manda `cost_details.values`, que es un arreglo justamente porque un evento
    puede tener varias boletas—. Un solo valor da `unico`, varios distintos dan
    `rango`, y cero da `None` para que el llamador decida qué significa eso en
    su fuente.

    Un 0 suelto es gratis, pero un 0 conviviendo con montos reales es la boleta
    de cortesía o el relleno del gestor de contenidos, no el piso del rango: se
    descarta. Publicar "$0 – 120 lks" anunciaría como gratis un show que no lo
    es, que es exactamente el error que ya se evitó con `offers.price` de
    visitbogota.
    """
    montos: list[int] = []
    for valor in valores:
        monto = _a_entero(valor)
        if monto is not None:
            montos.append(monto)

    if not montos:
        return None
    if all(m == 0 for m in montos):
        return Precio("gratis", 0, 0)

    reales = sorted({m for m in montos if m > 0})
    if len(reales) == 1:
        return Precio("unico", reales[0], reales[0])
    return Precio("rango", reales[0], reales[-1])


def desde_piso(valor: float | str | None) -> Precio | None:
    """Un precio "desde": sabemos el más barato y nada más.

    Rockal Live publica `startingPrice`, y el nombre del campo es el dato: es
    el piso, no el precio. Mostrarlo pelado afirmaría que el show cuesta eso.
    """
    monto = _a_entero(valor)
    if monto is None:
        return None
    if monto == 0:
        return Precio("gratis", 0, 0)
    return Precio("desde", monto, None)


def desde_etiqueta(texto: str | None) -> Precio | None:
    """Traduce las etiquetas de las fuentes que no publican un monto.

    Idartes escribe 'Entrada libre' o 'Entrada con costo'. La segunda no es
    ruido: dice que el evento cuesta, aunque no cuánto, y eso es más de lo que
    dice un campo vacío. Cualquier otra cosa devuelve `None` en vez de
    intentar interpretarla — una etiqueta que no reconocemos no se adivina.
    """
    if not texto:
        return None
    normalizado = " ".join(texto.split()).strip().lower()
    if normalizado in ("entrada libre", "gratis", "entrada gratuita", "gratuito"):
        return Precio("gratis", 0, 0)
    if normalizado in ("entrada con costo", "con costo"):
        return Precio("con_costo")
    return None


def _a_entero(valor: float | str | None) -> int | None:
    """Un monto en pesos, o `None` si no hay forma honesta de leerlo.

    Las fuentes mandan el número de tres formas distintas —entero, decimal y
    cadena— y a veces con separadores. Lo que no se pueda leer devuelve `None`
    en vez de un 0, que se publicaría como "gratis".
    """
    if valor is None or isinstance(valor, bool):
        return None
    if isinstance(valor, int):
        return valor if valor >= 0 else None
    if isinstance(valor, float):
        return round(valor) if valor >= 0 else None

    texto = valor.strip()
    if not texto:
        return None
    # "33900", "33.900", "33,900", "$33.900 COP" — se quitan los separadores y
    # el resto tiene que ser dígitos. Un texto con letras adentro no es un
    # monto y no se fuerza.
    limpio = (
        texto.replace("$", "")
        .replace("COP", "")
        .replace(".", "")
        .replace(",", "")
        .replace(" ", "")
        .replace("\xa0", "")
    )
    if not limpio.isdigit():
        return None
    return int(limpio)
