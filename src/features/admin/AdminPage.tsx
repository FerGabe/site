"use client";

import { useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import type { User } from "firebase/auth";
import {
  collection,
  onSnapshot,
  type Timestamp,
} from "firebase/firestore";
import { useMergedGiftCatalog } from "@/features/gifts/hooks/useMergedGiftCatalog";
import type { GiftCategory, GiftItem } from "@/features/gifts/types/gift";
import { markGiftPaymentReceived } from "@/lib/firestore/saveGiftRequest";
import {
  seedGiftCatalogFromCodeDefaults,
  upsertGiftCatalogItem,
} from "@/lib/firestore/giftCatalog";
import { getFirebaseAuth, getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import type { GiftRequestStatus } from "@/shared/types/firestore";
import { normalizePublicAssetPath } from "@/shared/utils/assetPath";

type Tab = "guests" | "requests" | "catalog";

const CATEGORIES: GiftCategory[] = [
  "lua-de-mel",
  "casa",
  "cozinha",
  "eletro",
  "contribuicao",
];

type RsvpRow = {
  id: string;
  fullName: string;
  attending: boolean;
  adults: number;
  children: number;
  companionNames: string[];
  message: string;
  createdMs: number;
};

type GiftRequestRow = {
  id: string;
  giftId: string;
  giftName: string;
  giftValue: number;
  guestName: string;
  message: string;
  paymentMethod: string;
  status: GiftRequestStatus | string;
  createdMs: number;
};

function tsToMs(v: unknown): number {
  if (v && typeof v === "object" && "toMillis" in v) {
    return (v as Timestamp).toMillis();
  }
  return 0;
}

export function AdminPage() {
  const firebaseOk = isFirebaseConfigured();
  const auth = getFirebaseAuth();
  const db = getFirestoreDb();
  const { gifts: mergedGifts } = useMergedGiftCatalog();

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("guests");

  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [requests, setRequests] = useState<GiftRequestRow[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const [selectedGiftId, setSelectedGiftId] = useState<string>("");
  const [gName, setGName] = useState("");
  const [gPrice, setGPrice] = useState("");
  const [gImage, setGImage] = useState("");
  const [gCategory, setGCategory] = useState<GiftCategory>("casa");
  const [gActive, setGActive] = useState(true);
  const [gOpenAmount, setGOpenAmount] = useState(false);
  const [gPix, setGPix] = useState("");
  const [gCard, setGCard] = useState("");
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, [auth]);

  useEffect(() => {
    if (!db || !user) {
      setRsvps([]);
      return;
    }
    const unsub = onSnapshot(
      collection(db, "rsvps"),
      (snap) => {
        const rows: RsvpRow[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            fullName: String(data.fullName ?? ""),
            attending: Boolean(data.attending),
            adults: Number(data.adults ?? 0),
            children: Number(data.children ?? 0),
            companionNames: Array.isArray(data.companionNames)
              ? (data.companionNames as string[])
              : [],
            message: String(data.message ?? ""),
            createdMs: tsToMs(data.createdAt),
          };
        });
        rows.sort((a, b) => b.createdMs - a.createdMs);
        setRsvps(rows);
      },
      () => setRsvps([])
    );
    return () => unsub();
  }, [db, user]);

  useEffect(() => {
    if (!db || !user) {
      setRequests([]);
      return;
    }
    const unsub = onSnapshot(
      collection(db, "gift_requests"),
      (snap) => {
        const rows: GiftRequestRow[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            giftId: String(data.giftId ?? ""),
            giftName: String(data.giftName ?? ""),
            giftValue: Number(data.giftValue ?? 0),
            guestName: String(data.guestName ?? ""),
            message: String(data.message ?? ""),
            paymentMethod: String(data.paymentMethod ?? ""),
            status: String(data.status ?? "") as GiftRequestStatus,
            createdMs: tsToMs(data.createdAt ?? data.updatedAt),
          };
        });
        rows.sort((a, b) => b.createdMs - a.createdMs);
        setRequests(rows);
      },
      () => setRequests([])
    );
    return () => unsub();
  }, [db, user]);

  const giftOptions = useMemo(() => mergedGifts, [mergedGifts]);

  useEffect(() => {
    if (!selectedGiftId && giftOptions[0]) {
      setSelectedGiftId(giftOptions[0].id);
    }
  }, [giftOptions, selectedGiftId]);

  useEffect(() => {
    const g = giftOptions.find((x) => x.id === selectedGiftId);
    if (!g) return;
    setGName(g.name);
    setGPrice(
      g.price === null || g.openAmount ? "" : String(Math.round(g.price))
    );
    setGImage(normalizePublicAssetPath(g.image));
    setGCategory(g.category);
    setGActive(g.active);
    setGOpenAmount(Boolean(g.openAmount || g.price === null));
    setGPix(g.pixCode ?? "");
    setGCard(g.cardPaymentLink ?? "");
  }, [giftOptions, selectedGiftId]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!auth) {
      setAuthError("Firebase não configurado.");
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      setPassword("");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Não foi possível entrar.";
      setAuthError(msg);
    }
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const confirmReceived = async (requestId: string) => {
    setActionId(requestId);
    setBanner(null);
    const res = await markGiftPaymentReceived(requestId);
    setActionId(null);
    if (!res.ok) setBanner(res.error);
    else setBanner("Presente marcado como recebido.");
  };

  const saveCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatalogSaving(true);
    setBanner(null);
    const priceParsed =
      gPrice.trim() === "" ? NaN : Number(gPrice.replace(",", "."));
    const price =
      gOpenAmount || !Number.isFinite(priceParsed)
        ? null
        : Math.max(0, priceParsed);
    if (!gOpenAmount && (price === null || price < 1)) {
      setBanner("Informe um preço válido ou marque valor livre.");
      setCatalogSaving(false);
      return;
    }
    const currentGift = giftOptions.find((x) => x.id === selectedGiftId);
    const imagePath =
      gImage.trim() ||
      (currentGift ? normalizePublicAssetPath(currentGift.image) : "");
    if (!imagePath) {
      setBanner("Informe o caminho da imagem (ex.: /gifts/arquivo.webp).");
      setCatalogSaving(false);
      return;
    }
    const res = await upsertGiftCatalogItem({
      id: selectedGiftId,
      name: gName,
      price,
      image: imagePath.startsWith("/") ? imagePath : `/${imagePath}`,
      category: gCategory,
      active: gActive,
      openAmount: gOpenAmount,
      pixCode: gPix,
      cardPaymentLink: gCard,
    });
    setCatalogSaving(false);
    if (!res.ok) setBanner(res.error);
    else setBanner("Presente salvo no catálogo.");
  };

  const seedCatalog = async () => {
    setSeeding(true);
    setBanner(null);
    const res = await seedGiftCatalogFromCodeDefaults();
    setSeeding(false);
    if (!res.ok) setBanner(res.error);
    else setBanner("Lista padrão importada para o Firestore.");
  };

  if (!firebaseOk || !auth || !db) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <h1 className="font-display text-2xl text-oliva mb-3">Admin</h1>
        <p className="text-texto/75 leading-relaxed">
          Firebase não está configurado. Preencha as variáveis{" "}
          <code className="text-sm">NEXT_PUBLIC_FIREBASE_*</code> no{" "}
          <code className="text-sm">.env.local</code>.
        </p>
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center text-texto/70">
        Carregando…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-display text-2xl text-oliva mb-2 text-center">
          Admin
        </h1>
        <p className="text-sm text-texto/65 text-center mb-8">
          Entre com o usuário criado no Firebase Authentication (e-mail/senha).
        </p>
        <form
          onSubmit={login}
          className="rounded-2xl border border-bege-claro bg-white/70 p-6 shadow-sm space-y-4"
        >
          {authError ? (
            <p className="text-sm text-red-700/90 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {authError}
            </p>
          ) : null}
          <label className="block text-sm">
            <span className="text-texto/70">E-mail</span>
            <input
              type="email"
              autoComplete="username"
              className="mt-1.5 w-full rounded-xl border border-bege-claro bg-cream/50 px-4 py-3 outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="text-texto/70">Senha</span>
            <input
              type="password"
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-xl border border-bege-claro bg-cream/50 px-4 py-3 outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-oliva py-3 text-sm font-medium text-white hover:bg-oliva/90 transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-bege-claro/80 pb-6 mb-8">
        <div>
          <h1 className="font-display text-2xl text-oliva">Admin</h1>
          <p className="text-sm text-texto/65 mt-1">
            Logado como <span className="font-medium">{user.email}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="self-start rounded-full border border-bege-areia bg-white/70 px-5 py-2 text-sm text-texto hover:border-oliva/40 transition-colors"
        >
          Sair
        </button>
      </header>

      {banner ? (
        <p className="mb-6 rounded-xl border border-salvia/30 bg-salvia/10 px-4 py-3 text-sm text-texto/85">
          {banner}
        </p>
      ) : null}

      <nav className="flex flex-wrap gap-2 mb-8">
        {(
          [
            ["guests", "Convidados (RSVP)"],
            ["requests", "Pedidos de presente"],
            ["catalog", "Catálogo de presentes"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-full px-4 py-2 text-sm tracking-wide transition-colors ${
              tab === id
                ? "bg-oliva text-white shadow-sm"
                : "border border-bege-areia/80 bg-white/60 text-texto/80 hover:border-oliva/35"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "guests" ? (
        <section className="space-y-4">
          <h2 className="font-display text-xl text-texto">
            Confirmações de presença
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-bege-claro bg-white/70 shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-bege-claro/80 bg-cream/80 text-xs uppercase tracking-wide text-texto/55">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Presença</th>
                  <th className="px-4 py-3">Pessoas</th>
                  <th className="px-4 py-3">Acompanhantes</th>
                  <th className="px-4 py-3">Mensagem</th>
                </tr>
              </thead>
              <tbody>
                {rsvps.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-texto/60"
                    >
                      Nenhum RSVP encontrado (ou sem permissão de leitura).
                    </td>
                  </tr>
                ) : (
                  rsvps.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-bege-claro/50 align-top"
                    >
                      <td className="px-4 py-3 font-medium">{r.fullName}</td>
                      <td className="px-4 py-3">
                        {r.attending ? "Sim" : "Não"}
                      </td>
                      <td className="px-4 py-3">
                        {r.adults} adulto(s), {r.children} criança(s)
                      </td>
                      <td className="px-4 py-3 text-texto/80">
                        {r.companionNames.length
                          ? r.companionNames.join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-texto/75 max-w-xs whitespace-pre-wrap">
                        {r.message || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "requests" ? (
        <section className="space-y-4">
          <h2 className="font-display text-xl text-texto">
            Pedidos e reservas de presente
          </h2>
          <p className="text-sm text-texto/65">
            Use &ldquo;Marcar recebido&rdquo; quando o pagamento já tiver sido
            confirmado por você (após o convidado declarar pagamento).
          </p>
          <div className="overflow-x-auto rounded-2xl border border-bege-claro bg-white/70 shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-bege-claro/80 bg-cream/80 text-xs uppercase tracking-wide text-texto/55">
                <tr>
                  <th className="px-4 py-3">Presente</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Convidado</th>
                  <th className="px-4 py-3">Pagamento</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-texto/60"
                    >
                      Nenhum pedido encontrado.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-bege-claro/50 align-top"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.giftName}</div>
                        <div className="text-xs text-texto/50">{r.giftId}</div>
                      </td>
                      <td className="px-4 py-3">
                        {Number.isFinite(r.giftValue)
                          ? r.giftValue.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div>{r.guestName}</div>
                        {r.message ? (
                          <div className="mt-1 text-xs text-texto/60 whitespace-pre-wrap max-w-[14rem]">
                            {r.message}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 capitalize">{r.paymentMethod}</td>
                      <td className="px-4 py-3 text-xs uppercase tracking-wide text-texto/70">
                        {r.status}
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "pending_manual_review" ? (
                          <button
                            type="button"
                            disabled={actionId === r.id}
                            onClick={() => void confirmReceived(r.id)}
                            className="rounded-full border border-oliva/40 px-3 py-1.5 text-xs text-oliva hover:bg-oliva hover:text-white transition-colors disabled:opacity-50"
                          >
                            {actionId === r.id ? "Salvando…" : "Marcar recebido"}
                          </button>
                        ) : (
                          <span className="text-texto/45">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "catalog" ? (
        <section className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-xl text-texto">
              Catálogo de presentes
            </h2>
            <button
              type="button"
              disabled={seeding}
              onClick={() => void seedCatalog()}
              className="rounded-full border border-bege-areia bg-white/70 px-4 py-2 text-sm text-texto hover:border-oliva/40 disabled:opacity-50"
            >
              {seeding ? "Importando…" : "Importar lista padrão (Firestore)"}
            </button>
          </div>
          <p className="text-sm text-texto/65">
            Ajuste nome, foto (caminho em <code className="text-xs">/gifts/…</code>
            ), valor, Pix e link do cartão. O site público mescla estes dados com
            a lista base do código.
          </p>

          <form
            onSubmit={saveCatalog}
            className="rounded-2xl border border-bege-claro bg-white/70 p-6 shadow-sm space-y-4 max-w-xl"
          >
            <label className="block text-sm">
              <span className="text-texto/70">Presente</span>
              <select
                className="mt-1.5 w-full rounded-xl border border-bege-claro bg-cream/50 px-4 py-3 outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
                value={selectedGiftId}
                onChange={(e) => setSelectedGiftId(e.target.value)}
              >
                {giftOptions.map((g: GiftItem) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-texto/70">Nome</span>
              <input
                className="mt-1.5 w-full rounded-xl border border-bege-claro bg-cream/50 px-4 py-3 outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
                value={gName}
                onChange={(e) => setGName(e.target.value)}
                required
              />
            </label>

            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="accent-oliva"
                checked={gOpenAmount}
                onChange={(e) => setGOpenAmount(e.target.checked)}
              />
              <span className="text-texto/75">Valor livre (contribuição)</span>
            </label>

            <label className="block text-sm">
              <span className="text-texto/70">Preço (R$)</span>
              <input
                disabled={gOpenAmount}
                className="mt-1.5 w-full rounded-xl border border-bege-claro bg-cream/50 px-4 py-3 outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40 disabled:opacity-50"
                value={gPrice}
                onChange={(e) => setGPrice(e.target.value)}
                placeholder="Ex.: 250"
              />
            </label>

            <label className="block text-sm">
              <span className="text-texto/70">Imagem (URL pública)</span>
              <input
                className="mt-1.5 w-full rounded-xl border border-bege-claro bg-cream/50 px-4 py-3 outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
                value={gImage}
                onChange={(e) => setGImage(e.target.value)}
                placeholder="/gifts/arquivo.webp"
                required
              />
            </label>

            <label className="block text-sm">
              <span className="text-texto/70">Categoria</span>
              <select
                className="mt-1.5 w-full rounded-xl border border-bege-claro bg-cream/50 px-4 py-3 outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
                value={gCategory}
                onChange={(e) => setGCategory(e.target.value as GiftCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="accent-oliva"
                checked={gActive}
                onChange={(e) => setGActive(e.target.checked)}
              />
              <span className="text-texto/75">Ativo na lista pública</span>
            </label>

            <label className="block text-sm">
              <span className="text-texto/70">Pix copia e cola</span>
              <textarea
                rows={3}
                className="mt-1.5 w-full resize-y rounded-xl border border-bege-claro bg-cream/50 px-4 py-3 font-mono text-xs outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
                value={gPix}
                onChange={(e) => setGPix(e.target.value)}
              />
            </label>

            <label className="block text-sm">
              <span className="text-texto/70">Link cartão (InfinitePay etc.)</span>
              <input
                className="mt-1.5 w-full rounded-xl border border-bege-claro bg-cream/50 px-4 py-3 outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
                value={gCard}
                onChange={(e) => setGCard(e.target.value)}
                placeholder="https://..."
              />
            </label>

            <button
              type="submit"
              disabled={catalogSaving}
              className="w-full rounded-full bg-oliva py-3 text-sm font-medium text-white hover:bg-oliva/90 disabled:opacity-50 transition-colors"
            >
              {catalogSaving ? "Salvando…" : "Salvar presente"}
            </button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
