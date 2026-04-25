"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

const settled = { opacity: 1, y: 0 };

/** Wrapper estável: o hero não usa opacity:0 no SSR (evita tela branca se o JS atrasar ou falhar). */
export function MotionHero({ children }: { children: ReactNode }) {
  return <div className="w-full">{children}</div>;
}

/** Revelar ao entrar na viewport; respeita prefers-reduced-motion. */
export function MotionReveal({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="w-full"
      /* false = não força opacity:0 no HTML; evita página “toda branca” se o JS falhar. */
      initial={false}
      whileInView={settled}
      viewport={{ once: true, amount: 0.12, margin: "0px 0px -56px 0px" }}
      transition={{
        duration: reduce ? 0 : 0.7,
        delay: reduce ? 0 : delay,
        ease,
      }}
    >
      {children}
    </motion.div>
  );
}
