const PROD_BASE_PATH = "/site";

export function assetPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (process.env.NODE_ENV !== "production") return normalized;
  return `${PROD_BASE_PATH}${normalized}`;
}
