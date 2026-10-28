import Link from "next/link";
import Image from "next/image";

export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <Link className={`brand-mark${light ? " brand-mark--light" : ""}`} href="/" aria-label="Edusaaathi home">
      <span className="brand-mark__symbol" aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <Image
          src="/logo.png"
          alt="Edusaaathi logo"
          width={38}
          height={38}
          priority
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </span>
      <span className="brand-mark__word"><strong>Edu</strong><span>saaathi</span></span>
    </Link>
  );
}
