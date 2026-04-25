import Image from "next/image";
import type { GiftItem } from "../types/gift";
import { formatBRL } from "../utils/format";

type GiftCardProps = {
  gift: GiftItem;
  onPresentear: () => void;
  layout?: "grid" | "carousel";
  locked?: boolean;
  lockLabel?: string;
};

export function GiftCard({
  gift,
  onPresentear,
  layout = "grid",
  locked = false,
  lockLabel = "Reservado",
}: GiftCardProps) {
  const priceLabel =
    gift.openAmount || gift.price === null
      ? "Valor a definir"
      : formatBRL(gift.price);

  return (
    <article
      className={`group relative flex h-full flex-col rounded-[1.35rem] border border-bege-claro/80 bg-white/70 shadow-sm hover:shadow-md hover:border-salvia/35 transition-all duration-500 overflow-hidden ${
        layout === "carousel" ? "min-h-[26rem]" : ""
      }`}
    >
      <div className="relative aspect-[5/4] overflow-hidden">
        <Image
          src={gift.image}
          alt={gift.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          sizes={
            layout === "carousel"
              ? "(max-width: 640px) 85vw, 300px"
              : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          }
        />
        <div className="absolute inset-0 bg-gradient-to-t from-texto/35 via-transparent to-transparent opacity-80" />
        {locked ? (
          <span className="absolute left-3 top-3 rounded-full bg-oliva/90 px-3 py-1 text-[11px] tracking-wide text-white">
            {lockLabel}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="font-display text-xl text-texto leading-snug mb-2">
          {gift.name}
        </h3>
        <p className="text-sm text-oliva font-medium tracking-wide mb-5">
          {priceLabel}
        </p>
        <button
          type="button"
          onClick={onPresentear}
          disabled={locked}
          className="mt-auto w-full rounded-full border border-oliva/40 py-3 text-sm tracking-wide text-oliva hover:bg-oliva hover:text-white hover:border-oliva transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-oliva"
        >
          {locked ? "Indisponível no momento" : "Presentear"}
        </button>
      </div>
    </article>
  );
}
