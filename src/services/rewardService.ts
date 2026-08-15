import { BASE_URL } from "@/config";
import { authFetch } from "@/services/auth";
import type {
  BaseResponse,
  CheckInStatus,
  MissionData,
  WalletData,
} from "@/types/reward";

const apiUrl = (path: string) => `${BASE_URL.replace(/\/$/, "")}${path}`;

type RewardRequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

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

async function parseData<T>(response: Response, url: string): Promise<T> {
  const text = await response.text();
  let payload: BaseResponse<T>;

  try {
    payload = text ? JSON.parse(text) : ({} as BaseResponse<T>);
  } catch {
    throw new RewardApiError(
      `Phản hồi không hợp lệ từ ${url}`,
      undefined,
      response.status,
    );
  }

  const responseCode = Number(payload.code ?? payload.statusCode);
  const hasErrorCode = !Number.isNaN(responseCode) && responseCode >= 400;

  if (!response.ok || payload.success === false || hasErrorCode) {
    throw new RewardApiError(
      payload.message || `Yêu cầu thất bại với mã HTTP ${response.status}`,
      payload.code ?? payload.statusCode,
      response.status,
    );
  }

  if (!("data" in payload)) {
    throw new RewardApiError(
      `Phản hồi từ ${url} không chứa trường data`,
      undefined,
      response.status,
    );
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
    return await parseData<T>(response, url);
  } catch (error) {
    if (error instanceof RewardApiError) throw error;
    const message =
      error instanceof Error ? error.message : "Không thể kết nối đến máy chủ";
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
