"use client";

import { useState } from "react";
import { WEDDING_GIFTS } from "../data/gifts";
import { GiftCard } from "./GiftCard";
import { GiftModal } from "./GiftModal";
import type { GiftItem } from "../types/gift";
import { SectionTitle } from "@/shared/components/SectionTitle";
import { BotanicalDivider } from "@/shared/components/BotanicalFrame";

export function GiftListSection() {
  const [selected, setSelected] = useState<GiftItem | null>(null);
  const gifts = WEDDING_GIFTS.filter((g) => g.active);

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
        <BotanicalDivider className="mb-14" />

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {gifts.map((gift) => (
            <GiftCard
              key={gift.id}
              gift={gift}
              onPresentear={() => setSelected(gift)}
            />
          ))}
        </div>
      </div>

      <GiftModal gift={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
