/**
 * Set de íconos del look & feel (2026-08-28): trazo simple, sin relleno,
 * sobre una grilla de 20-24px — nunca emoji. `BrandMark` toma los colores
 * de marca directo de los tokens de `globals.css`, así que se ve correcto
 * en modo claro y oscuro sin props adicionales.
 */

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 42 42"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="21" cy="21" r="19" stroke="var(--accent)" strokeWidth="2.5" />
      <path
        d="M11 24c2-6 5-9 10-9s8 3 10 9"
        stroke="var(--accent-2)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="21" cy="21" r="2.6" fill="var(--foreground)" />
    </svg>
  );
}

export function IconNota({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M9 18V5.5L18 4v10.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6.5" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="15.5" cy="16.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function IconSun({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M10 2v2M10 16v2M18 10h-2M4 10H2M15.5 4.5l-1.4 1.4M5.9 14.1l-1.4 1.4M15.5 15.5l-1.4-1.4M5.9 5.9 4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconMoon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M17 12.5A7 7 0 1 1 7.5 3a5.5 5.5 0 0 0 9.5 9.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
