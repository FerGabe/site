type NameConnectorProps = {
  className?: string;
};

/** Separador "e" minimalista com fundo verde suave. */
export function NameConnector({ className = "" }: NameConnectorProps) {
  return (
    <span
      className={`mx-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-salvia/25 font-display text-lg italic text-oliva align-middle ${className}`}
      aria-hidden
    >
      e
    </span>
  );
}
