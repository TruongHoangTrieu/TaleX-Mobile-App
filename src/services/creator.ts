import { BASE_URL } from "@/config";
import { authFetch } from "@/services/auth";

type CreatorApiEnvelope<T> = {
  success?: boolean;
  code?: number | string;
  statusCode?: number | string;
  message?: string;
  data?: T;
  timestamp?: string;
};

export type CreatorApiError = Error & {
  code?: number | string;
  status?: number;
  payload?: unknown;
};

export interface CreatorTermsVersion {
  id: string;
  version?: string;
  title?: string;
  content?: string;
  type?: "CREATOR" | string;
  isActive?: boolean;
  effectiveDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatorAnalyticData {
  likes?: number;
  views?: number;
  comments?: number;
  shares?: number;
  bookmarks?: number;
  watchTime?: number;
}

export interface CreatorTierData {
  creatorTierId?: string;
  tierName?: string;
  tierLevel?: number;
  minFollowerRequired?: number;
  minViewsRequired?: number;
  minWatchTimeRequired?: number;
  premiumFundShareRatio?: number;
  directPurchaseShareRatio?: number;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OwnCreatorResponse {
  id?: string;
  creatorId?: string;
  accountId?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  status?: string;
  followerCount?: number;
  followToCount?: number;
  analyticData?: CreatorAnalyticData;
  creatorTier?: CreatorTierData;
  isAcceptedLatestTerms: boolean;
  termsVersion?: CreatorTermsVersion | null;
  latestTermsVersionId?: string;
  acceptedTermsVersionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterCreatorResponse {
  id?: string;
  creatorId?: string;
  accountId?: string;
  status?: string;
  termsId?: string;
  isAcceptedLatestTerms?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TermsLogResponse {
  id?: string;
  accountId?: string;
  creatorId?: string;
  versionId: string;
  acceptedAt?: string;
  createdAt?: string;
}

export interface CreatorAnalyticData {
  views?: number;
  likes?: number;
  comments?: number;
  bookmarks?: number;
  shares?: number;
  watchTime?: number;
}

export interface CreatorLogItem {
  id?: string;
  hourBucket?: string;
  creatorId?: string;
  follows?: number;
  analyticData?: CreatorAnalyticData;
}

export interface CreatorSeriesResponseItem {
  seriesId: string;
  title: string;
  contentType?: "COMIC" | "VIDEO";
  status?: string;
  coverUrl?: string;
  totalViews?: number;
  totalSubscriptions?: number;
  createdAt?: string;
}

export interface CreatorSeriesListResponse {
  content?: CreatorSeriesResponseItem[];
  items?: CreatorSeriesResponseItem[];
  totalElements?: number;
  totalPages?: number;
}

export interface CoinWalletResponse {
  balance?: number;
  totalEarned?: number;
  totalSpent?: number;
}

const apiUrl = (path: string) => `${BASE_URL.replace(/\/$/, "")}${path}`;

const createApiError = (
  message: string,
  code?: number | string,
  status?: number,
  payload?: unknown,
): CreatorApiError => {
  const error = new Error(message) as CreatorApiError;
  error.code = code;
  error.status = status;
  error.payload = payload;
  return error;
};

const normalizeCode = (value?: number | string) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

async function parseCreatorResponse<T>(res: Response, url: string): Promise<T> {
  const text = await res.text();
  let json: CreatorApiEnvelope<T> | T;

  try {
    json = text ? JSON.parse(text) : ({} as CreatorApiEnvelope<T>);
  } catch {
    throw createApiError(
      `Invalid JSON response from ${url}`,
      undefined,
      res.status,
      text,
    );
  }

  const envelope = json as CreatorApiEnvelope<T>;
  const code = normalizeCode(envelope?.code ?? envelope?.statusCode);

  if (res.status === 4041 || code === 4041) {
    throw createApiError(
      envelope?.message || "Creator profile not found",
      4041,
      res.status,
      json,
    );
  }

  if (!res.ok) {
    throw createApiError(
      envelope?.message || `Request failed with status ${res.status}`,
      code,
      res.status,
      json,
    );
  }

  return envelope && "data" in envelope ? (envelope.data as T) : (json as T);
}

// 1. GET /api/v1/creators/own
export async function getOwnCreator(): Promise<OwnCreatorResponse> {
  const url = apiUrl("/api/v1/creators/own");
  const res = await authFetch(url, { method: "GET" });
  return parseCreatorResponse<OwnCreatorResponse>(res, url);
}

// 2. GET /api/v1/creators/logs?from=...&to=...
export async function getCreatorLogs(params?: { from?: string; to?: string }): Promise<CreatorLogItem[]> {
  try {
    let query = "";
    if (params?.from || params?.to) {
      const qp = new URLSearchParams();
      if (params.from) qp.append("from", params.from);
      if (params.to) qp.append("to", params.to);
      query = `?${qp.toString()}`;
    }
    const url = apiUrl(`/api/v1/creators/logs${query}`);
    const res = await authFetch(url, { method: "GET" });
    const data = await parseCreatorResponse<CreatorLogItem[]>(res, url);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// 3. GET /api/v1/series/by-creator?page=...&size=...
export async function listSeriesByCreator(page: number = 0, size: number = 100): Promise<CreatorSeriesListResponse> {
  try {
    const url = apiUrl(`/api/v1/series/by-creator?page=${page}&size=${size}`);
    const res = await authFetch(url, { method: "GET" });
    return await parseCreatorResponse<CreatorSeriesListResponse>(res, url);
  } catch {
    return { content: [] };
  }
}

// 4. GET /api/v1/series/follows/creator/followers
export async function getCreatorFollowersCount(): Promise<number> {
  try {
    const url = apiUrl("/api/v1/series/follows/creator/followers");
    const res = await authFetch(url, { method: "GET" });
    const data = await parseCreatorResponse<any>(res, url);
    if (typeof data === "number") return data;
    if (typeof data?.totalElements === "number") return data.totalElements;
    if (typeof data?.numberOfElements === "number") return data.numberOfElements;
    if (Array.isArray(data?.content)) return data.content.length;
    if (Array.isArray(data)) return data.length;
    return 0;
  } catch {
    return 0;
  }
}

// 5. GET /api/v1/coins/wallet
export async function getCoinWallet(): Promise<CoinWalletResponse> {
  try {
    const url = apiUrl("/api/v1/coins/wallet");
    const res = await authFetch(url, { method: "GET" });
    return await parseCreatorResponse<CoinWalletResponse>(res, url);
  } catch {
    return { balance: 0, totalEarned: 0, totalSpent: 0 };
  }
}

export async function getActiveCreatorTerms(): Promise<CreatorTermsVersion> {
  const url = apiUrl("/api/v1/terms-versions/active/CREATOR");
  const res = await authFetch(url, { method: "GET" });
  return parseCreatorResponse<CreatorTermsVersion>(res, url);
}

export async function registerCreator(termsId: string): Promise<RegisterCreatorResponse> {
  const url = apiUrl("/api/v1/creators");
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ termsId }),
  });
  return parseCreatorResponse<RegisterCreatorResponse>(res, url);
}

export async function acceptNewTerms(versionId: string): Promise<TermsLogResponse> {
  const url = apiUrl("/api/v1/terms-logs");
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ versionId }),
  });
  return parseCreatorResponse<TermsLogResponse>(res, url);
}

export interface NextCreatorTierData {
  tierId?: string;
  tierName: string;
  tierLevel: number;
  minFollowerRequired: number;
  minViewsRequired: number;
  minWatchTimeRequired: number;
  premiumFundShareRatio: number;
  directPurchaseShareRatio: number;
  isDefault?: boolean;
}

export async function getNextCreatorTier(currentTierLevel = 0): Promise<NextCreatorTierData | null> {
  const baseUrlClean = BASE_URL.replace(/\/$/, "");
  const url = `${baseUrlClean}/api/v1/creator-tiers/next?currentTierLevel=${currentTierLevel}`;

  try {
    const res = await authFetch(url, {
      method: "GET",
      headers: {
        Accept: "*/*",
      },
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return json?.data ?? null;
  } catch (err) {
    console.log("Error fetching next creator tier:", err);
    return null;
  }
}

export async function getCreatorTiers(): Promise<NextCreatorTierData[]> {
  const baseUrlClean = BASE_URL.replace(/\/$/, "");
  const url = `${baseUrlClean}/api/v1/creator-tiers?page=1&pageSize=50&sortBy=tierLevel&sortDirection=ASC`;

  try {
    const res = await authFetch(url, {
      method: "GET",
      headers: {
        Accept: "*/*",
      },
    });

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    return json?.data?.content || json?.data || [];
  } catch (err) {
    console.log("Error fetching creator tiers:", err);
    return [];
  }
}
