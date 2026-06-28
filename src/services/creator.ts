import { BASE_URL } from "@/config";
import { authFetch } from "@/services/auth";

type CreatorApiEnvelope<T> = {
  success?: boolean;
  code?: number | string;
  statusCode?: number | string;
  message?: string;
  data?: T;
  timestamp?: string;
};

export type CreatorApiError = Error & {
  code?: number | string;
  status?: number;
  payload?: unknown;
};

export interface CreatorTermsVersion {
  id: string;
  version?: string;
  title?: string;
  content?: string;
  type?: "CREATOR" | string;
  isActive?: boolean;
  effectiveDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OwnCreatorResponse {
  id?: string;
  creatorId?: string;
  accountId?: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  status?: string;
  isAcceptedLatestTerms: boolean;
  termsVersion?: CreatorTermsVersion | null;
  latestTermsVersionId?: string;
  acceptedTermsVersionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RegisterCreatorResponse {
  id?: string;
  creatorId?: string;
  accountId?: string;
  status?: string;
  termsId?: string;
  isAcceptedLatestTerms?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TermsLogResponse {
  id?: string;
  accountId?: string;
  creatorId?: string;
  versionId: string;
  acceptedAt?: string;
  createdAt?: string;
}

const apiUrl = (path: string) => `${BASE_URL.replace(/\/$/, "")}${path}`;

const createApiError = (
  message: string,
  code?: number | string,
  status?: number,
  payload?: unknown,
): CreatorApiError => {
  const error = new Error(message) as CreatorApiError;
  error.code = code;
  error.status = status;
  error.payload = payload;
  return error;
};

const normalizeCode = (value?: number | string) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

async function parseCreatorResponse<T>(res: Response, url: string): Promise<T> {
  const text = await res.text();
  let json: CreatorApiEnvelope<T> | T;

  try {
    json = text ? JSON.parse(text) : ({} as CreatorApiEnvelope<T>);
  } catch {
    throw createApiError(
      `Invalid JSON response from ${url}`,
      undefined,
      res.status,
      text,
    );
  }

  const envelope = json as CreatorApiEnvelope<T>;
  const code = normalizeCode(envelope?.code ?? envelope?.statusCode);

  if (res.status === 4041 || code === 4041) {
    throw createApiError(
      envelope?.message || "Creator profile not found",
      4041,
      res.status,
      json,
    );
  }

  if (!res.ok) {
    throw createApiError(
      envelope?.message || `Request failed with status ${res.status}`,
      code,
      res.status,
      json,
    );
  }

  return envelope && "data" in envelope ? (envelope.data as T) : (json as T);
}

export async function getOwnCreator(): Promise<OwnCreatorResponse> {
  const url = apiUrl("/api/v1/creators/own");
  const res = await authFetch(url, {
    method: "GET",
  });

  return parseCreatorResponse<OwnCreatorResponse>(res, url);
}

export async function getActiveCreatorTerms(): Promise<CreatorTermsVersion> {
  const url = apiUrl("/api/v1/terms-versions/active/CREATOR");
  const res = await authFetch(url, {
    method: "GET",
  });

  return parseCreatorResponse<CreatorTermsVersion>(res, url);
}

export async function registerCreator(
  termsId: string,
): Promise<RegisterCreatorResponse> {
  const url = apiUrl("/api/v1/creators");
  const res = await authFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ termsId }),
  });

  return parseCreatorResponse<RegisterCreatorResponse>(res, url);
}

export async function acceptNewTerms(versionId: string): Promise<TermsLogResponse> {
  const url = apiUrl("/api/v1/terms-logs");
  const res = await authFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ versionId }),
  });

  return parseCreatorResponse<TermsLogResponse>(res, url);
}
