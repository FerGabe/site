"use client";

import { useMemo, useState } from "react";
import { WEDDING_GIFTS } from "../data/gifts";
import { GiftModal } from "./GiftModal";
import { GiftCarousel } from "./GiftCarousel";
import type { GiftItem } from "../types/gift";
import type { PriceBand, PriceSort } from "../utils/filterGifts";
import { filterAndSortGifts } from "../utils/filterGifts";
import { SectionTitle } from "@/shared/components/SectionTitle";
import { BotanicalDivider } from "@/shared/components/BotanicalFrame";

const BANDS: { id: PriceBand; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "100-300", label: "R$ 100 – 300" },
  { id: "400-1000", label: "R$ 400 – 1.000" },
  { id: "1000-plus", label: "+ de R$ 1.000" },
];

const SORTS: { id: PriceSort; label: string }[] = [
  { id: "default", label: "Ordem da lista" },
  { id: "asc", label: "Menor → maior" },
  { id: "desc", label: "Maior → menor" },
];

export function GiftListSection() {
  const [selected, setSelected] = useState<GiftItem | null>(null);
  const [band, setBand] = useState<PriceBand>("all");
  const [sort, setSort] = useState<PriceSort>("default");

  const base = useMemo(
    () => WEDDING_GIFTS.filter((g) => g.active),
    []
  );

  const visible = useMemo(
    () => filterAndSortGifts(base, band, sort),
    [base, band, sort]
  );

  const scrollKey = `${band}-${sort}`;

  return (
    <section
      id="presentes"
      className="py-20 md:py-28 bg-gradient-to-b from-cream via-white/40 to-cream"
    >
      <div className="mx-auto max-w-6xl px-6">
        <SectionTitle
          eyebrow="Lista de presentes"
          title="Gestos que aquecem o lar"
          subtitle="Cada escolha é um abraço na nossa nova vida a dois. Os presentes permanecem visíveis até a confirmação pelos noivos — assim todos podem sonhar juntos, com calma e elegância."
        />
        <BotanicalDivider className="mb-10" />

        <div className="mb-8 space-y-5">
          <div>
            <p className="font-display text-xs tracking-[0.2em] uppercase text-texto/50 mb-2.5">
              Faixa de preço
            </p>
            <div className="flex flex-wrap gap-2">
              {BANDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBand(b.id)}
                  className={`rounded-full border px-4 py-2 text-xs sm:text-sm tracking-wide transition-all ${
                    band === b.id
                      ? "border-oliva bg-oliva text-white shadow-sm"
                      : "border-bege-areia/80 bg-white/70 text-texto hover:border-salvia/60"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <p className="font-display text-xs tracking-[0.2em] uppercase text-texto/50 shrink-0">
              Ordenar por preço
            </p>
            <div className="flex flex-wrap gap-2">
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSort(s.id)}
                  className={`rounded-full border px-3.5 py-2 text-xs sm:text-sm transition-all ${
                    sort === s.id
                      ? "border-salvia bg-salvia/25 text-oliva"
                      : "border-bege-claro bg-white/60 text-texto/85 hover:border-bege-areia"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-texto/50 max-w-2xl">
            &ldquo;Contribuição livre&rdquo; aparece só em &ldquo;Todos&rdquo;, pois o valor é
            escolhido por você.
          </p>
        </div>

        <GiftCarousel
          gifts={visible}
          onPresentear={setSelected}
          scrollResetKey={scrollKey}
        />
      </div>

      <GiftModal gift={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
