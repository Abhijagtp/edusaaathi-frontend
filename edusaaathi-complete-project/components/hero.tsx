"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ArrowRightIcon, SparkIcon, WhatsAppIcon } from "@/components/icons";
import { getWhatsAppHref } from "@/lib/config";

function HeroBackdrop() {
  return <div className="hero-backdrop" aria-hidden="true" />;
}

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const whatsappHref = getWhatsAppHref("Hi, I would like guidance exploring courses and admission information.");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
        timeline
          .fromTo(".hero-backdrop", { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 0)
          .fromTo(".hero-eyebrow", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.34 }, 0.08)
          .fromTo(".hero-title-line", { clipPath: "inset(0 0 100% 0)", y: 16 }, { clipPath: "inset(0 0 -8% 0)", y: 0, duration: 0.56, stagger: 0.12 }, 0.18)
          .fromTo(".hero-underline", { scaleX: 0 }, { scaleX: 1, duration: 0.38, ease: "power2.inOut" }, 0.73)
          .fromTo(".hero-description", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 0.75)
          .fromTo(".hero-actions", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.36 }, 0.92)
          .fromTo(".hero-proof-item", { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.28, stagger: 0.07 }, 1.08);
      }, root);
      return () => context.revert();
    });
    return () => media.revert();
  }, []);

  return (
    <section className="hero-section page-wrap" ref={rootRef} aria-labelledby="hero-title">
      <HeroBackdrop />
      <div className="hero-copy">
        <p className="hero-eyebrow"><span className="hero-eyebrow__mark"><SparkIcon /></span> YOUR EDUCATION PARTNER</p>
        <h1 className="hero-title" id="hero-title">
          <span className="hero-title-line">Find the <em>Right Course<span className="hero-underline" />.</em></span>
          <span className="hero-title-line">Build your <em className="hero-future">Future.</em></span>
        </h1>
        <p className="hero-description">Explore courses, understand eligibility and get guidance from Edusaaathi to take the next step in your education journey.</p>
        <div className="hero-actions">
          <Link className="button button--primary hero-primary" href="/courses">Explore Courses <ArrowRightIcon /></Link>
          <a className="hero-whatsapp" href={whatsappHref} target="_blank" rel="noopener noreferrer"><span className="hero-whatsapp__icon"><WhatsAppIcon /></span>Talk to Us on WhatsApp</a>
        </div>
        <ul className="hero-proof" aria-label="How Edusaaathi can help">
          <li className="hero-proof-item"><span />Course discovery</li>
          <li className="hero-proof-item"><span />Eligibility guidance</li>
          <li className="hero-proof-item"><span />Admission enquiries</li>
        </ul>
      </div>
      <div className="hero-scroll-cue" aria-hidden="true"><span /> SCROLL TO DISCOVER</div>
    </section>
  );
}
