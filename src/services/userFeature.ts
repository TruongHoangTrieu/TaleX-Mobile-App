import { BASE_URL } from "@/config";
import { authFetch } from "@/services/auth";
import {
  UserFeatureProfile,
  CreateUserFeatureRequest,
} from "@/types/userFeature";

const USER_FEATURE_ENDPOINT = "/api/v1/mongo/features/user";

export interface GetUserFeatureResult {
  data: UserFeatureProfile | null;
  isMissing: boolean;
}

/**
 * Fetch the user's feature & interaction profile from Mongo.
 * GET /api/v1/mongo/features/user
 * If response is 404, returns data: null and isMissing: true (user has not completed survey/onboarding).
 */
export async function getUserFeatureProfile(): Promise<GetUserFeatureResult> {
  const baseUrlClean = BASE_URL.replace(/\/$/, "");
  const url = `${baseUrlClean}${USER_FEATURE_ENDPOINT}`;

  try {
    const res = await authFetch(url, {
      method: "GET",
    });

    if (res.status === 404) {
      return { data: null, isMissing: true };
    }

    // Handle server errors (5xx) gracefully — don't crash the UI
    if (!res.ok) {
      const text2 = await res.text().catch(() => "");
      let json2: any = null;
      try { json2 = text2 ? JSON.parse(text2) : null; } catch {}
      const msg = json2?.message || `Lỗi server khi tải profile (${res.status})`;
      console.warn("[getUserFeatureProfile] Server error:", msg);
      return { data: null, isMissing: false };
    }

    const text = await res.text();
    let json: any;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (e) {
      return { data: null, isMissing: false };
    }

    // Unwrap data if response is in standard wrapper { success: true, data: { ... } }
    const payload = (json && typeof json === "object" && "data" in json && json.data) ? json.data : json;

    // Check if profile document is empty or lacks onboarding preferences
    const hasOnboardingData =
      Boolean(payload?.gender) ||
      (Array.isArray(payload?.onboardingGenres) && payload.onboardingGenres.length > 0) ||
      (Array.isArray(payload?.onboardingTags) && payload.onboardingTags.length > 0) ||
      (Array.isArray(payload?.onboardingMovieGenres) && payload.onboardingMovieGenres.length > 0);

    const isMissing = !payload || !hasOnboardingData;

    return { data: payload as UserFeatureProfile, isMissing };
  } catch (err: any) {
    console.warn("[getUserFeatureProfile] Network/timeout warning:", err?.message || err);
    return { data: null, isMissing: false };
  }
}

/**
 * Create or update the user's feature profile.
 * POST /api/v1/mongo/features/user
 */
export async function createUserFeatureProfile(
  payload: CreateUserFeatureRequest
): Promise<UserFeatureProfile> {
  const baseUrlClean = BASE_URL.replace(/\/$/, "");
  const url = `${baseUrlClean}${USER_FEATURE_ENDPOINT}`;

  const res = await authFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    throw new Error(`Invalid JSON response from ${url}`);
  }

  if (!res.ok) {
    const msg = json?.message || `Failed to create user features (status ${res.status})`;
    throw new Error(msg);
  }

  return json as UserFeatureProfile;
}

export interface PublicOption {
  id: string;
  name: string;
  description?: string;
}

/**
 * Fetch public onboarding categories.
 * GET /api/v1/public/categories
 */
export async function getPublicCategories(): Promise<PublicOption[]> {
  const baseUrlClean = BASE_URL.replace(/\/$/, "");
  const url = `${baseUrlClean}/api/v1/public/categories?page=1&pageSize=100`;

  try {
    const res = await fetch(url, { headers: { Accept: "*/*" } });
    if (!res.ok) return [];
    const json = await res.json();
    const payload = json?.data;
    const list: any[] = Array.isArray(payload) ? payload : (payload?.content || []);

    return list
      .map((item) => ({
        id: (item.categoryId || item.id || "").toString(),
        name: (item.categoryName || item.name || "").toString(),
        description: item.description,
      }))
      .filter((item) => Boolean(item.id && item.name));
  } catch (err) {
    console.error("[getPublicCategories] Error:", err);
    return [];
  }
}

/**
 * Fetch public onboarding tags.
 * GET /api/v1/public/tags
 */
export async function getPublicTags(): Promise<PublicOption[]> {
  const baseUrlClean = BASE_URL.replace(/\/$/, "");
  const url = `${baseUrlClean}/api/v1/public/tags?page=1&pageSize=100`;

  try {
    const res = await fetch(url, { headers: { Accept: "*/*" } });
    if (!res.ok) return [];
    const json = await res.json();
    const payload = json?.data;
    const list: any[] = Array.isArray(payload) ? payload : (payload?.content || []);

    return list
      .map((item) => ({
        id: (item.tagId || item.id || "").toString(),
        name: (item.tagName || item.name || "").toString(),
        description: item.description,
      }))
      .filter((item) => Boolean(item.id && item.name));
  } catch (err) {
    console.error("[getPublicTags] Error:", err);
    return [];
  }
}

