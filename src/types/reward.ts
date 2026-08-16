export interface WalletData {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface CheckInStatus {
  isCheckedInToday: boolean;
  currentStreak: number;
}

export interface MissionData {
  missionId: string;
  code: string;
  title: string;
  description: string;
  rewardAmount: number;
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
}

export interface AdSessionData {
  sessionId: string;
  expiresInSeconds: number;
}

export interface AdCampaignData {
  campaignId: string;
  title: string;
  mediaUrl: string;
  targetUrl?: string;
  mediaType: "VIDEO" | "IMAGE" | string;
}

export interface BaseResponse<T> {
  success?: boolean;
  code?: number | string;
  statusCode?: number | string;
  message?: string;
  data?: T;
  timestamp?: string;
}
