import Image from "next/image";

type MonogramMarkProps = {
  className?: string;
  size?: number;
};

export function MonogramMark({ className = "", size = 96 }: MonogramMarkProps) {
  return (
    <Image
      src="/brand/monogram-transparent.png"
      aria-label="Monograma Fer e Gabe"
      alt="Monograma Fer e Gabe"
      width={1024}
      height={845}
      className={`h-auto w-auto object-contain ${className}`}
      style={{ maxHeight: size }}
    />
  );
}
