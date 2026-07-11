export const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || "https://api.talex.pro.vn/";

// Web OAuth Client ID from Google Cloud Console — used as `webClientId` so
// GoogleSignin issues an ID token whose audience the backend can verify
// (backend checks aud against google.client-id.web).
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
