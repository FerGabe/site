import {
  doc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";
import { BASE_WEDDING_GIFTS } from "@/features/gifts/data/gifts";
import { GIFT_PAYMENT_BY_ID } from "@/features/gifts/data/giftPaymentById";
import type { GiftCategory, GiftItem } from "@/features/gifts/types/gift";
import { getFirebaseAuth, getFirestoreDb } from "@/lib/firebase";

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

export async function upsertGiftCatalogItem(
  input: GiftCatalogUpsertInput
): Promise<SaveResult> {
  const err = requireAdmin();
  if (err) return { ok: false, error: err };

  const db = getFirestoreDb();
  if (!db) {
    return {
      ok: false,
      error: "Firebase não configurado. Verifique as variáveis em .env.local.",
    };
  }

  try {
    await setDoc(
      doc(db, "gifts", input.id),
      {
        name: input.name.trim(),
        price: input.price,
        image: input.image.trim(),
        category: input.category,
        active: input.active,
        openAmount: input.openAmount,
        pixCode: input.pixCode.trim(),
        cardPaymentLink: input.cardPaymentLink.trim(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return { ok: true, id: input.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao salvar presente.";
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

  try {
    const batch = writeBatch(db);
    for (const g of BASE_WEDDING_GIFTS as GiftItem[]) {
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
          openAmount: Boolean(g.openAmount),
          pixCode: pay?.pixCode ?? "",
          cardPaymentLink: pay?.cardPaymentLink ?? "",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
    await batch.commit();
    return { ok: true, id: "seed" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao importar lista padrão.";
    return { ok: false, error: msg };
  }
}
