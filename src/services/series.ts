import { BASE_URL } from "@/config";
import { authFetch } from "@/services/auth";

export interface AnalyticData {
  likes?: number;
  views?: number;
  comments?: number;
  shares?: number;
  bookmarks?: number;
  watchTime?: number;
}

export function formatWatchTime(secondsOrMins?: number): string {
  if (secondsOrMins == null || secondsOrMins < 0) return "0s";
  if (secondsOrMins < 60) return `${secondsOrMins}s`;
  const mins = Math.floor(secondsOrMins / 60);
  const secs = secondsOrMins % 60;
  if (mins < 60) {
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}

export function formatAnalyticNumber(num?: any): string {
  if (num == null) return "0";
  if (typeof num === "string") {
    const trimmed = num.trim();
    if (/[kKmM]$/.test(trimmed)) return trimmed;
    const parsed = parseFloat(trimmed);
    if (isNaN(parsed) || parsed <= 0) return "0";
    num = parsed;
  }
  if (typeof num !== "number" || isNaN(num) || num <= 0) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString("vi-VN");
}

export interface SeriesItem {
  id?: string;
  seriesId?: string;
  title: string;
  thumbnailUrl?: string;
  coverUrl?: string;
  bannerUrl?: string;
  description?: string;
  category?: string;
  rating?: string;
  year?: string;
  ageRating?: string;
  translation?: string;
  regionAndGenre?: string;
  episodes?: any[];
  analyticData?: AnalyticData;
  averageRating?: number;
  [key: string]: any;
}

export interface SeriesResponse {
  code: number;
  message: string;
  data: {
    content: SeriesItem[];
    isFirst: boolean;
    isLast: boolean;
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
  };
}

export async function getPublicSeries(
  page = 1,
  pageSize = 20,
  contentType?: "VIDEO" | "COMIC" | "video" | "comic",
): Promise<SeriesResponse> {
  const normalizedType = contentType ? contentType.toUpperCase() : undefined;
  let url = `${BASE_URL.replace(/\/$/, "")}/api/v1/public/series?page=${page}&pageSize=${pageSize}`;
  if (normalizedType) {
    url = `${BASE_URL.replace(/\/$/, "")}/api/v1/public/series/search?contentType=${normalizedType}&page=${Math.max(0, page - 1)}&size=${pageSize}`;
  }
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch series: ${res.status}`);
  }

  return res.json();
}

export interface SeriesDetailResponse {
  code: number;
  message: string;
  data: SeriesItem;
}

export async function getPublicSeriesDetail(seriesId: string): Promise<SeriesDetailResponse> {
  const url = `${BASE_URL.replace(/\/$/, "")}/api/v1/public/series/${seriesId}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch series details: ${res.status}`);
  }

  return res.json();
}

export interface SeasonItem {
  seasonId: string;
  seriesId: string;
  seasonNumber: number;
  title: string;
  description?: string;
  status?: string;
  [key: string]: any;
}

export interface SeasonListResponse {
  code: number;
  message: string;
  data: SeasonItem[];
}


export interface EpisodeItem {
  episodeId: string;
  seasonId: string;
  episodeNumber: number;
  title: string;
  description?: string;
  thumbnail?: string;
  contentType?: string;
  status?: string;
  playbackUrl?: string;
  unlockType?: "FREE" | "PAID";
  priceVnd?: number;
  likes?: number;
  views?: number;
  publishedAt?: string;
  totalPage?: number | null;
  analyticData?: AnalyticData;
  averageRating?: number;
  [key: string]: any;
}

export interface EpisodeListResponse {
  code: number;
  message: string;
  data: EpisodeItem[];
}

export interface PlaybackItem {
  episodeId: string;
  mediaId: string;
  mediaType: string;
  playbackType: string;
  hlsUrl: string;
  playbackUrl: string;
  duration?: number;
  [key: string]: any;
}

export interface PlaybackResponse {
  code: number;
  message: string;
  data: PlaybackItem;
}

export async function getSeriesSeasons(seriesId: string): Promise<SeasonListResponse> {
  if (!seriesId) {
    return { code: 200, message: "OK", data: [] };
  }
  const url = `${BASE_URL.replace(/\/$/, "")}/api/v1/public/series/${seriesId}/seasons`;
  const res = await authFetch(url, {
    method: "GET",
    headers: {
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch seasons: ${res.status}`);
  }

  const text = await res.text();
  if (!text || !text.trim()) {
    return { code: 200, message: "OK", data: [] };
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn("getSeriesSeasons: Invalid JSON response:", text);
    return { code: 200, message: "OK", data: [] };
  }
}

export async function getSeasonEpisodes(seasonId: string): Promise<EpisodeListResponse> {
  if (!seasonId) {
    return { code: 200, message: "OK", data: [] };
  }
  const url = `${BASE_URL.replace(/\/$/, "")}/api/v1/public/seasons/${seasonId}/episodes`;
  const res = await authFetch(url, {
    method: "GET",
    headers: {
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch episodes: ${res.status}`);
  }

  const text = await res.text();
  if (!text || !text.trim()) {
    return { code: 200, message: "OK", data: [] };
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn("getSeasonEpisodes: Invalid JSON response:", text);
    return { code: 200, message: "OK", data: [] };
  }
}

export async function getEpisodePlayback(
  episodeId: string,
  viewerId?: string,
): Promise<PlaybackResponse> {
  let url = `${BASE_URL.replace(/\/$/, "")}/api/v1/public/episodes/${episodeId}/playback`;
  if (viewerId) {
    url += `?viewerId=${viewerId}`;
  }
  // authFetch so Authorization header is sent when available
  const res = await authFetch(url, {
    method: "GET",
    headers: {
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    const err: any = new Error(`Failed to fetch playback details: ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}


export async function getPublicEpisodeMedia(episodeId: string, viewerId?: string): Promise<any> {
  let endpoint = `/api/v1/public/episodes/${episodeId}/media`;
  if (viewerId) {
    endpoint += `?viewerId=${viewerId}`;
  }
  const url = `${BASE_URL.replace(/\/$/, "")}${endpoint}`;
  const res = await authFetch(url, {
    method: "GET",
    headers: {
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = `Failed to fetch public episode media: ${res.status}`;
    try {
      const json = JSON.parse(text);
      if (json.message) msg = json.message;
    } catch (e) {}
    const err: any = new Error(msg);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

export async function getPublicEpisodeDetail(episodeId: string): Promise<any> {
  if (!episodeId) {
    return { code: 400, message: "Missing episodeId", data: null };
  }
  const url = `${BASE_URL.replace(/\/$/, "")}/api/v1/public/episodes/${episodeId}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "*/*" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch episode detail: ${res.status}`);
  }

  const text = await res.text();
  if (!text || !text.trim()) {
    return { code: 200, message: "OK", data: null };
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn("getPublicEpisodeDetail: Invalid JSON response:", text);
    return { code: 200, message: "OK", data: null };
  }
}

// ─── Combo ─────────────────────────────────────────────────────────────────

export interface ComboEpisodeItem {
  episodeId: string;
  episodeNumber?: number;
  title?: string;
  seasonId?: string;
  seriesTitle?: string;
}

export interface ComboItem {
  comboId: string;
  title: string;
  description?: string;
  priceVnd: number;
  originalPriceVnd?: number;
  episodes?: ComboEpisodeItem[];
  [key: string]: any;
}

export interface ComboListResponse {
  code: number;
  message: string;
  data: ComboItem[];
}

export async function getPublicCombos(): Promise<ComboItem[]> {
  const url = `${BASE_URL.replace(/\/$/, "")}/api/v1/public/combos`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "*/*" },
    });
    if (!res.ok) return [];
    const json = await res.json();
    if (Array.isArray(json?.data?.content)) return json.data.content;
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.content)) return json.content;
    if (Array.isArray(json)) return json;
    return [];
  } catch {
    return [];
  }
}

// ─── Advanced Search Series (/api/v1/public/series/search) ────────────────

export type SearchSeriesSortBy =
  | "releasedupdatetime"
  | "averagerating"
  | "likes"
  | "views"
  | "watchtime"
  | string;

export interface SearchSeriesParams {
  search?: string;
  contentType?: "VIDEO" | "COMIC" | string;
  ageRatings?: string[];
  status?: string;
  categoryIds?: string[];
  tagIds?: string[];
  sortBy?: SearchSeriesSortBy;
  sortDirection?: "ASC" | "DESC" | "asc" | "desc" | string;
  page?: number;
  size?: number;
  sort?: string[];
}

export interface SearchSeriesItem {
  seriesId: string;
  accountId?: string;
  creatorId?: string;
  creatorName?: string;
  creatorAvatar?: string;
  totalCreatorFollowers?: number;
  title: string;
  description?: string;
  coverUrl?: string | null;
  bannerUrl?: string | null;
  contentType?: "VIDEO" | "COMIC" | string;
  ageRating?: string;
  language?: string;
  totalViews?: number;
  createdAt?: string;
  updatedAt?: string;
  averageRating?: number;
  releasedUpdateTime?: string;
  [key: string]: any;
}

export interface SearchSeriesResponse {
  code: number;
  message: string;
  data: {
    content: SearchSeriesItem[];
    isFirst?: boolean;
    isLast?: boolean;
    pageNumber?: number;
    pageSize?: number;
    totalElements?: number;
    totalPages?: number;
    [key: string]: any;
  };
}

export async function searchPublicSeries(
  params: SearchSeriesParams = {}
): Promise<SearchSeriesResponse> {
  const query = new URLSearchParams();

  if (params.search && params.search.trim()) {
    query.append("search", params.search.trim());
  }
  if (params.contentType) {
    query.append("contentType", params.contentType);
  }
  if (params.status) {
    query.append("status", params.status);
  }
  if (params.sortBy) {
    query.append("sortBy", params.sortBy);
  }
  if (params.sortDirection) {
    query.append("sortDirection", params.sortDirection);
  }

  query.append("page", (params.page ?? 0).toString());
  query.append("size", (params.size ?? 20).toString());

  if (params.categoryIds && Array.isArray(params.categoryIds)) {
    params.categoryIds.forEach((id) => {
      if (id) query.append("categoryIds", id);
    });
  }
  if (params.tagIds && Array.isArray(params.tagIds)) {
    params.tagIds.forEach((id) => {
      if (id) query.append("tagIds", id);
    });
  }
  if (params.ageRatings && Array.isArray(params.ageRatings)) {
    params.ageRatings.forEach((age) => {
      if (age) query.append("ageRatings", age);
    });
  }
  if (params.sort && Array.isArray(params.sort)) {
    params.sort.forEach((s) => {
      if (s) query.append("sort", s);
    });
  }

  const url = `${BASE_URL.replace(/\/$/, "")}/api/v1/public/series/search?${query.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to search public series: ${res.status}`);
  }

  return res.json();
}

