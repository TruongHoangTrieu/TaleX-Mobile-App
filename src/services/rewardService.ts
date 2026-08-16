import { BASE_URL } from "@/config";
import { authFetch } from "@/services/auth";
import type {
  AdCampaignData,
  AdSessionData,
  BaseResponse,
  CheckInStatus,
  MissionData,
  WalletData,
} from "@/types/reward";

const apiUrl = (path: string) => `${BASE_URL.replace(/\/$/, "")}${path}`;

type RewardRequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

const WATCH_AD_MISSION_CODE = "WATCH_AD";
const MISSION_AD_SLOT_CODES = ["IN_VIDEO", "POPUP_OVERLAY"] as const;
const MISSION_AD_SOURCE = "MISSION";

export class RewardApiError extends Error {
  code?: number | string;
  status?: number;

  constructor(message: string, code?: number | string, status?: number) {
    super(message);
    this.name = "RewardApiError";
    this.code = code;
    this.status = status;
  }
}

async function parsePayload<T>(
  response: Response,
  url: string,
  options?: { requireData?: boolean },
): Promise<T | undefined> {
  const text = await response.text();
  let payload: BaseResponse<T>;

  try {
    payload = text ? JSON.parse(text) : ({} as BaseResponse<T>);
  } catch {
    throw new RewardApiError(
      `Invalid JSON response from ${url}`,
      undefined,
      response.status,
    );
  }

  const responseCode = Number(payload.code ?? payload.statusCode);
  const hasErrorCode = !Number.isNaN(responseCode) && responseCode >= 400;

  if (!response.ok || payload.success === false || hasErrorCode) {
    throw new RewardApiError(
      payload.message || `Request failed with HTTP ${response.status}`,
      payload.code ?? payload.statusCode,
      response.status,
    );
  }

  if (!("data" in payload)) {
    if (options?.requireData) {
      throw new RewardApiError(
        `Response from ${url} does not contain data`,
        undefined,
        response.status,
      );
    }
    return undefined;
  }

  return payload.data;
}

async function requestData<T>(
  path: string,
  options: RewardRequestOptions,
): Promise<T> {
  const url = apiUrl(path);

  try {
    const response = await authFetch(url, options);
    const data = await parsePayload<T>(response, url, { requireData: true });
    return data as T;
  } catch (error) {
    if (error instanceof RewardApiError) throw error;
    const message =
      error instanceof Error ? error.message : "Cannot connect to server";
    throw new RewardApiError(message);
  }
}

async function requestOptionalData<T>(
  path: string,
  options: RewardRequestOptions,
): Promise<T | undefined> {
  const url = apiUrl(path);

  try {
    const response = await authFetch(url, options);
    return await parsePayload<T>(response, url);
  } catch (error) {
    if (error instanceof RewardApiError) throw error;
    const message =
      error instanceof Error ? error.message : "Cannot connect to server";
    throw new RewardApiError(message);
  }
}

async function requestPublicData<T>(
  path: string,
  options: RewardRequestOptions,
): Promise<T> {
  const url = apiUrl(path);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "*/*",
        ...(options.headers || {}),
      },
    });
    const data = await parsePayload<T>(response, url, { requireData: true });
    return data as T;
  } catch (error) {
    if (error instanceof RewardApiError) throw error;
    const message =
      error instanceof Error ? error.message : "Cannot connect to server";
    throw new RewardApiError(message);
  }
}

async function requestPublicOptionalData<T>(
  path: string,
  options: RewardRequestOptions,
): Promise<T | undefined> {
  const url = apiUrl(path);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "*/*",
        ...(options.headers || {}),
      },
    });
    return await parsePayload<T>(response, url);
  } catch (error) {
    if (error instanceof RewardApiError) throw error;
    const message =
      error instanceof Error ? error.message : "Cannot connect to server";
    throw new RewardApiError(message);
  }
}

export function getWallet(): Promise<WalletData> {
  return requestData<WalletData>("/api/v1/coins/wallet", { method: "GET" });
}

export function getCheckInStatus(): Promise<CheckInStatus> {
  return requestData<CheckInStatus>("/api/v1/check-in/status", {
    method: "GET",
  });
}

export function performCheckIn(): Promise<CheckInStatus> {
  return requestData<CheckInStatus>("/api/v1/check-in", { method: "POST" });
}

export function getMissions(): Promise<MissionData[]> {
  return requestData<MissionData[]>("/api/v1/missions", { method: "GET" });
}

export function sendOnlineHeartbeat(): Promise<void> {
  return requestData<void>("/api/v1/missions/heartbeat", { method: "POST" });
}

export function startAdMissionSession(
  missionCode = WATCH_AD_MISSION_CODE,
): Promise<AdSessionData> {
  return requestData<AdSessionData>("/api/v1/missions/ads/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ missionCode }),
  });
}

export async function getMissionAds(): Promise<AdCampaignData[]> {
  let lastError: unknown;

  for (const slotCode of MISSION_AD_SLOT_CODES) {
    try {
      const ads = await requestPublicData<AdCampaignData[]>(
        `/api/v1/ads/serve/all?slotCode=${encodeURIComponent(slotCode)}`,
        { method: "GET" },
      );

      const videoAds = ads.filter(
        (ad) => ad.mediaUrl && ad.mediaType?.toUpperCase() === "VIDEO",
      );

      if (videoAds.length > 0) return videoAds;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) throw lastError;
  return [];
}

export async function trackMissionAdImpression(
  campaignId: string,
): Promise<void> {
  await requestPublicOptionalData<void>("/api/v1/ads/track/impression", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campaignId,
      source: MISSION_AD_SOURCE,
    }),
  });
}

export async function trackMissionAdClick(campaignId: string): Promise<void> {
  await requestPublicOptionalData<void>("/api/v1/ads/track/click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ campaignId }),
  });
}

export async function completeAdMissionSession(
  sessionId: string,
): Promise<void> {
  await requestOptionalData<void>("/api/v1/missions/ads/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
}
