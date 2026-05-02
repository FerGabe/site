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
import type { GiftCategory } from "@/features/gifts/types/gift";
import { GIFT_PAYMENT_BY_ID } from "@/features/gifts/data/giftPaymentById";
import { markGiftPaymentReceived } from "@/lib/firestore/saveGiftRequest";
import {
  deleteGiftCatalogItem,
  seedGiftCatalogFromCodeDefaults,
  upsertGiftCatalogItem,
} from "@/lib/firestore/giftCatalog";
import { getFirebaseAuth, getFirestoreDb, isFirebaseConfigured } from "@/lib/firebase";
import type { GiftRequestStatus } from "@/shared/types/firestore";
import { normalizePublicAssetPath } from "@/shared/utils/assetPath";

type Tab = "guests" | "requests" | "catalog";
type CatalogFormMode = "hidden" | "create" | "edit";

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

type CatalogGiftRow = {
  id: string;
  name: string;
  price: number | null;
  image: string;
  category: GiftCategory;
  active: boolean;
  openAmount: boolean;
  pixCode: string;
  cardPaymentLink: string;
  updatedMs: number;
};

function tsToMs(v: unknown): number {
  if (v && typeof v === "object" && "toMillis" in v) {
    return (v as Timestamp).toMillis();
  }
  return 0;
}

function isCategory(value: unknown): value is GiftCategory {
  return (
    typeof value === "string" &&
    CATEGORIES.includes(value as GiftCategory)
  );
}

function toGiftId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function AdminPage() {
  const firebaseOk = isFirebaseConfigured();
  const auth = getFirebaseAuth();
  const db = getFirestoreDb();
  const [user, setUser] = useState<User | null>(null);
  const { gifts: mergedGifts } = useMergedGiftCatalog({
    enabled: Boolean(user),
  });

  const [authReady, setAuthReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("guests");

  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [requests, setRequests] = useState<GiftRequestRow[]>([]);
  const [catalogRows, setCatalogRows] = useState<CatalogGiftRow[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const [selectedGiftId, setSelectedGiftId] = useState<string>("");
  const [catalogFormMode, setCatalogFormMode] = useState<CatalogFormMode>("hidden");
  const [giftDeletingId, setGiftDeletingId] = useState<string | null>(null);
  const [gId, setGId] = useState("");
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
    const t = window.setTimeout(() => {
      setAuthReady((ready) => {
        if (!ready) {
          console.warn(
            "[admin] Auth state demorou; exibindo login. Verifique rede / Firebase."
          );
        }
        return true;
      });
    }, 12000);
    return () => {
      window.clearTimeout(t);
      unsub();
    };
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

  useEffect(() => {
    if (!db || !user) {
      setCatalogRows([]);
      return;
    }
    const unsub = onSnapshot(
      collection(db, "gifts"),
      (snap) => {
        const rows: CatalogGiftRow[] = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            name: String(data.name ?? d.id),
            price:
              data.price === null
                ? null
                : typeof data.price === "number" && Number.isFinite(data.price)
                  ? data.price
                  : null,
            image: normalizePublicAssetPath(String(data.image ?? "")),
            category: isCategory(data.category) ? data.category : "casa",
            active: typeof data.active === "boolean" ? data.active : true,
            openAmount: Boolean(data.openAmount),
            pixCode: String(data.pixCode ?? ""),
            cardPaymentLink: String(data.cardPaymentLink ?? ""),
            updatedMs: tsToMs(data.updatedAt),
          };
        });
        rows.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        setCatalogRows(rows);
      },
      () => setCatalogRows([])
    );
    return () => unsub();
  }, [db, user]);

  const giftOptions = useMemo(
    () =>
      [...mergedGifts].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [mergedGifts]
  );
  const firestoreIds = useMemo(
    () => new Set(catalogRows.map((g) => g.id)),
    [catalogRows]
  );

  useEffect(() => {
    if (catalogFormMode !== "edit") return;
    if (!giftOptions.length) {
      setSelectedGiftId("");
      return;
    }
    if (!selectedGiftId || !giftOptions.some((g) => g.id === selectedGiftId)) {
      setSelectedGiftId(giftOptions[0].id);
    }
  }, [giftOptions, selectedGiftId, catalogFormMode]);

  useEffect(() => {
    if (catalogFormMode !== "edit") return;
    const g = giftOptions.find((x) => x.id === selectedGiftId);
    if (!g) return;
    const pay = GIFT_PAYMENT_BY_ID[g.id];
    setGId(g.id);
    setGName(g.name);
    setGPrice(
      g.price === null || g.openAmount ? "" : String(Math.round(g.price))
    );
    setGImage(normalizePublicAssetPath(g.image));
    setGCategory(g.category);
    setGActive(g.active);
    setGOpenAmount(Boolean(g.openAmount || g.price === null));
    setGPix(g.pixCode ?? pay?.pixCode ?? "");
    setGCard(g.cardPaymentLink ?? pay?.cardPaymentLink ?? "");
  }, [giftOptions, selectedGiftId, catalogFormMode]);

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

  const startCreateGift = () => {
    setBanner(null);
    setCatalogFormMode("create");
    setSelectedGiftId("");
    setGId("");
    setGName("");
    setGPrice("");
    setGImage("/gifts/");
    setGCategory("casa");
    setGActive(true);
    setGOpenAmount(false);
    setGPix("");
    setGCard("");
  };

  const startEditGift = (giftId: string) => {
    setBanner(null);
    const g = giftOptions.find((x) => x.id === giftId);
    if (!g) return;
    const pay = GIFT_PAYMENT_BY_ID[g.id];
    setCatalogFormMode("edit");
    setSelectedGiftId(giftId);
    setGId(g.id);
    setGName(g.name);
    setGPrice(
      g.price === null || g.openAmount ? "" : String(Math.round(g.price))
    );
    setGImage(normalizePublicAssetPath(g.image));
    setGCategory(g.category);
    setGActive(g.active);
    setGOpenAmount(Boolean(g.openAmount || g.price === null));
    setGPix(g.pixCode ?? pay?.pixCode ?? "");
    setGCard(g.cardPaymentLink ?? pay?.cardPaymentLink ?? "");
  };

  const hideCatalogForm = () => {
    setCatalogFormMode("hidden");
    setSelectedGiftId("");
  };

  const saveCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (seeding) {
      setBanner("Aguarde a publicação no Firebase terminar para salvar alterações.");
      return;
    }
    const isCreatingGift = catalogFormMode === "create";
    if (!isCreatingGift && !selectedGiftId) {
      setBanner("Selecione um presente para editar.");
      return;
    }
    setCatalogSaving(true);
    setBanner(null);
    const normalizedId = toGiftId(gId);
    const targetId = isCreatingGift ? normalizedId : selectedGiftId;
    if (!targetId) {
      setBanner("Informe um ID para o presente.");
      setCatalogSaving(false);
      return;
    }
    if (isCreatingGift && giftOptions.some((g) => g.id === targetId)) {
      setBanner("Já existe um presente com esse ID.");
      setCatalogSaving(false);
      return;
    }
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
    const currentGift = giftOptions.find((x) => x.id === targetId);
    const defaultPay = currentGift ? GIFT_PAYMENT_BY_ID[currentGift.id] : undefined;
    const imagePath =
      gImage.trim() ||
      (currentGift ? normalizePublicAssetPath(currentGift.image) : "");
    if (!imagePath) {
      setBanner("Informe o caminho da imagem (ex.: /gifts/arquivo.webp).");
      setCatalogSaving(false);
      return;
    }
    try {
      const res = await upsertGiftCatalogItem({
        id: targetId,
        name: gName,
        price,
        image: imagePath.startsWith("/") ? imagePath : `/${imagePath}`,
        category: gCategory,
        active: gActive,
        openAmount: gOpenAmount,
        pixCode: gPix.trim() || defaultPay?.pixCode || "",
        cardPaymentLink: gCard.trim() || defaultPay?.cardPaymentLink || "",
      });
      if (!res.ok) setBanner(res.error);
      else {
        setBanner("Presente salvo no catálogo.");
        setCatalogFormMode("edit");
        setSelectedGiftId(targetId);
        setGId(targetId);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao salvar presente.";
      setBanner(msg);
    } finally {
      setCatalogSaving(false);
    }
  };

  const seedCatalog = async () => {
    setSeeding(true);
    setBanner(null);
    try {
      const res = await seedGiftCatalogFromCodeDefaults();
      if (!res.ok) setBanner(res.error);
      else setBanner("Lista padrão importada para o Firestore.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao publicar no Firebase.";
      setBanner(msg);
    } finally {
      setSeeding(false);
    }
  };

  const deleteCatalogGift = async (giftId: string) => {
    const item = giftOptions.find((g) => g.id === giftId);
    const ok = window.confirm(
      `Excluir o presente "${item?.name ?? giftId}" do catálogo?`
    );
    if (!ok) return;
    setBanner(null);
    setGiftDeletingId(giftId);
    try {
      const res = await (firestoreIds.has(giftId)
        ? deleteGiftCatalogItem(giftId)
        : upsertGiftCatalogItem({
            id: giftId,
            name: item?.name ?? giftId,
            price: item?.price ?? null,
            image:
              item && item.image
                ? normalizePublicAssetPath(item.image)
                : "/gifts/placeholder.webp",
            category: item?.category ?? "casa",
            active: false,
            openAmount: Boolean(item?.openAmount),
            pixCode: item?.pixCode ?? "",
            cardPaymentLink: item?.cardPaymentLink ?? "",
          }));
      if (!res.ok) {
        setBanner(res.error);
        return;
      }
      if (selectedGiftId === giftId) {
        setSelectedGiftId("");
        setCatalogFormMode("hidden");
      }
      setBanner(
        firestoreIds.has(giftId)
          ? "Presente excluído do catálogo."
          : "Presente ocultado da lista pública."
      );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao excluir/ocultar presente.";
      setBanner(msg);
    } finally {
      setGiftDeletingId(null);
    }
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
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startCreateGift}
                className="rounded-full bg-oliva px-4 py-2 text-sm text-white hover:bg-oliva/90"
              >
                + Criar novo presente
              </button>
              <button
                type="button"
                disabled={seeding}
                onClick={() => void seedCatalog()}
                className="rounded-full border border-bege-areia bg-white/70 px-4 py-2 text-sm text-texto hover:border-oliva/40 disabled:opacity-50"
              >
                {seeding ? "Publicando…" : "Publicar 31 no Firebase"}
              </button>
            </div>
          </div>
          <p className="text-sm text-texto/65">
            Visualize toda a lista de presentes (base + Firestore), edite, oculte,
            exclua itens do Firestore e crie novos. Para imagem, use caminho público como{" "}
            <code className="text-xs">/gifts/arquivo.webp</code>.
          </p>
          <div className="sm:hidden">
            <button
              type="button"
              onClick={startCreateGift}
              className="w-full rounded-full bg-oliva px-4 py-2.5 text-sm text-white hover:bg-oliva/90"
            >
              + Criar novo presente
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-bege-claro bg-white/70 shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-bege-claro/80 bg-cream/80 text-xs uppercase tracking-wide text-texto/55">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Ativo</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {giftOptions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-texto/60"
                    >
                      Nenhum presente encontrado.
                    </td>
                  </tr>
                ) : (
                  giftOptions.map((g) => (
                    <tr
                      key={g.id}
                      className="border-b border-bege-claro/50 align-top"
                    >
                      <td className="px-4 py-3 font-medium">{g.name}</td>
                      <td className="px-4 py-3 text-xs text-texto/60">{g.id}</td>
                      <td className="px-4 py-3">{g.category}</td>
                      <td className="px-4 py-3">
                        {g.openAmount || g.price === null
                          ? "Valor livre"
                          : g.price.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                      </td>
                      <td className="px-4 py-3">{g.active ? "Sim" : "Não"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEditGift(g.id)}
                            className="rounded-full border border-oliva/40 px-3 py-1.5 text-xs text-oliva hover:bg-oliva hover:text-white transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            disabled={giftDeletingId === g.id}
                            onClick={() => void deleteCatalogGift(g.id)}
                            className="rounded-full border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-60"
                          >
                            {giftDeletingId === g.id
                              ? "Salvando…"
                              : firestoreIds.has(g.id)
                                ? "Excluir"
                                : "Ocultar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {catalogFormMode === "hidden" ? null : (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
              <button
                type="button"
                onClick={hideCatalogForm}
                className="absolute inset-0 bg-texto/45 backdrop-blur-[1px]"
                aria-label="Fechar edição de presente"
              />
              <form
                onSubmit={saveCatalog}
                className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-bege-claro bg-cream p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-display text-lg text-texto">
                    {catalogFormMode === "create"
                      ? "Adicionar presente"
                      : "Editar presente"}
                  </h3>
                  <button
                    type="button"
                    onClick={hideCatalogForm}
                    className="rounded-full border border-bege-areia bg-white px-3 py-1 text-xs text-texto hover:border-oliva/40"
                  >
                    Fechar
                  </button>
                </div>

                <label className="block text-sm">
                  <span className="text-texto/70">ID (slug)</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-bege-claro bg-white px-4 py-3 font-mono text-xs outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40 disabled:opacity-60"
                    value={gId}
                    onChange={(e) => setGId(e.target.value)}
                    placeholder="ex.: jogo-pratos"
                    disabled={catalogFormMode !== "create"}
                    required
                  />
                </label>

                <label className="block text-sm">
                  <span className="text-texto/70">Nome</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-bege-claro bg-white px-4 py-3 outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
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
                    className="mt-1.5 w-full rounded-xl border border-bege-claro bg-white px-4 py-3 outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40 disabled:opacity-50"
                    value={gPrice}
                    onChange={(e) => setGPrice(e.target.value)}
                    placeholder="Ex.: 250"
                  />
                </label>

                <label className="block text-sm">
                  <span className="text-texto/70">Imagem (URL pública)</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-bege-claro bg-white px-4 py-3 outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
                    value={gImage}
                    onChange={(e) => setGImage(e.target.value)}
                    placeholder="/gifts/arquivo.webp"
                    required
                  />
                </label>

                <label className="block text-sm">
                  <span className="text-texto/70">Categoria</span>
                  <select
                    className="mt-1.5 w-full rounded-xl border border-bege-claro bg-white px-4 py-3 outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
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
                    className="mt-1.5 w-full resize-y rounded-xl border border-bege-claro bg-white px-4 py-3 font-mono text-xs outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
                    value={gPix}
                    onChange={(e) => setGPix(e.target.value)}
                  />
                </label>

                <label className="block text-sm">
                  <span className="text-texto/70">Link cartão (InfinitePay etc.)</span>
                  <input
                    className="mt-1.5 w-full rounded-xl border border-bege-claro bg-white px-4 py-3 outline-none focus:border-salvia/80 focus:ring-1 focus:ring-salvia/40"
                    value={gCard}
                    onChange={(e) => setGCard(e.target.value)}
                    placeholder="https://..."
                  />
                </label>

                <button
                  type="submit"
                  disabled={catalogSaving || seeding}
                  className="w-full rounded-full bg-oliva py-3 text-sm font-medium text-white hover:bg-oliva/90 disabled:opacity-50 transition-colors"
                >
                  {catalogSaving
                    ? "Salvando…"
                    : catalogFormMode === "create"
                      ? "Criar presente"
                      : "Salvar alterações"}
                </button>
              </form>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
