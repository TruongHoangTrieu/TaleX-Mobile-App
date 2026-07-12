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
import { getMissions, getWallet } from "@/services/rewardService";
import type { MissionData } from "@/types/reward";

type RewardContextType = {
  balance: number;
  missions: MissionData[];
  isLoading: boolean;
  refreshRewardData: (options?: { silent?: boolean }) => Promise<void>;
};

const RewardContext = createContext<RewardContextType | undefined>(undefined);

export function RewardProvider({ children }: React.PropsWithChildren) {
  const { isAuthenticated } = useAuth();
  const [balance, setBalance] = useState(0);
  const [missions, setMissions] = useState<MissionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const requestIdRef = useRef(0);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);

  const refreshRewardData = useCallback((options?: { silent?: boolean }) => {
    if (!isAuthenticated) {
      requestIdRef.current += 1;
      refreshPromiseRef.current = null;
      setBalance(0);
      setMissions([]);
      setIsLoading(false);
      return Promise.resolve();
    }

    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const requestId = ++requestIdRef.current;
    if (!options?.silent) setIsLoading(true);

    let refreshPromise!: Promise<void>;
    refreshPromise = (async () => {
      try {
        const [wallet, missionList] = await Promise.all([
          getWallet(),
          getMissions(),
        ]);
        if (requestId === requestIdRef.current) {
          setBalance(wallet.balance);
          setMissions(missionList);
        }
      } catch (error) {
        if (requestId === requestIdRef.current) {
          console.warn(
            "[RewardContext] Không thể tải dữ liệu phần thưởng:",
            error instanceof Error ? error.message : error,
          );
        }
      } finally {
        if (requestId === requestIdRef.current && !options?.silent) {
          setIsLoading(false);
        }
        if (refreshPromiseRef.current === refreshPromise) {
          refreshPromiseRef.current = null;
        }
      }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, [isAuthenticated]);

  useEffect(() => {
    void refreshRewardData();
  }, [refreshRewardData]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshRewardData({ silent: true });
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated, refreshRewardData]);

  return (
    <RewardContext.Provider
      value={{ balance, missions, isLoading, refreshRewardData }}
    >
      {children}
    </RewardContext.Provider>
  );
}

export function useReward() {
  const context = useContext(RewardContext);
  if (!context) {
    throw new Error("useReward must be used within RewardProvider");
  }
  return context;
}
