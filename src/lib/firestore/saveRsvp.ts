import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";

export type SaveRsvpInput = {
  fullName: string;
  attending: boolean;
  adults: number;
  children: number;
  message: string;
};

export type SaveResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function saveRsvp(input: SaveRsvpInput): Promise<SaveResult> {
  const db = getFirestoreDb();
  if (!db) {
    return {
      ok: false,
      error:
        "Firebase não configurado. Verifique as variáveis em .env.local.",
    };
  }

  try {
    const ref = await addDoc(collection(db, "rsvps"), {
      fullName: input.fullName.trim(),
      attending: input.attending,
      adults: input.adults,
      children: input.children,
      message: input.message.trim(),
      createdAt: serverTimestamp(),
    });
    return { ok: true, id: ref.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao enviar confirmação.";
    return { ok: false, error: msg };
  }
}
