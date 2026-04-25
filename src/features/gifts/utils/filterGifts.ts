import type { GiftItem } from "../types/gift";

export type PriceBand = "all" | "100-300" | "400-1000" | "1000-plus";

export type PriceSort = "default" | "asc" | "desc";

/** Presentes sem preço fixo só aparecem em “Todos”. */
export function giftMatchesBand(gift: GiftItem, band: PriceBand): boolean {
  if (band === "all") return true;
  const p = gift.price;
  if (p === null || p === undefined) return false;
  switch (band) {
    case "100-300":
      return p >= 100 && p <= 300;
    case "400-1000":
      return p >= 400 && p <= 1000;
    case "1000-plus":
      return p > 1000;
    default:
      return true;
  }
}

export function filterGiftsByBand(
  gifts: GiftItem[],
  band: PriceBand
): GiftItem[] {
  return gifts.filter((g) => giftMatchesBand(g, band));
}

function sortKey(g: GiftItem): number {
  if (g.openAmount || g.price === null) return Number.NaN;
  return g.price;
}

export function sortGiftsByPrice(
  gifts: GiftItem[],
  sort: PriceSort
): GiftItem[] {
  const copy = [...gifts];
  if (sort === "default") return copy;

  return copy.sort((a, b) => {
    const pa = sortKey(a);
    const pb = sortKey(b);
    const aOpen = Number.isNaN(pa);
    const bOpen = Number.isNaN(pb);
    if (aOpen && bOpen) return 0;
    if (aOpen) return 1;
    if (bOpen) return -1;
    if (sort === "asc") return pa - pb;
    return pb - pa;
  });
}

export function filterAndSortGifts(
  gifts: GiftItem[],
  band: PriceBand,
  sort: PriceSort
): GiftItem[] {
  return sortGiftsByPrice(filterGiftsByBand(gifts, band), sort);
}
