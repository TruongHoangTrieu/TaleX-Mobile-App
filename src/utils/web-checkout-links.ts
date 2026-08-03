import { WEB_BASE_URL } from "@/config";
import type { ContentItemType } from "@/services/order";

const webUrl = (path: string) => `${WEB_BASE_URL.replace(/\/$/, "")}${path}`;

/**
 * Wraps a relative web path behind the SSO handoff route when a one-time
 * code is available, so the browser lands already logged in — falls back to
 * the plain URL (manual login on web) when `code` is null/undefined.
 */
const wrapWithSso = (relativePath: string, code?: string | null) =>
  code
    ? webUrl(`/api/internal/auth/sso?code=${code}&redirect=${encodeURIComponent(relativePath)}`)
    : webUrl(relativePath);

/** `/checkout?subscriptionId=...` when a plan is already selected, else the plan list `/premium`. */
export const buildPremiumWebUrl = (code?: string | null, subscriptionId?: string) =>
  wrapWithSso(
    subscriptionId ? `/checkout?subscriptionId=${subscriptionId}` : "/premium",
    code,
  );

interface ContentCheckoutParams {
  itemId: string;
  itemType: ContentItemType;
  title?: string;
  returnTo?: string;
}

/** `/checkout-content` — used when the Coin balance can't fully cover an Episode/Combo. */
export const buildContentCheckoutWebUrl = (
  { itemId, itemType, title, returnTo }: ContentCheckoutParams,
  code?: string | null,
) => {
  const params = new URLSearchParams({ itemId, itemType });
  if (title) params.set("title", title);
  if (returnTo) params.set("returnTo", returnTo);
  return wrapWithSso(`/checkout-content?${params.toString()}`, code);
};
