-- El cartel deja de aplanarse dentro del título (2026-09-15).
--
-- `normalizar_titulo()` calcula tres cosas de cada título crudo: la lista de
-- artistas, la gira, y el texto que sale de pegarlas. Hasta hoy se guardaba
-- solo lo tercero. "Mukangu/Atake Mapale/ Los Yoryis" entraba como "Mukangu &
-- Atake Mapalé & Los Yoryis" y los tres nombres sueltos se botaban, aunque el
-- código los tuviera en la mano un renglón antes de unirlos.
--
-- El lector de afiches hacía lo mismo por otro camino: devuelve `artistas:
-- string[]` en el orden en que aparecen impresos —la mejor fuente que hay de
-- quién encabeza— y lo volcaba a las notas como "Cartel: X & Y & Z", texto
-- para que el admin lo volviera a teclear a mano.
--
-- El "&" encadenado se lee mal con tres nombres y es ilegible con cinco. Pero
-- el problema de fondo no es tipográfico: **una frase no enlaza con nada.**
-- Mientras los tres nombres vivan pegados dentro de `title`, el directorio no
-- puede saber que ahí hay tres artistas, y las dos señales de recomendación
-- que dependen del cartel no tienen de dónde salir.
--
-- ⚠️ **Esto es una sugerencia, no el cartel.** Quién tocó de verdad vive en
-- `event_artists`: lo confirma una persona y son fichas del directorio. Esta
-- lista son nombres leídos de la fuente o del afiche, así que se muestran como
-- texto sin enlace, y el cartel manda sobre ella en cuanto exista. Es la misma
-- distinción que ya rige entre `category` —señal cruda, nunca se muestra— y
-- `generos` —lo escribe una persona—.
--
-- `title` no se toca. Sigue siendo lo que se comparte, lo que edita el admin y
-- lo que sobrevive al cron. Ninguno de los eventos ya publicados cambia de
-- título por esta migración, y el relleno de las filas que ya existen es un
-- update masivo que va aparte, con autorización.

alter table canonical_events
    add column if not exists artistas text[] not null default '{}',
    add column if not exists gira text;

comment on column canonical_events.artistas is
    'Los artistas del cartel tal como los leyó la fuente o el afiche, en el orden en que venían. Es una sugerencia y no una afirmación: el cartel confirmado vive en `event_artists` y manda sobre esta lista. Con cero o un nombre, la pantalla muestra `title`.';

comment on column canonical_events.gira is
    'La gira o el ciclo que venía detrás del artista en el título crudo, lo que hoy queda tras el " | ". Se guarda aparte para poder componer el encabezado desde la lista sin perderla.';
