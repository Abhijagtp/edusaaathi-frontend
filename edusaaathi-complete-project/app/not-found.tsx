import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";

export default function NotFound() {
  return (
    <main className="not-found page-wrap" id="main-content">
      <p className="eyebrow"><span className="eyebrow__dot" /> A SMALL DETOUR</p>
      <p className="not-found__code">404</p>
      <h1>This page took<br /><em>a different route.</em></h1>
      <p>The page you’re looking for may have moved or no longer exists. There are other places to explore.</p>
      <div className="not-found__actions"><Link className="button button--primary" href="/">Back to home <ArrowRightIcon /></Link><Link className="text-link" href="/courses">Browse courses <ArrowRightIcon /></Link></div>
    </main>
  );
}
