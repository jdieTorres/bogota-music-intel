"use client";

/**
 * Moderación de salas.
 *
 * Una sala nace sola: `upsert_venues` la crea en cuanto un evento scrapeado
 * la nombra, con el nombre tal como lo publica la fuente. Por eso el
 * borrador — "Teatro Libre de Bogotá Sala Centro" entró con el nombre que le
 * pone Rockal Live y no con el que usa el teatro, y hasta el 2026-08-31 eso
 * se arreglaba en un archivo del repo (`nombres_de_salas.py`) en vez de acá.
 *
 * Dos pestañas y no tres, a diferencia de los eventos: una sala no caduca.
 * No hay nada equivalente a "ya pasaron".
 */

import { useCallback, useEffect, useState } from "react";

import { BOTON, BOTON_TENUE, CAMPO, Etiqueta, Rotulo } from "@/components/admin/ui";
import { VOLVER } from "@/components/admin/ModeracionDeEventos";
import {
  type CorreccionDeSala,
  type PestañaDeSala,
  type SalaEnModeracion,
  aprobarSala,
  crearSala,
  descartarSala,
  getSalas,
  guardarSala,
} from "@/lib/admin/salas";
import { slugDeSala } from "@/lib/admin/slug";

const PESTAÑAS: [PestañaDeSala, string][] = [
  ["borrador", "Por aprobar"],
  ["publicado", "En el mapa"],
];

const VACIO: Record<PestañaDeSala, string> = {
  borrador: "El cron no encontró ninguna sala nueva.",
  publicado: "Todavía no hay ninguna sala aprobada.",
};

export function ModeracionDeSalas({ setError }: { setError: (m: string | null) => void }) {
  const [salas, setSalas] = useState<SalaEnModeracion[]>([]);
  const [pestaña, setPestaña] = useState<PestañaDeSala>("borrador");
  const [elegida, setElegida] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);

  const cargar = useCallback(
    async (cual: PestañaDeSala) => {
      try {
        setSalas(await getSalas(cual));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    },
    [setError],
  );

  useEffect(() => {
    // `cargar` es async y hace `await` antes de tocar el estado, así que
    // no hay ningún setState síncrono dentro del efecto. La regla no puede
    // verlo desde acá y marca un falso positivo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar(pestaña);
  }, [cargar, pestaña]);

  const seleccionada = salas.find((s) => s.id === elegida) ?? null;

  return (
    <>
      <nav className="mt-6 flex items-center gap-1 border-b border-border">
        {PESTAÑAS.map(([clave, rotulo]) => (
          <button
            key={clave}
            onClick={() => {
              setPestaña(clave);
              setElegida(null);
              setCreando(false);
            }}
            className={`-mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
              pestaña === clave
                ? "border-accent text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {rotulo}
          </button>
        ))}
        <button
          onClick={() => {
            setCreando(true);
            setElegida(null);
          }}
          className={`${BOTON_TENUE} ml-auto mb-2`}
        >
          + Nueva sala
        </button>
      </nav>

      <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted">
        {salas.length} {salas.length === 1 ? "sala" : "salas"}
      </p>

      {creando ? (
        <div className="mt-6">
          <button onClick={() => setCreando(false)} className={VOLVER}>
            ← Volver al listado
          </button>
          <FormularioDeSala
            setError={setError}
            alCrear={() => {
              setCreando(false);
              setPestaña("publicado");
              void cargar("publicado");
            }}
          />
        </div>
      ) : seleccionada ? (
        <div className="mt-6">
          <button onClick={() => setElegida(null)} className={VOLVER}>
            ← Volver al listado
          </button>
          <div className="mt-4">
            <FichaDeSala
              key={seleccionada.id}
              sala={seleccionada}
              setError={setError}
              alResolver={() => {
                setElegida(null);
                void cargar(pestaña);
              }}
            />
          </div>
        </div>
      ) : salas.length === 0 ? (
        <p className="mt-10 text-muted">{VACIO[pestaña]}</p>
      ) : (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {salas.map((sala) => (
            <RenglonDeSala key={sala.id} sala={sala} alElegir={() => setElegida(sala.id)} />
          ))}
        </ul>
      )}
    </>
  );
}

function cuantosEventos(sala: SalaEnModeracion): number {
  return sala.canonical_events?.[0]?.count ?? 0;
}

function RenglonDeSala({
  sala,
  alElegir,
}: {
  sala: SalaEnModeracion;
  alElegir: () => void;
}) {
  const eventos = cuantosEventos(sala);
  return (
    <li>
      <button
        onClick={alElegir}
        className="flex w-full items-baseline gap-3 px-2 py-3 text-left transition-colors hover:bg-surface-hover"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate">{sala.name}</span>
          <span className="mt-0.5 block truncate text-xs text-muted">
            {sala.address ?? "sin dirección"}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {/* Cuántos eventos la nombran: es el dato que dice si vale la pena
              aprobarla o si entró por un evento suelto y raro. */}
          <span className="font-mono text-xs text-muted">
            {eventos} {eventos === 1 ? "evento" : "eventos"}
          </span>
          {sala.latitude == null && <Etiqueta>sin ubicar</Etiqueta>}
          {sala.source_type === "manual" && <Etiqueta>a mano</Etiqueta>}
        </span>
      </button>
    </li>
  );
}

function FichaDeSala({
  sala,
  setError,
  alResolver,
}: {
  sala: SalaEnModeracion;
  setError: (m: string | null) => void;
  alResolver: () => void;
}) {
  const [campos, setCampos] = useState<CorreccionDeSala>({
    name: sala.name,
    address: sala.address,
    website_url: sala.website_url,
    latitude: sala.latitude,
    longitude: sala.longitude,
  });
  const [ocupado, setOcupado] = useState(false);

  async function accion(fn: () => Promise<void>) {
    setOcupado(true);
    setError(null);
    try {
      await fn();
      alResolver();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setOcupado(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Etiqueta>{sala.status}</Etiqueta>
        <span className="ml-auto font-mono text-xs text-muted">{sala.slug}</span>
      </div>

      {/* El slug no se edita nunca. Es la identidad de la sala en toda la
          base: la clave con que el scraper la reencuentra y con que están
          enganchadas las coordenadas curadas. Cambiarlo partiría la sala en
          dos y repartiría sus eventos entre las mitades. */}
      <p className="mt-2 text-xs text-muted">
        El identificador no se edita: es con lo que el scraper reconoce la sala.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <Rotulo>Nombre</Rotulo>
          <input
            value={campos.name ?? ""}
            onChange={(e) => setCampos({ ...campos, name: e.target.value })}
            className={CAMPO}
          />
        </label>
        <label className="sm:col-span-2">
          <Rotulo>Dirección</Rotulo>
          <input
            value={campos.address ?? ""}
            onChange={(e) => setCampos({ ...campos, address: e.target.value || null })}
            className={CAMPO}
          />
        </label>
        <label>
          <Rotulo>Latitud</Rotulo>
          <input
            value={campos.latitude ?? ""}
            onChange={(e) =>
              setCampos({ ...campos, latitude: e.target.value ? Number(e.target.value) : null })
            }
            placeholder="4.6510"
            className={CAMPO}
          />
        </label>
        <label>
          <Rotulo>Longitud</Rotulo>
          <input
            value={campos.longitude ?? ""}
            onChange={(e) =>
              setCampos({ ...campos, longitude: e.target.value ? Number(e.target.value) : null })
            }
            placeholder="-74.0630"
            className={CAMPO}
          />
        </label>
        <label className="sm:col-span-2">
          <Rotulo>Sitio</Rotulo>
          <input
            value={campos.website_url ?? ""}
            onChange={(e) => setCampos({ ...campos, website_url: e.target.value || null })}
            className={CAMPO}
          />
        </label>
      </div>

      <p className="mt-3 text-xs text-muted">
        Sin coordenadas la sala se lista como &ldquo;sin ubicar&rdquo; debajo del mapa. Es
        preferible a un pin en el lugar equivocado — pegá el punto desde Google Maps.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-border pt-4">
        {sala.status === "publicado" ? (
          <button
            disabled={ocupado}
            onClick={() => accion(() => guardarSala(sala.id, campos))}
            className={`${BOTON} bg-accent text-background`}
          >
            Guardar cambios
          </button>
        ) : (
          <button
            disabled={ocupado || !campos.name?.trim()}
            onClick={() => accion(() => aprobarSala(sala.id, campos))}
            className={`${BOTON} bg-accent text-background disabled:opacity-40`}
          >
            Aprobar sala
          </button>
        )}
        {sala.status !== "descartado" && (
          <button
            disabled={ocupado}
            onClick={() => accion(() => descartarSala(sala.id))}
            className={`${BOTON_TENUE} ml-auto`}
            title="La saca del mapa pero no la borra: se puede volver atrás"
          >
            No va
          </button>
        )}
      </div>
    </div>
  );
}

function FormularioDeSala({
  setError,
  alCrear,
}: {
  setError: (m: string | null) => void;
  alCrear: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function crear() {
    setOcupado(true);
    setError(null);
    try {
      await crearSala({
        name: nombre,
        address: direccion || null,
        latitude: lat ? Number(lat) : null,
        longitude: lon ? Number(lon) : null,
      });
      alCrear();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setOcupado(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-surface p-4 sm:p-5">
      <h2 className="font-display text-lg font-semibold">Nueva sala</h2>
      <p className="mt-1 text-xs text-muted">
        Para un lugar que ningún scraper publica. Nace aprobada: la estás creando vos, que
        sos quien aprobaría el borrador.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <Rotulo>Nombre</Rotulo>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={CAMPO} />
          {nombre.trim() && (
            // Se muestra el identificador antes de crear porque después no se
            // puede cambiar, y porque tiene que coincidir con el que generaría
            // el scraper si algún día publica esta sala.
            <span className="mt-1 block font-mono text-xs text-muted">
              identificador: {slugDeSala(nombre)}
            </span>
          )}
        </label>
        <label className="sm:col-span-2">
          <Rotulo>Dirección</Rotulo>
          <input
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className={CAMPO}
          />
        </label>
        <label>
          <Rotulo>Latitud</Rotulo>
          <input
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="4.6510"
            className={CAMPO}
          />
        </label>
        <label>
          <Rotulo>Longitud</Rotulo>
          <input
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            placeholder="-74.0630"
            className={CAMPO}
          />
        </label>
      </div>

      <button
        disabled={ocupado || !nombre.trim()}
        onClick={crear}
        className={`${BOTON} mt-5 bg-accent text-background disabled:opacity-40`}
      >
        {ocupado ? "Creando…" : "Crear sala"}
      </button>
    </div>
  );
}
