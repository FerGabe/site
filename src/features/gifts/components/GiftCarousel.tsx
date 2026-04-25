"use client";

import { useEffect, useMemo, useState } from "react";
import type { GiftItem } from "../types/gift";
import { GiftCard } from "./GiftCard";

type GiftCarouselProps = {
  gifts: GiftItem[];
  onPresentear: (gift: GiftItem) => void;
  /** Muda quando filtros/ordem mudam — repõe paginação na 1ª grade. */
  scrollResetKey: string;
};

const PAGE_SIZE = 6;

export function GiftCarousel({
  gifts,
  onPresentear,
  scrollResetKey,
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

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {current.map((gift) => (
          <GiftCard
            key={gift.id}
            gift={gift}
            onPresentear={() => onPresentear(gift)}
            layout="carousel"
          />
        ))}
      </div>

      {pages > 1 ? (
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={goNext}
            className="rounded-full border border-oliva/40 bg-white px-7 py-3 text-sm tracking-wide text-oliva hover:bg-oliva hover:text-white transition-all"
          >
            Ver próximos 6 presentes
          </button>
          <p className="text-xs text-texto/50">
            Grade {page + 1} de {pages}
          </p>
        </div>
      ) : null}
    </div>
  );
}
