/** Moldura botânica decorativa SVG — leve, reutilizável. */
export function BotanicalCorner({
  className = "",
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) {
  return (
    <svg
      className={`pointer-events-none text-salvia/45 ${flip ? "scale-x-[-1]" : ""} ${className}`}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M8 104C28 88 36 64 32 44c-4-20 8-36 28-40M20 100c12-8 20-24 18-40M12 92c16-4 28-20 26-36"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M4 112c8-4 14-12 16-22 2-14-2-28-12-38"
        stroke="currentColor"
        strokeWidth="0.9"
        opacity="0.7"
      />
      <circle cx="24" cy="28" r="3" fill="currentColor" opacity="0.35" />
      <circle cx="48" cy="16" r="2" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

export function BotanicalDivider({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center gap-3 sm:gap-4 py-2 ${className}`}
      aria-hidden
    >
      <span className="h-px w-12 sm:w-20 bg-gradient-to-r from-transparent via-bege-areia/70 to-bege-areia/35" />
      <svg
        width="10"
        height="14"
        viewBox="0 0 10 14"
        fill="none"
        className="shrink-0 text-oliva/45"
      >
        <path
          d="M5 1v12M2 5h6"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinecap="round"
        />
      </svg>
      <span className="h-px w-12 sm:w-20 bg-gradient-to-l from-transparent via-bege-areia/70 to-bege-areia/35" />
    </div>
  );
}
