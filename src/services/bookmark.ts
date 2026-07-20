import { BASE_URL } from "@/config";
import { authFetch } from "@/services/auth";

export type BookmarkedUser = {
  accountId: string;
  username: string;
  avatarUrl?: string;
  bookmarkedAt?: string;
};

export type AccountBookmarkResponse = {
  episodeId: string;
  episodeTitle: string;
  episodeNumber?: number;
  seriesId?: string;
  seriesTitle?: string;
  seriesCoverUrl?: string;
  bookmarkedAt: string;
  contentType?: "VIDEO" | "COMIC";
};

export type BaseSliceResponse<T> = {
  content: T[];
  number: number;
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

const apiUrl = (path: string) => `${BASE_URL.replace(/\/$/, "")}${path}`;

export async function bookmarkEpisode(episodeId: string): Promise<any> {
  const url = apiUrl(`/api/v1/episodes/${episodeId}/bookmark`);
  const res = await authFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = `Failed to bookmark episode: ${res.status}`;
    try {
      const json = JSON.parse(text);
      if (json.message) msg = json.message;
    } catch (e) {}
    throw new Error(msg);
  }

  return res.json();
}

export async function unbookmarkEpisode(episodeId: string): Promise<any> {
  const url = apiUrl(`/api/v1/episodes/${episodeId}/bookmark`);
  const res = await authFetch(url, {
    method: "DELETE",
    headers: {
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    let msg = `Failed to unbookmark episode: ${res.status}`;
    try {
      const json = JSON.parse(text);
      if (json.message) msg = json.message;
    } catch (e) {}
    throw new Error(msg);
  }

  return res.json();
}

export async function getMyBookmarkedEpisodes(
  page = 0,
  size = 20,
): Promise<BaseSliceResponse<AccountBookmarkResponse>> {
  const url = apiUrl(`/api/v1/bookmarks/me?page=${page}&size=${size}&sort=createdAt,DESC`);
  const res = await authFetch(url, {
    method: "GET",
    headers: {
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch bookmarked episodes: ${res.status}`);
  }

  const json = await res.json();
  return json.data || json;
}

export async function getEpisodeBookmarks(
  episodeId: string,
  page = 0,
  size = 10,
): Promise<BaseSliceResponse<BookmarkedUser>> {
  const url = apiUrl(`/api/v1/episodes/${episodeId}/bookmarks?page=${page}&size=${size}&sort=createdAt,DESC`);
  const res = await authFetch(url, {
    method: "GET",
    headers: {
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch episode bookmarks: ${res.status}`);
  }

  const json = await res.json();
  return json.data || json;
}
