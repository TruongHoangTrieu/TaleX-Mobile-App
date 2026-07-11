import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import Toast from "react-native-toast-message";
import {
  login as loginService,
  googleLogin as googleLoginService,
  getProfile as getProfileService,
  logout as logoutService,
  getAccessToken as getAccessTokenService,
  getRefreshToken as getRefreshTokenService,
} from "@/services/auth";

type User = {
  accountId?: string;
  username?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  hasPassword?: boolean;
  googleLinked?: boolean;
  coins?: number;
  roleName?: string;
  status?: string;
  createdAt?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<{ status: string; verificationToken?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  const loadFromToken = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessTokenService();
      const refreshToken = await getRefreshTokenService();
      if (!token && !refreshToken) {
        setUser(null);
        return;
      }

      const res = await getProfileService();
      if (res && res.success && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFromToken();
  }, [loadFromToken]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginService({ email, password });
      if (!res || !res.success) throw new Error(res?.message || "Login failed");
      // tokens are saved inside loginService
      Toast.show({ type: "success", text1: "Đăng nhập thành công" });
      await loadFromToken();
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Đăng nhập thất bại",
        text2: e instanceof Error ? e.message : String(e),
      });
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [loadFromToken]);

  // Returns status so the caller (LoginScreen) can branch: ACTIVE -> already
  // logged in here; ONBOARDING -> caller must navigate to collect phone/DOB.
  const loginWithGoogle = useCallback(async (idToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await googleLoginService(idToken);
      if (!res || !res.success || !res.data) {
        throw new Error(res?.message || "Đăng nhập Google thất bại");
      }

      if (res.data.status === "ACTIVE") {
        Toast.show({ type: "success", text1: "Đăng nhập thành công" });
        await loadFromToken();
      }

      return {
        status: res.data.status || "ACTIVE",
        verificationToken: res.data.verificationToken,
      };
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Đăng nhập Google thất bại",
        text2: e instanceof Error ? e.message : String(e),
      });
      setError(e instanceof Error ? e.message : String(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, [loadFromToken]);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await logoutService();
      setUser(null);
      Toast.show({ type: "success", text1: "Đăng xuất thành công" });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Đăng xuất thất bại",
        text2: e instanceof Error ? e.message : String(e),
      });
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await loadFromToken();
    } finally {
      setLoading(false);
    }
  }, [loadFromToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        login,
        loginWithGoogle,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;
