import Image from "next/image";
import type { GiftItem } from "../types/gift";
import { formatBRL } from "../utils/format";

type GiftCardProps = {
  gift: GiftItem;
  onPresentear: () => void;
  layout?: "grid" | "carousel";
  locked?: boolean;
};

export function GiftCard({
  gift,
  onPresentear,
  layout = "grid",
  locked = false,
}: GiftCardProps) {
  const purchased = Boolean(gift.purchased);
  const reservedLook = locked && !purchased;
  const mutedCard = purchased || reservedLook;
  const unavailable = locked || purchased;

  const priceLabel =
    gift.openAmount || gift.price === null
      ? "Valor a definir"
      : formatBRL(gift.price);

  return (
    <article
      className={`group relative flex h-full flex-col rounded-[1.35rem] border shadow-sm transition-all duration-500 overflow-hidden ${
        mutedCard
          ? "border-bege-areia/90 bg-bege-claro/40 opacity-95 grayscale-[0.85]"
          : "border-bege-claro/80 bg-white/70 hover:shadow-md hover:border-salvia/35"
      } ${layout === "carousel" ? "min-h-[19.5rem] sm:min-h-[26rem]" : ""}`}
    >
      <div className="relative aspect-[5/4] overflow-hidden">
        <Image
          src={gift.image}
          alt={gift.name}
          fill
          className={`object-cover transition-transform duration-700 ${
            mutedCard
              ? "grayscale brightness-[0.88] contrast-[0.96]"
              : "group-hover:scale-[1.04]"
          }`}
          sizes={
            layout === "carousel"
              ? "(max-width: 640px) 85vw, 300px"
              : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          }
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t from-texto/35 via-transparent to-transparent ${
            mutedCard ? "opacity-55" : "opacity-80"
          }`}
        />
        {mutedCard ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-3 sm:p-5">
            <span className="max-w-[min(100%,18rem)] rounded-full bg-oliva/92 px-4 py-2.5 text-center text-[10px] font-semibold uppercase leading-snug tracking-[0.14em] text-white shadow-lg sm:px-6 sm:py-3 sm:text-[11px] sm:tracking-[0.18em]">
              Presente comprado
            </span>
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3
          className={`font-display text-xl leading-snug mb-2 ${
            mutedCard ? "text-texto/55" : "text-texto"
          }`}
        >
          {gift.name}
        </h3>
        <p
          className={`text-sm font-medium tracking-wide mb-5 ${
            mutedCard ? "text-texto/45" : "text-oliva"
          }`}
        >
          {priceLabel}
        </p>
        <button
          type="button"
          onClick={onPresentear}
          disabled={unavailable}
          className="mt-auto w-full rounded-full border border-oliva/40 py-3 text-sm tracking-wide text-oliva hover:bg-oliva hover:text-white hover:border-oliva transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-oliva"
        >
          {mutedCard ? "Presente comprado" : "Presentear"}
        </button>
      </div>
    </article>
  );
}
