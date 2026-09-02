-- El precio deja de ser una cadena y pasa a ser un rango (pedido por Juan el
-- 2026-09-02).
--
-- El motivo de producto: casi ningún toque tiene un precio único. Varía por
-- localidad dentro de la sala, y un festival vende varias clases de boleta.
-- Mostrar un solo número afirma algo falso; el rango dice lo que se sabe.
--
-- El motivo técnico apareció al mirar los datos, y es un bug real: Latino
-- Power publica DOS campos y el scraper venía tomando el equivocado. `cost`
-- es un texto ya redondeado a miles —dice "$34"— mientras `cost_details.
-- values` trae el monto de verdad, 33900. O sea que 7 eventos están
-- publicados con el precio dividido por mil. Y `values` es un ARREGLO: la
-- propia fuente ya contempla varios precios por evento, que es justo el caso
-- que esta migración viene a modelar.
--
-- Cuatro estados que hoy conviven en `price_text` y que una sola columna de
-- texto no puede distinguir sin adivinar:
--   'Entrada libre'      (Idartes)  -> gratis
--   'Entrada con costo'  (Idartes)  -> hay precio pero no sabemos cuál
--   '$107,000 COP'       (Rockal)   -> es un `startingPrice`, un piso
--   '$34'                (Latino)   -> un monto, mal leído
--
-- `price_kind` en null significa "no sabemos si cuesta", que NO es lo mismo
-- que 'con_costo' ("sabemos que cuesta, no cuánto"). Es la misma regla de
-- siempre: "no sé" y "confirmado que no" no se colapsan.

-- ---------------------------------------------------------------------------
-- 1. Las columnas, en las dos capas.
-- ---------------------------------------------------------------------------
-- Van en `events` además de en `canonical_events` porque el scraper ahora las
-- parsea, y porque `source_snapshot` las vigila: si la sala mueve el precio,
-- el evento tiene que volver a la cola. Sin la columna en el crudo no habría
-- contra qué comparar.

alter table events
    add column if not exists price_kind text
        check (price_kind in ('gratis', 'unico', 'rango', 'desde', 'con_costo')),
    add column if not exists price_min bigint check (price_min >= 0),
    add column if not exists price_max bigint check (price_max >= 0);

alter table canonical_events
    add column if not exists price_kind text
        check (price_kind in ('gratis', 'unico', 'rango', 'desde', 'con_costo')),
    add column if not exists price_min bigint check (price_min >= 0),
    add column if not exists price_max bigint check (price_max >= 0);

-- El techo nunca puede quedar por debajo del piso. Es barato de exigir acá y
-- caro de descubrir en pantalla: un rango invertido se lee como un precio
-- normal y nadie lo nota.
alter table events
    drop constraint if exists events_price_rango_coherente;
alter table events
    add constraint events_price_rango_coherente
        check (price_min is null or price_max is null or price_max >= price_min);

alter table canonical_events
    drop constraint if exists canonical_events_price_rango_coherente;
alter table canonical_events
    add constraint canonical_events_price_rango_coherente
        check (price_min is null or price_max is null or price_max >= price_min);

-- ---------------------------------------------------------------------------
-- 2. Backfill de lo que ya está guardado.
-- ---------------------------------------------------------------------------
-- Solo se traduce lo que se puede leer sin inventar. Lo de Latino Power
-- ('$34') se deja deliberadamente SIN backfill: el texto guardado perdió los
-- miles y no hay forma honesta de recuperarlos desde acá — recuperar 33900 de
-- "$34" sería adivinar el redondeo. Lo arregla la próxima corrida del cron,
-- que ya lee `cost_details.values`.

update events
   set price_kind = 'gratis', price_min = 0, price_max = 0
 where price_kind is null and lower(trim(price_text)) = 'entrada libre';

update events
   set price_kind = 'con_costo'
 where price_kind is null and lower(trim(price_text)) = 'entrada con costo';

update canonical_events
   set price_kind = 'gratis', price_min = 0, price_max = 0
 where price_kind is null and lower(trim(price_text)) = 'entrada libre';

update canonical_events
   set price_kind = 'con_costo'
 where price_kind is null and lower(trim(price_text)) = 'entrada con costo';

-- Rockal Live: '$107,000 COP'. Es un `startingPrice`, así que entra como
-- 'desde' y no como 'unico' — la fuente dice que es el más barato, no el
-- precio. La coma es separador de miles (formato inglés del scraper viejo).
update events
   set price_kind = 'desde',
       price_min = replace(replace(replace(price_text, '$', ''), ',', ''), ' COP', '')::bigint
 where price_kind is null
   and source = 'rockal_live'
   and price_text ~ '^\$[0-9,]+ COP$';

update canonical_events c
   set price_kind = 'desde',
       price_min = replace(replace(replace(c.price_text, '$', ''), ',', ''), ' COP', '')::bigint
 where c.price_kind is null
   and c.price_text ~ '^\$[0-9,]+ COP$';

-- ---------------------------------------------------------------------------
-- 3. `price_text` se queda, y no es olvido.
-- ---------------------------------------------------------------------------
-- En `events` sigue siendo la evidencia cruda de lo que publicó la fuente, que
-- es el criterio de siempre: guardar crudo, interpretar en lectura. En
-- `canonical_events` queda sin uso —el frontend pasa a leer las columnas
-- nuevas— pero soltarla borra datos que no se pueden recuperar, y eso es
-- decisión de Juan, no de la migración. Queda anotado en ESTADO.md.

comment on column events.price_text is
    'Crudo de la fuente. La interpretación estructurada vive en price_kind/min/max.';
comment on column canonical_events.price_text is
    'Superseded por price_kind/min/max desde 2026-09-02. Se conserva sin uso; soltarla es decisión de Juan.';
