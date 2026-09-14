import { describe, expect, it } from "vitest";

import { aTextoPlano, enlaceSeguro, esHtml, estiloPermitido } from "@/lib/texto-rico";

describe("aTextoPlano", () => {
  it("saca las etiquetas y deja el texto", () => {
    // Lo usa la tarjeta de compartir: un `<strong>` colado en el og:description
    // sale como texto en el chat de quien recibe el enlace.
    expect(aTextoPlano("<p>Nicolás <strong>y los Fumadores</strong></p>")).toBe(
      "Nicolás y los Fumadores",
    );
  });

  it("no pega dos párrafos sin espacio", () => {
    // Sin esto "…centro.</p><p>Su primer disco…" quedaba como
    // "centro.Su primer disco".
    expect(aTextoPlano("<p>Uno.</p><p>Dos.</p>")).toBe("Uno. Dos.");
  });

  it("devuelve las entidades a su letra", () => {
    expect(aTextoPlano("<p>Rock &amp; Roll &lt;en vivo&gt;</p>")).toBe("Rock & Roll <en vivo>");
  });

  it("con texto plano no hace nada", () => {
    expect(aTextoPlano("Una bio de antes, sin formato.")).toBe("Una bio de antes, sin formato.");
  });

  it("aguanta el hueco", () => {
    expect(aTextoPlano(null)).toBe("");
  });
});

describe("esHtml", () => {
  it("distingue lo que escribió el editor de lo que ya estaba", () => {
    // Las notas de antes del editor son texto plano y se siguen pintando con
    // sus saltos de línea. Pasarlas por el pintor de HTML las dejaría en un
    // solo bloque sin párrafos.
    expect(esHtml("<p>Con formato</p>")).toBe(true);
    expect(esHtml("Sin formato.\nCon un salto.")).toBe(false);
    expect(esHtml("Una cuenta: 3 < 5 y 7 > 2")).toBe(false);
  });
});

describe("enlaceSeguro", () => {
  it("deja pasar http y https", () => {
    expect(enlaceSeguro("https://nicolasylosfumadores.bandcamp.com")).toBe(true);
    expect(enlaceSeguro("http://ejemplo.co")).toBe(true);
  });

  it("no deja pasar javascript: ni data:", () => {
    // La barra no los produce, pero pegar desde otro sitio sí puede traerlos.
    expect(enlaceSeguro("javascript:alert(1)")).toBe(false);
    expect(enlaceSeguro("data:text/html;base64,PHNjcmlwdD4=")).toBe(false);
    expect(enlaceSeguro("  JavaScript:alert(1)")).toBe(false);
  });
});

describe("estiloPermitido", () => {
  it("solo deja la alineación, que es lo único que pone la barra", () => {
    expect(estiloPermitido("text-align: center")).toBe("text-align: center");
    expect(estiloPermitido("text-align:justify")).toBe("text-align: justify");
  });

  it("descarta cualquier otra cosa", () => {
    // Pegar desde un correo o un documento arrastra fuentes, colores y
    // tamaños que romperían la tipografía del sitio.
    expect(estiloPermitido("color: red; font-size: 40px")).toBeNull();
    expect(estiloPermitido("text-align: center; color: red")).toBe("text-align: center");
    expect(estiloPermitido("position: fixed; text-align: left")).toBe("text-align: left");
  });
});
