"use client";

import { motion } from "framer-motion";
import { useWeddingCountdown } from "../hooks/useWeddingCountdown";
import { BotanicalDivider } from "@/shared/components/BotanicalFrame";

function Box({
  value,
  label,
  animate,
}: {
  value: number;
  label: string;
  /** Quando true, permite keyframe suave ao mudar o dígito (só após hidratação). */
  animate?: boolean;
}) {
  return (
    <div className="flex flex-col items-center min-w-[4.5rem] sm:min-w-[5.5rem]">
      <div className="w-full rounded-2xl border border-bege-claro bg-white/70 px-3 py-4 sm:px-4 sm:py-5 shadow-sm backdrop-blur-sm">
        <motion.span
          className="inline-block font-display text-3xl sm:text-4xl md:text-5xl text-oliva tabular-nums"
          key={animate ? `${label}-${value}` : `${label}-sync`}
          initial={animate ? { opacity: 0.35, y: 4 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {String(value).padStart(2, "0")}
        </motion.span>
      </div>
      <span className="mt-2 text-[10px] sm:text-xs tracking-[0.2em] uppercase text-texto/55">
        {label}
      </span>
    </div>
  );
}

export function CountdownSection() {
  const { days, hours, minutes, seconds, isPast, isReady } =
    useWeddingCountdown();

  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-b from-cream to-bege-claro/35">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-bege-areia/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-bege-areia/70 to-transparent" />
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="font-display text-sm tracking-[0.35em] uppercase text-oliva/85 mb-4">
          Contagem regressiva
        </p>
        <h2 className="font-display text-3xl md:text-4xl text-texto mb-4">
          Até o chá de casa nova
        </h2>
        <BotanicalDivider className="mb-12" />
        {isPast ? (
          <p className="text-lg text-texto/75">
            O dia chegou — obrigado por caminhar ao nosso lado.
          </p>
        ) : (
          <motion.div
            className="flex flex-wrap justify-center gap-3 sm:gap-5 md:gap-6"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Box value={days} label="Dias" animate={isReady} />
            <Box value={hours} label="Horas" animate={isReady} />
            <Box value={minutes} label="Min" animate={isReady} />
            <Box value={seconds} label="Seg" animate={isReady} />
          </motion.div>
        )}
      </div>
    </section>
  );
}
