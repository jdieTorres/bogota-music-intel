/**
 * Los géneros que se ofrecen como sugerencia al escribir uno en `/admin`.
 *
 * Los cuatro primeros no son invención: son el vocabulario de Rockal Live,
 * la única fuente que publica algo con forma de género de verdad y lo único
 * que hay en la base. El resto son los que la escena de Bogotá pide y
 * todavía nadie escribió.
 *
 * Es un `datalist` y no un `select` a propósito: la lista existe para que
 * los chips no terminen siendo "rock", "Rock" y "Rock/Punk/Metal" a la vez,
 * no para cerrar el vocabulario. Lo que no esté acá se escribe igual.
 *
 * Vive en `lib` y no en el componente para poder probarlo sin montar JSX.
 * Lo que se prueba es que ninguna sugerencia sea de las que la cartelera
 * esconde: ofrecer un valor que después no se muestra sería mentirle al
 * admin sobre lo que va a pasar.
 */
export const GENEROS_SUGERIDOS = [
  "Rock/Punk/Metal",
  "Pop",
  "Hip Hop/Rap",
  "Reggaeton",
  "Salsa",
  "Cumbia",
  "Folclor",
  "Electrónica",
  "Jazz",
  "Blues",
  "Reggae",
  "Indie",
  "Experimental",
];
