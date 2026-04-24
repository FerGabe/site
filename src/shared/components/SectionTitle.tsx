import type { ReactNode } from "react";

type SectionTitleProps = {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  align?: "left" | "center";
};

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: SectionTitleProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <div className={`max-w-2xl mb-12 md:mb-16 ${alignClass}`}>
      {eyebrow ? (
        <p className="font-display text-sm md:text-base tracking-[0.35em] uppercase text-oliva/80 mb-3">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-texto text-balance leading-tight">
        {title}
      </h2>
      {subtitle ? (
        <div className="mt-5 text-base md:text-lg text-texto/75 leading-relaxed">
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}
