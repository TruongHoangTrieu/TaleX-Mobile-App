import { BASE_URL } from "@/config";
import { authFetch } from "@/services/auth";

export interface HomeFeedSeries {
  seriesId: string;
  accountId?: string;
  creatorId?: string;
  creatorName?: string;
  creatorAvatar?: string;
  totalCreatorFollowers?: number;
  title: string;
  description?: string;
  coverUrl?: string;
  bannerUrl?: string | null;
  contentType?: "COMIC" | "VIDEO" | string;
  ageRating?: string;
  language?: string;
  totalViews?: number;
  views?: number;
  analyticData?: any;
  createdAt?: string;
  updatedAt?: string;
  averageRating?: number;
  releasedUpdateTime?: string;
}

export interface HomeFeedData {
  promoted: HomeFeedSeries[];
  trending: HomeFeedSeries[];
  newReleases: HomeFeedSeries[];
  recentlyUpdated: HomeFeedSeries[];
  latestCommunityChoice: HomeFeedSeries[];
  communityChoice: HomeFeedSeries[];
  randomCategory: HomeFeedSeries[];
  accountSubscription: HomeFeedSeries[];
}

export interface HomeFeedResponse {
  code: number;
  message: string;
  data: HomeFeedData;
}

export interface HomeFeedParams {
  promotedLimit?: number;
  trendingLimit?: number;
  newReleasesLimit?: number;
  recentlyUpdatedLimit?: number;
  latestCommunityChoiceLimit?: number;
  communityChoiceLimit?: number;
  randomCategoryLimit?: number;
  subscriptionLimit?: number;
}

/**
 * Fetch home feed recommendations from 8 channels.
 * GET /api/v1/recommendations/home-feed
 */
export async function getHomeFeed(params: HomeFeedParams = {}): Promise<HomeFeedResponse> {
  const {
    promotedLimit = 3,
    trendingLimit = 10,
    newReleasesLimit = 8,
    recentlyUpdatedLimit = 6,
    latestCommunityChoiceLimit = 4,
    communityChoiceLimit = 10,
    randomCategoryLimit = 6,
    subscriptionLimit = 6,
  } = params;

  const queryParams = new URLSearchParams({
    promotedLimit: String(promotedLimit),
    trendingLimit: String(trendingLimit),
    newReleasesLimit: String(newReleasesLimit),
    recentlyUpdatedLimit: String(recentlyUpdatedLimit),
    latestCommunityChoiceLimit: String(latestCommunityChoiceLimit),
    communityChoiceLimit: String(communityChoiceLimit),
    randomCategoryLimit: String(randomCategoryLimit),
    subscriptionLimit: String(subscriptionLimit),
  });

  const baseUrlClean = BASE_URL.replace(/\/$/, "");
  const url = `${baseUrlClean}/api/v1/recommendations/home-feed?${queryParams.toString()}`;

  const res = await authFetch(url, {
    method: "GET",
    headers: {
      Accept: "*/*",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch home feed: ${res.status}`);
  }

  return res.json();
}

export interface RecommendationFeedParams {
  sessionId?: string;
  pageType?: "WATCH" | "MOVIES" | "COMICS" | "HOME" | string;
  limit?: number;
  offset?: number;
}

export function generateSessionId(prefix = "sess"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Fetch infinite recommendation feed for watch page or other pages.
 * GET /api/v1/recommendations/feed
 */
export async function getRecommendationFeed(
  params: RecommendationFeedParams = {}
): Promise<HomeFeedSeries[]> {
  const sessionId = params.sessionId || generateSessionId("sess_watch");
  const queryParams = new URLSearchParams({
    sessionId,
    pageType: params.pageType || "WATCH",
    limit: String(params.limit ?? 10),
    ...(params.offset !== undefined ? { offset: String(params.offset) } : {}),
  });

  const baseUrlClean = BASE_URL.replace(/\/$/, "");
  const url = `${baseUrlClean}/api/v1/recommendations/feed?${queryParams.toString()}`;

  try {
    const res = await authFetch(url, {
      method: "GET",
      headers: {
        Accept: "*/*",
      },
    });

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    const rawData = json?.data !== undefined ? json.data : json;
    if (Array.isArray(rawData)) return rawData;
    if (Array.isArray(rawData?.content)) return rawData.content;
    if (Array.isArray(rawData?.items)) return rawData.items;
    return [];
  } catch (err) {
    console.warn("getRecommendationFeed error:", err);
    return [];
  }
}

