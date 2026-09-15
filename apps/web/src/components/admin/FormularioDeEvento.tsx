"use client";

/**
 * Cargar un evento a mano.
 *
 * Es la razón de ser de toda esta fase. El scraping solo ve las salas que
 * publican su propia cartelera: el toque local en un bar chico, anunciado
 * por una historia de Instagram y nada más, es invisible para el pipeline —
 * y promover ese toque es el propósito de la plataforma.
 *
 * La evidencia es obligatoria y la base la exige (`origin = 'manual'` sin
 * `evidence` no entra). No es burocracia: un evento cargado a mano no tiene
 * página de sala a la que remitir al lector, así que la única trazabilidad
 * que va a existir es lo que se escriba acá.
 */

import { useEffect, useState } from "react";

import {
  BOTON,
  BOTON_TENUE,
  CAMPO,
  CampoDeArtistas,
  CampoDeFechaYHora,
  CampoDeGeneros,
  Rotulo,
} from "@/components/admin/ui";
import { CampoDePrecio } from "@/components/admin/CampoDePrecio";
import { type CamposDelAfiche, esSoloUnEnlace, salaQueCoincide } from "@/lib/admin/afiche";
import { desdeCamposDeFecha, fechaConAnioInferido } from "@/lib/admin/fecha";
import { leerAfiche, subirAfiche } from "@/lib/admin/carga-de-afiche";
import { crearEvento } from "@/lib/admin/eventos";
import type { PrecioEvento } from "@/lib/precio";
import type { TipoEvento } from "@/lib/events";
import { getArtistasParaVincular } from "@/lib/admin/artistas";
import { crearSalaEnBorrador, getSalasPublicadas } from "@/lib/admin/salas";
import { encabezadoEnTexto } from "@/lib/encabezado";

/** El valor del selector que significa "la escribo yo". No puede chocar con
 *  ningún id de sala, que son uuid. */
const SALA_NUEVA = "__nueva__";

export function FormularioDeEvento({
  setError,
  alCrear,
}: {
  setError: (m: string | null) => void;
  alCrear: () => void;
}) {
  const [salas, setSalas] = useState<{ id: string; name: string }[]>([]);
  const [titulo, setTitulo] = useState("");
  const [sala, setSala] = useState("");
  const [salaNueva, setSalaNueva] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [precio, setPrecio] = useState<PrecioEvento>({
    price_kind: null,
    price_min: null,
    price_max: null,
  });
  const [boleteria, setBoleteria] = useState("");
  const [generos, setGeneros] = useState<string[]>([]);
  const [artistas, setArtistas] = useState<string[]>([]);
  const [gira, setGira] = useState("");
  const [delDirectorio, setDelDirectorio] = useState<string[]>([]);
  // "" es la opción "todavía no sé", que se guarda como null. Se separa
  // del union porque un <select> no puede tener valor null.
  const [tipo, setTipo] = useState<Exclude<TipoEvento, null> | "">("music");
  const [local, setLocal] = useState("");
  const [evidencia, setEvidencia] = useState("");
  const [afiche, setAfiche] = useState<string | null>(null);
  const [pegado, setPegado] = useState("");
  const [notas, setNotas] = useState<string[]>([]);
  const [leyendo, setLeyendo] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    getSalasPublicadas()
      .then(setSalas)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [setError]);

  // Los nombres del directorio, para escribir el del cartel igual que el de
  // la ficha. Sin ellos el campo sigue sirviendo: se escribe a mano.
  useEffect(() => {
    getArtistasParaVincular()
      .then((todos) => setDelDirectorio(todos.map((a) => a.nombre)))
      .catch(() => setDelDirectorio([]));
  }, []);

  // Con la sala escrita a mano, lo que hace falta es el nombre y no el id:
  // el id todavía no existe cuando se aprieta el botón.
  const salaLista = sala === SALA_NUEVA ? salaNueva.trim().length > 0 : Boolean(sala);
  const listo = titulo.trim() && salaLista && evidencia.trim().length >= 10;

  /**
   * Corre una lectura y vuelca lo leído en los campos vacíos.
   *
   * **Nunca pisa lo que ya escribiste.** Lo que salió del afiche es una
   * propuesta y lo que escribió una persona es una decisión; si el modelo
   * ganara, corregir un campo y volver a leer borraría la corrección.
   *
   * Lo que no se pudo leer se queda vacío a propósito: un hueco se ve y se
   * completa, un valor verosímil pero falso no se nota.
   */
  async function correr(pedir: () => Promise<CamposDelAfiche>) {
    setLeyendo(true);
    setError(null);
    try {
      const c = await pedir();
      if (!titulo && c.titulo) setTitulo(c.titulo);
      // Cada mitad entra por su cuenta: un afiche que anuncia el día y no la
      // hora llena la fecha y deja la hora vacía, que es el hueco honesto.
      // El año inferido entra igual que el resto: solo si el campo está vacío.
      // Cuando el afiche no lo imprime, `dia_y_mes` trae "MM-DD" y acá se le
      // pone el que corresponde — ver `anioParaDiaYMes`, que explica por qué
      // esta es una excepción deliberada a no inventar datos.
      const delAfiche =
        c.fecha_local ?? (c.dia_y_mes ? fechaConAnioInferido(c.dia_y_mes) : null);
      if (!fecha && delAfiche) setFecha(delAfiche);
      if (!hora && c.hora_local) setHora(c.hora_local);
      const encontrada = salaQueCoincide(c.sala_nombre, salas);
      if (!sala) setSala(encontrada ?? "");
      if (!boleteria && c.boleteria_url) setBoleteria(c.boleteria_url);
      // El género que leyó el afiche entra como uno más, sin pisar los que
      // ya estén escritos.
      if (c.genero && !generos.includes(c.genero)) setGeneros([...generos, c.genero]);
      // El modelo devuelve los artistas en el orden en que aparecen impresos,
      // que es la mejor señal que hay del cartel. Hasta el 2026-09-15 esto se
      // volcaba a las notas como "Cartel: X & Y" para volver a teclearlo.
      if (artistas.length === 0 && c.artistas.length > 0) setArtistas(c.artistas);
      // El precio no se autocompleta: son tres columnas que hay que leer
      // juntas para no afirmar de más, y el afiche solo da texto suelto.
      // Se muestra crudo abajo para que se transcriba a mano.
      setNotas(
        [
          c.precio_texto && `Precio impreso: ${c.precio_texto}`,
          // Sin esto, la fecha completa se leería después como si el afiche la
          // trajera. La inferencia se acepta; disimularla, no.
          !c.fecha_local &&
            c.dia_y_mes &&
            delAfiche &&
            `El afiche no imprime el año: dice ${c.dia_y_mes.replace("-", "/")} y se asumió ${delAfiche.slice(0, 4)}.`,
          c.sala_nombre &&
            !encontrada &&
            `El afiche dice «${c.sala_nombre}», que no está entre las salas cargadas.`,
          c.notas,
        ].filter((n): n is string => Boolean(n)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLeyendo(false);
    }
  }

  const subirYLeer = (archivo: File) =>
    correr(async () => {
      const url = await subirAfiche(archivo);
      setAfiche(url);
      return leerAfiche({ imagenUrl: url });
    });

  function leerElTexto() {
    if (esSoloUnEnlace(pegado)) {
      setError(
        "Un enlace solo no alcanza: no podemos abrirlo. Copia el texto de la " +
          "publicación, o descarga el afiche y súbelo.",
      );
      return;
    }
    void correr(() => leerAfiche({ texto: pegado }));
  }

  async function crear() {
    setOcupado(true);
    setError(null);
    try {
      // La sala primero, porque el evento la necesita por id. Si esto falla
      // —el caso frecuente es que ya exista sin publicar— el evento no se crea
      // y el formulario se queda entero, con todo lo escrito.
      const venueId =
        sala === SALA_NUEVA ? (await crearSalaEnBorrador(salaNueva)).id : sala;

      await crearEvento({
        title: titulo.trim(),
        venue_id: venueId,
        starts_at: desdeCamposDeFecha(fecha, hora),
        ...precio,
        ticket_url: boleteria.trim() || null,
        generos,
        artistas,
        gira: gira.trim() || null,
        event_type: tipo || null,
        is_local: local === "" ? null : local === "true",
        image_url: afiche,
        evidence: evidencia.trim(),
      });
      alCrear();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setOcupado(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-surface p-4 sm:p-5">
      <h2 className="font-display text-lg font-semibold">Nuevo evento</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Entra como borrador, igual que lo que trae el cron: aparece en &ldquo;Por
        revisar&rdquo; y se publica desde ahí. Un camino que se salta la cola es un camino
        que nadie revisa.
      </p>

      {/* El afiche va arriba de todo porque es por donde se empieza: se
          carga, se lee, y el resto del formulario queda medio lleno. Que sea
          opcional no es un detalle — un evento se puede cargar entero a mano
          y este bloque simplemente se ignora.

          La imagen manda sobre el texto, y no es una preferencia estética:
          en esta escena **la información vive en el flyer**. La sala publica
          una imagen con la fecha, el cartel y el precio quemados adentro, y
          muchas veces el texto del post no dice ninguno de los tres. */}
      <div className="mt-4 border-t border-border pt-4">
        <Rotulo>Desde el afiche (opcional)</Rotulo>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Se completan los campos que se puedan leer. Lo que el afiche no diga queda
          vacío a propósito: revisa antes de guardar.
        </p>

        {/* Zona de carga: click, pegar o arrastrar.
            **Pegar es el gesto que importa.** Instagram no deja bajar la
            imagen ni entrar a buscarla, pero una captura de pantalla
            (Win+Shift+S) queda en el portapapeles — y obligar a guardarla en
            disco para después buscarla en un selector es pedir tres pasos
            donde alcanza uno.
            Es `tabIndex` y no solo click porque pegar necesita foco, y el
            teclado tiene que poder llegar acá. */}
        <div
          tabIndex={0}
          onPaste={(e) => {
            const imagen = Array.from(e.clipboardData.files).find((f) =>
              f.type.startsWith("image/"),
            );
            if (imagen) {
              e.preventDefault();
              void subirYLeer(imagen);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const imagen = Array.from(e.dataTransfer.files).find((f) =>
              f.type.startsWith("image/"),
            );
            if (imagen) void subirYLeer(imagen);
          }}
          className="mt-3 flex flex-col items-center gap-3 rounded-md border border-dashed border-border bg-background px-4 py-6 text-center"
        >
          {afiche ? (
            /* Con <img> y no next/image: es una vista previa de admin y no
               vale la pena pasarla por el optimizador ni por remotePatterns. */
            // eslint-disable-next-line @next/next/no-img-element
            <img src={afiche} alt="" className="max-h-40 rounded-sm object-contain" />
          ) : (
            <p className="text-sm text-muted">
              Pega una captura con <kbd className="font-mono text-xs">Ctrl+V</kbd>,
              arrastrá el archivo, o
            </p>
          )}

          <label
            className={`${BOTON} cursor-pointer bg-accent text-background ${
              leyendo ? "opacity-40" : ""
            }`}
          >
            {leyendo ? "Leyendo…" : afiche ? "Cambiar el afiche" : "Elegir un archivo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={leyendo}
              onChange={(e) => {
                const archivo = e.target.files?.[0];
                if (archivo) void subirYLeer(archivo);
              }}
            />
          </label>

          {afiche && !leyendo && (
            <button
              type="button"
              className={BOTON_TENUE}
              onClick={() => void correr(() => leerAfiche({ imagenUrl: afiche }))}
            >
              Volver a leerlo
            </button>
          )}
        </div>

        {/* El texto es la segunda vía, no la primera: sirve cuando el post
            tiene los datos en el caption y el flyer no. */}
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-muted">
            …o pegar el texto de la publicación
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            El texto, no el enlace: Instagram y las boleteras no dejan que un servidor
            entre a buscar, así que hay que traer el contenido y no la dirección.
          </p>
          <textarea
            value={pegado}
            onChange={(e) => setPegado(e.target.value)}
            rows={4}
            placeholder="Pega aquí el texto del post"
            className={`${CAMPO} mt-2`}
          />
          <button
            type="button"
            className={`${BOTON} mt-2 bg-accent text-background disabled:opacity-40`}
            disabled={leyendo || !pegado.trim()}
            onClick={leerElTexto}
          >
            {leyendo ? "Leyendo…" : "Leer el texto"}
          </button>
        </details>

        {notas.length > 0 && (
          /* Lo que se leyó pero no entró en ningún campo. Es el lugar donde
             el lector dice lo que NO pudo resolver —el año que falta, la sala
             que no existe, el precio en crudo—, y por eso se muestra en vez
             de descartarse. */
          <ul className="mt-3 space-y-1 border-l-2 border-border pl-3 text-xs leading-relaxed text-muted">
            {notas.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <Rotulo>Título</Rotulo>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Artista | Gira"
            className={CAMPO}
          />
          {/* No pasa por el normalizador: lo escribes tú, ya en la
              forma en que quieres que salga. Normalizarlo encima sería pisarte. */}
          <span className="mt-1 block text-xs text-muted">
            Se publica tal cual lo escribas. Si abajo anotas dos o más artistas,
            la cartelera muestra esa lista y no esto.
          </span>
        </label>

        {/* La sala que no está en la lista se escribe acá mismo y nace en
            borrador. Antes decía "creala en la pestaña Salas", que obligaba a
            abandonar un evento a medio cargar para ir a llenar una ficha
            entera — y lo que se tiene en ese momento es un nombre leído de un
            flyer, nada más. */}
        <label>
          <Rotulo>Sala</Rotulo>
          <select value={sala} onChange={(e) => setSala(e.target.value)} className={CAMPO}>
            <option value="">elige una…</option>
            {salas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            <option value={SALA_NUEVA}>— no está en la lista, la escribo —</option>
          </select>
          {sala === SALA_NUEVA ? (
            <>
              <input
                value={salaNueva}
                onChange={(e) => setSalaNueva(e.target.value)}
                placeholder="Nombre de la sala, como se escribe"
                className={`${CAMPO} mt-2`}
              />
              <span className="mt-1 block text-xs leading-relaxed text-muted">
                Se crea en borrador, con el nombre y nada más. Queda en Salas →
                Por aprobar para ponerle dirección, coordenada y foto.{" "}
                <strong>Apruébala antes de publicar el evento</strong>, o la ficha
                dirá «sala por confirmar».
              </span>
            </>
          ) : (
            <span className="mt-1 block text-xs text-muted">
              Solo salen las aprobadas.
            </span>
          )}
        </label>

        <CampoDeFechaYHora
          fecha={fecha}
          hora={hora}
          alCambiar={(campos) => {
            setFecha(campos.fecha);
            setHora(campos.hora);
          }}
        />

        <CampoDePrecio valor={precio} alCambiar={setPrecio} />

        <label>
          <Rotulo>Boletería</Rotulo>
          <input
            value={boleteria}
            onChange={(e) => setBoleteria(e.target.value)}
            className={CAMPO}
          />
        </label>

        <CampoDeArtistas
          valor={artistas}
          alCambiar={setArtistas}
          sugerencias={delDirectorio}
        />

        {artistas.length >= 2 && (
          <label className="sm:col-span-2">
            <Rotulo>Gira o ciclo (opcional)</Rotulo>
            <input
              value={gira}
              onChange={(e) => setGira(e.target.value)}
              placeholder="Ronroco Tour"
              className={CAMPO}
            />
          </label>
        )}

        {/* Lo que se va a publicar, armado con lo que hay escrito.
            **El título deja de ser lo que se muestra en cuanto hay dos
            artistas**, y sin esto no habría forma de notarlo desde acá: la
            regla de que "el título guardado es el título publicado" se
            decidió el 2026-08-31 porque el admin veía una cosa y el visitante
            otra, y esta línea es lo que la mantiene cierta. */}
        {artistas.length >= 2 && (
          <p className="sm:col-span-2 -mt-1 text-xs text-muted">
            En la cartelera se verá:{" "}
            <span className="text-foreground">
              {encabezadoEnTexto({
                title: titulo.trim(),
                artistas,
                gira: gira.trim() || null,
              })}
            </span>
          </p>
        )}

        <CampoDeGeneros valor={generos} alCambiar={setGeneros} />

        <label>
          <Rotulo>Qué es</Rotulo>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as typeof tipo)}
            className={CAMPO}
          >
            <option value="music">toque</option>
            <option value="fiesta">fiesta o ciclo</option>
            <option value="festival">festival</option>
            <option value="not_music">no es música</option>
            <option value="">todavía no sé</option>
          </select>
        </label>

        <label>
          <Rotulo>Artista local</Rotulo>
          <select value={local} onChange={(e) => setLocal(e.target.value)} className={CAMPO}>
            <option value="">no lo sé</option>
            <option value="true">sí, local</option>
            <option value="false">no, internacional</option>
          </select>
        </label>

        <label className="sm:col-span-2">
          <Rotulo>Evidencia (obligatoria)</Rotulo>
          <textarea
            value={evidencia}
            onChange={(e) => setEvidencia(e.target.value)}
            rows={3}
            placeholder="De dónde salió: el post del artista, el flyer, quién lo confirmó."
            className={CAMPO}
          />
          <span className="mt-1 block text-xs leading-relaxed text-muted">
            No hay página de sala a la que mandar al lector, así que esto es toda la
            trazabilidad que va a existir. La base lo exige.
          </span>
        </label>
      </div>

      <button
        disabled={ocupado || !listo}
        onClick={crear}
        className={`${BOTON} mt-5 bg-accent text-background disabled:opacity-40`}
        title={!listo ? "Faltan el título, la sala o la evidencia" : undefined}
      >
        {ocupado ? "Creando…" : "Crear borrador"}
      </button>
    </div>
  );
}
