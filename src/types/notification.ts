export type NotificationType =
  | "REPORT_RESULT"
  | "PENALTY_WARNING"
  | "APPEAL_RESULT"
  | "SYSTEM_NOTICE"
  | "EPISODE_FORCE_HIDDEN"
  | "EPISODE_RESTORED"
  | "SUBSCRIPTION_PURCHASE_SUCCESS"
  | "COMBO_PURCHASE_SUCCESS"
  | "EPISODE_PURCHASE_SUCCESS"
  | string;

export type NotificationReferenceType =
  | "EPISODE"
  | "COMBO"
  | "PENALTY"
  | "APPEAL"
  | string;

export interface NotificationItem {
  notificationId: string;
  recipientId?: string | null;
  title: string;
  content: string;
  type: NotificationType;
  referenceType?: NotificationReferenceType | null;
  referenceId?: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface NotificationPageData {
  content: NotificationItem[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface NotificationListParams {
  page?: number;
  pageSize?: number;
  createdAtFrom?: string;
  createdAtTo?: string;
  updatedAtFrom?: string;
  updatedAtTo?: string;
}
