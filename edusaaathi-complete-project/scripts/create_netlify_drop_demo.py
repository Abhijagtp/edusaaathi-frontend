from __future__ import annotations

import re
import shutil
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "netlify-demo"
ZIP_PATH = ROOT / "edusaaathi-netlify-demo.zip"
BASE_URL = "http://localhost:3000"
COURSE_SLUGS = ["bca", "bba", "mba", "b-tech", "mca", "b-com"]
COURSES = [("bca", "BCA"), ("bba", "BBA"), ("mba", "MBA"), ("b-tech", "B.Tech"), ("mca", "MCA"), ("b-com", "B.Com")]
ROUTES = {
    "/": "index.html",
    "/courses": "courses/index.html",
    **{f"/courses/{slug}": f"courses/{slug}/index.html" for slug in COURSE_SLUGS},
    "/privacy": "privacy/index.html",
    "/terms": "terms/index.html",
}

DEMO_JS = r'''(() => {
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector("#primary-navigation");
  if (menuButton && navigation) {
    menuButton.addEventListener("click", () => {
      const open = navigation.classList.toggle("site-nav--open");
      menuButton.setAttribute("aria-expanded", String(open));
      menuButton.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    });
    navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
      navigation.classList.remove("site-nav--open");
      menuButton.setAttribute("aria-expanded", "false");
    }));
  }

  const dialog = document.querySelector(".enquiry-dialog");
  if (dialog) {
    const courseSelect = dialog.querySelector("select");
    const currentSlug = location.pathname.match(/^\/courses\/([^/]+)/)?.[1];
    if (courseSelect && currentSlug) courseSelect.value = currentSlug;

    document.querySelectorAll(
      ".button--nav, .site-nav__mobile-cta, .footer-contact-link, .counselling-panel__content .button, .course-detail-hero__actions .button--outline, .course-contact-panel__text-button"
    ).forEach((trigger) => trigger.addEventListener("click", () => {
      if (!dialog.open) dialog.showModal();
    }));

    dialog.querySelector(".enquiry-dialog__close")?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    dialog.querySelector("form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      let note = dialog.querySelector(".demo-only-notice");
      if (!note) {
        note = document.createElement("p");
        note.className = "demo-only-notice";
        note.setAttribute("role", "status");
        dialog.querySelector(".enquiry-form__submit")?.before(note);
      }
      note.textContent = "Demo only: this form is not connected, so no enquiry was saved.";
    });
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.gsap || !window.ScrollTrigger) return;
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  if (window.Lenis) {
    const lenis = new window.Lenis({ autoRaf: false, anchors: true, lerp: 0.09, smoothWheel: true, syncTouch: false, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
  }

  const hero = document.querySelector(".hero-section");
  if (hero) {
    const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
    timeline
      .fromTo(".hero-backdrop", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 0)
      .fromTo(".hero-eyebrow", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.34 }, 0.08)
      .fromTo(".hero-title-line", { clipPath: "inset(0 0 100% 0)", y: 16 }, { clipPath: "inset(0 0 -8% 0)", y: 0, duration: 0.56, stagger: 0.12 }, 0.18)
      .fromTo(".hero-underline", { scaleX: 0 }, { scaleX: 1, duration: 0.38, ease: "power2.inOut" }, 0.73)
      .fromTo(".hero-description", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 0.75)
      .fromTo(".hero-actions", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.36 }, 0.92)
      .fromTo(".hero-proof-item", { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.07 }, 1.08);
  }

  gsap.utils.toArray("[data-reveal]").forEach((element) => {
    gsap.fromTo(element, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.66, ease: "power2.out", scrollTrigger: { trigger: element, start: "top 88%", once: true } });
  });
  gsap.utils.toArray("[data-reveal-sequence]").forEach((group) => {
    const items = group.querySelectorAll("[data-reveal-item]");
    gsap.fromTo(items, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.14, ease: "power2.out", scrollTrigger: { trigger: group, start: "top 82%", once: true } });
  });
  gsap.utils.toArray("[data-parallax]").forEach((element) => {
    gsap.to(element, { y: -18, ease: "none", scrollTrigger: { trigger: element.parentElement || element, start: "top bottom", end: "bottom top", scrub: 0.7 } });
  });
  requestAnimationFrame(() => ScrollTrigger.refresh());
})();
'''

DEMO_NOTES = """Edusaaathi — Netlify Drop Demo

To publish: extract the ZIP, then drag the `netlify-demo` folder to Netlify Drop.

Included: homepage, course list, six sample course guides, FAQ accordions, privacy and terms pages, custom 404, local styling, the education-globe hero and student-study counselling backgrounds, self-hosted Manrope font, and local GSAP/ScrollTrigger/Lenis assets.

Demo-only differences: course links work; the mobile menu works; the enquiry dialog opens from its buttons. Submitting the enquiry form displays a clear demo notice and does not save personal data. The admin dashboard and API routes are not part of this static export. Use the full Next.js source project for the later API-connected implementation.

Source project files remain in the parent folder. Do not collect real enquiries with this static demo.
"""


def fetch_url(path: str) -> tuple[int, str]:
    request = urllib.request.Request(f"{BASE_URL}{path}", headers={"User-Agent": "Edusaaathi-static-demo-export/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return response.status, response.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as error:
        return error.code, error.read().decode("utf-8", errors="replace")


def strip_next_runtime(html: str, current_route: str) -> str:
    def keep_jsonld(match: re.Match[str]) -> str:
        opening = match.group(1)
        return match.group(0) if re.search(r'type=["\']application/ld\+json["\']', opening, re.I) else ""

    html = re.sub(r"(<script\b[^>]*>.*?</script\s*>)", keep_jsonld, html, flags=re.I | re.S)
    html = re.sub(r"<link\b(?=[^>]*(?:as=[\"']script|rel=[\"'](?:preload|prefetch)[\"']))[^>]*>", "", html, flags=re.I)
    html = re.sub(r'<a([^>]*\bhref=["\']/admin/login["\'][^>]*)>.*?</a>', "", html, flags=re.I | re.S)
    html = html.replace('<option value="" selected="">Loading courses…</option>', "")

    options = []
    for slug, name in COURSES:
        selected = " selected=\"\"" if (current_route == f"/courses/{slug}" or (current_route == "/" and slug == "bca")) else ""
        options.append(f'<option value="{slug}"{selected}>{name}</option>')
    options_html = "".join(options)
    html = re.sub(r"<select([^>]*)>\s*</select>", lambda match: f"<select{match.group(1)}>{options_html}</select>", html, count=1, flags=re.I | re.S)
    html = re.sub(r'\sdisabled=""(?=[^>]*>)', "", html)

    if "/demo.js" not in html:
        vendor_tags = (
            '<script src="/vendor/gsap.min.js" defer></script>'
            '<script src="/vendor/ScrollTrigger.min.js" defer></script>'
            '<script src="/vendor/lenis.min.js" defer></script>'
            '<script src="/demo.js" defer></script>'
        )
        html = html.replace("</body>", f"{vendor_tags}</body>")
    return html


def write_response(route: str, relative_path: str) -> None:
    status, html = fetch_url(route)
    if status >= 500 or not html:
        raise RuntimeError(f"Could not render {route}: HTTP {status}")
    destination = OUTPUT / relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(strip_next_runtime(html, route), encoding="utf-8")
    print(f"Rendered {route} -> {relative_path} (HTTP {status})")


def main() -> None:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir(parents=True)

    for route, relative_path in ROUTES.items():
        write_response(route, relative_path)

    not_found_source = ROOT / ".next" / "server" / "app" / "_not-found.html"
    if not_found_source.exists():
        not_found_html = not_found_source.read_text(encoding="utf-8")
    else:
        status, not_found_html = fetch_url("/courses/course-that-does-not-exist")
        if status != 404:
            raise RuntimeError(f"Expected the custom not-found route to return 404, got HTTP {status}")
    (OUTPUT / "404.html").write_text(strip_next_runtime(not_found_html, "/404"), encoding="utf-8")

    for route, filename in [("/robots.txt", "robots.txt"), ("/sitemap.xml", "sitemap.xml")]:
        status, body = fetch_url(route)
        if status != 200:
            raise RuntimeError(f"Could not fetch {route}: HTTP {status}")
        (OUTPUT / filename).write_text(body, encoding="utf-8")

    (OUTPUT / "demo.js").write_text(DEMO_JS, encoding="utf-8")
    (OUTPUT / "DEMO-NOTES.txt").write_text(DEMO_NOTES, encoding="utf-8")
    (OUTPUT / "_headers").write_text(
        "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n\n/_next/static/*\n  Cache-Control: public, max-age=31536000, immutable\n\n/fonts/*\n  Cache-Control: public, max-age=31536000, immutable\n",
        encoding="utf-8",
    )

    static_css = ROOT / ".next" / "static" / "css"
    if not static_css.is_dir():
        raise RuntimeError("Production CSS not found. Run npm run build first.")
    shutil.copytree(static_css, OUTPUT / "_next" / "static" / "css")
    shutil.copytree(ROOT / "public" / "fonts", OUTPUT / "fonts")
    (OUTPUT / "vendor").mkdir(exist_ok=True)
    shutil.copy2(ROOT / "node_modules" / "gsap" / "dist" / "gsap.min.js", OUTPUT / "vendor" / "gsap.min.js")
    shutil.copy2(ROOT / "node_modules" / "gsap" / "dist" / "ScrollTrigger.min.js", OUTPUT / "vendor" / "ScrollTrigger.min.js")
    shutil.copy2(ROOT / "node_modules" / "lenis" / "dist" / "lenis.min.js", OUTPUT / "vendor" / "lenis.min.js")
    shutil.copy2(ROOT / "node_modules" / "lenis" / "LICENSE", OUTPUT / "vendor" / "LENIS-LICENSE.txt")
    shutil.copy2(ROOT / "app" / "icon.svg", OUTPUT / "icon.svg")
    (OUTPUT / "images").mkdir(exist_ok=True)
    for image_name in ("elegant-education-globe.webp", "moody-student-study.webp"):
        image_path = ROOT / "public" / "images" / image_name
        if not image_path.is_file():
            raise RuntimeError(f"Site background image is missing: {image_path}")
        shutil.copy2(image_path, OUTPUT / "images" / image_path.name)

    if ZIP_PATH.exists():
        ZIP_PATH.unlink()
    with zipfile.ZipFile(ZIP_PATH, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for file_path in sorted(OUTPUT.rglob("*")):
            if file_path.is_file():
                archive.write(file_path, file_path.relative_to(OUTPUT).as_posix())
    print(f"Created {ZIP_PATH} ({ZIP_PATH.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
