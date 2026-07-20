import { BASE_URL } from "@/config";
import { authFetch } from "@/services/auth";
import type { BaseSliceResponse, ApiEnvelope } from "./follow";

export interface LikedUser {
  accountId: string;
  username: string;
  avatarUrl?: string;
  likedAt?: string;
}

export interface AccountLikeResponse {
  episodeId: string;
  episodeTitle?: string;
  episodeNumber?: number;
  seriesTitle?: string;
  seriesCoverUrl?: string;
  likedAt?: string;
}

const apiUrl = (path: string) => `${BASE_URL.replace(/\/$/, "")}${path}`;

async function parseJson<T>(res: Response, url: string): Promise<T> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : ({} as T);
  } catch (e) {
    throw new Error(`Invalid JSON response from ${url}`);
  }
}

// 1. GET /api/v1/episodes/{episodeId}/likes - Lấy danh sách người đã thích
export async function getEpisodeLikes(
  episodeId: string,
  page = 0,
  size = 20,
): Promise<BaseSliceResponse<LikedUser>> {
  const url = apiUrl(`/api/v1/episodes/${episodeId}/likes?page=${page}&size=${size}`);
  const res = await fetch(url, { method: "GET", headers: { Accept: "*/*" } });
  const json = await parseJson<any>(res, url);
  if (!res.ok) {
    throw new Error(json.message || `Fetch episode likes failed (${res.status})`);
  }
  return json.data || json;
}

// 2. POST /api/v1/episodes/{episodeId}/likes - Thích tập phim/chương
export async function likeEpisode(episodeId: string): Promise<ApiEnvelope> {
  const url = apiUrl(`/api/v1/episodes/${episodeId}/likes`);
  const res = await authFetch(url, { method: "POST" });
  const json = await parseJson<ApiEnvelope>(res, url);
  if (!res.ok) {
    throw new Error(json.message || `Like episode failed (${res.status})`);
  }
  return json;
}

// 3. DELETE /api/v1/episodes/{episodeId}/likes - Bỏ thích tập phim/chương
export async function unlikeEpisode(episodeId: string): Promise<ApiEnvelope> {
  const url = apiUrl(`/api/v1/episodes/${episodeId}/likes`);
  const res = await authFetch(url, { method: "DELETE" });
  const json = await parseJson<ApiEnvelope>(res, url);
  if (!res.ok) {
    throw new Error(json.message || `Unlike episode failed (${res.status})`);
  }
  return json;
}

// 4. GET /api/v1/accounts/me/likes - Lấy danh sách tập phim/chương đã thích của user hiện tại
export async function getMyLikedEpisodes(
  page = 0,
  size = 200,
): Promise<BaseSliceResponse<AccountLikeResponse>> {
  const url = apiUrl(`/api/v1/accounts/me/likes?page=${page}&size=${size}`);
  const res = await authFetch(url, { method: "GET" });
  const json = await parseJson<any>(res, url);
  if (!res.ok) {
    throw new Error(json.message || `Fetch my liked episodes failed (${res.status})`);
  }
  return json.data || json;
}
