import { describe, expect, it } from "vitest";

import { faltaParaCambiarClave, mensajeDeSupabase } from "@/lib/admin/clave";

describe("faltaParaCambiarClave", () => {
  it("las dos copias tienen que coincidir, y eso solo lo sabe el formulario", () => {
    // Supabase recibe una sola contraseña, así que un dedazo al escribirla
    // se guarda sin error y se descubre al intentar entrar. Es la única
    // comprobación que no puede hacer el servidor.
    const falta = faltaParaCambiarClave("una-clave-larga", "una-clave-larqa");

    expect(falta?.campo).toBe("confirmacion");
    expect(falta?.mensaje).toMatch(/no coinciden/i);
  });

  it("una contraseña vacía se reclama en su campo", () => {
    expect(faltaParaCambiarClave("", "")?.campo).toBe("clave");
  });

  it("los espacios en blanco no son una contraseña", () => {
    expect(faltaParaCambiarClave("      ", "      ")?.campo).toBe("clave");
  });

  it("se reclama la contraseña antes que la confirmación", () => {
    // Se lleva el cursor a un solo campo, igual que en la ficha de artista:
    // enumerar dos problemas no ayuda a resolver el primero.
    expect(faltaParaCambiarClave("", "algo")?.campo).toBe("clave");
  });

  it("dos copias iguales y no vacías pasan: el largo lo juzga Supabase", () => {
    // Acá no se replica el mínimo de caracteres a propósito. Vive en la
    // configuración del proyecto y puede cambiar sin tocar el repo; una copia
    // local se desincroniza y empieza a rechazar lo que el servidor acepta.
    expect(faltaParaCambiarClave("abc", "abc")).toBeNull();
  });
});

describe("mensajeDeSupabase", () => {
  it("traduce la contraseña filtrada, que es la que más confunde", () => {
    // Juan activó «Prevent use of leaked passwords» el 2026-09-16. Sin
    // traducir, el aviso llega en inglés y hablando de data breaches, y
    // parece que el sistema fallara en vez de estar protegiéndolo.
    const dicho = mensajeDeSupabase(
      "This password has been found in a data breach and cannot be used.",
    );

    expect(dicho).toMatch(/filtrad|conocida/i);
    expect(dicho).not.toMatch(/data breach/i);
  });

  it("traduce el mínimo de caracteres diciendo cuántos", () => {
    const dicho = mensajeDeSupabase("Password should be at least 8 characters.");

    expect(dicho).toMatch(/8/);
    expect(dicho).not.toMatch(/should be at least/i);
  });

  it("traduce que la nueva no puede ser la de antes", () => {
    const dicho = mensajeDeSupabase(
      "New password should be different from the old password.",
    );

    expect(dicho).toMatch(/misma|anterior|distinta/i);
    expect(dicho).not.toMatch(/should be different/i);
  });

  it("lo que no reconoce lo deja pasar entero en vez de inventar", () => {
    // Un mensaje raro en inglés es peor que uno en español, pero mucho mejor
    // que un "algo salió mal" que esconde la causa: es la regla de no
    // inventar un dato, puesta en los errores.
    expect(mensajeDeSupabase("Rate limit exceeded")).toBe("Rate limit exceeded");
  });

  it("sin mensaje dice algo útil y no una cadena vacía", () => {
    expect(mensajeDeSupabase("")).toMatch(/\S/);
    expect(mensajeDeSupabase(undefined)).toMatch(/\S/);
  });
});
