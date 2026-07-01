import { BASE_URL } from "../config";
import { authFetch } from "./auth";

export interface SubscriptionBenefit {
  key: "isAdBlocked" | "isMovieUnlocked" | "isStoryUnlocked";
  label: string;
  enabled: boolean;
}

export type SubscriptionDurationUnit = "DAYS" | "MONTHS" | "YEARS";

export interface SubscriptionPlan {
  subscriptionId: string;
  tier: string;
  description: string;
  price: number;
  duration: number;
  durationUnit: SubscriptionDurationUnit;
  isAdBlocked: boolean;
  isMovieUnlocked: boolean;
  isStoryUnlocked: boolean;
  totalPurchases: number;
}

export interface SubscriptionPageData {
  content: SubscriptionPlan[];
  pageNumber?: number;
  pageSize?: number;
  totalElements?: number;
  totalPages?: number;
}

export interface SubscriptionResponse {
  code: number;
  message: string;
  data: SubscriptionPageData;
}

export type GetSubscriptionsResult = {
  success: boolean;
  data?: SubscriptionPlan[];
  message?: string;
};

export const getSubscriptions = async (): Promise<GetSubscriptionsResult> => {
  const url = `${BASE_URL.replace(
    /\/$/,
    "",
  )}/api/v1/subscriptions?page=1&pageSize=20&sortBy=price&sortDirection=ASC`;

  try {
    const response = await authFetch(url, { method: "GET" });
    const payload = (await response.json()) as SubscriptionResponse;

    if (!response.ok || payload.code >= 400) {
      return {
        success: false,
        message: payload.message || `Request failed with status ${response.status}`,
      };
    }

    return {
      success: true,
      data: payload.data.content,
      message: payload.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách gói Premium.",
    };
  }
};
