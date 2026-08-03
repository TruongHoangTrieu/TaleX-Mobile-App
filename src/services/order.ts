import { BASE_URL } from "@/config";
import { authFetch } from "./auth";

export type OrderStatus =
  | "AWAITING_PAYMENT"
  | "COMPLETED"
  | "OUT_OF_TIME"
  | "CANCELLED";

export type ContentItemType = "EPISODE" | "COMBO";

export interface OrderResponseDto {
  orderId: string;
  paymentCode: string;
  qrUrl?: string | null;
  totalAmount: number;
  coinAmountUsed: number;
  fiatAmount: number;
  status: OrderStatus;
  expiresAt: string;
  comboOriginalPrice?: number;
  comboOwnedEpisodeCount?: number;
  comboTotalEpisodeCount?: number;
}

export interface OrderHistoryItemDto {
  orderId: string;
  itemType: string;
  itemTitle: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  invoiceUrl?: string;
}

export interface OrderHistoryPageData {
  content: OrderHistoryItemDto[];
  pageNumber?: number;
  pageSize?: number;
  totalElements?: number;
  totalPages?: number;
}

interface OrderApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

export type OrderResult<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

const orderUrl = (path: string) =>
  `${BASE_URL.replace(/\/$/, "")}/api/v1/orders${path}`;

const jsonHeaders = { "Content-Type": "application/json" };

async function postForResult<T>(
  path: string,
  body?: Record<string, unknown>,
): Promise<OrderResult<T>> {
  try {
    const response = await authFetch(orderUrl(path), {
      method: "POST",
      headers: jsonHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
    const payload = (await response.json()) as OrderApiEnvelope<T>;

    if (!response.ok || payload.code >= 400) {
      return {
        success: false,
        message: payload.message || `Request failed with status ${response.status}`,
      };
    }

    return { success: true, data: payload.data, message: payload.message };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Không thể kết nối máy chủ.",
    };
  }
}

export const createContentOrder = (
  itemId: string,
  itemType: ContentItemType,
  coinAmountToUse?: number,
): Promise<OrderResult<OrderResponseDto>> =>
  postForResult<OrderResponseDto>("/content", {
    itemId,
    itemType,
    ...(coinAmountToUse ? { coinAmountToUse } : {}),
  });

export const cancelOrder = (orderId: string): Promise<OrderResult<OrderResponseDto>> =>
  postForResult<OrderResponseDto>(`/${orderId}/cancel`);

export const confirmCoinPayment = (
  orderId: string,
): Promise<OrderResult<OrderResponseDto>> =>
  postForResult<OrderResponseDto>(`/${orderId}/confirm-coin-payment`);

export const getOrderHistory = async (
  page = 1,
  pageSize = 20,
): Promise<OrderResult<OrderHistoryPageData>> => {
  try {
    const response = await authFetch(
      orderUrl(`/history?page=${page}&pageSize=${pageSize}`),
      { method: "GET" },
    );
    const payload = (await response.json()) as OrderApiEnvelope<OrderHistoryPageData>;

    if (!response.ok || payload.code >= 400) {
      return {
        success: false,
        message: payload.message || `Request failed with status ${response.status}`,
      };
    }

    return { success: true, data: payload.data, message: payload.message };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Không thể tải lịch sử đơn hàng.",
    };
  }
};
