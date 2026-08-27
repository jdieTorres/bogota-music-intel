import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">404</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        No encontramos ese evento
      </h1>
      <p className="mt-3 text-muted">
        Puede que ya haya pasado o que la sala lo haya bajado de su cartelera.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-md bg-accent px-5 py-3 font-medium text-background transition-opacity hover:opacity-90"
      >
        Ver la cartelera
      </Link>
    </div>
  );
}
