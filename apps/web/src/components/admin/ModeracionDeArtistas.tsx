"use client";

/**
 * Moderación de artistas.
 *
 * Se parece a la de salas, pero con una diferencia de fondo: **acá no hay
 * scraper que proponga**. Ninguna API conoce al artista local emergente —se
 * probaron cinco y la búsqueda está cerrada—, así que el borrador no es "lo
 * trajo el cron y nadie lo miró" sino "lo empecé y no lo terminé".
 *
 * Y publicar acá **es** el juicio editorial: no hay casilla de "es de la
 * escena" en ninguna parte. Estar en el directorio lo es.
 */

import { useCallback, useEffect, useState } from "react";

import {
  BOTON_PRIMARIO,
  BOTON_ROJO,
  BOTON_SECUNDARIO,
  BOTON_TENUE,
  CAMPO,
  CampoDeImagen,
  BarraDeAcciones,
  Etiqueta,
  Rotulo,
} from "@/components/admin/ui";
import { VOLVER } from "@/components/admin/ModeracionDeEventos";
import {
  type ArtistaEnModeracion,
  type CorreccionDeArtista,
  type PestañaDeArtista,
  type TrackEnModeracion,
  borrarTrack,
  crearArtista,
  crearTrack,
  guardarTrack,
  descartarArtista,
  getArtistas,
  guardarArtista,
  publicarArtista,
} from "@/lib/admin/artistas";
import { slugDeSala } from "@/lib/admin/slug";
import { direccionPublica, leerEnlaceDeAudio, miniatura } from "@/lib/enlaces-de-audio";

const PESTAÑAS: [PestañaDeArtista, string][] = [
  ["borrador", "Sin terminar"],
  ["publicado", "En el directorio"],
];

const VACIO: Record<PestañaDeArtista, string> = {
  borrador: "No hay ninguna ficha a medias.",
  publicado: "Todavía no hay nadie en el directorio.",
};

const AYUDA_CARATULA =
  "La carátula del sencillo o del disco. Si no hay, déjalo vacío: el disco lleva una etiqueta compuesta con el nombre y el título, que es honesta. No pegues un fotograma del video.";

const AYUDA_EVIDENCIA =
  "De dónde salen el origen y la grafía del nombre: su Instagram, una nota de prensa, su Bandcamp. Sin esto la base no deja publicar.";

export function ModeracionDeArtistas({ setError }: { setError: (m: string | null) => void }) {
  const [artistas, setArtistas] = useState<ArtistaEnModeracion[]>([]);
  const [pestaña, setPestaña] = useState<PestañaDeArtista>("borrador");
  const [elegido, setElegido] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setArtistas(await getArtistas(pestaña));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar");
    }
  }, [pestaña, setError]);

  useEffect(() => {
    // Mismo caso que en `ModeracionDeSalas`: `cargar` es async y hace `await`
    // antes de tocar el estado, así que no hay ningún setState síncrono acá
    // dentro. La regla no puede verlo y marca un falso positivo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar();
  }, [cargar]);

  const abierto = artistas.find((a) => a.id === elegido) ?? null;

  if (creando) {
    return (
      <FormularioDeArtista
        setError={setError}
        alVolver={() => setCreando(false)}
        alCrear={async () => {
          setCreando(false);
          setPestaña("borrador");
          await cargar();
        }}
      />
    );
  }

  if (abierto) {
    return (
      <FichaDeArtista
        artista={abierto}
        setError={setError}
        alVolver={() => setElegido(null)}
        alCambiar={cargar}
      />
    );
  }

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-4">
          {PESTAÑAS.map(([cual, nombre]) => (
            <button
              key={cual}
              onClick={() => setPestaña(cual)}
              className={`font-mono text-xs uppercase tracking-widest transition-colors ${
                pestaña === cual ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {nombre}
            </button>
          ))}
        </div>
        <button onClick={() => setCreando(true)} className={BOTON_TENUE}>
          + Nuevo artista
        </button>
      </div>

      {artistas.length === 0 ? (
        <p className="mt-8 text-sm text-muted">{VACIO[pestaña]}</p>
      ) : (
        <ul className="mt-6">
          {artistas.map((artista) => (
            <li key={artista.id} className="border-t border-border">
              <button
                onClick={() => setElegido(artista.id)}
                className="flex w-full items-baseline gap-3 py-3 text-left transition-colors hover:bg-surface-hover"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-display font-semibold tracking-tight">
                    {artista.nombre}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {[artista.origen_ciudad, artista.origen_pais].filter(Boolean).join(", ")}
                  </span>
                </span>
                {/* Qué le falta, de un vistazo. Es lo que decide a cuál
                    entrar, igual que el conteo de eventos en las salas. */}
                {artista.tracks.length > 0 && (
                  <Etiqueta>{artista.tracks.length} tracks</Etiqueta>
                )}
                {!artista.bio && <Etiqueta>sin notas</Etiqueta>}
                {!artista.evidencia && <Etiqueta>sin evidencia</Etiqueta>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function FichaDeArtista({
  artista,
  setError,
  alVolver,
  alCambiar,
}: {
  artista: ArtistaEnModeracion;
  setError: (m: string | null) => void;
  alVolver: () => void;
  alCambiar: () => Promise<void>;
}) {
  const [campos, setCampos] = useState<CorreccionDeArtista>({
    nombre: artista.nombre,
    origen_ciudad: artista.origen_ciudad,
    origen_pais: artista.origen_pais,
    bio: artista.bio,
    foto_url: artista.foto_url,
    bandcamp_url: artista.bandcamp_url,
    evidencia: artista.evidencia,
  });
  const [ocupado, setOcupado] = useState(false);

  const correr = async (accion: () => Promise<void>, volver = false) => {
    setOcupado(true);
    try {
      await accion();
      setError(null);
      await alCambiar();
      if (volver) alVolver();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="mt-8">
      <button onClick={alVolver} className={VOLVER}>
        ← Volver
      </button>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <Rotulo>Nombre</Rotulo>
          <input
            value={campos.nombre ?? ""}
            onChange={(e) => setCampos({ ...campos, nombre: e.target.value })}
            className={CAMPO}
          />
        </label>

        <label>
          <Rotulo>Ciudad</Rotulo>
          <input
            value={campos.origen_ciudad ?? ""}
            onChange={(e) => setCampos({ ...campos, origen_ciudad: e.target.value || null })}
            className={CAMPO}
          />
        </label>

        <label>
          <Rotulo>País</Rotulo>
          <input
            value={campos.origen_pais ?? ""}
            onChange={(e) => setCampos({ ...campos, origen_pais: e.target.value || null })}
            className={CAMPO}
          />
        </label>

        <div className="sm:col-span-2">
          {/* ⚠️ El origen es un hecho, no el criterio de si es de la escena.
              Eso lo decide publicarlo acá. Confundir las dos cosas fue lo que
              costó la baja de MusicBrainz. */}
          <p className="-mt-2 mb-3 text-xs text-muted">
            De dónde es, como dato. No decide si entra al directorio: eso lo decides
            tú al publicarlo. Si no lo tienes confirmado, déjalo vacío.
          </p>
        </div>

        <label className="sm:col-span-2">
          <Rotulo>Notas de contratapa</Rotulo>
          <textarea
            value={campos.bio ?? ""}
            onChange={(e) => setCampos({ ...campos, bio: e.target.value || null })}
            rows={6}
            className={CAMPO}
          />
          <span className="mt-1 block text-xs text-muted">
            Lo que escribas acá es lo único del sitio que no salió de otra parte.
          </span>
        </label>

        <div className="sm:col-span-2">
          <CampoDeImagen
            rotulo="Foto del artista"
            valor={campos.foto_url ?? null}
            alCambiar={(v) => setCampos({ ...campos, foto_url: v })}
            ayuda="Una foto suya, de su Instagram o su prensa. Si no hay una buena, déjalo vacío: la ficha se ve bien sin foto."
          />
        </div>

        <label className="sm:col-span-2">
          <Rotulo>Bandcamp</Rotulo>
          <input
            value={campos.bandcamp_url ?? ""}
            onChange={(e) => setCampos({ ...campos, bandcamp_url: e.target.value || null })}
            placeholder="https://…"
            className={CAMPO}
          />
          <span className="mt-1 block text-xs text-muted">
            Su página, no un track suelto. Sale en la ficha como el disco completo, y
            no entra a la rockola: su reproductor no se puede encadenar.
          </span>
        </label>

        <label className="sm:col-span-2">
          <Rotulo>Evidencia</Rotulo>
          <textarea
            value={campos.evidencia ?? ""}
            onChange={(e) => setCampos({ ...campos, evidencia: e.target.value || null })}
            rows={2}
            className={CAMPO}
          />
          <span className="mt-1 block text-xs text-muted">{AYUDA_EVIDENCIA}</span>
        </label>
      </div>

      <Tracks artista={artista} setError={setError} alCambiar={alCambiar} />

      <BarraDeAcciones>
        <button
          disabled={ocupado}
          onClick={() => void correr(() => guardarArtista(artista.id, campos))}
          className={BOTON_PRIMARIO}
        >
          Guardar
        </button>
        {artista.status !== "publicado" && (
          <button
            disabled={ocupado}
            onClick={() => void correr(() => publicarArtista(artista.id, campos), true)}
            className={BOTON_SECUNDARIO}
          >
            Publicar en el directorio
          </button>
        )}
        <button
          disabled={ocupado}
          onClick={() => void correr(() => descartarArtista(artista.id), true)}
          className={`${BOTON_ROJO} ml-auto`}
        >
          Sacar del directorio
        </button>
      </BarraDeAcciones>
    </div>
  );
}

/**
 * El tracklist del artista.
 *
 * La dirección se pega y el helper decide la plataforma. **Si no la
 * reconoce, dice por qué** en vez de dejar el campo vacío: casi siempre la
 * dirección está bien y lo que pasa es que esa plataforma no se puede
 * encadenar, y eso no se arregla reintentando.
 */
function Tracks({
  artista,
  setError,
  alCambiar,
}: {
  artista: ArtistaEnModeracion;
  setError: (m: string | null) => void;
  alCambiar: () => Promise<void>;
}) {
  const [titulo, setTitulo] = useState("");
  const [anio, setAnio] = useState("");
  const [pegado, setPegado] = useState("");
  const [caratula, setCaratula] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const lectura = pegado.trim() ? leerEnlaceDeAudio(pegado) : null;
  const enlace = lectura?.reconocido ? lectura.enlace : null;

  const agregar = async () => {
    if (!enlace || !titulo.trim()) return;
    setOcupado(true);
    try {
      await crearTrack({
        artista_id: artista.id,
        titulo,
        // Un año que no se sabe se queda en null. No se deduce del video.
        anio: anio.trim() ? Number(anio) : null,
        plataforma: enlace.plataforma,
        id_externo: enlace.idExterno,
        caratula_url: caratula,
        orden: artista.tracks.length,
      });
      setTitulo("");
      setAnio("");
      setPegado("");
      setCaratula(null);
      setError(null);
      await alCambiar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo agregar");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <section className="mt-10">
      <h3 className="font-mono text-xs uppercase tracking-widest text-muted">Tracks</h3>

      {artista.tracks.length > 0 && (
        <ol className="mt-3">
          {artista.tracks.map((track, i) => (
            <RenglonDeTrack
              key={track.id}
              track={track}
              numero={i + 1}
              setError={setError}
              alCambiar={alCambiar}
            />
          ))}
        </ol>
      )}

      <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_6rem]">
        <label>
          <Rotulo>Título</Rotulo>
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className={CAMPO} />
        </label>
        <label>
          <Rotulo>Año</Rotulo>
          <input
            value={anio}
            onChange={(e) => setAnio(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            className={CAMPO}
          />
        </label>

        <label className="sm:col-span-2">
          <Rotulo>Dirección del track</Rotulo>
          <input
            value={pegado}
            onChange={(e) => setPegado(e.target.value)}
            placeholder="https://youtu.be/… o https://soundcloud.com/…"
            className={CAMPO}
          />
          {lectura && !lectura.reconocido && (
            <span className="mt-1 block text-xs text-red-400">{lectura.motivo}</span>
          )}
          {enlace && (
            <span className="mt-1 block text-xs text-muted">
              {enlace.plataforma === "youtube" ? "YouTube" : "SoundCloud"} ·{" "}
              <a
                href={direccionPublica(enlace)}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                comprobar que es el track correcto
              </a>
            </span>
          )}
        </label>

        {/* La miniatura es del video, no una carátula: sirve para confirmar
            que se pegó el track correcto y nada más. SoundCloud no la sirve
            en una dirección predecible, así que ahí no hay nada que mostrar
            —y no se inventa una que daría 404—. */}
        {enlace && miniatura(enlace) && (
          <div className="sm:col-span-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- viene de un host cualquiera, igual que la foto de sala */}
            <img
              src={miniatura(enlace) ?? ""}
              alt=""
              className="h-24 w-auto rounded-sm border border-border"
            />
          </div>
        )}

        <div className="sm:col-span-2">
          <CampoDeImagen
            rotulo="Carátula (opcional)"
            valor={caratula}
            alCambiar={setCaratula}
            ayuda={AYUDA_CARATULA}
          />
        </div>

        <div className="sm:col-span-2">
          <button
            disabled={ocupado || !enlace || !titulo.trim()}
            onClick={() => void agregar()}
            className={BOTON_PRIMARIO}
          >
            Agregar al tracklist
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * Un track del tracklist, con su edición en línea.
 *
 * Se edita acá y no en otra pantalla porque lo que hay que corregir casi
 * siempre es una carátula que faltaba o un año que no se sabía al pegarlo: dos
 * campos, no una ficha. Mandar eso a otra vista costaría más que el arreglo.
 *
 * ⚠️ **La dirección del track no se edita.** Cambiarla convertiría este track
 * en otro sin que el título lo diga, y el resultado sería una fila que dice
 * una canción y suena otra. Para eso se quita y se agrega el correcto.
 */
function RenglonDeTrack({
  track,
  numero,
  setError,
  alCambiar,
}: {
  track: TrackEnModeracion;
  numero: number;
  setError: (m: string | null) => void;
  alCambiar: () => Promise<void>;
}) {
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(track.titulo);
  const [anio, setAnio] = useState(track.anio ? String(track.anio) : "");
  const [caratula, setCaratula] = useState(track.caratula_url);
  const [ocupado, setOcupado] = useState(false);

  const correr = async (accion: () => Promise<void>) => {
    setOcupado(true);
    try {
      await accion();
      setError(null);
      await alCambiar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el track");
    } finally {
      setOcupado(false);
    }
  };

  if (editando) {
    return (
      <li className="border-t border-border py-4 first:border-t-0">
        <div className="grid gap-3 sm:grid-cols-[1fr_6rem]">
          <label>
            <Rotulo>Título</Rotulo>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className={CAMPO} />
          </label>
          <label>
            <Rotulo>Año</Rotulo>
            <input
              value={anio}
              onChange={(e) => setAnio(e.target.value.replace(/\D/g, "").slice(0, 4))}
              inputMode="numeric"
              className={CAMPO}
            />
          </label>
          <div className="sm:col-span-2">
            <CampoDeImagen
              rotulo="Carátula"
              valor={caratula}
              alCambiar={setCaratula}
              ayuda={AYUDA_CARATULA}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            disabled={ocupado || !titulo.trim()}
            onClick={() =>
              void correr(async () => {
                await guardarTrack(track.id, {
                  titulo,
                  // Un año que se borra vuelve a "no se sabe", no a cero.
                  anio: anio.trim() ? Number(anio) : null,
                  caratula_url: caratula,
                });
                setEditando(false);
              })
            }
            className={BOTON_PRIMARIO}
          >
            Guardar track
          </button>
          <button
            disabled={ocupado}
            onClick={() => {
              setTitulo(track.titulo);
              setAnio(track.anio ? String(track.anio) : "");
              setCaratula(track.caratula_url);
              setEditando(false);
            }}
            className={BOTON_SECUNDARIO}
          >
            Cancelar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 border-t border-border py-2.5 first:border-t-0">
      <span className="w-5 shrink-0 text-right font-mono text-xs text-muted">{numero}</span>
      <span className="min-w-0 flex-1 truncate">{track.titulo}</span>
      {track.anio && <span className="font-mono text-xs text-muted">{track.anio}</span>}
      <Etiqueta>{track.plataforma === "youtube" ? "YT" : "SC"}</Etiqueta>
      {!track.caratula_url && <Etiqueta>sin carátula</Etiqueta>}
      <button onClick={() => setEditando(true)} className={BOTON_TENUE}>
        Editar
      </button>
      <button
        disabled={ocupado}
        onClick={() => void correr(() => borrarTrack(track.id))}
        className={BOTON_ROJO}
      >
        Quitar
      </button>
    </li>
  );
}

/**
 * El artista nuevo nace en borrador, al revés que una sala cargada a mano.
 *
 * No es una inconsistencia: una sala se carga completa de una sentada, y una
 * ficha de artista que valga la pena publicar necesita notas y tracks, que se
 * escriben en varias pasadas. El borrador es el estado real mientras tanto.
 */
function FormularioDeArtista({
  setError,
  alVolver,
  alCrear,
}: {
  setError: (m: string | null) => void;
  alVolver: () => void;
  alCrear: () => Promise<void>;
}) {
  const [nombre, setNombre] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [pais, setPais] = useState("");
  const [evidencia, setEvidencia] = useState("");
  const [ocupado, setOcupado] = useState(false);

  return (
    <div className="mt-8">
      <button onClick={alVolver} className={VOLVER}>
        ← Volver
      </button>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <Rotulo>Nombre</Rotulo>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={CAMPO} />
          {nombre.trim() && (
            <span className="mt-1 block font-mono text-xs text-muted">
              {slugDeSala(nombre)}
            </span>
          )}
        </label>

        <label>
          <Rotulo>Ciudad</Rotulo>
          <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} className={CAMPO} />
        </label>

        <label>
          <Rotulo>País</Rotulo>
          <input value={pais} onChange={(e) => setPais(e.target.value)} className={CAMPO} />
        </label>

        <label className="sm:col-span-2">
          <Rotulo>Evidencia</Rotulo>
          <textarea
            value={evidencia}
            onChange={(e) => setEvidencia(e.target.value)}
            rows={2}
            className={CAMPO}
          />
          <span className="mt-1 block text-xs text-muted">{AYUDA_EVIDENCIA}</span>
        </label>
      </div>

      <button
        disabled={ocupado || !nombre.trim()}
        onClick={async () => {
          setOcupado(true);
          try {
            await crearArtista({
              nombre,
              origen_ciudad: ciudad || null,
              origen_pais: pais || null,
              evidencia: evidencia || null,
            });
            setError(null);
            await alCrear();
          } catch (e) {
            setError(e instanceof Error ? e.message : "No se pudo crear");
          } finally {
            setOcupado(false);
          }
        }}
        className={`mt-8 ${BOTON_PRIMARIO}`}
      >
        Crear ficha
      </button>
    </div>
  );
}
