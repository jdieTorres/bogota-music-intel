-- Fase 4: coordenadas de las salas para el mapa de escena en vivo.
--
-- Se guarda junto a la coordenada la consulta que se hizo y el nombre que
-- devolvió el geocodificador. Un pin en el lugar equivocado es peor que no
-- tener pin, y sin ese rastro no hay forma de auditar si "Movistar Arena"
-- resolvió al estadio o a la estación de TransMilenio del mismo nombre.

alter table venues
    add column if not exists latitude double precision,
    add column if not exists longitude double precision,
    add column if not exists geocode_source text,
    add column if not exists geocode_query text,
    add column if not exists geocode_display_name text,
    add column if not exists geocoded_at timestamptz;

-- Bogotá cabe holgadamente en este rectángulo. Evita que una coordenada
-- disparatada (otro país, lat/lon invertidas) entre a la tabla sin ruido.
alter table venues
    drop constraint if exists venues_coordenadas_en_bogota;

alter table venues
    add constraint venues_coordenadas_en_bogota check (
        (latitude is null and longitude is null)
        or (
            latitude between 4.3 and 4.9
            and longitude between -74.35 and -73.95
        )
    );

create index if not exists venues_coordenadas_idx
    on venues (latitude, longitude)
    where latitude is not null;
