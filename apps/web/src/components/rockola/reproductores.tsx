"use client";

import { useEffect, useRef, useState } from "react";

import type { Plataforma } from "@/lib/enlaces-de-audio";

/**
 * Los reproductores que la rockola sabe encadenar.
 *
 * **No alojamos audio y no podemos.** No hay fuente legal del audio de esta
 * escena —está verificado y archivado dos veces—, así que lo que hay acá son
 * reproductores de terceros embebidos, cada uno con la misma interfaz por
 * fuera: se monta, suena, se pausa, y avisa cuando el track terminó para que
 * la cola avance sola.
 *
 * ⚠️ **El de YouTube se ve, y no es una decisión de diseño.** Sus políticas
 * exigen que el reproductor mida al menos 200x200 y prohíben taparlo con
 * nada, controles y atribución incluidos. Un iframe escondido detrás del
 * disco sería justo lo que no se puede hacer, y este proyecto no evade
 * términos. Los controles propios de la bandeja van **al lado**, que sí está
 * permitido.
 */

/**
 * El alto del reproductor de YouTube, en píxeles.
 *
 * Es el mínimo que exigen sus políticas —200 px por lado— y por eso manda
 * sobre el diseño en vez de al revés. El ancho sale de ahí: 16:9 da 356, que
 * cabe entero en un teléfono de 390 con el margen de la página.
 */
export const ALTO_DE_YOUTUBE = 200;
export const ANCHO_DE_YOUTUBE = 356;

type PropsDeReproductor = {
  idExterno: string;
  /** Lo que quiere quien escucha. El reproductor se acomoda a esto. */
  sonando: boolean;
  /** Se llama cuando el track terminó solo. La cola avanza con esto. */
  alTerminar: () => void;
};

/**
 * Espera a que la API de una plataforma esté en `window` y la devuelve.
 *
 * Las dos se cargan **al primer play y no antes**: mientras nadie ponga nada,
 * la rockola no le cuesta un solo byte a quien vino a mirar la cartelera.
 *
 * Se sondea en vez de usar el callback global que ofrece YouTube
 * (`onYouTubeIframeAPIReady`) porque ese callback es uno solo para toda la
 * página: el segundo que lo defina pisa al primero, y ahí el reproductor que
 * perdió se queda mudo sin decir por qué.
 */
function useApiExterna<T>(src: string, obtener: () => T | null): T | null {
  // Con inicializador perezoso y no con un efecto que llame a `setApi`: si el
  // script ya está cargado —el caso normal a partir del segundo track— la API
  // se tiene desde el primer render y no hace falta un render de más.
  const [api, setApi] = useState<T | null>(() =>
    typeof window === "undefined" ? null : obtener(),
  );

  useEffect(() => {
    if (api) return;

    if (!document.querySelector(`script[src="${src}"]`)) {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    }

    const revisar = window.setInterval(() => {
      const listo = obtener();
      if (listo) {
        window.clearInterval(revisar);
        setApi(listo);
      }
    }, 60);

    return () => window.clearInterval(revisar);
    // `obtener` es una función estable por plataforma; la dependencia real es
    // la dirección del script.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return api;
}

/**
 * Guarda la última versión de un callback sin volver a suscribirlo.
 *
 * Las dos APIs registran su callback de "terminó" una sola vez, al crear el
 * reproductor. Sin esto, ese callback se quedaría con la versión de la
 * función que existía en ese momento y la cola avanzaría desde un estado
 * viejo — el track siguiente sería el que seguía hace tres canciones.
 */
function useCallbackVigente(callback: () => void) {
  const guardado = useRef(callback);
  useEffect(() => {
    guardado.current = callback;
  }, [callback]);
  return guardado;
}

// --- YouTube --------------------------------------------------------------

type PlayerDeYoutube = {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (id: string) => void;
  destroy: () => void;
};

type ApiDeYoutube = {
  Player: new (
    elemento: HTMLElement,
    opciones: {
      width?: number | string;
      height?: number | string;
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: () => void;
        onStateChange?: (evento: { data: number }) => void;
      };
    },
  ) => PlayerDeYoutube;
  PlayerState: { ENDED: number };
};

function apiDeYoutube(): ApiDeYoutube | null {
  const w = window as unknown as { YT?: ApiDeYoutube };
  return w.YT?.Player ? w.YT : null;
}

export function ReproductorDeYoutube({ idExterno, sonando, alTerminar }: PropsDeReproductor) {
  const caja = useRef<HTMLDivElement>(null);
  const player = useRef<PlayerDeYoutube | null>(null);
  const [listo, setListo] = useState(false);
  const terminar = useCallbackVigente(alTerminar);
  const api = useApiExterna("https://www.youtube.com/iframe_api", apiDeYoutube);

  useEffect(() => {
    if (!api || !caja.current || player.current) return;

    // ⚠️ **El nodo que recibe YouTube lo creamos a mano, no lo pone React.**
    // `YT.Player` no monta el reproductor *dentro* del elemento: lo
    // **reemplaza** por su iframe. Si ese elemento fuera uno de React, los dos
    // se pelearían por el mismo nodo — y en desarrollo, donde los efectos
    // corren dos veces, el segundo montaje quedaba colgado de un nodo que ya
    // había sido sacado del documento. El resultado era un iframe del tamaño
    // correcto y en su sitio que nunca reproducía nada: negro, sin un solo
    // error en la consola. Se descubrió comparando contra un iframe pelado
    // con el mismo video, que sí cargaba.
    const montaje = document.createElement("div");
    caja.current.appendChild(montaje);

    player.current = new api.Player(montaje, {
      // ⚠️ **Sin esto el video sale recortado.** El nodo que creamos a mano no
      // lleva las clases que llevaba el de React, así que YouTube arma su
      // iframe con los 640x390 por defecto y la caja se come lo que sobra: se
      // ve la esquina superior izquierda del video y nadie sospecha que falta
      // la mitad, porque el reproductor mide lo que debe. Fue la factura de
      // arreglar el montaje sin mirar el tamaño.
      width: "100%",
      height: "100%",
      videoId: idExterno,
      // `autoplay` funciona porque acá se llega desde un click: lo que el
      // navegador bloquea es sonar sin gesto, no la etiqueta.
      playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
      events: {
        onReady: () => setListo(true),
        onStateChange: (evento) => {
          if (evento.data === api.PlayerState.ENDED) terminar.current();
        },
      },
    });
    const actual = player.current;
    return () => {
      actual?.destroy();
      player.current = null;
      montaje.remove();
      setListo(false);
    };
    // Se monta una sola vez, con el track que hubiera al llegar: los cambios
    // de track los atiende el efecto de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  // Cambiar de track no vuelve a montar el reproductor: se le pide otro
  // video. Montarlo de nuevo dejaría medio segundo de silencio entre canción
  // y canción, que es justo lo que una rockola no hace.
  useEffect(() => {
    if (listo) player.current?.loadVideoById(idExterno);
  }, [idExterno, listo]);

  useEffect(() => {
    if (!listo) return;
    if (sonando) player.current?.playVideo();
    else player.current?.pauseVideo();
  }, [sonando, listo]);

  // ⚠️ El tamaño se fija acá y no en quien usa el componente. El mínimo de
  // 200 px por lado es un requisito de la plataforma, y dejarlo del lado del
  // llamador es el mismo modo de fallar que ya se pagó con los límites de
  // peticiones de las APIs: parece más flexible y lo que hace es repartir la
  // responsabilidad hasta que alguien la olvida.
  //
  // Apaisado y no cuadrado: el video es 16:9 y meterlo en un cuadrado deja dos
  // franjas negras que ocupan un tercio de la caja. El ancho cede en pantallas
  // muy angostas —de ahí el `max-w-full`— pero el alto no, porque es el que
  // sostiene el mínimo.
  return (
    <div
      ref={caja}
      className="caja-de-video w-full shrink-0 overflow-hidden rounded-sm bg-black"
      style={{ maxWidth: ANCHO_DE_YOUTUBE, height: ALTO_DE_YOUTUBE }}
    />
  );
}

// --- SoundCloud -----------------------------------------------------------

type WidgetDeSoundcloud = {
  bind: (evento: string, callback: () => void) => void;
  play: () => void;
  pause: () => void;
  load: (url: string, opciones: Record<string, unknown>) => void;
};

type ApiDeSoundcloud = {
  Widget: ((iframe: HTMLIFrameElement) => WidgetDeSoundcloud) & {
    Events: { READY: string; FINISH: string };
  };
};

function apiDeSoundcloud(): ApiDeSoundcloud | null {
  const w = window as unknown as { SC?: ApiDeSoundcloud };
  return w.SC?.Widget ? w.SC : null;
}

/**
 * El widget de SoundCloud.
 *
 * Se embebe con la dirección pública del track y **no pide clave**: lo que
 * está cerrado desde hace años es el registro de apps de su API de datos, que
 * es otra cosa. Su Widget API da el mismo control que YouTube —incluido
 * avisar cuando el track termina— y no impone tamaño mínimo, así que acá el
 * reproductor puede ser la barra corta.
 */
export function ReproductorDeSoundcloud({ idExterno, sonando, alTerminar }: PropsDeReproductor) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const widget = useRef<WidgetDeSoundcloud | null>(null);
  const [listo, setListo] = useState(false);
  const terminar = useCallbackVigente(alTerminar);
  const api = useApiExterna("https://w.soundcloud.com/player/api.js", apiDeSoundcloud);

  // El track con el que se monta el iframe: va en el `src` inicial y no
  // cambia nunca. En estado y no en una ref porque se lee al renderizar.
  const [primero] = useState(idExterno);

  useEffect(() => {
    if (!api || !iframe.current || widget.current) return;
    const w = api.Widget(iframe.current);
    widget.current = w;
    w.bind(api.Widget.Events.READY, () => setListo(true));
    w.bind(api.Widget.Events.FINISH, () => terminar.current());
    return () => {
      widget.current = null;
      setListo(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api]);

  useEffect(() => {
    // El primer track ya viene en el `src` del iframe; volver a cargarlo
    // reiniciaría lo que acaba de arrancar.
    if (!listo || idExterno === primero) return;
    widget.current?.load(`https://soundcloud.com/${idExterno}`, {
      auto_play: true,
      visual: false,
      show_comments: false,
    });
  }, [idExterno, listo, primero]);

  useEffect(() => {
    if (!listo) return;
    if (sonando) widget.current?.play();
    else widget.current?.pause();
  }, [sonando, listo]);

  const src =
    "https://w.soundcloud.com/player/?url=" +
    encodeURIComponent(`https://soundcloud.com/${primero}`) +
    "&auto_play=true&visual=false&show_comments=false&hide_related=true";

  return (
    <iframe
      ref={iframe}
      title="Reproductor de SoundCloud"
      src={src}
      allow="autoplay"
      className="h-[166px] w-full shrink-0 rounded-sm"
      style={{ maxWidth: ANCHO_DE_YOUTUBE }}
    />
  );
}

export function Reproductor({
  plataforma,
  ...props
}: PropsDeReproductor & { plataforma: Plataforma }) {
  // La clave por plataforma es lo que hace que pasar de YouTube a SoundCloud
  // desmonte el reproductor anterior en vez de intentar reusarlo: son dos
  // APIs distintas y ninguna sabe del otro iframe.
  return plataforma === "youtube" ? (
    <ReproductorDeYoutube key="youtube" {...props} />
  ) : (
    <ReproductorDeSoundcloud key="soundcloud" {...props} />
  );
}
