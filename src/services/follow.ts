import { BASE_URL } from "@/config";
import { authFetch } from "@/services/auth";

export interface AccountFollowInfoDto {
  accountId: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string | null;
  followedAt?: string;
  bio?: string;
}

export interface BaseSliceResponse<T> {
  content: T[];
  number: number;
  size: number;
  numberOfElements: number;
  totalElements?: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}


export interface ApiEnvelope<T = any> {
  code?: number;
  message?: string;
  data?: T;
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

// 1. POST /api/v1/follows - Theo dõi nhà sáng tạo
export async function followCreator(followedId: string): Promise<ApiEnvelope> {
  const url = apiUrl("/api/v1/follows");
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ followedId }),
  });
  const json = await parseJson<ApiEnvelope>(res, url);
  if (!res.ok) {
    throw new Error(json.message || `Follow failed (${res.status})`);
  }
  return json;
}

// 2. DELETE /api/v1/follows - Hủy theo dõi nhà sáng tạo
export async function unfollowCreator(followedId: string): Promise<ApiEnvelope> {
  const url = apiUrl("/api/v1/follows");
  const res = await authFetch(url, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ followedId }),
  });
  const json = await parseJson<ApiEnvelope>(res, url);
  if (!res.ok) {
    throw new Error(json.message || `Unfollow failed (${res.status})`);
  }
  return json;
}

// 3. GET /api/v1/follows/followed - Lấy danh sách creator đang theo dõi
export async function getFollowedCreators(
  page = 0,
  size = 250,
): Promise<BaseSliceResponse<AccountFollowInfoDto>> {
  const url = apiUrl(`/api/v1/follows/followed?page=${page}&size=${size}`);
  const res = await authFetch(url, { method: "GET" });
  const json = await parseJson<any>(res, url);
  if (!res.ok) {
    throw new Error(json.message || `Fetch followed creators failed (${res.status})`);
  }
  return json.data || json;
}

// 4. GET /api/v1/follows/followers - Lấy danh sách người theo dõi
export async function getFollowers(
  page = 0,
  size = 20,
  creatorId?: string,
): Promise<BaseSliceResponse<AccountFollowInfoDto>> {
  let endpoint = `/api/v1/follows/followers?page=${page}&size=${size}`;
  if (creatorId) {
    endpoint += `&creatorId=${creatorId}`;
  }
  const url = apiUrl(endpoint);
  const res = await authFetch(url, { method: "GET" });
  const json = await parseJson<any>(res, url);
  if (!res.ok) {
    throw new Error(json.message || `Fetch followers failed (${res.status})`);
  }
  return json.data || json;
}

// 5. GET /api/v1/creators/{creatorId} - Lấy chi tiết creator
export async function getCreatorDetail(creatorId: string): Promise<any> {
  const url = apiUrl(`/api/v1/creators/${creatorId}`);
  const res = await fetch(url, { method: "GET", headers: { Accept: "*/*" } });
  const json = await parseJson<any>(res, url);
  if (!res.ok) {
    throw new Error(json.message || `Fetch creator detail failed (${res.status})`);
  }
  return json.data || json;
}
