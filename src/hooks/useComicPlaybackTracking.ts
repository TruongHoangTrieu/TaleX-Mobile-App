import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { recordEpisodeView, recordWatchProgress } from "@/services/watchSession";

function generateSessionId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15) +
    "-" +
    Date.now()
  );
}

const HEARTBEAT_INTERVAL_SEC = 5;

export function useComicPlaybackTracking(
  episodeId?: string,
  currentPage = 1,
  enabled = true,
) {
  const sessionIdRef = useRef<string>(generateSessionId());
  const hasSentViewRef = useRef<boolean>(false);
  const hasSentFirstEventRef = useRef<boolean>(false);
  const watchedAccumulatorRef = useRef<number>(0);
  const currentPageRef = useRef<number>(currentPage);
  const episodeIdRef = useRef<string | undefined>(episodeId);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Reset khi đổi chương truyện
  useEffect(() => {
    if (episodeId && episodeId !== episodeIdRef.current) {
      if (episodeIdRef.current && watchedAccumulatorRef.current >= 1) {
        const remaining = Math.min(5, Math.max(1, watchedAccumulatorRef.current));
        void recordWatchProgress({
          event: "last_event",
          session_id: sessionIdRef.current,
          episode_id: episodeIdRef.current,
          current_position: currentPageRef.current,
          heartbeat_value: remaining,
        });
      }

      sessionIdRef.current = generateSessionId();
      hasSentViewRef.current = false;
      hasSentFirstEventRef.current = false;
      watchedAccumulatorRef.current = 0;
      episodeIdRef.current = episodeId;
    }
  }, [episodeId]);

  // Ghi nhận lượt xem khi mở đọc truyện
  useEffect(() => {
    if (!enabled || !episodeId) return;

    if (!hasSentViewRef.current) {
      hasSentViewRef.current = true;
      void recordEpisodeView(episodeId, sessionIdRef.current);
    }
  }, [enabled, episodeId]);

  // Timer đếm giây đang đọc và gửi heartbeat
  useEffect(() => {
    if (!enabled || !episodeId) return;

    const intervalId = setInterval(() => {
      if (AppState.currentState !== "active") return;

      watchedAccumulatorRef.current += 1;

      if (watchedAccumulatorRef.current >= HEARTBEAT_INTERVAL_SEC) {
        const eventType = hasSentFirstEventRef.current ? "heartbeat" : "first_event";
        hasSentFirstEventRef.current = true;

        const accumulated = Math.min(5, Math.max(1, watchedAccumulatorRef.current));
        watchedAccumulatorRef.current = 0;

        void recordWatchProgress({
          event: eventType,
          session_id: sessionIdRef.current,
          episode_id: episodeId,
          current_position: currentPageRef.current,
          heartbeat_value: accumulated,
        });
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, episodeId]);

  // Gửi last_event khi thoát màn hình hoặc ẩn app
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState !== "active" && episodeIdRef.current && watchedAccumulatorRef.current >= 1) {
        const remaining = Math.min(5, Math.max(1, watchedAccumulatorRef.current));
        watchedAccumulatorRef.current = 0;
        void recordWatchProgress({
          event: "last_event",
          session_id: sessionIdRef.current,
          episode_id: episodeIdRef.current,
          current_position: currentPageRef.current,
          heartbeat_value: remaining,
        });
      }
    };

    const sub = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      sub.remove();
      if (episodeIdRef.current && watchedAccumulatorRef.current >= 1) {
        const remaining = Math.min(5, Math.max(1, watchedAccumulatorRef.current));
        watchedAccumulatorRef.current = 0;
        void recordWatchProgress({
          event: "last_event",
          session_id: sessionIdRef.current,
          episode_id: episodeIdRef.current,
          current_position: currentPageRef.current,
          heartbeat_value: remaining,
        });
      }
    };
  }, []);
}
