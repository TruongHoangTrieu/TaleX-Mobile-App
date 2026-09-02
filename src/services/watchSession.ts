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

export interface WatchProgressPayload {
  session_id: string;
  episode_id: string;
  current_position: number;
  heartbeat_value: number;
  event: "first_event" | "heartbeat" | "last_event";
}

/**
 * POST /api/v1/episodes/{episodeId}/views
 * Ghi nhận lượt xem và khởi tạo phiên xem
 */
export async function recordEpisodeView(episodeId: string, sessionId: string): Promise<any> {
  try {
    const res = await authFetch(apiUrl(`/api/v1/episodes/${episodeId}/views`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
      body: JSON.stringify({
        sessionId,
        episodeId,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("recordEpisodeView error:", err);
    return null;
  }
}

/**
 * POST /api/v1/episodes/watch-progress
 * Ghi nhận Heartbeat tiến trình xem phim / đọc truyện
 */
export async function recordWatchProgress(payload: WatchProgressPayload): Promise<any> {
  try {
    // heartbeat_value phải trong khoảng [1.0, 5.0] theo validation của server
    const clampedHeartbeat = Math.max(1.0, Math.min(5.0, Number(payload.heartbeat_value.toFixed(1))));
    const clampedPosition = Math.max(0, Number(payload.current_position.toFixed(2)));

    const res = await authFetch(apiUrl("/api/v1/episodes/watch-progress"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
      },
      body: JSON.stringify({
        session_id: payload.session_id,
        episode_id: payload.episode_id,
        current_position: clampedPosition,
        heartbeat_value: clampedHeartbeat,
        event: payload.event,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("recordWatchProgress error:", err);
    return null;
  }
}
