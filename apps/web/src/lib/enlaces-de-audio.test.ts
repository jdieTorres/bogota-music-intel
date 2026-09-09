import { describe, expect, it } from "vitest";

import {
  direccionPublica,
  leerEnlaceDeAudio,
  miniatura,
  type EnlaceDeAudio,
} from "@/lib/enlaces-de-audio";

/** Lee y falla ruidosamente si no se reconoció: el test quiere el enlace. */
function leido(pegado: string): EnlaceDeAudio {
  const lectura = leerEnlaceDeAudio(pegado);
  if (!lectura.reconocido) throw new Error(`no se reconoció: ${lectura.motivo}`);
  return lectura.enlace;
}

function motivo(pegado: string): string {
  const lectura = leerEnlaceDeAudio(pegado);
  if (lectura.reconocido) throw new Error("se reconoció y no debía");
  return lectura.motivo;
}

describe("leerEnlaceDeAudio, YouTube", () => {
  // Las cuatro formas que uno acaba pegando según de dónde copie.
  it("lee la de la barra del navegador", () => {
    expect(leido("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      plataforma: "youtube",
      idExterno: "dQw4w9WgXcQ",
    });
  });

  it("lee la del botón de compartir", () => {
    expect(leido("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      plataforma: "youtube",
      idExterno: "dQw4w9WgXcQ",
    });
  });

  it("lee la del código de inserción", () => {
    expect(leido("https://www.youtube.com/embed/dQw4w9WgXcQ")).toEqual({
      plataforma: "youtube",
      idExterno: "dQw4w9WgXcQ",
    });
  });

  it("lee la de un short", () => {
    expect(leido("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toEqual({
      plataforma: "youtube",
      idExterno: "dQw4w9WgXcQ",
    });
  });

  // La parte que de verdad rompe: la basura que arrastra el copiar y pegar.
  it("suelta la lista, el minuto y el rastreo que vienen pegados", () => {
    expect(leido("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabc&index=3").idExterno).toBe(
      "dQw4w9WgXcQ",
    );
    expect(leido("https://youtu.be/dQw4w9WgXcQ?si=xYz123&t=42").idExterno).toBe("dQw4w9WgXcQ");
  });

  it("acepta music.youtube.com y el móvil", () => {
    expect(leido("https://music.youtube.com/watch?v=dQw4w9WgXcQ").idExterno).toBe("dQw4w9WgXcQ");
    expect(leido("https://m.youtube.com/watch?v=dQw4w9WgXcQ").idExterno).toBe("dQw4w9WgXcQ");
  });

  it("no acepta la portada de un canal como si fuera un video", () => {
    // El id de canal mide distinto que el de video, y guardarlo daría un
    // reproductor vacío sin que nadie se entere hasta que alguien le dé play.
    expect(motivo("https://www.youtube.com/@unabanda")).toContain("no apunta a un video");
    expect(motivo("https://www.youtube.com/watch?v=corto")).toContain("no apunta a un video");
  });
});

describe("leerEnlaceDeAudio, SoundCloud", () => {
  it("guarda la ruta del track, que es lo que acepta el reproductor", () => {
    expect(leido("https://soundcloud.com/unabanda/el-tema")).toEqual({
      plataforma: "soundcloud",
      idExterno: "unabanda/el-tema",
    });
  });

  it("distingue un set de un track", () => {
    expect(motivo("https://soundcloud.com/unabanda/sets/el-disco")).toContain("set");
  });

  it("pide la dirección completa cuando le pegan el enlace corto", () => {
    // No se puede resolver sin pedirle la página, y adivinar sería inventar.
    expect(motivo("https://on.soundcloud.com/AbCdEf")).toContain("enlace corto");
  });

  it("no acepta el perfil del artista como si fuera un track", () => {
    expect(motivo("https://soundcloud.com/unabanda")).toContain("no apunta a un track");
  });
});

describe("leerEnlaceDeAudio, lo que no entra a la cola", () => {
  // Estas dos direcciones están perfectas: el problema es la plataforma. Si el
  // formulario respondiera "no se reconoce", Juan reintentaría pegando lo
  // mismo. Por eso cada una se dice por su nombre.
  it("manda Bandcamp al campo del disco completo", () => {
    const dicho = motivo("https://elkalvo.bandcamp.com/track/algo");
    expect(dicho).toContain("Bandcamp");
    expect(dicho).toContain("disco completo");
  });

  it("explica que Spotify se queda en 30 segundos", () => {
    expect(motivo("https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT")).toContain(
      "30 segundos",
    );
  });

  it("dice qué encadena cuando no es ninguna de las cuatro", () => {
    expect(motivo("https://vimeo.com/12345")).toContain("YouTube y SoundCloud");
  });

  it("no acepta un campo vacío ni algo que no es una dirección", () => {
    expect(motivo("   ")).toContain("Pega la dirección");
    expect(motivo("el tema del disco nuevo")).toContain("dirección web");
  });
});

describe("direccionPublica y miniatura", () => {
  it("arma la página del track en las dos plataformas", () => {
    expect(direccionPublica({ plataforma: "youtube", idExterno: "dQw4w9WgXcQ" })).toBe(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(direccionPublica({ plataforma: "soundcloud", idExterno: "unabanda/el-tema" })).toBe(
      "https://soundcloud.com/unabanda/el-tema",
    );
  });

  it("devuelve null la miniatura de SoundCloud en vez de inventar una", () => {
    // Su carátula solo sale de la API, que pide clave. Una dirección armada a
    // mano daría 404 y una imagen rota, que es peor que no mostrar nada.
    expect(miniatura({ plataforma: "soundcloud", idExterno: "unabanda/el-tema" })).toBeNull();
    expect(miniatura({ plataforma: "youtube", idExterno: "dQw4w9WgXcQ" })).toBe(
      "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    );
  });
});
