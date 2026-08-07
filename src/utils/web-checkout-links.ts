import { WEB_BASE_URL } from "@/config";

const webUrl = (path: string) => `${WEB_BASE_URL.replace(/\/$/, "")}${path}`;

/** `/checkout?subscriptionId=...` when a plan is already selected, else the plan list `/premium`. */
export const buildPremiumWebUrl = (subscriptionId?: string) =>
  subscriptionId ? webUrl(`/checkout?subscriptionId=${subscriptionId}`) : webUrl("/premium");

/**
 * The episode's own content page — `/read/{id}` for comics, `/watch/{id}` for
 * video — where the user can browse and tap "Mua" themselves on the website.
 * Not a checkout URL: mobile only ever hands off to a content page, never
 * straight into a payment flow.
 */
export const buildEpisodeWebUrl = (episodeId: string, contentKind: "COMIC" | "VIDEO") =>
  webUrl(`/${contentKind === "COMIC" ? "read" : "watch"}/${episodeId}`);

/**
 * There's no standalone combo page on the website — combos are shown inside
 * the series detail page, so that's the closest "combo's own page".
 */
export const buildComboWebUrl = (seriesId: string) => webUrl(`/series/${seriesId}`);
