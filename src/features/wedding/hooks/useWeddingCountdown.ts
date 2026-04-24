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
};

function getParts(target: Date, now: Date): CountdownParts {
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

export function useWeddingCountdown(): CountdownParts {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(() => getParts(WEDDING_DATE, now), [now]);
}

export { WEDDING_DATE };
