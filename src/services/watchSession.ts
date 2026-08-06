import { BASE_URL } from "@/config";
import { authFetch } from "@/services/auth";

export interface AnalyticData {
  likes: number;
  views: number;
  comments: number;
  shares: number;
  bookmarks: number;
  watchTime: number;
}

export interface WatchSessionEpisode {
  episodeId: string;
  seasonId: string;
  seriesId: string;
  creatorId: string;
  episodeNumber: number;
  title: string;
  description: string | null;
  thumbnail: string | null;
  contentType: "VIDEO" | "COMIC";
  status: string;
  scheduledPublishAt: string | null;
  publishedAt: string;
  unlockType: string;
  priceVnd: number;
  analyticData?: AnalyticData;
  totalPage: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  isDeleted: boolean;
}

export interface WatchSessionItem {
  id: string;
  episode: WatchSessionEpisode;
  watchDuration: number;
  heartbeatCount: number;
  startTime: string;
  endTime: string;
  currentPosition: number;
  updatedAt: string;
}

export interface BaseSliceResponse<T> {
  content: T[];
  number: number;
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

const apiUrl = (path: string) => `${BASE_URL.replace(/\/$/, "")}${path}`;

/**
 * GET /api/v1/watch-sessions/recent
 * Lấy danh sách các phiên xem gần đây nhất của tài khoản đăng nhập (phân trang dạng Slice).
 */
export async function getRecentWatchSessions(
  page = 0,
  size = 20,
  sort: string[] = []
): Promise<BaseSliceResponse<WatchSessionItem>> {
  let url = apiUrl(`/api/v1/watch-sessions/recent?page=${page}&size=${size}`);
  if (sort.length > 0) {
    url += `&sort=${sort.join(",")}`;
  }

  const res = await authFetch(url, {
    method: "GET",
    headers: {
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = `Failed to fetch recent watch sessions: ${res.status}`;
    try {
      const json = JSON.parse(text);
      if (json.message) msg = json.message;
    } catch {}
    throw new Error(msg);
  }

  const json = await res.json();
  const data = json.data !== undefined ? json.data : json;

  if (Array.isArray(data)) {
    return {
      content: data,
      number: page,
      size,
      numberOfElements: data.length,
      first: page === 0,
      last: true,
      empty: data.length === 0,
    };
  }

  return {
    content: data?.content || [],
    number: data?.number ?? page,
    size: data?.size ?? size,
    numberOfElements: data?.numberOfElements ?? (data?.content?.length || 0),
    first: data?.first ?? true,
    last: data?.last ?? true,
    empty: data?.empty ?? (!data?.content || data.content.length === 0),
  };
}

/**
 * Lấy vị trí xem gần nhất của một tập phim/truyện cụ thể
 */
export async function getEpisodeWatchPosition(episodeId: string): Promise<number | null> {
  try {
    const res = await getRecentWatchSessions(0, 50);
    const session = res.content.find((item) => item.episode?.episodeId === episodeId);
    return session ? session.currentPosition : null;
  } catch {
    return null;
  }
}
