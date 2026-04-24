"use client";

import { useWeddingCountdown } from "../hooks/useWeddingCountdown";
import { BotanicalDivider } from "@/shared/components/BotanicalFrame";

function Box({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center min-w-[4.5rem] sm:min-w-[5.5rem]">
      <div className="w-full rounded-2xl border border-bege-claro bg-white/70 px-3 py-4 sm:px-4 sm:py-5 shadow-sm backdrop-blur-sm">
        <span className="font-display text-3xl sm:text-4xl md:text-5xl text-oliva tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-2 text-[10px] sm:text-xs tracking-[0.2em] uppercase text-texto/55">
        {label}
      </span>
    </div>
  );
}

export function CountdownSection() {
  const { days, hours, minutes, seconds, isPast } = useWeddingCountdown();

  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-b from-cream to-bege-claro/35">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-bege-areia/60 to-transparent" />
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="font-display text-sm tracking-[0.35em] uppercase text-oliva/85 mb-4">
          Contagem regressiva
        </p>
        <h2 className="font-display text-3xl md:text-4xl text-texto mb-4">
          Até o grande dia
        </h2>
        <BotanicalDivider className="mb-12" />
        {isPast ? (
          <p className="text-lg text-texto/75">
            O dia chegou — obrigado por caminhar ao nosso lado.
          </p>
        ) : (
          <div className="flex flex-wrap justify-center gap-3 sm:gap-5 md:gap-6">
            <Box value={days} label="Dias" />
            <Box value={hours} label="Horas" />
            <Box value={minutes} label="Min" />
            <Box value={seconds} label="Seg" />
          </div>
        )}
      </div>
    </section>
  );
}
