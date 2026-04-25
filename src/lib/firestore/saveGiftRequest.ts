import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import type { PaymentMethod } from "@/shared/types/firestore";

export type SaveGiftRequestInput = {
  giftId: string;
  giftName: string;
  giftValue: number;
  guestName: string;
  guestWhatsapp: string;
  message: string;
  paymentMethod: PaymentMethod;
};

export type SaveResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const DAY_MS = 24 * 60 * 60 * 1000;

function reservationExpiresAtIso(): string {
  return new Date(Date.now() + DAY_MS).toISOString();
}

/** Cria reserva temporária de 1 dia ao iniciar pagamento. */
export async function createGiftReservation(
  input: SaveGiftRequestInput
): Promise<SaveResult> {
  const db = getFirestoreDb();
  if (!db) {
    return {
      ok: false,
      error:
        "Firebase não configurado. Verifique as variáveis em .env.local.",
    };
  }

  try {
    const ref = await addDoc(collection(db, "gift_requests"), {
      giftId: input.giftId,
      giftName: input.giftName,
      giftValue: input.giftValue,
      guestName: input.guestName.trim(),
      guestWhatsapp: input.guestWhatsapp.trim(),
      message: input.message.trim(),
      paymentMethod: input.paymentMethod,
      status: "awaiting_payment",
      locked: true,
      lockedAt: serverTimestamp(),
      reservedUntil: reservationExpiresAtIso(),
      paymentDeclaredAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { ok: true, id: ref.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao salvar.";
    return { ok: false, error: msg };
  }
}

/** Convidado confirma que pagou: vira lock permanente para revisão manual. */
export async function confirmGiftPaymentById(
  requestId: string
): Promise<SaveResult> {
  const db = getFirestoreDb();
  if (!db) {
    return {
      ok: false,
      error:
        "Firebase não configurado. Verifique as variáveis em .env.local.",
    };
  }

  try {
    await updateDoc(doc(db, "gift_requests", requestId), {
      status: "pending_manual_review",
      locked: true,
      reservedUntil: null,
      paymentDeclaredAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { ok: true, id: requestId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao confirmar pagamento.";
    return { ok: false, error: msg };
  }
}

/**
 * Admin: marca pedido como recebido/confirmado manualmente.
 * Utilitário pronto para painel administrativo futuro.
 */
export async function markGiftPaymentReceived(
  requestId: string
): Promise<SaveResult> {
  const db = getFirestoreDb();
  if (!db) {
    return {
      ok: false,
      error:
        "Firebase não configurado. Verifique as variáveis em .env.local.",
    };
  }
  try {
    await updateDoc(doc(db, "gift_requests", requestId), {
      status: "confirmed",
      locked: true,
      updatedAt: serverTimestamp(),
    });
    return { ok: true, id: requestId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao confirmar no admin.";
    return { ok: false, error: msg };
  }
}

/** Fallback para achar último pedido de um convidado e confirmar por ele. */
export async function confirmGiftPaymentByGuest(
  input: Pick<SaveGiftRequestInput, "giftId" | "guestWhatsapp">
): Promise<SaveResult> {
  const db = getFirestoreDb();
  if (!db) {
    return {
      ok: false,
      error:
        "Firebase não configurado. Verifique as variáveis em .env.local.",
    };
  }
  try {
    const q = query(
      collection(db, "gift_requests"),
      where("giftId", "==", input.giftId),
      where("guestWhatsapp", "==", input.guestWhatsapp.trim()),
      limit(1)
    );
    const snap = await getDocs(q);
    const first = snap.docs[0];
    if (!first) return { ok: false, error: "Reserva não encontrada." };
    return confirmGiftPaymentById(first.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao localizar reserva.";
    return { ok: false, error: msg };
  }
}
