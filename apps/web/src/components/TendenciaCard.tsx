import Image from "next/image";

import { IconNota } from "@/components/icons";
import { type ArtistaTendencia } from "@/lib/trending";

export function TendenciaCard({ artista }: { artista: ArtistaTendencia }) {
  return (
    <li className="flex items-center gap-4 rounded-lg border border-border bg-surface p-3">
      <span className="w-6 shrink-0 text-right font-mono text-sm text-muted">
        {artista.rank}
      </span>
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-background">
        {artista.image_url ? (
          <Image
            src={artista.image_url}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <IconNota className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{artista.artist_name}</p>
        {artista.metric !== null && (
          <p className="text-xs text-muted">
            {artista.metric.toLocaleString("es-CO")} oyentes
          </p>
        )}
      </div>
      {artista.is_local === true && (
        <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-background">
          Local
        </span>
      )}
    </li>
  );
}
