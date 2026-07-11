import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { GOOGLE_WEB_CLIENT_ID } from "@/config";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
  configured = true;
}

// Triggers the native Google Sign-In sheet and returns the ID token to send
// to the backend (`POST /api/auth/google`). Returns null if the user cancelled.
export async function signInWithGoogle(): Promise<string | null> {
  ensureConfigured();

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    return null;
  }

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error("Google không trả về idToken, vui lòng thử lại.");
  }

  return idToken;
}

export function isGoogleSignInCancelled(error: unknown): boolean {
  return (
    isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED
  );
}

export async function signOutGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    // ignore — user may not have an active Google session
  }
}
