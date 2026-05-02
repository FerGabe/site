import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  type Firestore,
  type Timestamp,
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

function reservedUntilMs(raw: unknown): number {
  if (raw == null) return 0;
  if (typeof raw === "string") {
    const t = Date.parse(raw);
    return Number.isFinite(t) ? t : 0;
  }
  if (
    typeof raw === "object" &&
    raw !== null &&
    "toMillis" in raw &&
    typeof (raw as Timestamp).toMillis === "function"
  ) {
    return (raw as Timestamp).toMillis();
  }
  return 0;
}

/** Presente já tem reserva ativa ou pagamento em análise — não deixa outro convidado. */
async function giftHasBlockingReservation(
  db: Firestore,
  giftId: string
): Promise<boolean> {
  const snap = await getDocs(
    query(collection(db, "gift_requests"), where("giftId", "==", giftId))
  );
  const now = Date.now();
  for (const d of snap.docs) {
    const data = d.data() as Record<string, unknown>;
    const status = String(data.status ?? "");
    if (
      status === "canceled" ||
      status === "cancelled" ||
      status === "expired"
    ) {
      continue;
    }
    if (status === "awaiting_payment") {
      if (reservedUntilMs(data.reservedUntil) > now) return true;
      continue;
    }
    if (status === "pending_manual_review" || status === "confirmed") {
      return true;
    }
  }
  return false;
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
    if (await giftHasBlockingReservation(db, input.giftId)) {
      return {
        ok: false,
        error:
          "Este presente já foi reservado ou está em confirmação. Escolha outro.",
      };
    }
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
  return adminConfirmGiftPayment(requestId);
}

/**
 * Admin: confirma pagamento (reserva aguardando ou já declarado pelo convidado).
 */
export async function adminConfirmGiftPayment(
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
    const ref = doc(db, "gift_requests", requestId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return { ok: false, error: "Pedido não encontrado." };
    }
    const status = String(snap.data()?.status ?? "");
    if (
      status !== "awaiting_payment" &&
      status !== "pending_manual_review"
    ) {
      return {
        ok: false,
        error:
          "Só é possível confirmar pagamento em reserva ou em análise manual.",
      };
    }
    const patch: Record<string, unknown> = {
      status: "confirmed",
      locked: true,
      reservedUntil: null,
      updatedAt: serverTimestamp(),
    };
    if (status === "awaiting_payment") {
      patch.paymentDeclaredAt = serverTimestamp();
    }
    await updateDoc(ref, patch);
    return { ok: true, id: requestId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao confirmar pagamento.";
    return { ok: false, error: msg };
  }
}

/**
 * Admin: cancela reserva / pedido em análise e libera o presente na lista pública.
 */
export async function adminCancelGiftReservation(
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
    const ref = doc(db, "gift_requests", requestId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return { ok: false, error: "Pedido não encontrado." };
    }
    const status = String(snap.data()?.status ?? "");
    if (
      status !== "awaiting_payment" &&
      status !== "pending_manual_review"
    ) {
      return {
        ok: false,
        error: "Só é possível cancelar reserva ou pagamento em análise.",
      };
    }
    await updateDoc(ref, {
      status: "canceled",
      locked: false,
      reservedUntil: null,
      updatedAt: serverTimestamp(),
    });
    return { ok: true, id: requestId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao cancelar reserva.";
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
