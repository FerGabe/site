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
import { GIFT_PAYMENT_BY_ID } from "@/features/gifts/data/giftPaymentById";
import {
  adminCancelGiftReservation,
  adminConfirmGiftPayment,
} from "@/lib/firestore/saveGiftRequest";
import {
  deleteGiftCatalogItem,
  type GiftCatalogUpsertInput,
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
  purchased: boolean;
  openAmount: boolean;
  pixCode: string;
  cardPaymentLink: string;
  updatedMs: number;
};

function buildCatalogUpsertFromGift(
  item: GiftItem,
  overrides: Partial<Pick<GiftCatalogUpsertInput, "active" | "purchased">>
): GiftCatalogUpsertInput {
  const pay = GIFT_PAYMENT_BY_ID[item.id];
  return {
    id: item.id,
    name: item.name,
    price: item.price,
    image: normalizePublicAssetPath(item.image),
    category: item.category,
    active: overrides.active ?? item.active,
    purchased: overrides.purchased ?? Boolean(item.purchased),
    openAmount: Boolean(item.openAmount),
    pixCode: item.pixCode?.trim() || pay?.pixCode || "",
    cardPaymentLink: item.cardPaymentLink?.trim() || pay?.cardPaymentLink || "",
  };
}

function tsToMs(v: unknown): number {
  if (v && typeof v === "object" && "toMillis" in v) {
    return (v as Timestamp).toMillis();
  }
  return 0;
}

/** Texto curto para coluna Pessoas: omite crianças se 0, omite adultos se 0. */
function formatRsvpPeopleBrief(adults: number, children: number): string {
  const parts: string[] = [];
  if (adults > 0) parts.push(`${adults} Adu`);
  if (children > 0) parts.push(`${children} Cri`);
  return parts.length > 0 ? parts.join(" ") : "—";
}

function giftRequestStatusLabel(status: string): string {
  const s = status.toLowerCase();
  if (s === "confirmed") return "Pago";
  if (s === "awaiting_payment" || s === "pending_manual_review")
    return "Reservado";
  if (s === "canceled" || s === "cancelled") return "Cancelado";
  if (s === "expired") return "Expirado";
  return status;
}

function formatPaymentMethodLabel(raw: string): string {
  const m = raw.toLowerCase().replace(/\s+/g, "_");
  if (m === "credit_card") return "Cartão";
  if (m === "pix") return "Pix";
  return raw || "—";
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
  /** false até o primeiro onSnapshot de rsvps (sucesso ou erro). */
  const [rsvpsLoaded, setRsvpsLoaded] = useState(false);
  const [requests, setRequests] = useState<GiftRequestRow[]>([]);
  const [catalogRows, setCatalogRows] = useState<CatalogGiftRow[]>([]);
  const [requestAction, setRequestAction] = useState<{
    id: string;
    kind: "confirm" | "cancel";
  } | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const [selectedGiftId, setSelectedGiftId] = useState<string>("");
  const [catalogFormMode, setCatalogFormMode] = useState<CatalogFormMode>("hidden");
  const [giftDeletingId, setGiftDeletingId] = useState<string | null>(null);
  const [giftPurchasedSavingId, setGiftPurchasedSavingId] = useState<string | null>(null);
  const [gId, setGId] = useState("");
  const [gName, setGName] = useState("");
  const [gPrice, setGPrice] = useState("");
  const [gImage, setGImage] = useState("");
  const [gCategory, setGCategory] = useState<GiftCategory>("casa");
  const [gOpenAmount, setGOpenAmount] = useState(false);
  const [gPix, setGPix] = useState("");
  const [gCard, setGCard] = useState("");
  const [catalogSaving, setCatalogSaving] = useState(false);

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
      setRsvpsLoaded(false);
      return;
    }
    setRsvpsLoaded(false);
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
        setRsvpsLoaded(true);
      },
      () => {
        setRsvps([]);
        setRsvpsLoaded(true);
      }
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
            purchased: typeof data.purchased === "boolean" ? data.purchased : false,
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

  const canAdminActOnGiftRequest = (status: string) =>
    status === "awaiting_payment" || status === "pending_manual_review";

  const runGiftRequestAction = async (
    requestId: string,
    kind: "confirm" | "cancel"
  ) => {
    if (kind === "cancel") {
      const ok = window.confirm(
        "Cancelar esta reserva? O presente volta a ficar disponível na lista pública."
      );
      if (!ok) return;
    }
    setRequestAction({ id: requestId, kind });
    setBanner(null);
    const res =
      kind === "confirm"
        ? await adminConfirmGiftPayment(requestId)
        : await adminCancelGiftReservation(requestId);
    setRequestAction(null);
    if (!res.ok) setBanner(res.error);
    else if (kind === "confirm") setBanner("Pagamento confirmado.");
    else setBanner("Reserva cancelada; o presente voltou a ficar disponível.");
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
        category: isCreatingGift ? gCategory : (currentGift?.category ?? gCategory),
        active: isCreatingGift ? true : Boolean(currentGift?.active),
        purchased: isCreatingGift ? false : Boolean(currentGift?.purchased),
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

  const setCatalogGiftPurchased = async (giftId: string, purchased: boolean) => {
    const item = giftOptions.find((g) => g.id === giftId);
    if (!item) return;
    if (Boolean(item.purchased) === purchased) return;
    setBanner(null);
    setGiftPurchasedSavingId(giftId);
    try {
      const res = await upsertGiftCatalogItem(
        buildCatalogUpsertFromGift(item, { purchased })
      );
      if (!res.ok) setBanner(res.error);
      else
        setBanner(
          purchased
            ? "Presente marcado como comprado."
            : "Marcação de comprado removida."
        );
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao atualizar comprado.";
      setBanner(msg);
    } finally {
      setGiftPurchasedSavingId(null);
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
      let res;
      if (firestoreIds.has(giftId)) {
        res = await deleteGiftCatalogItem(giftId);
      } else {
        if (!item) {
          setBanner("Presente não encontrado.");
          return;
        }
        res = await upsertGiftCatalogItem(
          buildCatalogUpsertFromGift(item, { active: false, purchased: false })
        );
      }
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

      <nav className="-mx-1 mb-8 flex flex-nowrap gap-1.5 overflow-x-auto px-1 pb-1 [-webkit-overflow-scrolling:touch] sm:mx-0 sm:gap-2 sm:px-0">
        {(
          [
            ["guests", "convidados"],
            ["requests", "presentes comprados"],
            ["catalog", "lista"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-xs tracking-wide transition-colors sm:px-4 sm:text-sm ${
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
          <div className="overflow-hidden rounded-2xl border border-bege-claro bg-white/70 shadow-sm">
            <table className="w-full table-fixed border-collapse text-left text-[11px] leading-snug sm:text-sm sm:leading-normal">
              <thead className="border-b border-bege-claro/80 bg-cream/80 text-[10px] uppercase tracking-wide text-texto/55 sm:text-xs">
                <tr>
                  <th
                    scope="col"
                    className="w-[26%] min-w-0 px-2 py-2.5 sm:w-[22%] sm:px-4 sm:py-3"
                  >
                    Nome
                  </th>
                  <th
                    scope="col"
                    className="w-[11%] min-w-0 px-1 py-2.5 text-center sm:w-auto sm:px-4 sm:text-left"
                    title="Presença"
                  >
                    <span className="sm:hidden">Pres.</span>
                    <span className="hidden sm:inline">Presença</span>
                  </th>
                  <th
                    scope="col"
                    className="w-[17%] min-w-0 px-1 py-2.5 sm:w-auto sm:px-4"
                    title="Pessoas"
                  >
                    <span className="sm:hidden">Pess.</span>
                    <span className="hidden sm:inline">Pessoas</span>
                  </th>
                  <th
                    scope="col"
                    className="w-[26%] min-w-0 px-1 py-2.5 sm:px-4"
                    title="Acompanhantes"
                  >
                    <span className="sm:hidden">Acomp.</span>
                    <span className="hidden sm:inline">Acompanhantes</span>
                  </th>
                  <th
                    scope="col"
                    className="min-w-0 px-1 py-2.5 sm:px-4"
                    title="Mensagem"
                  >
                    <span className="sm:hidden">Msg</span>
                    <span className="hidden sm:inline">Mensagem</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {!rsvpsLoaded ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-texto/65"
                    >
                      <span
                        className="inline-flex items-center justify-center gap-3"
                        role="status"
                        aria-live="polite"
                      >
                        <span
                          className="inline-block size-5 shrink-0 animate-spin rounded-full border-2 border-bege-areia border-t-oliva"
                          aria-hidden
                        />
                        <span>Carregando convidados…</span>
                      </span>
                    </td>
                  </tr>
                ) : rsvps.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-texto/60"
                    >
                      Nenhum RSVP encontrado (ou sem permissão de leitura).
                    </td>
                  </tr>
                ) : (
                  rsvps.map((r) => {
                    const companionsLabel = r.companionNames.length
                      ? r.companionNames.join(", ")
                      : "—";
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-bege-claro/50 align-top"
                      >
                        <td className="min-w-0 px-2 py-2.5 font-medium break-words sm:px-4 sm:py-3">
                          {r.fullName}
                        </td>
                        <td className="min-w-0 px-1 py-2.5 text-center sm:px-4 sm:text-left">
                          <span
                            className="inline-block text-[1.15rem] leading-none"
                            role="img"
                            aria-label={
                              r.attending ? "Sim, comparece" : "Não comparece"
                            }
                          >
                            {r.attending ? "✅" : "❌"}
                          </span>
                        </td>
                        <td className="min-w-0 px-1 py-2.5 tabular-nums sm:px-4 sm:py-3">
                          <span className="sm:hidden">
                            {formatRsvpPeopleBrief(r.adults, r.children)}
                          </span>
                          <span className="hidden sm:inline">
                            {r.adults > 0
                              ? `${r.adults} adulto(s)${r.children > 0 ? `, ${r.children} criança(s)` : ""}`
                              : r.children > 0
                                ? `${r.children} criança(s)`
                                : "—"}
                          </span>
                        </td>
                        <td
                          className="min-w-0 max-w-0 px-1 py-2.5 text-texto/80 sm:max-w-none sm:px-4 sm:py-3"
                          title={
                            r.companionNames.length
                              ? r.companionNames.join(", ")
                              : undefined
                          }
                        >
                          <span className="block truncate sm:whitespace-normal sm:break-words">
                            {companionsLabel}
                          </span>
                        </td>
                        <td className="min-w-0 px-1 py-2.5 text-texto/75 sm:px-4 sm:py-3">
                          <p className="line-clamp-3 break-words sm:line-clamp-none sm:whitespace-pre-wrap">
                            {r.message || "—"}
                          </p>
                        </td>
                      </tr>
                    );
                  })
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
          <div className="overflow-hidden rounded-2xl border border-bege-claro bg-white/70 shadow-sm">
            <table className="w-full border-collapse text-left text-sm">
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-texto/60">
                      Nenhum pedido encontrado.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => {
                    const valueLabel = Number.isFinite(r.giftValue)
                      ? r.giftValue.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })
                      : "—";
                    const paymentLabel = formatPaymentMethodLabel(
                      r.paymentMethod
                    );
                    const statusLabel = giftRequestStatusLabel(String(r.status));
                    const showActions = canAdminActOnGiftRequest(
                      String(r.status)
                    );
                    const busy = requestAction?.id === r.id;
                    const actions = showActions ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void runGiftRequestAction(r.id, "confirm")
                          }
                          className="shrink-0 whitespace-nowrap rounded-full border border-oliva/40 px-2 py-1.5 text-[10px] text-oliva hover:bg-oliva hover:text-white transition-colors disabled:opacity-50 sm:px-3 sm:text-xs"
                        >
                          {busy && requestAction?.kind === "confirm"
                            ? "Salvando…"
                            : "Confirmar pagamento"}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void runGiftRequestAction(r.id, "cancel")
                          }
                          className="shrink-0 whitespace-nowrap rounded-full border border-texto/25 px-2 py-1.5 text-[10px] text-texto/80 hover:bg-texto/10 transition-colors disabled:opacity-50 sm:px-3 sm:text-xs"
                        >
                          {busy && requestAction?.kind === "cancel"
                            ? "Salvando…"
                            : "Cancelar reserva"}
                        </button>
                      </>
                    ) : (
                      <span className="text-texto/45 text-xs">—</span>
                    );
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-bege-claro/50 align-top last:border-b-0"
                      >
                        <td className="px-3 py-3 sm:px-4 sm:py-3">
                          <div className="sm:hidden">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="min-w-0 flex-1 font-medium leading-snug break-words">
                                {r.giftName}
                              </span>
                              <span className="shrink-0 tabular-nums text-[11px] text-texto/80">
                                {valueLabel}
                              </span>
                            </div>
                            <div className="mt-2">
                              <p className="font-medium leading-snug">
                                {r.guestName}
                              </p>
                              {r.message ? (
                                <p className="mt-1 line-clamp-2 break-words text-[11px] text-texto/60">
                                  {r.message}
                                </p>
                              ) : null}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-texto/70">
                              <span>{paymentLabel}</span>
                              <span className="text-texto/35" aria-hidden>
                                ·
                              </span>
                              <span className="font-semibold text-texto">
                                {statusLabel}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-nowrap items-center gap-2">
                              {actions}
                            </div>
                          </div>
                          <div className="hidden gap-3 text-sm sm:grid sm:grid-cols-[minmax(0,1.1fr)_6.5rem_minmax(0,1fr)_4.5rem_5rem_auto] sm:items-start">
                            <div className="min-w-0 font-medium leading-snug break-words">
                              {r.giftName}
                            </div>
                            <div className="shrink-0 tabular-nums text-texto/85">
                              {valueLabel}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium">{r.guestName}</div>
                              {r.message ? (
                                <p className="mt-1 line-clamp-2 whitespace-pre-wrap break-words text-xs text-texto/60">
                                  {r.message}
                                </p>
                              ) : null}
                            </div>
                            <div className="shrink-0 pt-0.5 text-xs">
                              {paymentLabel}
                            </div>
                            <div className="shrink-0 pt-0.5 text-xs font-semibold text-texto/85">
                              {statusLabel}
                            </div>
                            <div className="flex min-w-0 flex-col gap-2 justify-self-end pt-0.5">
                              {actions}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
              Lista de presentes
            </h2>
            <button
              type="button"
              onClick={startCreateGift}
              className="w-full shrink-0 rounded-full bg-oliva px-4 py-2.5 text-sm text-white hover:bg-oliva/90 sm:w-auto sm:py-2"
            >
              + Criar novo presente
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-bege-claro bg-white/70 shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="hidden border-b border-bege-claro/80 bg-cream/80 text-xs uppercase tracking-wide text-texto/55 sm:table-header-group">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {giftOptions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-8 text-center text-texto/60"
                    >
                      Nenhum presente encontrado.
                    </td>
                  </tr>
                ) : (
                  giftOptions.map((g) => {
                    const priceLabel =
                      g.openAmount || g.price === null
                        ? "Valor livre"
                        : g.price.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          });
                    const actionsDisabled =
                      giftPurchasedSavingId === g.id ||
                      giftDeletingId === g.id;
                    const payBtnClass = g.purchased
                      ? "border-oliva bg-oliva text-white"
                      : "border-bege-areia bg-white text-texto/75 hover:border-oliva/35";
                    return (
                      <tr
                        key={g.id}
                        className="border-b border-bege-claro/50 align-top"
                      >
                        <td colSpan={3} className="px-4 py-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
                            <div className="min-w-0 sm:hidden">
                              <div className="font-medium leading-snug">
                                {g.name}
                              </div>
                              <div className="mt-0.5 text-sm text-texto/70 tabular-nums">
                                {priceLabel}
                              </div>
                            </div>
                            <div className="hidden min-w-0 font-medium leading-snug sm:block sm:flex-1 sm:truncate">
                              {g.name}
                            </div>
                            <div className="hidden shrink-0 text-sm text-texto/70 tabular-nums sm:block sm:w-28 sm:text-right">
                              {priceLabel}
                            </div>
                            <div className="-mx-0.5 flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 sm:mx-0 sm:ml-auto sm:shrink-0 sm:gap-2 sm:overflow-visible sm:pb-0">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={g.purchased}
                                aria-label={
                                  g.purchased
                                    ? "Presente comprado no catálogo; clique para desmarcar"
                                    : "Marcar presente como pago no catálogo"
                                }
                                disabled={actionsDisabled}
                                onClick={() =>
                                  void setCatalogGiftPurchased(
                                    g.id,
                                    !g.purchased
                                  )
                                }
                                className={`shrink-0 whitespace-nowrap rounded-full border px-2 py-1.5 text-[10px] font-medium leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-45 sm:px-3 sm:text-xs ${payBtnClass}`}
                              >
                                {giftPurchasedSavingId === g.id
                                  ? "Salvando…"
                                  : g.purchased
                                    ? "Presente comprado"
                                    : "Marcar como pago"}
                              </button>
                              <button
                                type="button"
                                onClick={() => startEditGift(g.id)}
                                disabled={actionsDisabled}
                                className="shrink-0 whitespace-nowrap rounded-full border border-oliva/40 px-2 py-1.5 text-[10px] text-oliva hover:bg-oliva hover:text-white transition-colors disabled:opacity-50 sm:px-3 sm:text-xs"
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                disabled={actionsDisabled}
                                onClick={() => void deleteCatalogGift(g.id)}
                                className="shrink-0 whitespace-nowrap rounded-full border border-red-300 px-2 py-1.5 text-[10px] text-red-700 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-60 sm:px-3 sm:text-xs"
                              >
                                {giftDeletingId === g.id
                                  ? "Salvando…"
                                  : firestoreIds.has(g.id)
                                    ? "Excluir"
                                    : "Ocultar"}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
                  disabled={catalogSaving}
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
