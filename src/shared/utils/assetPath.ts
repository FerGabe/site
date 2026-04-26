const PROD_BASE_PATH = "/site";

export function assetPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (process.env.NODE_ENV !== "production") return normalized;
  return `${PROD_BASE_PATH}${normalized}`;
}

/** Remove prefixo `/site` de URLs exportadas, para normalizar antes de `assetPath`. */
export function normalizePublicAssetPath(path: string): string {
  const t = path.trim();
  if (!t) return "/";
  if (t.startsWith(`${PROD_BASE_PATH}/`)) {
    return t.slice(PROD_BASE_PATH.length);
  }
  if (t === PROD_BASE_PATH) return "/";
  return t.startsWith("/") ? t : `/${t}`;
}
