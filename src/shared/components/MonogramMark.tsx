type MonogramMarkProps = {
  className?: string;
  size?: number;
};

/**
 * Monograma vetorial em verde da paleta do site.
 * Evita fundo escuro da imagem anterior e mantém visual premium/minimalista.
 */
export function MonogramMark({ className = "", size = 96 }: MonogramMarkProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      aria-label="Monograma Fer e Gabe"
      role="img"
    >
      <rect
        x="6"
        y="6"
        width="108"
        height="108"
        rx="18"
        fill="none"
        stroke="#6F7D52"
        strokeOpacity="0.35"
      />
      <text
        x="48"
        y="66"
        textAnchor="middle"
        fontFamily="var(--font-display), serif"
        fontSize="62"
        fill="#6F7D52"
      >
        F
      </text>
      <text
        x="72"
        y="86"
        textAnchor="middle"
        fontFamily="var(--font-display), serif"
        fontSize="62"
        fill="#6F7D52"
      >
        G
      </text>
    </svg>
  );
}
