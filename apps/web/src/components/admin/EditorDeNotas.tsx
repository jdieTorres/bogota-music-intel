"use client";

/**
 * Las notas de contratapa, con barra de formato.
 *
 * **Es el único texto del sitio que no salió de otra parte**, y por eso es el
 * único campo que merece formato: lo demás son datos, y un dato con negrilla
 * no dice nada más.
 *
 * ⚠️ **El área de escritura no es un nodo controlado por React.** Un
 * `contenteditable` cuyo `innerHTML` se reescribe en cada render pierde el
 * cursor en cada tecla: React repinta el nodo y el navegador manda el cursor
 * al principio. Así que el valor se pone **una vez**, al montar, y a partir de
 * ahí manda el DOM y el componente solo avisa hacia arriba. Es la misma
 * lección que costó el reproductor de YouTube, con otra librería: hay nodos
 * que se ceden, y al cederlos se cede también quién los pinta.
 *
 * Lo que escribe la barra se limpia contra la lista blanca de
 * `lib/texto-rico.ts` **en cada cambio**, que es lo que hace que pegar desde
 * un correo no arrastre fuentes, colores ni tamaños.
 */

import { useEffect, useRef } from "react";

import { Rotulo } from "@/components/admin/ui";
import {
  ETIQUETAS_PERMITIDAS,
  enlaceSeguro,
  estiloPermitido,
} from "@/lib/texto-rico";

/**
 * Deja solo lo que la barra produce.
 *
 * Necesita el navegador —parsea de verdad en vez de adivinar con
 * expresiones regulares, que es como se escriben los sanitizadores rotos— y
 * por eso vive acá y no en el módulo de criterio.
 */
function limpiarHtml(sucio: string): string {
  const doc = new DOMParser().parseFromString(`<body>${sucio}</body>`, "text/html");

  const limpiar = (nodo: Element) => {
    for (const hijo of [...nodo.children]) {
      limpiar(hijo);

      if (!ETIQUETAS_PERMITIDAS.has(hijo.tagName)) {
        // Se desenvuelve en vez de borrarse: un `<div>` o un `<span>` de
        // Word no aporta nada, pero el texto que lleva adentro sí.
        hijo.replaceWith(...hijo.childNodes);
        continue;
      }

      for (const atributo of [...hijo.attributes]) {
        const nombre = atributo.name.toLowerCase();
        if (nombre === "href" && hijo.tagName === "A") {
          if (!enlaceSeguro(atributo.value)) hijo.removeAttribute("href");
          continue;
        }
        if (nombre === "style") {
          const permitido = estiloPermitido(atributo.value);
          if (permitido) hijo.setAttribute("style", permitido);
          else hijo.removeAttribute("style");
          continue;
        }
        hijo.removeAttribute(atributo.name);
      }

      if (hijo.tagName === "A") {
        hijo.setAttribute("target", "_blank");
        hijo.setAttribute("rel", "noreferrer");
      }
    }
  };

  limpiar(doc.body);
  return doc.body.innerHTML;
}

type Herramienta = { comando: string; valor?: string; etiqueta: string; titulo: string };

const HERRAMIENTAS: Herramienta[][] = [
  [
    { comando: "bold", etiqueta: "N", titulo: "Negrilla" },
    { comando: "italic", etiqueta: "K", titulo: "Itálica" },
    { comando: "underline", etiqueta: "S", titulo: "Subrayado" },
  ],
  [
    { comando: "insertUnorderedList", etiqueta: "•", titulo: "Lista" },
    { comando: "insertOrderedList", etiqueta: "1.", titulo: "Lista numerada" },
  ],
  [
    { comando: "justifyLeft", etiqueta: "≡", titulo: "Alinear a la izquierda" },
    { comando: "justifyCenter", etiqueta: "≣", titulo: "Centrar" },
    { comando: "justifyFull", etiqueta: "☰", titulo: "Justificar" },
  ],
];

export function EditorDeNotas({
  valor,
  alCambiar,
  ayuda,
}: {
  valor: string | null;
  alCambiar: (html: string | null) => void;
  ayuda?: React.ReactNode;
}) {
  const area = useRef<HTMLDivElement>(null);

  // Solo al montar: de ahí en adelante el contenido lo maneja el navegador.
  // Volver a escribirlo en cada render se lleva el cursor al principio.
  useEffect(() => {
    if (area.current) area.current.innerHTML = valor ?? "";
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a propósito: ver arriba
  }, []);

  const avisar = () => {
    if (!area.current) return;
    const limpio = limpiarHtml(area.current.innerHTML);
    alCambiar(limpio.trim() ? limpio : null);
  };

  const aplicar = (herramienta: Herramienta) => {
    // `execCommand` está marcado como obsoleto y sigue siendo lo único que
    // hace esto sin traer un editor entero como dependencia. Si un día deja
    // de funcionar, lo que se pierde es la barra, no las notas: lo guardado
    // es HTML corriente.
    document.execCommand(herramienta.comando, false, herramienta.valor);
    avisar();
  };

  /**
   * Lo pegado entra como texto, sin el formato de donde venga.
   *
   * ⚠️ **Sin esto el editor miente.** `limpiarHtml` sanea lo que se guarda,
   * pero no lo que se ve: pegar de un correo dejaba en pantalla su fuente, su
   * color y su tamaño, y esos estilos desaparecían recién al recargar. Ver un
   * formato que no se va a publicar es peor que no poder pegarlo.
   *
   * Se pierde la negrilla del origen, y es el precio correcto: la barra está
   * a dos centímetros y el sitio tiene una sola tipografía.
   */
  const pegar = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const texto = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, texto);
    avisar();
  };

  const ponerEnlace = () => {
    const url = window.prompt("Dirección del enlace");
    if (!url) return;
    if (!enlaceSeguro(url)) {
      window.alert("El enlace tiene que empezar por http:// o https://");
      return;
    }
    document.execCommand("createLink", false, url);
    avisar();
  };

  return (
    <div className="sm:col-span-2">
      <Rotulo>Notas de contratapa</Rotulo>

      <div className="mt-1 flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 border-border bg-surface-hover px-2 py-1.5">
        {HERRAMIENTAS.map((grupo, i) => (
          <div key={i} className="flex items-center gap-1 [&:not(:first-child)]:ml-2">
            {grupo.map((h) => (
              <button
                key={h.comando}
                type="button"
                title={h.titulo}
                aria-label={h.titulo}
                // Sin esto el botón se roba el foco y con él la selección, así
                // que el comando se aplicaría sobre nada.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => aplicar(h)}
                className="min-w-7 rounded px-1.5 py-1 font-mono text-xs text-muted transition-colors hover:bg-background hover:text-foreground"
              >
                {h.etiqueta}
              </button>
            ))}
          </div>
        ))}
        <button
          type="button"
          title="Enlace"
          aria-label="Enlace"
          onMouseDown={(e) => e.preventDefault()}
          onClick={ponerEnlace}
          className="ml-2 min-w-7 rounded px-1.5 py-1 font-mono text-xs text-muted transition-colors hover:bg-background hover:text-foreground"
        >
          ⚭
        </button>
      </div>

      <div
        ref={area}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Notas de contratapa"
        onInput={avisar}
        onPaste={pegar}
        onBlur={avisar}
        data-vacio="Quién es, qué suena, por qué importa acá."
        className="notas notas-editables min-h-36 w-full rounded-b-md border border-border bg-background px-3 py-2 text-sm leading-relaxed focus:border-accent"
      />

      {ayuda && <span className="mt-1 block text-xs text-muted">{ayuda}</span>}
    </div>
  );
}
