import { BASE_URL } from "@/config";

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

export async function getPublicSeries(page = 1, pageSize = 20): Promise<SeriesResponse> {
  const url = `${BASE_URL.replace(/\/$/, "")}/api/v1/public/series?page=${page}&pageSize=${pageSize}`;
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
  contentType?: string;
  status?: string;
  playbackUrl?: string;
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
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch playback details: ${res.status}`);
  }

  return res.json();
}
