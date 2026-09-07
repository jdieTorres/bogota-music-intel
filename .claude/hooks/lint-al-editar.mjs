#!/usr/bin/env node
// Hook PostToolUse: corre el linter del lado que se acaba de editar.
//
// Por qué existe: los dos linters ya corren en CI, pero enterarse allá cuesta
// un viaje de ida y vuelta. `ThemeToggle.tsx` violó
// `react-hooks/set-state-in-effect` durante un día entero justamente porque
// nadie miraba eslint hasta después de pushear (ver el comentario en
// .github/workflows/tests.yml).
//
// Si el linter no está instalado —checkout limpio, sin `npm ci` ni `pip
// install -e`— el hook se calla y sale con 0: avisar de una herramienta que
// falta en cada edición sería peor que no avisar.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const WIN = process.platform === "win32";

// Lo que sale de acá lo lee el modelo, no una terminal, así que los códigos de
// color solo gastan contexto. Ruff los emite igual con NO_COLOR puesto y con la
// salida redirigida a una tubería, así que hay que quitarlos a mano. Se arma
// con fromCharCode para no dejar un carácter de control invisible en el fuente.
const COLORES = new RegExp(String.fromCharCode(27) + "\\[[0-9;]*m", "g");

function leerEntrada() {
  let crudo = "";
  try {
    crudo = readFileSync(0, "utf8");
  } catch {
    return null;
  }
  try {
    return JSON.parse(crudo);
  } catch {
    return null;
  }
}

/** El archivo editado, relativo a la raíz del repo, con "/" siempre. */
function archivoEditado(entrada) {
  const ruta = entrada?.tool_input?.file_path;
  if (!ruta) return null;
  const rel = relative(RAIZ, resolve(ruta));
  if (rel.startsWith("..")) return null; // fuera del repo
  return rel.split(sep).join("/");
}

/** Devuelve [binario, args, cwd] o null si ese lado no aplica o no está. */
function linterPara(archivo) {
  if (archivo.startsWith("services/api/") && archivo.endsWith(".py")) {
    const venv = join(RAIZ, "services", "api", ".venv");
    const bin = WIN
      ? join(venv, "Scripts", "ruff.exe")
      : join(venv, "bin", "ruff");
    if (!existsSync(bin)) return null;
    // El path se le pasa absoluto: ruff respeta igual el pyproject.toml.
    return [bin, ["check", join(RAIZ, archivo)], join(RAIZ, "services", "api")];
  }

  if (
    archivo.startsWith("apps/web/") &&
    /\.(ts|tsx|js|jsx|mjs)$/.test(archivo)
  ) {
    const binarios = join(RAIZ, "apps", "web", "node_modules", ".bin");
    const bin = WIN ? join(binarios, "eslint.cmd") : join(binarios, "eslint");
    if (!existsSync(bin)) return null;
    return [bin, [join(RAIZ, archivo)], join(RAIZ, "apps", "web")];
  }

  return null;
}

const entrada = leerEntrada();
const archivo = entrada && archivoEditado(entrada);
if (!archivo) process.exit(0);

const orden = linterPara(archivo);
if (!orden) process.exit(0);

const [bin, args, cwd] = orden;
const r = spawnSync(bin, args, {
  cwd,
  encoding: "utf8",
  shell: WIN,
  env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
});

if (r.error || r.status === 0 || r.status === null) process.exit(0);

// Código 2: la salida del linter vuelve al modelo para que la arregle antes de
// seguir. Cualquier otro código solo se le muestra a Juan.
const salida = ((r.stdout || "") + (r.stderr || "")).replace(COLORES, "");
process.stderr.write(`El linter marcó ${archivo}:\n\n${salida}`);
process.exit(2);
