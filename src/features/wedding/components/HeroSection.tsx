"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BotanicalCorner } from "@/shared/components/BotanicalFrame";
import { MonogramMark } from "@/shared/components/MonogramMark";

/** Quanto a foto “contraria” o scroll (maior = mais dinâmico). */
const PARALLAX = 0.58;

export function HeroSection() {
  const [bgTranslateY, setBgTranslateY] = useState(0);

  useEffect(() => {
    let raf = 0;

    const apply = () => {
      raf = 0;
      /* Scroll para baixo → a foto acompanha “descendo” (mesmo sentido), sem limite artificial. */
      setBgTranslateY(window.scrollY * PARALLAX);
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="topo"
      className="relative min-h-[92vh] flex flex-col justify-end md:justify-center overflow-hidden bg-botanical-fade"
    >
      <div className="absolute inset-0 -z-10">
        <Image
          src="/couple/casal-real.png"
          alt=""
          fill
          priority
          className="object-cover object-[center_60%] scale-105 grayscale will-change-transform"
          style={{
            opacity: 0.34,
            transform: `translateY(${bgTranslateY}px) scale(1.05)`,
          }}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-cream/75 via-cream/70 to-cream/78" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(111,125,82,0.09),transparent_58%)]" />
      </div>

      <div className="pointer-events-none absolute left-2 top-28 md:left-8 md:top-36 opacity-70">
        <BotanicalCorner className="w-24 md:w-32" />
      </div>
      <div className="pointer-events-none absolute right-2 top-20 md:right-10 md:top-28 opacity-70">
        <BotanicalCorner className="w-24 md:w-32" flip />
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-20 pt-36 md:pt-28 md:pb-28 text-center">
        <p className="font-display text-xs sm:text-sm tracking-[0.45em] uppercase text-oliva/90 mb-6 animate-fade-up [animation-delay:80ms] opacity-0">
          Save the date
        </p>
        <div className="mb-4 flex justify-center animate-fade-up [animation-delay:140ms] opacity-0">
          <MonogramMark
            size={320}
            className="h-40 w-40 sm:h-44 sm:w-44 md:h-48 md:w-48"
          />
        </div>
        <p className="font-display text-xl sm:text-2xl md:text-3xl text-texto/85 mb-10 animate-fade-up [animation-delay:220ms] opacity-0">
          6 de junho de 2026
        </p>
        <p className="max-w-xl mx-auto text-base md:text-lg text-texto/70 leading-relaxed animate-fade-up [animation-delay:300ms] opacity-0">
          Um convite feito à mão, em papel fino — para que você faça parte do
          nosso mais belo capítulo.
        </p>
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up [animation-delay:380ms] opacity-0">
          <a
            href="#rsvp"
            className="inline-flex items-center justify-center rounded-full bg-oliva px-8 py-3.5 text-sm tracking-wide text-white shadow-sm hover:bg-oliva/90 transition-all hover:shadow-md"
          >
            Confirmar presença
          </a>
          <a
            href="#presentes"
            className="inline-flex items-center justify-center rounded-full border border-bege-areia bg-white/60 px-8 py-3.5 text-sm tracking-wide text-texto hover:border-oliva/50 transition-all"
          >
            Lista de presentes
          </a>
        </div>
      </div>
    </section>
  );
}
