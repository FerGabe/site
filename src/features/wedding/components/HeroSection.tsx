import Image from "next/image";
import { BotanicalCorner } from "@/shared/components/BotanicalFrame";

export function HeroSection() {
  return (
    <section
      id="topo"
      className="relative min-h-[92vh] flex flex-col justify-end md:justify-center overflow-hidden bg-botanical-fade"
    >
      <div className="absolute inset-0 -z-10">
        <Image
          src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80"
          alt=""
          fill
          priority
          className="object-cover opacity-[0.22] scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream/92 to-cream" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(111,125,82,0.08),transparent_55%)]" />
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
        <h1 className="font-display text-[clamp(2.5rem,8vw,4.75rem)] leading-[1.05] text-texto mb-4 animate-fade-up [animation-delay:140ms] opacity-0">
          Fer <span className="text-salvia font-light">&</span> Gabe
        </h1>
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
