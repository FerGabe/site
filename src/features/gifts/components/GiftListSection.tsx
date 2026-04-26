"use client";

import { useEffect, useMemo, useState } from "react";
import { WEDDING_GIFTS } from "../data/gifts";
import { GiftModal } from "./GiftModal";
import { GiftCarousel } from "./GiftCarousel";
import type { GiftItem } from "../types/gift";
import type { PriceBand, PriceSort } from "../utils/filterGifts";
import { filterAndSortGifts } from "../utils/filterGifts";
import { SectionTitle } from "@/shared/components/SectionTitle";
import { BotanicalDivider } from "@/shared/components/BotanicalFrame";
import { getFirestoreDb } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

const BANDS: { id: PriceBand; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "100-300", label: "Até 300" },
  { id: "400-1000", label: "Até 1.000" },
  { id: "1000-plus", label: "+ de 1.000" },
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
  const [lockedGiftIds, setLockedGiftIds] = useState<Set<string>>(new Set());
  const [permanentLocks, setPermanentLocks] = useState<Set<string>>(new Set());

  const base = useMemo(
    () => WEDDING_GIFTS.filter((g) => g.active),
    []
  );

  const visible = useMemo(
    () => filterAndSortGifts(base, band, sort),
    [base, band, sort]
  );

  const scrollKey = `${band}-${sort}`;

  useEffect(() => {
    const db = getFirestoreDb();
    if (!db) return;
    const q = query(
      collection(db, "gift_requests"),
      where("status", "in", ["awaiting_payment", "pending_manual_review", "confirmed"])
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const now = Date.now();
        const temporary = new Set<string>();
        const permanent = new Set<string>();

        snap.forEach((d) => {
          const data = d.data() as {
            giftId?: string;
            status?: string;
            reservedUntil?: string | null;
          };
          if (!data.giftId || !data.status) return;

          if (data.status === "awaiting_payment") {
            const until = data.reservedUntil
              ? Date.parse(data.reservedUntil)
              : 0;
            if (until > now) temporary.add(data.giftId);
            return;
          }

          if (
            data.status === "pending_manual_review" ||
            data.status === "confirmed"
          ) {
            permanent.add(data.giftId);
          }
        });

        setLockedGiftIds(new Set([...temporary, ...permanent]));
        setPermanentLocks(permanent);
      },
      () => {
        /* Sem permissão de leitura ou índice: não quebra a página. */
        setLockedGiftIds(new Set());
        setPermanentLocks(new Set());
      }
    );

    return () => unsub();
  }, []);

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
            <div className="grid grid-cols-4 gap-2">
              {BANDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBand(b.id)}
                  className={`rounded-full border px-2 py-2 text-[11px] sm:px-4 sm:text-sm tracking-wide transition-all ${
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
            <div className="grid grid-cols-3 gap-2">
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSort(s.id)}
                  className={`rounded-full border px-2 py-2 text-[11px] sm:px-3.5 sm:text-sm transition-all ${
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
        </div>

        <GiftCarousel
          gifts={visible}
          onPresentear={setSelected}
          scrollResetKey={scrollKey}
          lockedGiftIds={lockedGiftIds}
          permanentlyLockedGiftIds={permanentLocks}
        />
      </div>

      <GiftModal gift={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
