import type { GiftCategory } from "@/features/gifts/types/gift";

/** Mesmo contrato que `GiftCatalogUpsertInput` (evita import circular com `giftCatalog.ts`). */
export type GiftCatalogRestPatchInput = {
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
};

const WRITE_FIELD_PATHS = [
  "name",
  "price",
  "image",
  "category",
  "active",
  "purchased",
  "openAmount",
  "pixCode",
  "cardPaymentLink",
  "updatedAt",
] as const;

function projectIdOrThrow(): string {
  const id = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!id) {
    throw new Error(
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID em falta. Não é possível gravar no Firestore."
    );
  }
  return id;
}

function giftDocumentUrl(giftId: string): string {
  const pid = projectIdOrThrow();
  return `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/gifts/${encodeURIComponent(giftId)}`;
}

function encodeFirestoreValue(
  value: string | number | boolean | null
): Record<string, unknown> {
  if (value === null) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "number") {
    if (Number.isFinite(value)) return { doubleValue: value };
    return { nullValue: null };
  }
  return { stringValue: String(value) };
}

async function readFirestoreError(res: Response): Promise<string> {
  let msg = `HTTP ${res.status}`;
  try {
    const j = (await res.json()) as {
      error?: { message?: string; status?: string };
    };
    if (j.error?.message) msg = j.error.message;
  } catch {
    try {
      const t = await res.text();
      if (t) msg = t.slice(0, 500);
    } catch {
      /* ignore */
    }
  }
  return msg;
}

/**
 * Gravação via REST (HTTP) para contornar bugs/sessões WebChannel em que `setDoc`
 * nunca recebe ack do servidor, apesar do cache local mostrar dados pendentes.
 */
export async function patchGiftCatalogDocumentRest(
  idToken: string,
  input: GiftCatalogRestPatchInput
): Promise<void> {
  const mask = WRITE_FIELD_PATHS.map(
    (f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`
  ).join("&");
  const url = `${giftDocumentUrl(input.id)}?${mask}`;

  const fields: Record<string, Record<string, unknown>> = {
    name: encodeFirestoreValue(input.name.trim()),
    price:
      input.price === null || input.openAmount
        ? { nullValue: null }
        : encodeFirestoreValue(input.price),
    image: encodeFirestoreValue(input.image.trim()),
    category: encodeFirestoreValue(input.category),
    active: encodeFirestoreValue(input.active),
    purchased: encodeFirestoreValue(input.purchased),
    openAmount: encodeFirestoreValue(input.openAmount),
    pixCode: encodeFirestoreValue(input.pixCode.trim()),
    cardPaymentLink: encodeFirestoreValue(input.cardPaymentLink.trim()),
    updatedAt: { timestampValue: new Date().toISOString() },
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });
  } catch (e) {
    const net = e instanceof Error ? e.message : "rede";
    throw new Error(
      `Pedido REST ao Firestore falhou (${net}). Verifique ligação à Internet e bloqueadores.`
    );
  }

  if (!res.ok) {
    throw new Error(await readFirestoreError(res));
  }
}

export async function deleteGiftCatalogDocumentRest(
  idToken: string,
  giftId: string
): Promise<void> {
  const url = giftDocumentUrl(giftId);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${idToken}` },
    });
  } catch (e) {
    const net = e instanceof Error ? e.message : "rede";
    throw new Error(
      `Pedido REST ao Firestore falhou (${net}). Verifique ligação à Internet e bloqueadores.`
    );
  }

  if (res.status === 404) return;
  if (!res.ok) {
    throw new Error(await readFirestoreError(res));
  }
}
