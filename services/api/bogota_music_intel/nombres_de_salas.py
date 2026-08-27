"""Nombres de sala corregidos a mano, cuando la fuente los publica mal.

Rockal Live anuncia "Teatro Libre de Bogotá Sala Centro", pero el teatro
llama a esa sede **Sede Centro**. La cartelera muestra el nombre corregido:
si el nombre está mal, el usuario que busca la sala no la encuentra.

**Se corrige el nombre visible, nunca el slug.** El slug sale de
`venue_name_raw` (el nombre tal como llega de la fuente) y es la identidad
de la sala en toda la base: es la clave de `coordenadas_curadas.py` y lo que
usa el upsert para no duplicar filas. Cambiarlo crearía una sala nueva y
dejaría la coordenada curada apuntando a la vieja. Por eso el diccionario se
indexa por slug y solo reemplaza el nombre.

Para agregar una entrada hace falta saber cómo se llama la sala de verdad,
no que el nombre "se vea raro".
"""

# Clave: slug de la sala (derivado del nombre que publica la fuente).
# Valor: el nombre que se muestra.
NOMBRES_CORREGIDOS: dict[str, str] = {
    # Rockal Live publica las dos sedes del Teatro Libre como "Sala X"; el
    # teatro las llama "Sede X". Confirmado con Juan el 2026-08-27.
    "teatro-libre-de-bogota-sala-centro": "Teatro Libre Sede Centro",
    "teatro-libre-de-bogota-sala-chapinero": "Teatro Libre Sede Chapinero",
}
