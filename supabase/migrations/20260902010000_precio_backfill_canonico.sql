-- Le baja al canónico el precio que ya está bien en el crudo (2026-09-02).
--
-- Segunda mitad de `20260902000000_precio_estructurado.sql`. Aquella no pudo
-- hacer esto porque el crudo todavía no tenía los montos: los trajo la corrida
-- del scraper posterior, que ya lee `cost_details.values` de Latino Power en
-- vez de su `cost` redondeado.
--
-- **Por qué se puede pisar sin preguntar, que es la parte que importa:** la
-- regla del proyecto es que el scraper nunca escribe encima de lo que decidió
-- el admin. Acá no hay nada que pisar — las tres columnas nacieron ayer y
-- nadie ha editado un precio todavía. Solo se tocan las filas que las tienen
-- en null, así que si alguien alcanzó a escribir una, se respeta.
--
-- Sin esto, 7 eventos publicados de Latino Power se quedan sin precio en
-- pantalla para siempre: la migración anterior no los pudo traducir a
-- propósito ("$34" perdió los miles y recuperarlos sería adivinar) y la
-- detección de cambios tampoco los iba a rescatar, porque compara contra una
-- foto que se tomó cuando estas columnas no existían.

-- ---------------------------------------------------------------------------
-- 1. El precio, desde la fila cruda que lo publique.
-- ---------------------------------------------------------------------------
-- Un canónico puede colgar de varias fuentes y no todas publican precio, así
-- que se toma la primera que sí. Cuando dos publiquen precios distintos esto
-- elige una: es aceptable para un backfill de una sola vez —hoy ninguna fuente
-- pisa a otra— y de ahí en adelante decide el admin en la cola.

update canonical_events c
   set price_kind = f.price_kind,
       price_min  = f.price_min,
       price_max  = f.price_max
  from (
        select distinct on (canonical_id)
               canonical_id, price_kind, price_min, price_max
          from events
         where canonical_id is not null
           and price_kind is not null
         order by canonical_id, price_min nulls last
       ) f
 where f.canonical_id = c.id
   and c.price_kind is null;

-- ---------------------------------------------------------------------------
-- 2. La foto de origen, al día.
-- ---------------------------------------------------------------------------
-- `source_snapshot` es "lo que ya vi de la fuente". Las fotos viejas no tienen
-- las claves de precio, así que la próxima corrida del cron leería null contra
-- 33900 y mandaría a la cola ~20 eventos publicados diciendo que la sala movió
-- el precio. Sería falso: la sala no movió nada, cambió lo que nosotros
-- sabemos leer.
--
-- Se agregan SOLO las tres claves nuevas (`||` mezcla, no reemplaza), así que
-- todo lo demás que la foto vigila queda intacto y cualquier cambio real que
-- estuviera pendiente se sigue detectando.

update canonical_events c
   set source_snapshot = c.source_snapshot || jsonb_build_object(
           'price_kind', to_jsonb(f.price_kind),
           'price_min',  to_jsonb(f.price_min),
           'price_max',  to_jsonb(f.price_max)
       )
  from (
        select distinct on (canonical_id)
               canonical_id, price_kind, price_min, price_max
          from events
         where canonical_id is not null
         order by canonical_id, (price_kind is null), price_min nulls last
       ) f
 where f.canonical_id = c.id
   and c.source_snapshot is not null;
