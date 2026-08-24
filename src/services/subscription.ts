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

export interface AccountSubscription {
  accountSubscriptionId: string;
  accountId: string;
  subscriptionId: string;
  startTime: string;
  endTime: string;
  updatedAt: string;
  cancelledAt: string | null;
  invoiceUrl?: string | null;
  isAdBlocked: boolean;
  isMovieUnlocked: boolean;
  isStoryUnlocked: boolean;
  isCancelled: boolean;
}

export const getActiveSubscription = async (): Promise<AccountSubscription | null> => {
  const url = `${BASE_URL.replace(
    /\/$/,
    "",
  )}/api/v1/account-subscriptions/own?page=1&pageSize=1&sortBy=endTime&sortDirection=DESC`;

  try {
    const response = await authFetch(url, { method: "GET" });
    if (!response.ok) return null;
    const payload = await response.json();
    const list = payload?.data?.content || payload?.data || [];
    const latest: AccountSubscription | undefined = list[0];
    if (!latest || latest.isCancelled) return null;
    const end = new Date(latest.endTime).getTime();
    if (end > Date.now()) {
      return latest;
    }
    return null;
  } catch {
    return null;
  }
};

export interface SubscriptionHistoryPageData {
  content: AccountSubscription[];
  pageNumber?: number;
  pageSize?: number;
  totalElements?: number;
  totalPages?: number;
}

export const getSubscriptionHistory = async (
  page = 1,
  pageSize = 20,
): Promise<{ success: boolean; data?: SubscriptionHistoryPageData; message?: string }> => {
  const url = `${BASE_URL.replace(
    /\/$/,
    "",
  )}/api/v1/account-subscriptions/own?page=${page}&pageSize=${pageSize}&sortBy=endTime&sortDirection=DESC`;

  try {
    const response = await authFetch(url, { method: "GET" });
    const payload = await response.json();
    if (!response.ok || (payload && payload.code >= 400)) {
      return {
        success: false,
        message: payload?.message || `Request failed with status ${response.status}`,
      };
    }

    const payloadData = payload?.data !== undefined ? payload.data : payload;
    const content = Array.isArray(payloadData)
      ? payloadData
      : Array.isArray(payloadData?.content)
      ? payloadData.content
      : [];

    return {
      success: true,
      data: {
        content,
        pageNumber: payloadData?.pageNumber ?? page,
        pageSize: payloadData?.pageSize ?? pageSize,
        totalElements: payloadData?.totalElements ?? content.length,
        totalPages: payloadData?.totalPages ?? 1,
      },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Không thể tải lịch sử Premium.",
    };
  }
};

