import React, { createContext, useContext, useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import {
  login as loginService,
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

  const loadFromToken = async () => {
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
  };

  useEffect(() => {
    loadFromToken();
  }, []);

  const login = async (email: string, password: string) => {
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
  };

  const logout = async () => {
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
  };

  const refreshProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      await loadFromToken();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        login,
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
