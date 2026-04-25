"use client";

import { useState } from "react";
import { saveRsvp } from "@/lib/firestore/saveRsvp";
import { SectionTitle } from "@/shared/components/SectionTitle";
import { BotanicalDivider } from "@/shared/components/BotanicalFrame";

type FormState = {
  fullName: string;
  attending: "yes" | "no";
  adults: string;
  children: string;
  otherAdultNames: string[];
  childrenNames: string[];
  message: string;
};

const initial: FormState = {
  fullName: "",
  attending: "yes",
  adults: "1",
  children: "0",
  otherAdultNames: [],
  childrenNames: [],
  message: "",
};

export function RSVPSection() {
  const [form, setForm] = useState<FormState>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const attendingBool = form.attending === "yes";
  const adultsNum = Math.max(0, parseInt(form.adults, 10) || 0);
  const childrenNum = Math.max(0, parseInt(form.children, 10) || 0);
  const extraAdults = Math.max(0, adultsNum - 1);

  const ensureSize = (arr: string[] | undefined, size: number): string[] => {
    const safe = arr ?? [];
    if (safe.length === size) return safe;
    if (safe.length > size) return safe.slice(0, size);
    return [...safe, ...Array(size - safe.length).fill("")];
  };

  const onAdultsChange = (value: string) => {
    const nextAdults = Math.max(0, parseInt(value, 10) || 0);
    const nextExtraAdults = Math.max(0, nextAdults - 1);
    setForm((f) => ({
      ...f,
      adults: value,
      otherAdultNames: ensureSize(f.otherAdultNames, nextExtraAdults),
    }));
  };

  const onChildrenChange = (value: string) => {
    const nextChildren = Math.max(0, parseInt(value, 10) || 0);
    setForm((f) => ({
      ...f,
      children: value,
      childrenNames: ensureSize(f.childrenNames, nextChildren),
    }));
  };

  const updateOtherAdultName = (index: number, value: string) => {
    setForm((f) => {
      const next = [...(f.otherAdultNames ?? [])];
      next[index] = value;
      return { ...f, otherAdultNames: next };
    });
  };

  const updateChildName = (index: number, value: string) => {
    setForm((f) => {
      const next = [...(f.childrenNames ?? [])];
      next[index] = value;
      return { ...f, childrenNames: next };
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.fullName.trim()) {
      setError("Informe seu nome completo.");
      return;
    }
    if (attendingBool && adultsNum < 1) {
      setError("Informe ao menos 1 adulto se for comparecer.");
      return;
    }
    if (
      attendingBool &&
      (form.otherAdultNames ?? []).some((n) => !n.trim())
    ) {
      setError("Preencha o nome de todos os adultos acompanhantes.");
      return;
    }
    if (attendingBool && (form.childrenNames ?? []).some((n) => !n.trim())) {
      setError("Preencha o nome de todas as crianças.");
      return;
    }

    setLoading(true);
    const result = await saveRsvp({
      fullName: form.fullName,
      attending: attendingBool,
      adults: attendingBool ? adultsNum : 0,
      children: attendingBool ? childrenNum : 0,
      companionNames: attendingBool
        ? [...(form.otherAdultNames ?? []), ...(form.childrenNames ?? [])]
            .map((n) => n.trim())
            .filter(Boolean)
        : [],
      message: form.message,
    });
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    setForm(initial);
  };

  return (
    <section
      id="rsvp"
      className="py-20 md:py-28 bg-bege-claro/30 border-t border-bege-areia/20"
    >
      <div className="mx-auto max-w-2xl px-6">
        <SectionTitle
          eyebrow="Confirmação"
          title="Sua presença é o nosso melhor presente"
          subtitle="Por favor, reserve um instantinho para nos contar se celebrará conosco — cada resposta nos ajuda a preparar este dia com carinho."
        />
        <BotanicalDivider className="mb-10" />

        {success ? (
          <div className="rounded-2xl border border-salvia/35 bg-white/70 px-6 py-10 text-center shadow-sm">
            <p className="font-display text-2xl text-oliva mb-3">Recebemos!</p>
            <p className="text-texto/80 leading-relaxed">
              Sua confirmação foi enviada com sucesso!
            </p>
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="mt-8 text-sm text-oliva underline-offset-4 hover:underline"
            >
              Enviar outra resposta
            </button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="rounded-[1.5rem] border border-bege-claro bg-white/70 p-6 sm:p-8 shadow-sm space-y-5"
          >
            {error ? (
              <p className="text-sm text-red-700/90 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </p>
            ) : null}

            <label className="block text-sm">
              <span className="text-texto/70">Nome completo</span>
              <input
                required
                className="mt-1.5 w-full rounded-xl border border-bege-claro bg-cream/50 px-4 py-3 text-texto outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
                value={form.fullName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, fullName: e.target.value }))
                }
                placeholder="Como deseja ser chamado(a)"
              />
            </label>

            <fieldset>
              <legend className="text-sm text-texto/70 mb-2">
                Irá ao evento?
              </legend>
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="att"
                    checked={form.attending === "yes"}
                    onChange={() =>
                      setForm((f) => ({ ...f, attending: "yes" }))
                    }
                    className="accent-oliva"
                  />
                  <span className="text-sm">Sim, estarei lá</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="att"
                    checked={form.attending === "no"}
                    onChange={() =>
                      setForm((f) => ({ ...f, attending: "no" }))
                    }
                    className="accent-oliva"
                  />
                  <span className="text-sm">Não poderei ir</span>
                </label>
              </div>
            </fieldset>

            {attendingBool && (
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm">
                  <span className="text-texto/70">Adultos</span>
                  <input
                    type="number"
                    min={1}
                    className="mt-1.5 w-full rounded-xl border border-bege-claro bg-cream/50 px-4 py-3 text-texto outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
                    value={form.adults}
                    onChange={(e) => onAdultsChange(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-texto/70">Crianças</span>
                  <input
                    type="number"
                    min={0}
                    className="mt-1.5 w-full rounded-xl border border-bege-claro bg-cream/50 px-4 py-3 text-texto outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
                    value={form.children}
                    onChange={(e) => onChildrenChange(e.target.value)}
                  />
                </label>
              </div>
            )}

            {attendingBool && extraAdults > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-texto/70">
                  Nome dos adultos acompanhantes
                </p>
                {(form.otherAdultNames ?? []).map((name, index) => (
                  <label className="block text-sm" key={`adult-${index}`}>
                    <span className="text-texto/60">
                      Adulto acompanhante {index + 1}
                    </span>
                    <input
                      required
                      className="mt-1.5 w-full rounded-xl border border-bege-claro bg-cream/50 px-4 py-3 text-texto outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
                      value={name}
                      onChange={(e) =>
                        updateOtherAdultName(index, e.target.value)
                      }
                      placeholder="Nome completo"
                    />
                  </label>
                ))}
              </div>
            )}

            {attendingBool && childrenNum > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-texto/70">Nome das crianças</p>
                {(form.childrenNames ?? []).map((name, index) => (
                  <label className="block text-sm" key={`child-${index}`}>
                    <span className="text-texto/60">Criança {index + 1}</span>
                    <input
                      required
                      className="mt-1.5 w-full rounded-xl border border-bege-claro bg-cream/50 px-4 py-3 text-texto outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
                      value={name}
                      onChange={(e) => updateChildName(index, e.target.value)}
                      placeholder="Nome completo"
                    />
                  </label>
                ))}
              </div>
            )}

            <label className="block text-sm">
              <span className="text-texto/70">Mensagem (opcional)</span>
              <textarea
                rows={3}
                className="mt-1.5 w-full resize-none rounded-xl border border-bege-claro bg-cream/50 px-4 py-3 text-texto outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
                placeholder="Um recado especial para os noivos"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-oliva py-3.5 text-sm font-medium tracking-wide text-white hover:bg-oliva/90 disabled:opacity-60 transition-all"
            >
              {loading ? "Enviando…" : "Enviar confirmação"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
