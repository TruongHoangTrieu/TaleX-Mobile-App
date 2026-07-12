import { Platform } from "react-native";
import { GOOGLE_WEB_CLIENT_ID } from "@/config";

let configured = false;

type GoogleSignInModule =
  typeof import("@react-native-google-signin/google-signin");

let googleSignInModule: GoogleSignInModule | null = null;

function getGoogleSignInModule(): GoogleSignInModule {
  if (googleSignInModule) return googleSignInModule;

  try {
    // Lazy require is intentional: Expo Go does not contain RNGoogleSignin.
    // Loading the package at module startup would crash the entire app before
    // React can render. A native development/production build still loads it.
    const loadedModule = require(
      "@react-native-google-signin/google-signin",
    ) as GoogleSignInModule;
    googleSignInModule = loadedModule;
    return loadedModule;
  } catch {
    throw new Error(
      "Đăng nhập Google không khả dụng trong Expo Go. Vui lòng dùng đăng nhập email hoặc chạy ứng dụng bằng development build.",
    );
  }
}

function ensureConfigured(module: GoogleSignInModule) {
  if (configured) return;
  module.GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
  });
  configured = true;
}

// Triggers the native Google Sign-In sheet and returns the ID token to send
// to the backend (`POST /api/auth/google`). Returns null if the user cancelled.
export async function signInWithGoogle(): Promise<string | null> {
  const module = getGoogleSignInModule();
  ensureConfigured(module);

  if (Platform.OS === "android") {
    await module.GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });
  }

  const response = await module.GoogleSignin.signIn();

  if (!module.isSuccessResponse(response)) {
    return null;
  }

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error("Google không trả về idToken, vui lòng thử lại.");
  }

  return idToken;
}

export function isGoogleSignInCancelled(error: unknown): boolean {
  // Do not attempt to load the package on the error path. When sign-in reached
  // the native SDK, the module is already cached and its platform-specific
  // cancellation code is available. In Expo Go the module remains null.
  return Boolean(
    googleSignInModule &&
      googleSignInModule.isErrorWithCode(error) &&
      error.code === googleSignInModule.statusCodes.SIGN_IN_CANCELLED,
  );
}

export async function signOutGoogle(): Promise<void> {
  try {
    const module = getGoogleSignInModule();
    await module.GoogleSignin.signOut();
  } catch {
    // Ignore when running in Expo Go or when no Google session is active.
  }
}
