import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useReward } from "@/context/RewardContext";
import { sendOnlineHeartbeat } from "@/services/rewardService";

const HEARTBEAT_INTERVAL_MS = 60_000;

export function useHeartbeat() {
  const { isAuthenticated } = useAuth();
  const { missions, refreshRewardData } = useReward();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRequestingRef = useRef(false);

  const hasPendingOnlineMission = missions.some(
    (mission) =>
      mission.code.startsWith("ONLINE_") && !mission.isCompleted,
  );

  useEffect(() => {
    let appState: AppStateStatus = AppState.currentState;

    const stopHeartbeat = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const sendHeartbeat = async () => {
      if (isRequestingRef.current) return;
      isRequestingRef.current = true;

      try {
        await sendOnlineHeartbeat();
        await refreshRewardData({ silent: true });
      } catch (error) {
        console.warn(
          "[Heartbeat] Không thể cập nhật tiến độ nhiệm vụ:",
          error instanceof Error ? error.message : error,
        );
      } finally {
        isRequestingRef.current = false;
      }
    };

    const reconcileHeartbeat = () => {
      const shouldRun =
        appState === "active" &&
        isAuthenticated &&
        hasPendingOnlineMission;

      if (!shouldRun) {
        stopHeartbeat();
        return;
      }

      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => {
          void sendHeartbeat();
        }, HEARTBEAT_INTERVAL_MS);
      }
    };

    const subscription = AppState.addEventListener("change", (nextState) => {
      appState = nextState;
      reconcileHeartbeat();
    });

    reconcileHeartbeat();

    return () => {
      subscription.remove();
      stopHeartbeat();
    };
  }, [hasPendingOnlineMission, isAuthenticated, refreshRewardData]);
}
