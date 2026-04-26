import { assetPath } from "@/shared/utils/assetPath";

type MonogramMarkProps = {
  className?: string;
  size?: number;
};

/** `<img>` nativo: aparece logo no header (sem esperar o pipeline do `next/image`). */
export function MonogramMark({ className = "", size = 96 }: MonogramMarkProps) {
  return (
    <img
      src={assetPath("/brand/monogram-transparent.png")}
      alt="Monograma Fer e Gabe"
      width={160}
      height={132}
      loading="eager"
      decoding="async"
      fetchPriority="high"
      className={`h-auto w-auto shrink-0 object-contain ${className}`}
      style={{ maxHeight: size }}
    />
  );
}
