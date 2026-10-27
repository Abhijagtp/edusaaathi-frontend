(() => {
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
