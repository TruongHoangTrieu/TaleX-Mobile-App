import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { getUnreadNotificationCount } from "@/services/notificationService";

type NotificationContextType = {
  unreadCount: number;
  isLoadingUnread: boolean;
  refreshUnreadCount: (options?: { silent?: boolean }) => Promise<void>;
  decrementUnreadCount: () => void;
  clearUnreadCount: () => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({ children }: React.PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingUnread, setIsLoadingUnread] = useState(false);
  const requestIdRef = useRef(0);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  const refreshUnreadCount = useCallback(
    (options?: { silent?: boolean }) => {
      if (!isAuthenticated) {
        requestIdRef.current += 1;
        refreshPromiseRef.current = null;
        setUnreadCount(0);
        setIsLoadingUnread(false);
        return Promise.resolve();
      }

      if (refreshPromiseRef.current) return refreshPromiseRef.current;

      const requestId = ++requestIdRef.current;
      if (!options?.silent) setIsLoadingUnread(true);

      let refreshPromise!: Promise<void>;
      refreshPromise = (async () => {
        try {
          const result = await getUnreadNotificationCount();
          if (requestId === requestIdRef.current && result.success) {
            setUnreadCount(Math.max(0, Number(result.data || 0)));
          }
        } catch (error) {
          if (requestId === requestIdRef.current) {
            console.warn(
              "[NotificationContext] Không thể tải số thông báo chưa đọc:",
              error instanceof Error ? error.message : error,
            );
          }
        } finally {
          if (requestId === requestIdRef.current && !options?.silent) {
            setIsLoadingUnread(false);
          }
          if (refreshPromiseRef.current === refreshPromise) {
            refreshPromiseRef.current = null;
          }
        }
      })();

      refreshPromiseRef.current = refreshPromise;
      return refreshPromise;
    },
    [isAuthenticated],
  );

  const decrementUnreadCount = useCallback(() => {
    setUnreadCount((current) => Math.max(0, current - 1));
  }, []);

  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    // Refresh immediately when active
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshUnreadCount({ silent: true });
      }
    });

    // Auto poll every 20s while app is running
    const interval = setInterval(() => {
      if (AppState.currentState === "active") {
        void refreshUnreadCount({ silent: true });
      }
    }, 20000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [isAuthenticated, refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        isLoadingUnread,
        refreshUnreadCount,
        decrementUnreadCount,
        clearUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
