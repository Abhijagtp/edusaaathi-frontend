import Link from "next/link";

export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <Link className={`brand-mark${light ? " brand-mark--light" : ""}`} href="/" aria-label="Edusaaathi home">
      <span className="brand-mark__symbol" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <path d="M20 4.5c-8.56 0-15.5 6.94-15.5 15.5S11.44 35.5 20 35.5 35.5 28.56 35.5 20 28.56 4.5 20 4.5Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M26.85 12.1c-1.7-1.56-3.96-2.5-6.45-2.5-5.74 0-10.4 4.66-10.4 10.4s4.66 10.4 10.4 10.4c2.5 0 4.75-.94 6.45-2.5M14.1 20h12.55m-4.6-4.35L26.4 20l-4.35 4.35" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="brand-mark__word"><strong>Edu</strong><span>saaathi</span></span>
    </Link>
  );
}
