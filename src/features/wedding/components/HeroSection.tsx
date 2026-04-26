"use client";

import { useEffect, useRef } from "react";
import { BotanicalCorner } from "@/shared/components/BotanicalFrame";
import { assetPath } from "@/shared/utils/assetPath";

/** Intensidade do parallax (menor no mobile = menos repintura por frame). */
const PARALLAX_DESKTOP = 0.52;
const PARALLAX_MOBILE = 0.26;
const MD_MIN = 768;

export function HeroSection() {
  /** Camada que move — só `transform` no DOM no rAF (sem `setState`). Sem `filter` aqui: grayscale em foto grande travava o scroll no telemóvel. */
  const parallaxRef = useRef<HTMLDivElement>(null);
  const lastY = useRef(0);

  useEffect(() => {
    let raf = 0;

    const parallaxFactor = () =>
      typeof window !== "undefined" && window.innerWidth < MD_MIN
        ? PARALLAX_MOBILE
        : PARALLAX_DESKTOP;

    const apply = () => {
      raf = 0;
      const el = parallaxRef.current;
      if (!el) return;

      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const nextY = reduce ? 0 : window.scrollY * parallaxFactor();
      if (Number.isFinite(lastY.current) && nextY === lastY.current) return;
      lastY.current = nextY;
      el.style.transform = `translate3d(0, ${nextY}px, 0) scale(1.06)`;
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(apply);
    };

    const onResize = () => {
      lastY.current = Number.NaN;
      onScroll();
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="topo"
      className="relative flex min-h-[92dvh] flex-col overflow-x-clip overflow-y-visible bg-botanical-fade pt-28 max-md:pb-0 md:min-h-[92vh] md:overflow-hidden md:justify-center md:pt-0 md:pb-0"
    >
      <div className="absolute inset-0 -z-10">
        <div
          ref={parallaxRef}
          className="absolute inset-0 md:will-change-transform"
          style={{ transform: "translate3d(0, 0px, 0) scale(1.06)" }}
        >
          {/* `img` nativo: menos camadas que `next/image` durante parallax; sem `filter` na camada animada. */}
          <img
            src={assetPath("/couple/casal-real.png")}
            alt=""
            width={1920}
            height={1280}
            fetchPriority="high"
            decoding="async"
            className="pointer-events-none absolute left-0 right-0 top-[-7%] h-[114%] w-full object-cover object-[center_58%] opacity-[0.34]"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-cream/75 via-cream/70 to-cream/78" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(111,125,82,0.09),transparent_58%)]" />
      </div>

      <div className="pointer-events-none absolute left-2 top-28 md:left-8 md:top-36 opacity-70">
        <BotanicalCorner className="w-24 md:w-32" />
      </div>
      <div className="pointer-events-none absolute right-2 top-20 md:right-10 md:top-28 opacity-70">
        <BotanicalCorner className="w-24 md:w-32" flip />
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 pb-6 text-center max-md:min-h-0 md:flex-none md:py-28 md:pb-28">
        <div className="max-md:pt-10">
          <p className="font-display text-xs sm:text-sm tracking-[0.45em] uppercase text-oliva/90 mb-6 animate-fade-up [animation-delay:80ms] opacity-0">
            Save the date
          </p>
          <h1 className="font-hero-name text-3xl sm:text-4xl md:text-5xl text-oliva/95 tracking-tight mb-4 animate-fade-up [animation-delay:140ms] opacity-0">
            Fernanda & Gabriel
          </h1>
          <p className="font-display text-xl sm:text-2xl md:text-3xl text-texto/85 mb-10 animate-fade-up [animation-delay:220ms] opacity-0">
            6 de junho de 2026
          </p>
          <p className="max-w-xl mx-auto text-base md:text-lg text-texto/70 leading-relaxed animate-fade-up [animation-delay:300ms] opacity-0">
            Um convite feito à mão, em papel fino — para que você faça parte do
            nosso mais belo capítulo.
          </p>
        </div>
        <div className="mt-auto flex flex-col items-center justify-center gap-4 pt-10 max-md:pb-10 sm:mt-12 sm:flex-row sm:pb-0 animate-fade-up [animation-delay:380ms] opacity-0">
          <a
            href="#presentes"
            className="inline-flex items-center justify-center rounded-full bg-oliva px-8 py-3.5 text-sm tracking-wide text-white shadow-sm hover:bg-oliva/90 transition-all hover:shadow-md"
          >
            Lista de presentes
          </a>
          <a
            href="#rsvp"
            className="inline-flex items-center justify-center rounded-full border border-bege-areia bg-white/60 px-8 py-3.5 text-sm tracking-wide text-texto hover:border-oliva/50 transition-all"
          >
            Confirmar presença
          </a>
        </div>
      </div>
    </section>
  );
}
