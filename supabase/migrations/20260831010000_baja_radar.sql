-- Baja del radar de tendencias (decidido por Juan el 2026-08-31).
--
-- El módulo salió del MVP y su código ya no existe en el repo: se borraron
-- `radar.py`, `radar_cli.py`, `lastfm.py`, `deezer.py`, `/tendencias` y el
-- paso del cron. Esta tabla es lo único que quedaba vivo.
--
-- ⚠️ Esto BORRA DATOS: 215 filas de `lastfm_geo` al 2026-08-31, que son las
-- fotos semanales de lo más escuchado en Colombia según Last.fm. No hay
-- forma de recuperarlas —cada fila era una foto de un momento— así que si
-- hay alguna intención de retomar el radar más adelante, conviene NO correr
-- esta migración: la tabla vacía no molesta a nadie y 215 filas no pesan
-- nada contra los 500 MB del plan gratuito de Supabase.
--
-- Se deja escrita y se aplica solo si Juan lo confirma.

drop table if exists trending_artists;
