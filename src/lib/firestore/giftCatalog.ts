import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { BASE_WEDDING_GIFTS } from "@/features/gifts/data/gifts";
import { GIFT_PAYMENT_BY_ID } from "@/features/gifts/data/giftPaymentById";
import type { GiftCategory, GiftItem } from "@/features/gifts/types/gift";
import {
  getFirebaseAuth,
  getFirestoreDb,
  isFirebaseConfigured,
} from "@/lib/firebase";
import {
  deleteGiftCatalogDocumentRest,
  patchGiftCatalogDocumentRest,
} from "@/lib/firestore/giftCatalogRestWrite";

const AUTH_TOKEN_MS = 15_000;
const FIRESTORE_READ_MS = 30_000;
const FIRESTORE_WRITE_MS = 45_000;

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  timeoutMessage: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(timeoutMessage)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

export type SaveResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type GiftCatalogUpsertInput = {
  id: string;
  name: string;
  price: number | null;
  /** Caminho público, ex.: `/gifts/nome.webp` (sem prefixo `/site`). */
  image: string;
  category: GiftCategory;
  active: boolean;
  /** Já comprado pelos noivos — some da lista pública. */
  purchased: boolean;
  openAmount: boolean;
  pixCode: string;
  cardPaymentLink: string;
};

function requireAdmin(): string | null {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) {
    return "Faça login como administrador.";
  }
  return null;
}

type FreshIdTokenResult =
  | { success: true; token: string }
  | { success: false; error: string };

/** Token fresco para REST / batch (evita writes presos com sessão expirada). */
async function getFreshIdToken(): Promise<FreshIdTokenResult> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) {
    return { success: false, error: "Faça login como administrador." };
  }
  try {
    const token = await withTimeout(
      auth.currentUser.getIdToken(true),
      AUTH_TOKEN_MS,
      "Firebase Auth não respondeu ao renovar a sessão. Tente janela anónima ou desative extensões (PIN, antivírus) em localhost."
    );
    return { success: true, token };
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "Sessão inválida. Saia, entre de novo e tente salvar.";
    return { success: false, error: msg };
  }
}

export async function upsertGiftCatalogItem(
  input: GiftCatalogUpsertInput
): Promise<SaveResult> {
  const err = requireAdmin();
  if (err) return { ok: false, error: err };

  if (!isFirebaseConfigured()) {
    return {
      ok: false,
      error: "Firebase não configurado. Verifique as variáveis em .env.local.",
    };
  }

  const authRes = await getFreshIdToken();
  if (!authRes.success) return { ok: false, error: authRes.error };

  try {
    await withTimeout(
      patchGiftCatalogDocumentRest(authRes.token, input),
      FIRESTORE_WRITE_MS,
      "O Firestore REST não confirmou o save a tempo. Verifique a rede e as regras de segurança."
    );
    return { ok: true, id: input.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao salvar presente.";
    return { ok: false, error: msg };
  }
}

export async function deleteGiftCatalogItem(id: string): Promise<SaveResult> {
  const err = requireAdmin();
  if (err) return { ok: false, error: err };

  if (!isFirebaseConfigured()) {
    return {
      ok: false,
      error: "Firebase não configurado. Verifique as variáveis em .env.local.",
    };
  }

  const authRes = await getFreshIdToken();
  if (!authRes.success) return { ok: false, error: authRes.error };

  try {
    await withTimeout(
      deleteGiftCatalogDocumentRest(authRes.token, id),
      FIRESTORE_WRITE_MS,
      "O Firestore REST não confirmou a exclusão a tempo. Verifique a rede."
    );
    return { ok: true, id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao excluir presente.";
    return { ok: false, error: msg };
  }
}

/** Primeira carga: grava no Firestore os presentes padrão + Pix/cartão do código. */
export async function seedGiftCatalogFromCodeDefaults(): Promise<SaveResult> {
  const err = requireAdmin();
  if (err) return { ok: false, error: err };

  const db = getFirestoreDb();
  if (!db) {
    return {
      ok: false,
      error: "Firebase não configurado. Verifique as variáveis em .env.local.",
    };
  }

  const authRes = await getFreshIdToken();
  if (!authRes.success) return { ok: false, error: authRes.error };

  try {
    const existingIds = new Set<string>();
    const current = await withTimeout(
      getDocs(collection(db, "gifts")),
      FIRESTORE_READ_MS,
      "Timeout ao ler o catálogo no Firestore. Verifique a rede."
    );
    current.forEach((d) => existingIds.add(d.id));

    const batch = writeBatch(db);
    for (const g of BASE_WEDDING_GIFTS as GiftItem[]) {
      // Não sobrescreve presentes já personalizados no painel admin.
      if (existingIds.has(g.id)) continue;
      const pay = GIFT_PAYMENT_BY_ID[g.id];
      const ref = doc(db, "gifts", g.id);
      batch.set(
        ref,
        {
          name: g.name,
          price: g.price,
          image: g.image,
          category: g.category,
          active: g.active,
          purchased: Boolean(g.purchased),
          openAmount: Boolean(g.openAmount),
          pixCode: pay?.pixCode ?? "",
          cardPaymentLink: pay?.cardPaymentLink ?? "",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
    await withTimeout(
      batch.commit(),
      FIRESTORE_WRITE_MS,
      "O Firestore não confirmou a importação a tempo. Verifique a rede e tente janela anónima sem extensões."
    );
    return { ok: true, id: "seed" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao importar lista padrão.";
    return { ok: false, error: msg };
  }
}
