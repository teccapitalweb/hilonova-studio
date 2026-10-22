"use client";

import { useEffect } from "react";

/**
 * Añade la clase .js al html (habilita el reveal al scroll vía CSS),
 * marca el nav al bajar y revela secciones al entrar en vista con un
 * IntersectionObserver. Respeta prefers-reduced-motion.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("js");

    const nav = document.querySelector(".nav");
    const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sel =
      ".sec-head,.sc-card,.quote,.cta-band,.ctx-grid,.value,.pcards,.steps,.sc-feats,.pricing";
    const els = Array.from(document.querySelectorAll(sel));

    if (reduce || typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("in"));
      return () => window.removeEventListener("scroll", onScroll);
    }

    // Garantía: lo que ya está en o por encima del viewport (porque el usuario
    // scrolleó mientras React hidrataba) se marca visible al vuelo.
    const vh = window.innerHeight || 0;
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92) el.classList.add("in");
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    els.forEach((el) => {
      if (!el.classList.contains("in")) io.observe(el);
    });

    // Red de seguridad: pasados 2.5 s, revela cualquier cosa que no haya disparado.
    const safety = window.setTimeout(() => {
      els.forEach((el) => el.classList.add("in"));
    }, 2500);

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      window.clearTimeout(safety);
    };
  }, []);

  return null;
}
