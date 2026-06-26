import { BASE_URL } from "@/config";
import * as SecureStore from "expo-secure-store";

type LoginRequest = {
  email: string;
  password: string;
};

type LoginResponse = {
  success: boolean;
  message?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
  timestamp?: string;
};

type RegisterRequest = {
  username: string;
  email: string;
  password: string;
  fullName: string;
  dateOfBirth: string;
  phone: string;
};

export type UpdateProfileRequest = {
  username: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  avatarUrl: string;
};

type VerifyEmailRequest = {
  verificationToken: string;
  otpCode: string;
};

type GenericResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  timestamp?: string;
};

type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

const ACCESS_TOKEN_KEY = "TALEX_ACCESS_TOKEN";
const REFRESH_TOKEN_KEY = "TALEX_REFRESH_TOKEN";

// In-memory cache to avoid async reads every time
const tokenStore: { accessToken: string | null; refreshToken: string | null } = {
  accessToken: null,
  refreshToken: null,
};

export async function setTokens(accessToken: string | null, refreshToken: string | null) {
  tokenStore.accessToken = accessToken;
  tokenStore.refreshToken = refreshToken;

  if (accessToken) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  } else {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  }

  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
}

export async function getAccessToken(): Promise<string | null> {
  if (tokenStore.accessToken) return tokenStore.accessToken;
  try {
    const t = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    tokenStore.accessToken = t;
    return t;
  } catch (e) {
    return null;
  }
}

export async function getRefreshToken(): Promise<string | null> {
  if (tokenStore.refreshToken) return tokenStore.refreshToken;
  try {
    const t = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    tokenStore.refreshToken = t;
    return t;
  } catch (e) {
    return null;
  }
}

export async function refreshToken(refreshTokenArg?: string): Promise<LoginResponse> {
  const url = `${BASE_URL.replace(/\/$/, "")}/api/auth/refresh-token`;
  const tokenToSend = refreshTokenArg || (await getRefreshToken());

  if (!tokenToSend) throw new Error("No refresh token available");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    body: JSON.stringify({ refreshToken: tokenToSend }),
  });

  const text = await res.text();
  let json: LoginResponse;
  try {
    json = text ? JSON.parse(text) : ({} as LoginResponse);
  } catch (e) {
    throw new Error(`Invalid JSON response from ${url}`);
  }

  if (!res.ok) {
    await clearTokens();
    const msg = json?.message || `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  // persist new tokens
  if (json?.data?.accessToken) {
    await setTokens(json.data.accessToken, json.data.refreshToken || null);
  }

  return json;
}

export async function clearTokens() {
  tokenStore.accessToken = null;
  tokenStore.refreshToken = null;
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

async function parseJsonResponse<T = any>(res: Response, url: string): Promise<T> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : ({} as T);
  } catch (e) {
    throw new Error(`Invalid JSON response from ${url}`);
  }
}

async function authFetch(url: string, options: RequestOptions = {}) {
  const buildOptions = async (token?: string | null): Promise<RequestInit> => {
    const headers: Record<string, string> = {
      Accept: "*/*",
      ...(options.headers || {}),
    };

    if (token) headers.Authorization = `Bearer ${token}`;

    return {
      ...options,
      headers,
    };
  };

  let accessToken = await getAccessToken();
  let res = await fetch(url, await buildOptions(accessToken));

  if (res.status !== 401) return res;

  try {
    const refreshRes = await refreshToken();
    accessToken = refreshRes.data?.accessToken || null;
  } catch (e) {
    await clearTokens();
    throw e;
  }

  if (!accessToken) {
    await clearTokens();
    throw new Error("Session expired. Please log in again.");
  }

  return fetch(url, await buildOptions(accessToken));
}

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const url = `${BASE_URL.replace(/\/$/, "")}/api/auth/login`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    body: JSON.stringify(req),
  });

  const text = await res.text();
  let json: LoginResponse;
  try {
    json = text ? JSON.parse(text) : ({} as LoginResponse);
  } catch (e) {
    throw new Error(`Invalid JSON response from ${url}`);
  }

  if (!res.ok) {
    const msg = json?.message || `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  // persist tokens securely
  if (json?.data?.accessToken) {
    await setTokens(json.data.accessToken, json.data.refreshToken || null);
  }

  return json;
}

export async function register(req: RegisterRequest): Promise<GenericResponse<string>> {
  const url = `${BASE_URL.replace(/\/$/, "")}/api/auth/register`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    body: JSON.stringify(req),
  });

  const text = await res.text();
  let json: GenericResponse<string>;
  try {
    json = text ? JSON.parse(text) : ({} as GenericResponse<string>);
  } catch (e) {
    throw new Error(`Invalid JSON response from ${url}`);
  }

  if (!res.ok) {
    const msg = json?.message || `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  return json;
}

export async function verifyEmail(req: VerifyEmailRequest): Promise<LoginResponse> {
  const url = `${BASE_URL.replace(/\/$/, "")}/api/auth/verify-email`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    body: JSON.stringify(req),
  });

  const text = await res.text();
  let json: LoginResponse;
  try {
    json = text ? JSON.parse(text) : ({} as LoginResponse);
  } catch (e) {
    throw new Error(`Invalid JSON response from ${url}`);
  }

  if (!res.ok) {
    const msg = json?.message || `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  if (json?.data?.accessToken) {
    await setTokens(json.data.accessToken, json.data.refreshToken || null);
  }

  return json;
}

export async function resendOtp(verificationToken: string): Promise<GenericResponse<string>> {
  const url = `${BASE_URL.replace(/\/$/, "")}/api/auth/resend-otp`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    body: JSON.stringify({ verificationToken }),
  });

  const text = await res.text();
  let json: GenericResponse<string>;
  try {
    json = text ? JSON.parse(text) : ({} as GenericResponse<string>);
  } catch (e) {
    throw new Error(`Invalid JSON response from ${url}`);
  }

  if (!res.ok) {
    const msg = json?.message || `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  return json;
}

export async function getProfile() {
  const url = `${BASE_URL.replace(/\/$/, "")}/api/auth/me`;

  const res = await authFetch(url, {
    method: "GET",
  });
  const json = await parseJsonResponse<any>(res, url);

  if (!res.ok) {
    const msg = json?.message || `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  return json;
}

export async function updateProfile(req: UpdateProfileRequest) {
  const url = `${BASE_URL.replace(/\/$/, "")}/api/auth/me`;
  const res = await authFetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(req),
  });
  const json = await parseJsonResponse<GenericResponse>(res, url);

  if (!res.ok) {
    const msg = json?.message || `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  return json;
}

// Logout API: revoke refresh token on server and clear local tokens
export async function logout(refreshToken?: string) {
  const url = `${BASE_URL.replace(/\/$/, "")}/api/auth/logout`;
  const tokenToSend = refreshToken || (await getRefreshToken());

  // Always attempt to call logout on server if we have a refresh token
  if (tokenToSend) {
    try {
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        body: JSON.stringify({ refreshToken: tokenToSend }),
      });
    } catch (e) {
      // ignore network errors here; we'll still clear local tokens
    }
  }

  // Clear local tokens regardless of server result
  await clearTokens();
}
