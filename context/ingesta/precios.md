# El precio de un evento

Se guarda como **rango**, no como cadena: casi ningún toque tiene un precio
único —varía por localidad, y un festival vende varias boletas—, así que un
solo número afirma algo falso.

Tres columnas (`price_kind`, `price_min`, `price_max`) y cinco clases, en
`services/api/bogota_music_intel/precios.py`. La distinción que importa es
entre **`con_costo`** ("cuesta, no sabemos cuánto" — el 'Entrada con costo' de
Idartes) y **`price_kind` en null** ("no sabemos si cuesta"): es la regla de no
colapsar "no sé" con "confirmado que no", aplicada al precio.

**Los montos se guardan en pesos enteros.** La conversión a lucas es de
presentación y vive en el frontend.

Qué publica cada fuente, que es lo que decidió el diseño:

| Fuente | Qué trae | Clase |
|---|---|---|
| Latino Power | `cost_details.values`, un **arreglo** | `unico` o `rango` |
| Rockal Live | `startingPrice` — un piso | `desde` |
| Idartes | una etiqueta, no un monto | `gratis` / `con_costo` |
| visitbogota | nada usable (su `offers.price` es `"0"` falso) | — |

⚠️ **La trampa que costó el bug: una fuente puede publicar el precio dos veces
y que una de las dos esté redondeada.** Latino Power manda `cost` —un texto ya
redondeado a miles, dice `"$34"`— junto a `cost_details.values`, que trae
`33900`. El scraper leía `cost`, así que **7 eventos se publicaron con el
precio dividido por mil**. Ningún test lo habría notado: `"34"` es una cadena
perfectamente válida. Ahora hay regresión en `tests/test_precio_scrapers.py`.

- **Un 0 conviviendo con montos reales no baja el piso del rango**: es cortesía
  o relleno del gestor de contenidos. Tomarlo publicaría "$0 – 120 lks" y
  anunciaría como gratis un show que cuesta.
- **`price_text` se conserva en `events`** como evidencia cruda de lo que
  publicó la fuente. Es el criterio de siempre: guardar crudo, interpretar en
  lectura.
