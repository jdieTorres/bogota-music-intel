/**
 * Lee un afiche —o un texto pegado— y propone los campos de un evento.
 *
 * **Es el primer route handler del repo, y tiene que serlo.** Todo lo demás
 * del frontend habla con Supabase desde el navegador, con la sesión del
 * admin y RLS decidiendo qué puede hacer. Acá no alcanza: la clave de
 * Anthropic no puede viajar al bundle, así que la llamada se hace del lado
 * del servidor y este archivo es el único lugar donde vive.
 *
 * **Propone, no decide.** Devuelve campos para prellenar el formulario de
 * carga manual; quien los verifica y publica es Juan, igual que con lo que
 * trae el cron. Nada de acá escribe en la base.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

/**
 * Leer un afiche tarda entre 10 y 30 segundos. El tope de una función en el
 * plan Hobby de Vercel es 60, así que se pide el máximo: quedarse en el
 * default de 10 cortaría casi todas las lecturas.
 */
export const maxDuration = 60;

/**
 * Lo que se le pide al modelo. **Todo es nullable y no es un descuido:** es
 * la regla de nunca inventar un dato, puesta donde más tienta. Un afiche que
 * no imprime la hora tiene que devolver `null`, no las 8 de la noche porque
 * es lo habitual.
 */
const Afiche = z.object({
  titulo: z
    .string()
    .nullable()
    .describe("El nombre del evento o del artista principal, tal como está impreso."),
  artistas: z
    .array(z.string())
    .describe("Los artistas del cartel, en el orden en que aparecen. Vacío si no hay ninguno legible."),
  fecha_local: z
    .string()
    .nullable()
    .describe(
      "La fecha en formato AAAA-MM-DD, hora de Bogotá. **Si el afiche no imprime el año, devuelve null**: " +
        "no lo deduzcas del año en curso ni de la temporada.",
    ),
  hora_local: z
    .string()
    .nullable()
    .describe("La hora de inicio en formato HH:MM de 24 horas, hora de Bogotá. Null si el afiche no la imprime."),
  sala_nombre: z
    .string()
    .nullable()
    .describe("El lugar, tal como está impreso. No lo normalices ni lo completes."),
  precio_texto: z
    .string()
    .nullable()
    .describe("Lo que el afiche dice del precio, literal ('$40.000', 'Entrada libre', 'Preventa 30k'). Sin interpretar."),
  boleteria_url: z.string().nullable().describe("La URL de venta si aparece escrita."),
  genero: z.string().nullable().describe("El género musical solo si el afiche lo dice."),
  notas: z
    .string()
    .nullable()
    .describe("Lo que no entró en ningún campo y le sirve a quien revisa: teloneros, si es un ciclo, si la fecha es dudosa."),
});

const INSTRUCCIONES = `Eres el asistente de carga de una cartelera de la escena musical de Bogotá.

Te llega un afiche de un toque (o el texto de una publicación) y devuelves los campos del evento.

La regla que manda sobre todas las demás: **no inventes ni completes nada.**
Si el afiche no lo dice, el campo va en null. Un "no sabemos" honesto vale más
que un valor verosímil pero falso — quien revisa puede completar un hueco, pero
no puede adivinar que un dato plausible está mal.

En concreto:
- Si no hay año impreso, \`fecha_local\` va en null aunque el día y el mes sí estén.
  Anota en \`notas\` lo que sí decía ("dice 12 de septiembre, sin año").
- Si no hay hora, \`hora_local\` va en null. No supongas que un toque es de noche.
- Las fechas y horas son de Bogotá, tal como están impresas. No conviertas a UTC
  ni sumes ni restes nada.
- El precio va literal en \`precio_texto\`. No lo pases a número ni resuelvas
  cuál de dos precios es "el" precio.
- Si el afiche está borroso o cortado y no puedes leer un campo con seguridad,
  es null y lo decís en \`notas\`.`;

/** Campos mínimos del cuerpo. La imagen llega como URL ya subida al bucket. */
type Cuerpo = { imagenUrl?: string; texto?: string };

export async function POST(request: Request) {
  // --- Puerta de entrada -------------------------------------------------
  // Sin esto, cualquiera que haga POST gasta el crédito de la API. Se
  // verifica contra la base con la misma función que decide quién publica,
  // no contra una lista del frontend.
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return Response.json({ error: "Hay que iniciar sesión." }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );
  const { data: esAdmin, error: errorDeSesion } = await supabase.rpc("es_admin");
  if (errorDeSesion || !esAdmin) {
    return Response.json({ error: "Esta sesión no puede cargar eventos." }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Falta la credencial para leer afiches. Está sin configurar en el servidor." },
      { status: 503 },
    );
  }

  const { imagenUrl, texto }: Cuerpo = await request.json();
  if (!imagenUrl && !texto?.trim()) {
    return Response.json({ error: "Hace falta un afiche o un texto." }, { status: 400 });
  }

  const contenido: Anthropic.ContentBlockParam[] = imagenUrl
    ? [
        { type: "image", source: { type: "url", url: imagenUrl } },
        { type: "text", text: "Lee este afiche y devuelve los campos del evento." },
      ]
    : [{ type: "text", text: `Lee esta publicación y devuelve los campos del evento:\n\n${texto}` }];

  try {
    const respuesta = await new Anthropic().messages.parse({
      model: "claude-opus-5",
      max_tokens: 4000,
      // Extraer campos de un afiche es una tarea de lectura, no de
      // razonamiento: el effort bajo alcanza y cuesta menos.
      output_config: { effort: "low", format: zodOutputFormat(Afiche) },
      system: INSTRUCCIONES,
      messages: [{ role: "user", content: contenido }],
    });

    if (respuesta.stop_reason === "refusal") {
      return Response.json({ error: "No se pudo leer este afiche." }, { status: 422 });
    }
    if (!respuesta.parsed_output) {
      return Response.json({ error: "La lectura no devolvió campos utilizables." }, { status: 422 });
    }

    return Response.json({
      campos: respuesta.parsed_output,
      // Lo que costó la lectura, para que se vea y no sea un gasto invisible.
      tokens: respuesta.usage.input_tokens + respuesta.usage.output_tokens,
    });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) {
      return Response.json({ error: "La credencial del servidor no sirve." }, { status: 503 });
    }
    // Un saldo agotado llega como 400 y sin este caso se mostraría "no se
    // pudo leer el afiche (400)", que manda a revisar el afiche cuando el
    // problema es la cuenta. Un error que no dice qué hacer cuesta más que
    // uno feo.
    if (e instanceof Anthropic.BadRequestError && /credit balance/i.test(e.message)) {
      return Response.json(
        { error: "La cuenta de Anthropic se quedó sin saldo. Hay que recargar en Plans & Billing." },
        { status: 402 },
      );
    }
    if (e instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "Demasiadas lecturas seguidas. Intenta en un momento." }, { status: 429 });
    }
    if (e instanceof Anthropic.APIError) {
      return Response.json({ error: `No se pudo leer el afiche (${e.status}).` }, { status: 502 });
    }
    throw e;
  }
}
