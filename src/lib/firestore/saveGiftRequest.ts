import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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

/**
 * Registra intenção de presente em `gift_requests`.
 * Status inicial `pending` para confirmação manual no futuro painel admin.
 */
export async function saveGiftRequest(
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
      status: "pending",
      createdAt: serverTimestamp(),
    });
    return { ok: true, id: ref.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao salvar.";
    return { ok: false, error: msg };
  }
}
