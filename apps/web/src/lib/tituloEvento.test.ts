import { describe, expect, it } from "vitest";

import {
  esGrito,
  partirArtistaYGira,
  partirArtistas,
  tituloCaso,
  tituloParaMostrar,
} from "@/lib/tituloEvento";

// Las salas reales, para poder ejercitar el borrado del "en <sala>" con los
// nombres que de verdad están en la base.
const MOVISTAR = "Movistar Arena";
const LATINO = "Latino Power Chapinero";
const ROCKAL = "Teatro Libre Sede Centro";
const JEG = "Teatro Jorge Eliécer Gaitán";
const ROYAL = "Royal Center";
const LOURDES = "Lourdes Music Hall";

/** Atajo: un concierto sin clasificar todavía se trata igual que uno. */
const concierto = (title: string, sala?: string) =>
  tituloParaMostrar({ title, event_type: "music" }, sala);

const fiesta = (title: string, sala?: string) =>
  tituloParaMostrar({ title, event_type: "fiesta" }, sala);

describe("tituloCaso", () => {
  it("rearma un título gritado, con conectores en minúscula", () => {
    expect(tituloCaso("FIESTA DE LA SALSA")).toBe("Fiesta de la Salsa");
    expect(tituloCaso("OF MONSTERS AND MEN")).toBe("Of Monsters and Men");
  });

  it("capitaliza el conector cuando abre el título", () => {
    expect(tituloCaso("LA MUCHACHA EN BOGOTÁ")).toBe("La Muchacha en Bogotá");
  });

  it("sube las minúsculas de una fuente que no grita", () => {
    expect(tituloCaso("Todos tus muertos")).toBe("Todos Tus Muertos");
    expect(tituloCaso("El plan de la mariposa")).toBe("El Plan de la Mariposa");
  });

  it("no baja una mayúscula que puso la fuente a mano", () => {
    // La banda se publica así; bajar la 'A' sería inventar que es conector.
    expect(tituloCaso("Lucho Al Attaque")).toBe("Lucho Al Attaque");
  });

  it("respeta una sigla suelta en un título que no grita", () => {
    expect(tituloCaso("WWE Bogota")).toBe("WWE Bogota");
  });

  it("rearma una ráfaga de mayúsculas dentro de un título en caja mixta", () => {
    // Dos mayúsculas seguidas son la fuente gritando un pedazo, no una sigla.
    expect(tituloCaso("Shing02, SPIN MASTER A-1 y Sam Nakamura")).toBe(
      "Shing02, Spin Master A-1 y Sam Nakamura",
    );
  });

  it("no rearma una palabra que mezcla letras y dígitos", () => {
    expect(tituloCaso("MADE4RAP")).toBe("MADE4RAP");
  });

  it("unifica el apóstrofo que cada sala escribe distinto", () => {
    expect(tituloCaso("OLD MAN´S CHILD")).toBe("Old Man’s Child");
  });

  it("conserva números y no rompe con acentos", () => {
    expect(tituloCaso("10 AÑOS Y NO AZARAN")).toBe("10 Años y No Azaran");
  });

  it("colapsa espacios repetidos", () => {
    expect(tituloCaso("ROBBIE   WILLIAMS")).toBe("Robbie Williams");
  });
});

describe("esGrito", () => {
  it("distingue mayúscula sostenida de caja mixta", () => {
    expect(esGrito("ROBBIE WILLIAMS")).toBe(true);
    expect(esGrito("Robbie Williams")).toBe(false);
    expect(esGrito("2026")).toBe(false);
  });
});

describe("partirArtistaYGira", () => {
  it("separa por barra vertical", () => {
    expect(partirArtistaYGira("ROBBIE WILLIAMS | BRITPOP")).toEqual({
      artista: "ROBBIE WILLIAMS",
      gira: "BRITPOP",
    });
  });

  it("separa por dos puntos y por guion con espacios alrededor", () => {
    expect(partirArtistaYGira("El Kalvo: 20 años").gira).toBe("20 años");
    expect(partirArtistaYGira("AKRIILA - TOUR LUCY").gira).toBe("TOUR LUCY");
  });

  it("trata la raya larga igual que el guion", () => {
    expect(partirArtistaYGira("Lenny Tavarez – J quiles")).toEqual({
      artista: "Lenny Tavarez",
      gira: "J quiles",
    });
  });

  it("no separa un guion pegado al nombre (Jay-Z)", () => {
    expect(partirArtistaYGira("JAY-Z EN BOGOTÁ")).toEqual({
      artista: "JAY-Z EN BOGOTÁ",
      gira: null,
    });
  });

  it("sin separador, todo el título es el artista", () => {
    expect(partirArtistaYGira("Los Mirlos")).toEqual({
      artista: "Los Mirlos",
      gira: null,
    });
  });

  it("un separador al borde no inventa un lado vacío", () => {
    expect(partirArtistaYGira("ROBBIE WILLIAMS |")).toEqual({
      artista: "ROBBIE WILLIAMS |",
      gira: null,
    });
  });
});

describe("partirArtistas", () => {
  it("parte un cartel separado por barras", () => {
    expect(partirArtistas("Mukangu/Atake Mapale/ Los Yoryis")).toEqual([
      "Mukangu",
      "Atake Mapale",
      "Los Yoryis",
    ]);
  });

  it("no parte una barra que es parte del nombre (AC/DC)", () => {
    expect(partirArtistas("AC/DC")).toEqual(["AC/DC"]);
  });

  it("parte por comas y remata la lista con la 'y' final", () => {
    expect(partirArtistas("Shing02, SPIN MASTER A-1 y Sam Nakamura")).toEqual([
      "Shing02",
      "SPIN MASTER A-1",
      "Sam Nakamura",
    ]);
  });

  it("no parte por 'y' si nada más marca que es una lista", () => {
    // "10 AÑOS Y NO AZARAN" es un nombre, no dos artistas.
    expect(partirArtistas("10 AÑOS Y NO AZARAN")).toEqual(["10 AÑOS Y NO AZARAN"]);
  });

  it("sí parte por 'y' cuando un 'presenta' ya dijo que es cartel", () => {
    expect(partirArtistas("Sara Curruchich y Humazapas", true)).toEqual([
      "Sara Curruchich",
      "Humazapas",
    ]);
  });
});

describe("tituloParaMostrar — lo básico", () => {
  it("concierto con gira: artista | gira, cada uno en su formato", () => {
    expect(concierto("ROBBIE WILLIAMS | BRITPOP")).toBe("Robbie Williams | Britpop");
  });

  it("concierto sin gira: solo el artista, sin barra colgando", () => {
    expect(concierto("COSCULLUELA")).toBe("Cosculluela");
  });

  it("evento sin clasificar todavía se trata como concierto", () => {
    expect(tituloParaMostrar({ title: "COSCULLUELA", event_type: null })).toBe(
      "Cosculluela",
    );
  });
});

describe("tituloParaMostrar — ruido de sala y de ciudad", () => {
  it("quita el 'en Bogotá' que la sala le pega al título", () => {
    expect(concierto("AKRIILA EN BOGOTÁ", ROCKAL)).toBe("Akriila");
    expect(concierto("El plan de la mariposa en Bogota", LATINO)).toBe(
      "El Plan de la Mariposa",
    );
  });

  it("quita el 'llega al <sala>' usando el nombre real de la sala", () => {
    expect(concierto("Blonde Redhead llega al Teatro Jorge Eliécer Gaitán", JEG)).toBe(
      "Blonde Redhead",
    );
  });

  it("quita el 'en <sala>' aunque la fuente escriba mal el nombre", () => {
    expect(concierto("Estelares en Latino power", LATINO)).toBe("Estelares");
  });

  it("lo que viene después del lugar es la gira, no basura", () => {
    expect(concierto("Gustavo Santaolalla llega a Bogotá con el Ronroco Tour", JEG)).toBe(
      "Gustavo Santaolalla | Ronroco Tour",
    );
    expect(concierto("Todo copas en Latino Power Bogota 20 Años", LATINO)).toBe(
      "Todo Copas | 20 Años",
    );
  });

  it("quita la ciudad pegada al final sin preposición", () => {
    expect(fiesta("MADE4RAP BOGOTÁ", ROCKAL)).toBe("MADE4RAP");
  });

  it("no borra un 'en' que no anuncia un lugar", () => {
    // "en vivo" no es la ciudad ni la sala: si se borrara, se llevaría el
    // resto del título por delante.
    expect(concierto("Fiesta en vivo", LATINO)).toBe("Fiesta en Vivo");
  });

  it("sin nombre de sala todavía quita la ciudad", () => {
    expect(concierto("KAKKMADDAFAKKA EN BOGOTA")).toBe("Kakkmaddafakka");
  });
});

describe("tituloParaMostrar — varios artistas van con '&', no con '|'", () => {
  it("separa un cartel de dos", () => {
    expect(concierto("Juantxo Skalari/ The Skatalites en Bogotá", LATINO)).toBe(
      "Juantxo Skalari & The Skatalites",
    );
  });

  it("separa un cartel de tres, corrigiendo la grafía curada", () => {
    expect(concierto("Mukangu/Atake Mapale/ Los Yoryis", LATINO)).toBe(
      "Mukangu & Atake Mapalé & Los Yoryis",
    );
  });

  it("separa una lista con comas y 'y'", () => {
    expect(
      concierto("Shing02, SPIN MASTER A-1 y Sam Nakamura en vivo en  Bogota", LATINO),
    ).toBe("Shing02 & Spin Master A-1 & Sam Nakamura");
  });

  it("pone el cartel adelante cuando un ciclo lo 'presenta'", () => {
    expect(concierto("Festival Orígenes presenta Sara Curruchich y Humazapas", JEG)).toBe(
      "Sara Curruchich & Humazapas | Festival Orígenes",
    );
  });
});

describe("tituloParaMostrar — el año y los defectos de la fuente", () => {
  it("quita el año suelto con que el Movistar desambigua sus fichas", () => {
    expect(concierto("WWE Bogota 2026", MOVISTAR)).toBe("WWE");
  });

  it("no quita un año que está dentro del nombre de la gira", () => {
    expect(concierto("Bloodbath | Sickening Latin America Tour 2026", LOURDES)).toBe(
      "Bloodbath | Sickening Latin America Tour 2026",
    );
  });

  it("colapsa un nombre que la fuente renderizó dos veces", () => {
    expect(concierto("BloodbathBloodbath", LOURDES)).toBe("Bloodbath");
  });

  it("no colapsa un nombre que se repite a propósito", () => {
    // "PABLOPABLO" es literalmente "PABLO" + "PABLO": sin la costura de
    // minúscula-a-mayúscula, la regla del duplicado lo destrozaría.
    expect(concierto("PABLOPABLO EN BOGOTÁ", ROCKAL)).toBe("pablopablo");
  });

  it("quita el punto colgando de una fiesta", () => {
    expect(fiesta("Poder Femenino En Latino power Noches Bomm.", LATINO)).toBe(
      "Poder Femenino Noches Bomm",
    );
  });
});

describe("tituloParaMostrar — fiestas", () => {
  it("no parte el nombre del ciclo en artista y gira", () => {
    expect(fiesta("THE JAZZ ROOM", ROYAL)).toBe("The Jazz Room");
    expect(fiesta("Que Chimba Puñeta Vol. 4", LATINO)).toBe("Que Chimba Puñeta Vol. 4");
  });
});

describe("tituloParaMostrar — lo que se cura a mano", () => {
  it("dos artistas que la fuente separó con un guion", () => {
    expect(concierto("Lenny Tavarez – J quiles", MOVISTAR)).toBe(
      "Lenny Tavárez & Justin Quiles | Superarte",
    );
  });

  it("la gira que la fuente no publica", () => {
    expect(concierto("Alvaro Diaz 2026", MOVISTAR)).toBe("Álvaro Díaz | Omakase Tour");
  });

  it("el título que viene al revés: la gira primero y el artista después", () => {
    expect(concierto("10 AÑOS Y NO AZARAN - LA MUCHACHA EN BOGOTÁ", ROCKAL)).toBe(
      "La Muchacha | 10 Años y No Azaran",
    );
  });

  it("el formato del show pegado al nombre de la banda", () => {
    expect(concierto("RAYOS LASER ACÚSTICO EN BOGOTÁ", ROCKAL)).toBe(
      "Rayos Láser | Acústico",
    );
  });

  it("un '&' que no separa artistas, y la gira sin separador", () => {
    expect(concierto("Carlos Vives & La Provincia Tour Al Sol", MOVISTAR)).toBe(
      "Carlos Vives & La Provincia | Tour al Sol",
    );
  });

  it("corrige la errata de la sala sin tocar el resto", () => {
    expect(concierto("SLAUHGTER TO PREVAIL", ROYAL)).toBe("Slaughter to Prevail");
    expect(concierto("Mad Profesor", LOURDES)).toBe("Mad Professor");
    expect(concierto("Ky Mani Marley", LOURDES)).toBe("Ky-Mani Marley");
  });

  it("la grafía curada sirve para cualquier evento del mismo artista", () => {
    // La entrada se guarda por artista, no por título: el show siguiente
    // de la misma banda entra solo.
    expect(concierto("5 SECONDS OF SUMMERS | EVERYONE´S A STAR! WORLD TOUR", MOVISTAR)).toBe(
      "5 Seconds of Summer | Everyone’s a Star! World Tour",
    );
    expect(concierto("5 Seconds of Summers en Bogotá", MOVISTAR)).toBe(
      "5 Seconds of Summer",
    );
  });
});
