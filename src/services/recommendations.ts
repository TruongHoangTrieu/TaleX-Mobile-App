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
