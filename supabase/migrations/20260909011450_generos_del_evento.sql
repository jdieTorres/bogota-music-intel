-- El género se separa de la categoría de la fuente (2026-09-08).
--
-- `category` guardaba cuatro cosas a la vez y las cuatro se pisaban: el
-- género real de Rockal Live ("Pop"), la disciplina de Idartes
-- ("Multidisciplinar"), la taxonomía de visitbogota ("Conciertos") y, desde
-- hoy, el tipo de evento de ticketlive ("dix-fm", "externos"). Encima el
-- admin escribía ahí el género que corregía a mano: cinco escritores, un
-- campo.
--
-- El síntoma era una lista negra en el frontend que crecía con cada fuente
-- —trece entradas, seis agregadas el mismo día— y que al olvidarse una
-- publicaba un chip que decía «Género: destacado».
--
-- El corte es el mismo que ya rige entre `events` y `canonical_events`: **lo
-- que escribe el admin va en columna propia, nunca encima de lo scrapeado.**
--
-- - `category` se queda como **señal del clasificador y nada más**. Nunca se
--   muestra; el frontend ni siquiera la pide. Sigue siendo lo que le dice al
--   pipeline que un evento de Idartes es danza o que uno de ticketlive es una
--   fiesta.
-- - `generos` lo escribe **solo una persona**, y es lo único que sale en
--   pantalla.
--
-- Es un arreglo y no una cadena: como en AOTY o RYM, un toque puede ser
-- "Post-punk" y "Shoegaze" a la vez, y obligar a elegir uno sería inventar
-- una precisión que la música no tiene.

alter table canonical_events
    add column if not exists generos text[] not null default '{}';

comment on column canonical_events.generos is
    'Los géneros del toque, escritos a mano en /admin. Varios por evento, como en AOTY o RYM. Es lo único que sale como chip en la cartelera: `category` guarda la señal cruda de la fuente y no se muestra nunca.';

-- Los que ya tenían un género de verdad se mudan. Son los de Rockal Live, la
-- única fuente que publicaba algo con forma de género; el resto de los valores
-- de `category` son taxonomías y se quedan donde están, invisibles.
update canonical_events
set generos = array[category]
where category in ('Pop', 'Hip Hop/Rap', 'Rock/Punk/Metal', 'Reggaeton')
  and generos = '{}';

-- La lista de sugerencias del formulario sale de esta columna —el vocabulario
-- es lo que ya se usó, no una lista en git— así que se consulta en cada carga.
create index if not exists canonical_events_generos_idx on canonical_events using gin (generos);
