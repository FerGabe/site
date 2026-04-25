"use client";

import { useState } from "react";
import {
  DEFAULT_PIX_KEY,
  INFINITEPAY_PAYMENT_LINK,
} from "@/shared/constants/payment";
import type { PaymentMethod } from "@/shared/types/firestore";

type PaymentChoiceProps = {
  method: PaymentMethod;
  onReserve: () => Promise<void>;
  onConfirmPaid: () => void;
  disabled?: boolean;
  loading?: boolean;
  reserveLoading?: boolean;
  hasReserved?: boolean;
};

function getPixKey(): string {
  const fromEnv = process.env.NEXT_PUBLIC_PIX_KEY;
  if (fromEnv && fromEnv.trim()) return fromEnv.trim();
  return DEFAULT_PIX_KEY;
}

export function PaymentChoice({
  method,
  onReserve,
  onConfirmPaid,
  disabled,
  loading,
  reserveLoading,
  hasReserved,
}: PaymentChoiceProps) {
  const [copied, setCopied] = useState(false);
  const pixKey = getPixKey();

  const copyPix = async () => {
    try {
      await onReserve();
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const handleCardPay = async () => {
    try {
      await onReserve();
      window.open(INFINITEPAY_PAYMENT_LINK, "_blank", "noopener,noreferrer");
    } catch {
      /* Erro já tratado no modal (reserva). */
    }
  };

  if (method === "credit_card") {
    return (
      <div className="space-y-6">
        <p className="text-sm text-texto/75 leading-relaxed">
          Você será direcionado para o ambiente seguro da InfinitePay. Nenhum dado
          de cartão é coletado neste site.
        </p>
        <button
          type="button"
          onClick={() => {
            void handleCardPay();
          }}
          disabled={reserveLoading}
          className="flex w-full items-center justify-center rounded-full bg-oliva px-6 py-3.5 text-sm font-medium tracking-wide text-white shadow-sm hover:bg-oliva/90 transition-all"
        >
          {reserveLoading ? "Reservando..." : "Pagar com cartão"}
        </button>
        {hasReserved ? (
          <p className="text-xs text-texto/60 text-center">
            Presente reservado por 1 dia aguardando confirmação.
          </p>
        ) : null}
        <button
          type="button"
          onClick={onConfirmPaid}
          disabled={disabled || loading}
          className="w-full rounded-full border border-bege-areia bg-white/80 py-3 text-sm tracking-wide text-texto hover:border-oliva/50 disabled:opacity-50 transition-all"
        >
          {loading ? "Registrando…" : "Já realizei o pagamento"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-bege-claro bg-bege-claro/25 p-4 sm:p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-texto/50 mb-2">
          Chave Pix
        </p>
        <p className="font-mono text-sm sm:text-base text-texto break-all">
          {pixKey}
        </p>
        <button
          type="button"
          onClick={() => {
            void copyPix();
          }}
          disabled={reserveLoading}
          className="mt-4 w-full rounded-full border border-oliva/30 py-2.5 text-sm text-oliva hover:bg-oliva hover:text-white transition-colors"
        >
          {copied ? "Chave copiada!" : reserveLoading ? "Reservando..." : "Copiar chave Pix"}
        </button>
      </div>
      {hasReserved ? (
        <p className="text-xs text-texto/60 text-center -mt-2">
          Presente reservado por 1 dia aguardando confirmação.
        </p>
      ) : null}

      <div className="flex flex-col items-center gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-texto/50">
          QR Code (exemplo)
        </p>
        <div className="relative h-40 w-40 rounded-xl border-2 border-dashed border-bege-areia/80 bg-white flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-2 opacity-[0.15]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,#6F7D52,#6F7D52 2px,transparent 2px,transparent 6px),repeating-linear-gradient(90deg,#6F7D52,#6F7D52 2px,transparent 2px,transparent 6px)",
            }}
          />
          <span className="relative text-[10px] tracking-widest uppercase text-texto/40 text-center px-2">
            Placeholder
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onConfirmPaid}
        disabled={disabled || loading}
        className="w-full rounded-full bg-oliva py-3.5 text-sm font-medium tracking-wide text-white hover:bg-oliva/90 disabled:opacity-50 transition-all"
      >
        {loading ? "Registrando…" : "Já realizei o pagamento"}
      </button>
    </div>
  );
}
