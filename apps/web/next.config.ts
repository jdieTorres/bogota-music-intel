import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Los afiches se sirven desde el sitio de cada sala o su boletería.
    // Al sumar un scraper nuevo hay que agregar su host acá o next/image
    // rechaza la imagen.
    remotePatterns: [
      { protocol: "https", hostname: "movistararena.co" },
      { protocol: "https", hostname: "lourdesmusichall.com" },
      { protocol: "https", hostname: "tickets.latinopower.com.co" },
      { protocol: "https", hostname: "www.idartes.gov.co" },
      { protocol: "https", hostname: "static.wixstatic.com" },
      { protocol: "https", hostname: "s3.eu-central-1.amazonaws.com" },
      // Radar de tendencias: imágenes de artista de Deezer y Last.fm.
      { protocol: "https", hostname: "cdn-images.dzcdn.net" },
      { protocol: "https", hostname: "lastfm-img.freetls.fastly.net" },
    ],
  },
};

export default nextConfig;
