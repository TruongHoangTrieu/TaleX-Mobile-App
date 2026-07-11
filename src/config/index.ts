export const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || "https://api.talex.pro.vn/";

// Web OAuth Client ID from Google Cloud Console — used as `webClientId` so
// GoogleSignin issues an ID token whose audience the backend can verify
// (backend checks aud against google.client-id.web). Not a secret — this ID
// is public and ships inside the app bundle regardless; the default here
// lets a fresh checkout run Google login with zero extra setup.
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  "944484409286-1be4pbdkiddo4eq795c38h14mla4jlhg.apps.googleusercontent.com";
