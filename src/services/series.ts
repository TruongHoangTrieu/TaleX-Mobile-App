import { BASE_URL } from "@/config";
import { authFetch } from "@/services/auth";

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
  let url = `${BASE_URL.replace(/\/$/, "")}/api/v1/public/series?page=${page}&pageSize=${pageSize}`;
  if (contentType) {
    url += `&contentType=${contentType}`;
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
  const url = `${BASE_URL.replace(/\/$/, "")}/api/v1/public/series/${seriesId}/seasons`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch seasons: ${res.status}`);
  }

  return res.json();
}
export async function getSeasonEpisodes(seasonId: string): Promise<EpisodeListResponse> {
  const url = `${BASE_URL.replace(/\/$/, "")}/api/v1/public/seasons/${seasonId}/episodes`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch episodes: ${res.status}`);
  }

  return res.json();
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
  const url = `${BASE_URL.replace(/\/$/, "")}/api/v1/public/episodes/${episodeId}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "*/*" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch episode detail: ${res.status}`);
  }

  return res.json();
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
    // Hỗ trợ cả dạng { data: [...] } và dạng mảng thẳng
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json)) return json;
    return [];
  } catch {
    return [];
  }
}
