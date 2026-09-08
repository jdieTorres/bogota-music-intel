import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Los afiches se sirven desde el sitio de cada sala o su boletería.
    //
    // ⚠️ **Al sumar un scraper nuevo hay que agregar su host acá.** Si falta,
    // `next/image` no degrada: lanza y rompe la tarjeta. Pasó el 2026-09-01
    // al publicar el primer evento de visitbogota. `moderacion_cli` ahora
    // avisa cuando llega una imagen de un host que no está en esta lista, para
    // que se vea en el log del cron y no cuando alguien abre la cartelera.
    //
    // La lista es explícita a propósito y no un comodín: el optimizador de
    // Next descarga y sirve cualquier URL que se le permita, así que abrirlo
    // lo convertiría en un proxy de imágenes para cualquiera.
    remotePatterns: [
      { protocol: "https", hostname: "movistararena.co" },
      { protocol: "https", hostname: "lourdesmusichall.com" },
      { protocol: "https", hostname: "tickets.latinopower.com.co" },
      { protocol: "https", hostname: "www.idartes.gov.co" },
      { protocol: "https", hostname: "static.wixstatic.com" },
      { protocol: "https", hostname: "s3.eu-central-1.amazonaws.com" },
      { protocol: "https", hostname: "visitbogota.co" },
      // Los afiches que carga el admin en /admin. A diferencia de los de
      // arriba, este host es nuestro: la imagen la subió una persona al
      // bucket `afiches`, no la publica la sala.
      { protocol: "https", hostname: "zwsagtrsylkzttwrgtmx.supabase.co" },
    ],
  },
};

export default nextConfig;
