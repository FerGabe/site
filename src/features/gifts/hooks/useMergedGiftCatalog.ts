"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { WEDDING_GIFTS } from "../data/gifts";
import type { GiftCategory, GiftItem } from "../types/gift";
import { getFirestoreDb } from "@/lib/firebase";
import { assetPath, normalizePublicAssetPath } from "@/shared/utils/assetPath";

const CATEGORIES: GiftCategory[] = [
  "lua-de-mel",
  "casa",
  "cozinha",
  "eletro",
  "contribuicao",
];

function isCategory(v: unknown): v is GiftCategory {
  return typeof v === "string" && CATEGORIES.includes(v as GiftCategory);
}

function mergeGift(base: GiftItem, raw: Record<string, unknown>): GiftItem {
  const next: GiftItem = { ...base };

  if (typeof raw.name === "string" && raw.name.trim()) {
    next.name = raw.name.trim();
  }
  if (typeof raw.openAmount === "boolean") {
    next.openAmount = raw.openAmount;
    if (raw.openAmount) {
      next.price = null;
    }
  }
  if (!next.openAmount) {
    if (raw.price === null) {
      next.price = null;
    } else if (typeof raw.price === "number" && Number.isFinite(raw.price)) {
      next.price = raw.price;
    }
  }
  if (typeof raw.image === "string" && raw.image.trim()) {
    next.image = assetPath(normalizePublicAssetPath(raw.image.trim()));
  }
  if (isCategory(raw.category)) {
    next.category = raw.category;
  }
  if (typeof raw.active === "boolean") {
    next.active = raw.active;
  }
  if (typeof raw.pixCode === "string") {
    next.pixCode = raw.pixCode.trim() || undefined;
  }
  if (typeof raw.cardPaymentLink === "string") {
    next.cardPaymentLink = raw.cardPaymentLink.trim() || undefined;
  }

  return next;
}

type MergedCatalogOptions = {
  /** When false, skips Firestore (e.g. admin login screen before auth). Default true. */
  enabled?: boolean;
};

export function useMergedGiftCatalog(options?: MergedCatalogOptions) {
  const enabled = options?.enabled !== false;

  const [overrides, setOverrides] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setOverrides({});
      setLoading(false);
      return;
    }

    const db = getFirestoreDb();
    if (!db) {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(
      collection(db, "gifts"),
      (snap) => {
        const next: Record<string, Record<string, unknown>> = {};
        snap.forEach((d) => {
          next[d.id] = d.data() as Record<string, unknown>;
        });
        setOverrides(next);
        setLoading(false);
      },
      () => {
        setOverrides({});
        setLoading(false);
      }
    );
    return () => unsub();
  }, [enabled]);

  const gifts = useMemo(() => {
    return WEDDING_GIFTS.map((base) => {
      const o = overrides[base.id];
      if (!o) return base;
      return mergeGift(base, o);
    });
  }, [overrides]);

  return { gifts, loading };
}
