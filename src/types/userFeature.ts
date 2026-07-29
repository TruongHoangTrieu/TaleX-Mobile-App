export type OnboardingGender = "MALE" | "FEMALE" | "FEMAL" | "UNKNOWN";

export interface UserInteractions {
  totalClicks?: number;
  totalLikes?: number;
  totalBookmarks?: number;
  totalShares?: number;
  totalComments?: number;

  likeToClickRatio?: number;
  bookmarkToClickRatio?: number;
  shareToClickRatio?: number;
  commentToClickRatio?: number;

  clicksLast7d?: number;
  likesLast7d?: number;
  bookmarksLast7d?: number;
  sharesLast7d?: number;
  commentsLast7d?: number;

  likeToClickRatioLast7d?: number;
  bookmarkToClickRatioLast7d?: number;
  shareToClickRatioLast7d?: number;
  commentToClickRatioLast7d?: number;

  clicksLast24h?: number;
  likesLast24h?: number;
  bookmarksLast24h?: number;
  sharesLast24h?: number;
  commentsLast24h?: number;

  likeToClickRatioLast24h?: number;
  bookmarkToClickRatioLast24h?: number;
  shareToClickRatioLast24h?: number;
  commentToClickRatioLast24h?: number;
}

export interface UserDeepEngagement {
  totalWatchTime?: number;
  watchTimeLast24h?: number;
  watchTimeLast7d?: number;
}

export interface UserPreferences {
  genresClicksRaw?: Record<string, number>;
  genresWatchTimeRaw?: Record<string, number>;
  tagsClicksRaw?: Record<string, number>;
  tagsWatchTimeRaw?: Record<string, number>;

  preferredGenresByClicks?: Record<string, number>;
  preferredGenresByWatchTime?: Record<string, number>;
  preferredTagsByClicks?: Record<string, number>;
  preferredTagsByWatchTime?: Record<string, number>;

  preferredGenresByClicksLast7d?: Record<string, number>;
  preferredGenresByWatchTimeLast7d?: Record<string, number>;
  preferredTagsByClicksLast7d?: Record<string, number>;
  preferredTagsByWatchTimeLast7d?: Record<string, number>;

  preferredGenresByClicksLast24h?: Record<string, number>;
  preferredGenresByWatchTimeLast24h?: Record<string, number>;
  preferredTagsByClicksLast24h?: Record<string, number>;
  preferredTagsByWatchTimeLast24h?: Record<string, number>;
}

export interface UserFeatureProfile {
  accountId?: string;
  language?: string;
  gender?: OnboardingGender;
  age?: number;
  createdAt?: string;

  onboardingGenres?: string[];
  onboardingTags?: string[];
  onboardingMovieGenres?: string[];
  onboardingComicGenres?: string[];

  interactions?: UserInteractions;
  deepEngagement?: UserDeepEngagement;
  preferences?: UserPreferences;
}

export interface CreateUserFeatureRequest {
  gender: OnboardingGender;
  age: number;
  onboardingGenres: string[];
  onboardingTags: string[];
  onboardingMovieGenres?: string[];
  onboardingComicGenres?: string[];
}
