import { BASE_URL } from "@/config";
import { authFetch } from "@/services/auth";

export interface CommentDto {
  commentId: string;
  episodeId?: string;
  parentCommentId?: string | null;
  commentParentId?: string | null;
  accountId?: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string | null;
  content: string;
  repliesCount?: number;
  replyCount?: number;
  status?: "ACTIVE" | "HIDDEN" | "DELETED" | string;
  createdAt?: string | null;
  updatedAt?: string | null;
  isOwner?: boolean;
}

export interface CreateCommentPayload {
  content: string;
  episodeId: string;
  commentParentId?: string;
}

export interface BaseSliceResponse<T> {
  content: T[];
  isFirst?: boolean;
  isLast?: boolean;
  pageNumber?: number;
  pageSize?: number;
  totalElements?: number;
  totalPages?: number;
  numberOfElements?: number;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// Helper unwrap response
function unwrapResponse<T>(json: any): T {
  if (json && typeof json === "object" && "code" in json && "data" in json) {
    return json.data as T;
  }
  return json as T;
}

// 1. GET /api/v1/episodes/{episodeId}/comments - Lấy danh sách bình luận gốc
export async function getEpisodeComments(
  episodeId: string,
  page = 0,
  size = 10,
  sort = "createdAt,DESC"
): Promise<BaseSliceResponse<CommentDto>> {
  const cleanBase = BASE_URL.replace(/\/$/, "");
  const url = `${cleanBase}/api/v1/episodes/${episodeId}/comments?page=${page}&size=${size}&sort=${sort}`;
  
  const res = await authFetch(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Failed to fetch comments: ${res.status}`);
  }
  const json = await res.json();
  return unwrapResponse<BaseSliceResponse<CommentDto>>(json);
}

// 2. GET /api/v1/comments/{commentId}/replies - Lấy danh sách phản hồi
export async function getCommentReplies(
  commentId: string,
  page = 0,
  size = 10,
  sort = "createdAt,ASC"
): Promise<BaseSliceResponse<CommentDto>> {
  const cleanBase = BASE_URL.replace(/\/$/, "");
  const url = `${cleanBase}/api/v1/comments/${commentId}/replies?page=${page}&size=${size}&sort=${sort}`;
  
  const res = await authFetch(url, { method: "GET" });
  if (!res.ok) {
    throw new Error(`Failed to fetch replies: ${res.status}`);
  }
  const json = await res.json();
  return unwrapResponse<BaseSliceResponse<CommentDto>>(json);
}

// 3. POST /api/v1/comments - Tạo bình luận (gốc hoặc phản hồi)
export async function createComment(payload: CreateCommentPayload): Promise<any> {
  const cleanBase = BASE_URL.replace(/\/$/, "");
  const url = `${cleanBase}/api/v1/comments`;

  const res = await authFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || `Failed to create comment: ${res.status}`);
  }
  const json = await res.json();
  return unwrapResponse<any>(json);
}

// 4. PUT /api/v1/comments/{commentId} - Cập nhật bình luận
export async function updateComment(commentId: string, content: string): Promise<any> {
  const cleanBase = BASE_URL.replace(/\/$/, "");
  const url = `${cleanBase}/api/v1/comments/${commentId}`;

  const res = await authFetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || `Failed to update comment: ${res.status}`);
  }
  const json = await res.json();
  return unwrapResponse<any>(json);
}

// 5. DELETE /api/v1/comments/{commentId} - Xóa bình luận
export async function deleteComment(commentId: string): Promise<any> {
  const cleanBase = BASE_URL.replace(/\/$/, "");
  const url = `${cleanBase}/api/v1/comments/${commentId}`;

  const res = await authFetch(url, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || `Failed to delete comment: ${res.status}`);
  }
  const json = await res.json();
  return unwrapResponse<any>(json);
}

// 6. PATCH /api/v1/comments/{commentId} - Ẩn bình luận (ADMIN / STAFF)
export async function hideComment(commentId: string): Promise<any> {
  const cleanBase = BASE_URL.replace(/\/$/, "");
  const url = `${cleanBase}/api/v1/comments/${commentId}`;

  const res = await authFetch(url, {
    method: "PATCH",
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.message || `Failed to hide comment: ${res.status}`);
  }
  const json = await res.json();
  return unwrapResponse<any>(json);
}
