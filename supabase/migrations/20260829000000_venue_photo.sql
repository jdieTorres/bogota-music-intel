-- Panel de sala en el mapa: al tocar un venue se muestra su foto, dirección
-- y eventos, debajo del mapa (decidido con Juan el 2026-08-29).
--
-- No hay foto de venue en ninguna fuente que scrapeamos hoy —los afiches
-- son de cada evento, no de la sala—, así que esto es un hueco honesto
-- hasta que Juan cargue fotos reales, mismo criterio que las coordenadas
-- curadas: mejor sin foto que una imagen que no es la sala.

alter table venues
    add column if not exists photo_url text;

comment on column venues.photo_url is
    'Foto de la sala, curada a mano en fotos_curadas.py. Null hasta que se cargue una.';
