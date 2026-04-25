"use client";

import { useCallback, useEffect, useId, useState } from "react";
import type { GiftItem } from "../types/gift";
import { formatBRL } from "../utils/format";
import { PaymentChoice } from "./PaymentChoice";
import {
  confirmGiftPaymentById,
  createGiftReservation,
} from "@/lib/firestore/saveGiftRequest";
import type { PaymentMethod } from "@/shared/types/firestore";

type Step = "form" | "payment" | "success";

type GiftModalProps = {
  gift: GiftItem | null;
  onClose: () => void;
};

const initialForm = {
  guestName: "",
  guestWhatsapp: "",
  message: "",
  paymentMethod: "pix" as PaymentMethod,
  openAmount: "",
};

export function GiftModal({ gift, onClose }: GiftModalProps) {
  const titleId = useId();
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [reserveLoading, setReserveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep("form");
    setForm(initialForm);
    setError(null);
    setLoading(false);
    setReserveLoading(false);
    setRequestId(null);
  }, []);

  useEffect(() => {
    if (!gift) reset();
  }, [gift, reset]);

  useEffect(() => {
    if (!gift) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gift, onClose]);

  if (!gift) return null;

  const resolvedValue = (() => {
    if (gift.openAmount || gift.price === null) {
      const n = Number(form.openAmount.replace(",", "."));
      return Number.isFinite(n) ? n : NaN;
    }
    return gift.price ?? NaN;
  })();

  const summaryValueLabel =
    gift.openAmount || gift.price === null
      ? Number.isFinite(resolvedValue) && resolvedValue > 0
        ? formatBRL(resolvedValue)
        : "Valor a definir pelo convidado"
      : formatBRL(gift.price!);

  const validateForm = (): boolean => {
    if (!form.guestName.trim()) {
      setError("Informe seu nome.");
      return false;
    }
    if (!form.guestWhatsapp.trim()) {
      setError("Informe seu WhatsApp.");
      return false;
    }
    if (gift.openAmount || gift.price === null) {
      if (!Number.isFinite(resolvedValue) || resolvedValue < 1) {
        setError("Informe um valor válido (mín. R$ 1,00).");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const goPayment = () => {
    if (!validateForm()) return;
    setStep("payment");
  };

  const handleConfirmPaid = async () => {
    try {
      if (!requestId) {
        setError(
          "Antes de confirmar, copie a chave Pix ou clique em pagar com cartão para reservar o presente."
        );
        return;
      }
      if (!Number.isFinite(resolvedValue) || resolvedValue < 1) {
        setError("Valor inválido.");
        return;
      }
      setLoading(true);
      setError(null);
      const result = await confirmGiftPaymentById(requestId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStep("success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao confirmar.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async () => {
    try {
      if (requestId) return;
      if (!Number.isFinite(resolvedValue) || resolvedValue < 1) {
        setError("Valor inválido.");
        return;
      }
      if (!validateForm()) return;
      setReserveLoading(true);
      setError(null);
      const result = await createGiftReservation({
        giftId: gift.id,
        giftName: gift.name,
        giftValue: resolvedValue,
        guestName: form.guestName,
        guestWhatsapp: form.guestWhatsapp,
        message: form.message,
        paymentMethod: form.paymentMethod,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRequestId(result.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao reservar.";
      setError(msg);
    } finally {
      setReserveLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="dialog"
      aria-modal
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-texto/40 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[1.75rem] sm:rounded-[1.75rem] border border-bege-claro bg-cream shadow-2xl animate-fade-up">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-bege-claro/80 bg-cream/95 backdrop-blur px-5 py-4 sm:px-6">
          <h2 id={titleId} className="font-display text-lg sm:text-xl text-texto">
            Presente especial
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-texto/60 hover:bg-bege-claro/50 hover:text-texto transition-colors"
            aria-label="Fechar modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="px-5 py-6 sm:px-8 sm:py-8 space-y-6">
          <div className="rounded-2xl border border-white bg-white/60 p-4 sm:p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-texto/45 mb-1">
              Presente escolhido
            </p>
            <p className="font-display text-xl text-texto">{gift.name}</p>
            <p className="mt-2 text-sm text-texto/70">
              Valor:{" "}
              <span className="font-medium text-oliva">{summaryValueLabel}</span>
            </p>
            <p className="mt-3 text-sm text-texto/65 leading-relaxed">
              {gift.openAmount
                ? "Sua contribuição será registrada com o valor que indicar abaixo."
                : "O item permanece visível na lista até a confirmação manual dos noivos."}
            </p>
          </div>

          {step === "success" ? (
            <div className="rounded-2xl border border-salvia/30 bg-salvia/10 px-5 py-8 text-center space-y-3">
              <p className="font-display text-2xl text-oliva">Obrigado!</p>
              <p className="text-texto/80 leading-relaxed">
                Presente registrado com sucesso! Os noivos irão confirmar o
                pagamento.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 inline-flex rounded-full bg-oliva px-8 py-3 text-sm text-white hover:bg-oliva/90 transition-colors"
              >
                Fechar
              </button>
            </div>
          ) : step === "form" ? (
            <>
              {error ? (
                <p className="text-sm text-red-700/90 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {error}
                </p>
              ) : null}
              <div className="space-y-4">
                <label className="block text-sm">
                  <span className="text-texto/70">Nome</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-bege-claro bg-white/80 px-4 py-3 text-texto outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40 transition-shadow"
                    value={form.guestName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, guestName: e.target.value }))
                    }
                    placeholder="Seu nome completo"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-texto/70">WhatsApp</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-bege-claro bg-white/80 px-4 py-3 text-texto outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
                    value={form.guestWhatsapp}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, guestWhatsapp: e.target.value }))
                    }
                    placeholder="(00) 00000-0000"
                  />
                </label>
                {(gift.openAmount || gift.price === null) && (
                  <label className="block text-sm">
                    <span className="text-texto/70">Valor (R$)</span>
                    <input
                      inputMode="decimal"
                      className="mt-1.5 w-full rounded-xl border border-bege-claro bg-white/80 px-4 py-3 text-texto outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
                      value={form.openAmount}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, openAmount: e.target.value }))
                      }
                      placeholder="Ex.: 200"
                    />
                  </label>
                )}
                <label className="block text-sm">
                  <span className="text-texto/70">Mensagem para os noivos</span>
                  <textarea
                    rows={3}
                    className="mt-1.5 w-full resize-none rounded-xl border border-bege-claro bg-white/80 px-4 py-3 text-texto outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
                    value={form.message}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, message: e.target.value }))
                    }
                    placeholder="Um carinho em palavras…"
                  />
                </label>
              </div>

              <fieldset className="space-y-3">
                <legend className="text-sm text-texto/70 mb-1">
                  Forma de pagamento
                </legend>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-bege-claro bg-white/60 px-4 py-3 has-[:checked]:border-oliva has-[:checked]:ring-1 has-[:checked]:ring-oliva/30">
                    <input
                      type="radio"
                      name="pay"
                      checked={form.paymentMethod === "pix"}
                      onChange={() =>
                        setForm((f) => ({ ...f, paymentMethod: "pix" }))
                      }
                      className="accent-oliva"
                    />
                    <span className="text-sm">Pix</span>
                  </label>
                  <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-bege-claro bg-white/60 px-4 py-3 has-[:checked]:border-oliva has-[:checked]:ring-1 has-[:checked]:ring-oliva/30">
                    <input
                      type="radio"
                      name="pay"
                      checked={form.paymentMethod === "credit_card"}
                      onChange={() =>
                        setForm((f) => ({
                          ...f,
                          paymentMethod: "credit_card",
                        }))
                      }
                      className="accent-oliva"
                    />
                    <span className="text-sm">Cartão de crédito</span>
                  </label>
                </div>
              </fieldset>

              <button
                type="button"
                onClick={goPayment}
                className="w-full rounded-full bg-oliva py-3.5 text-sm font-medium tracking-wide text-white hover:bg-oliva/90 transition-all"
              >
                Continuar para o pagamento
              </button>
            </>
          ) : (
            <>
              {error ? (
                <p className="text-sm text-red-700/90 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {error}
                </p>
              ) : null}
              <PaymentChoice
                method={form.paymentMethod}
                onReserve={handleReserve}
                onConfirmPaid={() => {
                  void handleConfirmPaid();
                }}
                loading={loading}
                reserveLoading={reserveLoading}
                hasReserved={Boolean(requestId)}
              />
              <button
                type="button"
                onClick={() => setStep("form")}
                className="w-full text-sm text-texto/55 hover:text-texto underline-offset-4 hover:underline"
              >
                Voltar e editar dados
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
