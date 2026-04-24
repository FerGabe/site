"use client";

import { useEffect, useMemo, useState } from "react";

/** 6 de junho de 2026 — cerimônia às 16h (horário de Brasília). */
const WEDDING_DATE = new Date("2026-06-06T16:00:00-03:00");

export type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  /** Só fica true no cliente após o mount — evita erro de hidratação com `Date`. */
  isReady: boolean;
};

function getParts(target: Date, now: Date): Omit<CountdownParts, "isReady"> {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  const seconds = Math.floor(diff / 1000) % 60;
  const minutes = Math.floor(diff / (1000 * 60)) % 60;
  const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds, isPast: false };
}

/** Placeholder estável no SSR e no 1.º render no cliente (antes do useEffect). */
const PLACEHOLDER: CountdownParts = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  isPast: false,
  isReady: false,
};

export function useWeddingCountdown(): CountdownParts {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(() => {
    if (!now) return PLACEHOLDER;
    return { ...getParts(WEDDING_DATE, now), isReady: true };
  }, [now]);
}

export { WEDDING_DATE };
