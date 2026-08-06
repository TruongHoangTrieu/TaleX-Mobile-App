import { BASE_URL } from "@/config";
import { authFetch } from "@/services/auth";

export interface RateSeriesRequest {
  seriesId: string;
  rate: number;
}

export interface SeriesRatingItem {
  ratingId: string;
  seriesId: string;
  accountId: string;
  accountName?: string;
  avatarUrl?: string;
  rate: number;
  updatedAt: string;
  createdAt: string;
  seriesTitle?: string;
  seriesCoverUrl?: string;
}

export interface SeriesRatingsListResponse {
  content?: SeriesRatingItem[];
  items?: SeriesRatingItem[];
  totalElements?: number;
  totalPages?: number;
}

const apiUrl = (path: string) => `${BASE_URL.replace(/\/$/, "")}${path}`;

/**
 * 1. POST /api/v1/series/{seriesId}/rate
 * Đánh giá hoặc Cập nhật điểm đánh giá cho Series (1 - 5 sao)
 */
export async function rateSeries(seriesId: string, rate: number): Promise<any> {
  const url = apiUrl(`/api/v1/series/${seriesId}/rate`);
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seriesId, rate }),
  });
  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : {};
    return json?.data ?? json;
  } catch {
    return text;
  }
}

/**
 * 2. DELETE /api/v1/series/{seriesId}/rate
 * Xóa đánh giá của tài khoản đối với Series
 */
export async function deleteSeriesRating(seriesId: string): Promise<any> {
  const url = apiUrl(`/api/v1/series/${seriesId}/rate`);
  const res = await authFetch(url, {
    method: "DELETE",
  });
  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : {};
    return json?.data ?? json;
  } catch {
    return text;
  }
}

/**
 * 3. GET /api/v1/series/{seriesId}/ratings
 * Lấy danh sách tất cả các lượt đánh giá của một Series cụ thể
 */
export async function getSeriesRatings(
  seriesId: string,
  page: number = 0,
  size: number = 10
): Promise<SeriesRatingsListResponse> {
  try {
    const url = apiUrl(
      `/api/v1/series/${seriesId}/ratings?page=${page}&size=${size}&sort=updatedAt,DESC`
    );
    const res = await authFetch(url, { method: "GET" });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    return json?.data ?? json;
  } catch {
    return { content: [] };
  }
}

/**
 * 4. GET /api/v1/ratings/me
 * Lấy danh sách tất cả các series mà tài khoản hiện tại đã đánh giá
 */
export async function getMyRatings(
  page: number = 0,
  size: number = 100
): Promise<SeriesRatingsListResponse> {
  try {
    const url = apiUrl(`/api/v1/ratings/me?page=${page}&size=${size}&sort=updatedAt,DESC`);
    const res = await authFetch(url, { method: "GET" });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    return json?.data ?? json;
  } catch {
    return { content: [] };
  }
}
