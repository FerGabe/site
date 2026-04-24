"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

const settled = { opacity: 1, y: 0 };

/** Entrada suave acima da dobra (após hidratação). */
export function MotionHero({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="w-full"
      initial={reduce ? { opacity: 1 } : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.95, ease }}
    >
      {children}
    </motion.div>
  );
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
      initial={reduce ? settled : { opacity: 0, y: 28 }}
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
