import { BASE_URL } from "@/config";
import { authFetch } from "@/services/auth";

type ApiEnvelope<T> = {
  code?: number | string;
  statusCode?: number | string;
  message?: string;
  data?: T;
  success?: boolean;
  timestamp?: string;
};

type ApiError = Error & {
  code?: number | string;
  status?: number;
  statusCode?: number | string;
  payload?: unknown;
};

export type CreatorIdentityStatus = string | number;
export type CreatorPaymentStatus = string | number;

export interface VerificationStatusDto {
  isCreatorVerified?: boolean;
  isTermsAccepted?: boolean;
  identityStatus?: CreatorIdentityStatus | null;
  taxId?: string | null;
  paymentStatus?: CreatorPaymentStatus | null;
  paymentProfileId?: string | null;
  termVersionId?: string | null;
  acceptedTermVersionId?: string | null;
  latestTermVersionId?: string | null;
  rejectionReason?: string | null;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface MonetizationTermVersionDto {
  id: string;
  version?: string;
  title?: string;
  content?: string;
  type?: string;
  isActive?: boolean;
  effectiveDate?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface PaymentProfileRequestDto {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isPrimary: boolean;
}

export interface PaymentProfileDto extends PaymentProfileRequestDto {
  id?: string;
  paymentProfileId?: string;
  creatorId?: string;
  status?: CreatorPaymentStatus;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface TermsLogDto {
  id?: string;
  accountId?: string;
  creatorId?: string;
  versionId: string;
  acceptedAt?: string;
  createdAt?: string;
  [key: string]: unknown;
}

const apiUrl = (path: string) => `${BASE_URL.replace(/\/$/, "")}${path}`;

function createApiError(
  message: string,
  status?: number,
  code?: number | string,
  statusCode?: number | string,
  payload?: unknown,
): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.code = code;
  error.statusCode = statusCode;
  error.payload = payload;
  return error;
}

async function parseApiResponse<T>(res: Response, url: string): Promise<T> {
  const text = await res.text();
  let json: ApiEnvelope<T> | T;

  try {
    json = text ? JSON.parse(text) : ({} as ApiEnvelope<T>);
  } catch {
    throw createApiError(`Invalid JSON response from ${url}`, res.status);
  }

  const envelope = json as ApiEnvelope<T>;
  const rawCode = envelope?.code ?? envelope?.statusCode;
  const code = Number(rawCode);

  if (!res.ok || (!Number.isNaN(code) && code >= 400)) {
    throw createApiError(
      envelope?.message || `Request failed with status ${res.status}`,
      res.status,
      rawCode,
      envelope?.statusCode,
      json,
    );
  }

  return envelope && "data" in envelope ? (envelope.data as T) : (json as T);
}

function isUnverifiedCreatorError(error: unknown) {
  const apiError = error as ApiError;
  const message = String(apiError?.message || "").toLowerCase();

  return (
    Number(apiError?.code) === 4003 ||
    Number(apiError?.statusCode) === 4003 ||
    apiError?.status === 403 ||
    apiError?.status === 404 ||
    message.includes("4003") ||
    message.includes("chưa hoàn tất") ||
    message.includes("chua hoan tat") ||
    message.includes("not verified")
  );
}

export async function getVerificationStatus(): Promise<VerificationStatusDto> {
  const url = apiUrl("/api/v1/creators/verification-status");

  try {
    const res = await authFetch(url, { method: "GET" });
    return await parseApiResponse<VerificationStatusDto>(res, url);
  } catch (error) {
    if (isUnverifiedCreatorError(error)) {
      return {
        isCreatorVerified: false,
        isTermsAccepted: false,
      };
    }

    throw error;
  }
}

export async function getActiveMonetizationTerm(
  type: string,
): Promise<MonetizationTermVersionDto> {
  const url = apiUrl(`/api/v1/terms-versions/active/${type}`);
  const res = await authFetch(url, { method: "GET" });
  return parseApiResponse<MonetizationTermVersionDto>(res, url);
}

export async function submitVerification(
  termVersionId: string,
): Promise<VerificationStatusDto> {
  const url = apiUrl("/api/v1/creators/verification");
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ termsId: termVersionId }),
  });
  return parseApiResponse<VerificationStatusDto>(res, url);
}

export async function acceptTerms(versionId: string): Promise<TermsLogDto> {
  const url = apiUrl("/api/v1/terms-logs");
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ versionId }),
  });
  return parseApiResponse<TermsLogDto>(res, url);
}

export async function updateTaxIdentity(
  taxId: string,
): Promise<VerificationStatusDto> {
  const url = apiUrl("/api/v1/creators/identities/tax");
  const res = await authFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taxId }),
  });
  return parseApiResponse<VerificationStatusDto>(res, url);
}

export async function createPaymentProfile(
  data: PaymentProfileRequestDto,
): Promise<PaymentProfileDto> {
  const url = apiUrl("/api/v1/payment-profiles");
  const res = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseApiResponse<PaymentProfileDto>(res, url);
}

export async function updatePaymentProfile(
  id: string,
  data: PaymentProfileRequestDto,
): Promise<PaymentProfileDto> {
  const url = apiUrl(`/api/v1/payment-profiles/${id}`);
  const res = await authFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return parseApiResponse<PaymentProfileDto>(res, url);
}

export async function cancelPaymentProfile(id: string): Promise<void> {
  const url = apiUrl(`/api/v1/payment-profiles/${id}`);
  const res = await authFetch(url, { method: "DELETE" });
  return parseApiResponse<void>(res, url);
}
