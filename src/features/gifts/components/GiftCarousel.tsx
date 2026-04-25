"use client";

import { useEffect, useMemo, useState } from "react";
import type { GiftItem } from "../types/gift";
import { GiftCard } from "./GiftCard";

type GiftCarouselProps = {
  gifts: GiftItem[];
  onPresentear: (gift: GiftItem) => void;
  /** Muda quando filtros/ordem mudam — repõe paginação na 1ª grade. */
  scrollResetKey: string;
  lockedGiftIds?: Set<string>;
  permanentlyLockedGiftIds?: Set<string>;
};

const PAGE_SIZE = 6;

export function GiftCarousel({
  gifts,
  onPresentear,
  scrollResetKey,
  lockedGiftIds,
  permanentlyLockedGiftIds,
}: GiftCarouselProps) {
  const [page, setPage] = useState(0);

  const pages = useMemo(() => Math.max(1, Math.ceil(gifts.length / PAGE_SIZE)), [gifts.length]);
  const sliceStart = page * PAGE_SIZE;
  const current = gifts.slice(sliceStart, sliceStart + PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [scrollResetKey]);

  if (gifts.length === 0) {
    return (
      <p className="rounded-2xl border border-bege-claro bg-white/60 px-6 py-10 text-center text-texto/70">
        Nenhum presente nesta faixa de preço. Experimente &ldquo;Todos&rdquo; ou
        outra faixa.
      </p>
    );
  }

  const goNext = () => setPage((p) => (p + 1) % pages);
  const goPrev = () => setPage((p) => (p - 1 + pages) % pages);

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {current.map((gift) => (
          <GiftCard
            key={gift.id}
            gift={gift}
            onPresentear={() => onPresentear(gift)}
            layout="carousel"
            locked={Boolean(lockedGiftIds?.has(gift.id))}
            lockLabel={
              permanentlyLockedGiftIds?.has(gift.id)
                ? "Pagamento em confirmação"
                : "Reservado por 1 dia"
            }
          />
        ))}
      </div>

      {pages > 1 ? (
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goPrev}
              className="inline-flex items-center justify-center rounded-full border border-oliva/35 bg-white px-5 py-3 text-sm tracking-wide text-oliva hover:bg-oliva hover:text-white transition-all"
              aria-label="Voltar grade de presentes"
            >
              <Chevron direction="left" />
              <span className="ml-2">Voltar</span>
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center justify-center rounded-full border border-oliva/40 bg-white px-5 py-3 text-sm tracking-wide text-oliva hover:bg-oliva hover:text-white transition-all"
              aria-label="Avançar grade de presentes"
            >
              <span className="mr-2">Avançar</span>
              <Chevron direction="right" />
            </button>
          </div>
          <p className="text-xs text-texto/50">
            Grade {page + 1} de {pages}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
