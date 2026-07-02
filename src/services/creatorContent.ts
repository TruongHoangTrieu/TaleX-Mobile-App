import { BASE_URL } from "@/config";
import { authFetch } from "@/services/auth";

type ApiEnvelope<T> = {
  success?: boolean;
  code?: number | string;
  statusCode?: number | string;
  message?: string;
  data?: T;
  timestamp?: string;
};

export type ContentType = "VIDEO" | "COMIC";
export type SeriesStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "DELETED" | "SCHEDULED";
export type Visibility = "PUBLIC" | "PRIVATE";
export type SeasonStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "DELETED" | "SCHEDULED";
export type EpisodeStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "DELETED" | "SCHEDULED";
export type ContentApprovalStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";
export type EpisodeUnlockType = "FREE" | "PAID";
export type MediaType = "VIDEO" | "IMAGE";
export type MediaStatus =
  | "PENDING"
  | "PROCESSING"
  | "HLS_PROCESSING"
  | "HLS_READY"
  | "ACTIVE"
  | "HIDDEN"
  | "INACTIVE"
  | "DELETED"
  | "FAILED";

export type CategoryResponse = {
  categoryId: string;
  categoryName: string;
};

export type TagResponse = {
  tagId: string;
  tagName: string;
};

export interface SeriesItem {
  seriesId: string;
  creatorId?: string;
  title: string;
  description?: string;
  coverUrl?: string;
  bannerUrl?: string;
  contentType: ContentType;
  status: SeriesStatus;
  visibility?: Visibility;
  categories?: CategoryResponse[];
  tags?: TagResponse[];
}

export interface SeasonItem {
  seasonId: string;
  seriesId: string;
  seasonNumber: number;
  title: string;
  description?: string;
  status: SeasonStatus;
}

export interface EpisodeItem {
  episodeId: string;
  seasonId: string;
  episodeNumber: number;
  title: string;
  description?: string;
  contentType: ContentType;
  status: EpisodeStatus;
  unlockType?: EpisodeUnlockType;
  priceVnd?: number;
}

export interface MediaResponse {
  mediaId: string;
  episodeId: string;
  mediaType: MediaType;
  mimeType: string;
  fileUrl?: string | null;
  status: MediaStatus;
  approvalStatus?: ContentApprovalStatus;
  errorMessage?: string;
}

export type SeriesRequest = {
  title: string;
  description?: string;
  coverUrl?: string;
  bannerUrl?: string;
  contentType: ContentType;
  visibility?: Visibility;
  ageRating?: string;
  language?: string;
  categoryIds?: string[];
  tagIds?: string[];
};

export type SeasonRequest = {
  seasonNumber: number;
  title: string;
  description?: string;
  status?: SeasonStatus;
};

export type EpisodeRequest = {
  episodeNumber: number;
  title: string;
  description?: string;
  contentType?: ContentType;
  status?: EpisodeStatus;
  unlockType?: EpisodeUnlockType;
  priceVnd?: number;
};

export type ImagePresignedUploadRequest = {
  fileName: string;
  mimeType: string;
  fileSize: number;
  imageContext: "cover" | "banner" | "comic-page" | "avatar";
  entityId?: string;
};

export type ImagePresignedUploadResponse = {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  bucket: string;
  region: string;
};

export type VideoUploadSessionRequest = {
  fileName: string;
  fileSize: number;
  mimeType: string;
  protectionType?: string;
};

export type VideoUploadSessionResponse = {
  uploadSessionId: string;
  mediaId: string;
  episodeId: string;
  provider: string;
  uploadUrl: string;
  publicId: string;
  fileSize: number;
  fileName: string;
  mimeType: string;
  status: string;
};

export type MediaUploadSessionResponse = {
  uploadSessionId: string;
  mediaId: string;
  episodeId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBytes: number;
  status: string;
  errorMessage?: string;
};

export type CopyrightViolation = {
  mediaCopyrightId: string;
  mediaId: string;
  sourceMediaId?: string;
  startTimeTarget?: number;
  endTimeTarget?: number;
  similarityScore?: number;
  violationType?: string;
  isValid?: boolean;
};

export type CensorshipResult = {
  censorshipId: string;
  mediaId: string;
  primaryViolationLabel?: string;
  confidenceScore?: number;
  status?: string;
};

export type MediaViolationsResponse = {
  mediaId: string;
  contentId?: string;
  copyrightViolations: CopyrightViolation[];
  censorshipResults: CensorshipResult[];
};

const apiUrl = (path: string) => `${BASE_URL.replace(/\/$/, "")}${path}`;

async function handleResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let json: ApiEnvelope<T>;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Phản hồi không hợp lệ từ server: ${res.status}`);
  }

  if (!res.ok) {
    throw new Error(json?.message || `Lỗi HTTP ${res.status}`);
  }

  // Handle wrap/unwrap based on standard envelope
  return json && "data" in json ? (json.data as T) : (json as any as T);
}

// -------------------------------------------------------------
// SERIES APIs
// -------------------------------------------------------------
export async function listSeriesByCreator(): Promise<SeriesItem[]> {
  const url = apiUrl("/api/v1/series/by-creator?page=1&pageSize=100");
  const res = await authFetch(url, { method: "GET" });
  const data = await handleResponse<{ content: SeriesItem[] }>(res);
  return data?.content || [];
}

export async function createSeries(request: SeriesRequest): Promise<SeriesItem> {
  const url = apiUrl("/api/v1/series");
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<SeriesItem>(res);
}

// -------------------------------------------------------------
// SEASON APIs
// -------------------------------------------------------------
export async function listSeasonsBySeries(seriesId: string): Promise<SeasonItem[]> {
  const url = apiUrl(`/api/v1/series/${seriesId}/seasons`);
  const res = await authFetch(url, { method: "GET" });
  return handleResponse<SeasonItem[]>(res);
}

export async function createSeason(seriesId: string, request: SeasonRequest): Promise<SeasonItem> {
  const url = apiUrl(`/api/v1/series/${seriesId}/seasons`);
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<SeasonItem>(res);
}

// -------------------------------------------------------------
// EPISODE APIs
// -------------------------------------------------------------
export async function createEpisode(seasonId: string, request: EpisodeRequest): Promise<EpisodeItem> {
  const url = apiUrl(`/api/v1/seasons/${seasonId}/episodes`);
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<EpisodeItem>(res);
}

export async function listMediaByEpisode(episodeId: string): Promise<MediaResponse[]> {
  const url = apiUrl(`/api/v1/episodes/${episodeId}/media`);
  const res = await authFetch(url, { method: "GET" });
  return handleResponse<MediaResponse[]>(res);
}

export async function publishEpisode(episodeId: string): Promise<EpisodeItem> {
  const url = apiUrl(`/api/v1/episodes/${episodeId}/publish`);
  const res = await authFetch(url, { method: "PATCH" });
  return handleResponse<EpisodeItem>(res);
}

// -------------------------------------------------------------
// S3 IMAGE UPLOAD APIs
// -------------------------------------------------------------
export async function getImagePresignedUpload(
  request: ImagePresignedUploadRequest,
): Promise<ImagePresignedUploadResponse> {
  const url = apiUrl("/api/v1/media/image/presigned-upload");
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<ImagePresignedUploadResponse>(res);
}

export async function uploadImageToS3(
  fileUri: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  imageContext: "cover" | "banner",
): Promise<string> {
  // 1. Get presigned upload URL
  const presigned = await getImagePresignedUpload({
    fileName,
    mimeType,
    fileSize,
    imageContext,
  });

  // 2. Fetch the local URI to a Blob
  const localRes = await fetch(fileUri);
  const blob = await localRes.blob();

  // 3. PUT the blob to S3 URL
  const s3Res = await fetch(presigned.uploadUrl, {
    method: "PUT",
    body: blob,
    headers: {
      "Content-Type": mimeType,
    },
  });

  if (!s3Res.ok) {
    throw new Error(`S3 upload failed: ${s3Res.status}`);
  }

  return presigned.publicUrl;
}

// -------------------------------------------------------------
// VIDEO UPLOAD APIs
// -------------------------------------------------------------
export async function createVideoUploadSession(
  episodeId: string,
  request: VideoUploadSessionRequest,
): Promise<VideoUploadSessionResponse> {
  const url = apiUrl(`/api/v1/episodes/${episodeId}/media/video/upload-session`);
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<VideoUploadSessionResponse>(res);
}

export async function getVideoUploadSession(uploadSessionId: string): Promise<MediaUploadSessionResponse> {
  const url = apiUrl(`/api/v1/media/upload-sessions/${uploadSessionId}`);
  const res = await authFetch(url, { method: "GET" });
  return handleResponse<MediaUploadSessionResponse>(res);
}

export async function updateVideoUploadProgress(
  uploadSessionId: string,
  uploadedBytes: number,
  status: string = "UPLOADING",
): Promise<MediaUploadSessionResponse> {
  const url = apiUrl(`/api/v1/media/upload-sessions/${uploadSessionId}/progress`);
  const res = await authFetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uploadedBytes, status }),
  });
  return handleResponse<MediaUploadSessionResponse>(res);
}

export async function completeVideoUpload(
  uploadSessionId: string,
  request: {
    publicId: string;
    secureUrl: string;
    bytes: number;
    duration?: number;
    width?: number;
    height?: number;
  },
): Promise<MediaResponse> {
  const url = apiUrl(`/api/v1/media/upload-sessions/${uploadSessionId}/complete`);
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleResponse<MediaResponse>(res);
}

// -------------------------------------------------------------
// VIOLATIONS / COPYRIGHT APIs
// -------------------------------------------------------------
export async function fetchMediaViolations(mediaId: string): Promise<MediaViolationsResponse> {
  const url = apiUrl(`/api/v1/media/${mediaId}/violations`);
  const res = await authFetch(url, { method: "GET" });
  return handleResponse<MediaViolationsResponse>(res);
}
