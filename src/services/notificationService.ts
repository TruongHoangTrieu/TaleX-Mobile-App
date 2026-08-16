import { BASE_URL } from "@/config";
import { authFetch } from "@/services/auth";
import type {
  NotificationListParams,
  NotificationPageData,
} from "@/types/notification";

interface NotificationApiEnvelope<T> {
  code?: number;
  message?: string;
  data?: T;
  success?: boolean;
}

export type NotificationResult<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

type NotificationRequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

const notificationsUrl = (path: string) =>
  `${BASE_URL.replace(/\/$/, "")}/api/v1/notifications${path}`;

async function parseJson<T>(
  response: Response,
  url: string,
): Promise<NotificationApiEnvelope<T>> {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Invalid JSON response from ${url}`);
  }
}

async function requestForResult<T>(
  path: string,
  options: NotificationRequestOptions = {},
): Promise<NotificationResult<T>> {
  const url = notificationsUrl(path);

  try {
    const response = await authFetch(url, options);
    const payload = await parseJson<T>(response, url);

    if (!response.ok || (payload.code ?? 200) >= 400) {
      return {
        success: false,
        message:
          payload.message || `Request failed with status ${response.status}`,
      };
    }

    return {
      success: true,
      data: payload.data,
      message: payload.message,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Không thể kết nối máy chủ.",
    };
  }
}

function buildNotificationListQuery(params: NotificationListParams = {}) {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 20));

  if (params.createdAtFrom) query.set("createdAtFrom", params.createdAtFrom);
  if (params.createdAtTo) query.set("createdAtTo", params.createdAtTo);
  if (params.updatedAtFrom) query.set("updatedAtFrom", params.updatedAtFrom);
  if (params.updatedAtTo) query.set("updatedAtTo", params.updatedAtTo);

  return query.toString();
}

export function getMyNotifications(
  params: NotificationListParams = {},
): Promise<NotificationResult<NotificationPageData>> {
  return requestForResult<NotificationPageData>(
    `/my-notifications?${buildNotificationListQuery(params)}`,
    { method: "GET" },
  );
}

export function getUnreadNotificationCount(): Promise<
  NotificationResult<number>
> {
  return requestForResult<number>("/unread-count", { method: "GET" });
}

export function markNotificationRead(
  notificationId: string,
): Promise<NotificationResult<null>> {
  return requestForResult<null>(
    `/${encodeURIComponent(notificationId)}/read`,
    { method: "PUT" },
  );
}

export function markAllNotificationsRead(): Promise<NotificationResult<null>> {
  return requestForResult<null>("/read-all", { method: "PUT" });
}
