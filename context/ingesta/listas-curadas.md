# Las siete listas curadas

MusicBrainz resuelve bien al internacional consagrado y mal al local
emergente, que es lo contrario de lo que esta plataforma necesita. **No hay
API que reemplace estas listas** — ver `context/archivo/apis-de-musica.md`.

**Todas exigen un campo `evidencia`, y hay tests que lo verifican.** La regla:
la nacionalidad, la coordenada o la grafía tiene que venir de una fuente
consultable, nunca de memoria ni de criterio propio.

Viven en `services/api/bogota_music_intel/`.

| Archivo | Qué guarda |
|---|---|
| `artistas_locales.py` | origen de artistas que MusicBrainz no cubre |
| `ciclos_curados.py` | fiestas y ciclos, **por nombre**, no por id de evento |
| `festivales_curados.py` | festivales, **por título completo**, no por subcadena |
| `coordenadas_curadas.py` | coordenadas de salas que Nominatim no resuelve |
| `nombres_de_salas.py` | nombres corregidos cuando la fuente los publica mal |
| `fotos_curadas.py` | fotos de sala para el panel del mapa |
| `titulos_curados.py` | grafías de artista y títulos crudos mal escritos |

Detalles que hay que respetar al agregar entradas:

- **Ciclos y festivales ignoran el año final** ("Rock al Parque 2026" ≡ "Rock
  al Parque"), así que la edición siguiente entra sola. Igual que el "Vol. 5"
  de un ciclo.
- ⚠️ **El festival empareja por título completo, no por subcadena.** "Festival
  Orígenes presenta Sara Curruchich y Humazapas" **no** es el festival: es un
  concierto dentro del festival, con dos artistas que MusicBrainz sí resuelve.
  Es festival cuando el título es el nombre del festival **y nada más**; en
  cuanto nombra a quién toca, es un concierto.
- **`nombres_de_salas.py` corrige el nombre visible y nunca el slug**, que
  sale del nombre crudo y es la identidad de la sala: es la clave de las
  coordenadas curadas y lo que evita que el upsert duplique filas.
- **`titulos_curados.py` tiene dos niveles.** Preferir siempre `GRAFIAS` (por
  nombre de artista, sirve para cualquier evento futuro suyo) sobre `TITULOS`
  (por título crudo exacto), que deja de engancharse si la sala cambia una
  coma.
- **`fotos_curadas.py`**: aplicar con `python -m
  bogota_music_intel.fotos_cli [--dry-run]`. Si el host de la imagen no está
  en `images.remotePatterns` de `apps/web/next.config.ts`, Next.js la rechaza.
