import { useEffect, useRef, useCallback } from "react";
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

export function useVideoPlaybackTracking(
  episodeId?: string,
  isPlaying = false,
  currentTime = 0,
  enabled = true,
) {
  const sessionIdRef = useRef<string>(generateSessionId());
  const hasSentViewRef = useRef<boolean>(false);
  const hasSentFirstEventRef = useRef<boolean>(false);
  const watchedAccumulatorRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(currentTime);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const currentTimeRef = useRef<number>(currentTime);
  const episodeIdRef = useRef<string | undefined>(episodeId);

  // Cập nhật refs mỗi khi state thay đổi
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    currentTimeRef.current = currentTime;
  }, [isPlaying, currentTime]);

  // Reset session khi đổi tập phim
  useEffect(() => {
    if (episodeId && episodeId !== episodeIdRef.current) {
      // Gửi sự kiện kết thúc của tập trước nếu có thời gian tích lũy
      if (episodeIdRef.current && watchedAccumulatorRef.current >= 1) {
        const remaining = Math.min(5, Math.max(1, watchedAccumulatorRef.current));
        void recordWatchProgress({
          event: "last_event",
          session_id: sessionIdRef.current,
          episode_id: episodeIdRef.current,
          current_position: currentTimeRef.current,
          heartbeat_value: remaining,
        });
      }

      sessionIdRef.current = generateSessionId();
      hasSentViewRef.current = false;
      hasSentFirstEventRef.current = false;
      watchedAccumulatorRef.current = 0;
      lastTimeRef.current = 0;
      episodeIdRef.current = episodeId;
    }
  }, [episodeId]);

  // Ghi nhận lượt xem khi bắt đầu phát video
  useEffect(() => {
    if (!enabled || !episodeId) return;

    if (isPlaying && !hasSentViewRef.current) {
      hasSentViewRef.current = true;
      void recordEpisodeView(episodeId, sessionIdRef.current);
    }
  }, [enabled, episodeId, isPlaying]);

  // Nhận tín hiệu timeUpdate từ player
  const onTimeUpdate = useCallback(
    (time: number) => {
      if (!enabled || !episodeIdRef.current || !isPlayingRef.current) {
        lastTimeRef.current = time;
        return;
      }

      const diff = time - lastTimeRef.current;
      lastTimeRef.current = time;
      currentTimeRef.current = time;

      // Chỉ tích lũy thời gian thực tế đang phát bình thường (tránh tua nhanh)
      if (diff > 0 && diff < 2.0) {
        watchedAccumulatorRef.current += diff;
      } else if (diff < 0) {
        // Người dùng tua ngược lại
        watchedAccumulatorRef.current = 0;
      }

      if (watchedAccumulatorRef.current >= HEARTBEAT_INTERVAL_SEC) {
        const eventType = hasSentFirstEventRef.current ? "heartbeat" : "first_event";
        hasSentFirstEventRef.current = true;

        const accumulated = Math.min(5, Math.max(1, watchedAccumulatorRef.current));
        watchedAccumulatorRef.current = 0;

        void recordWatchProgress({
          event: eventType,
          session_id: sessionIdRef.current,
          episode_id: episodeIdRef.current,
          current_position: time,
          heartbeat_value: accumulated,
        });
      }
    },
    [enabled],
  );

  // Gửi last_event khi chuyển tab, thoát app hoặc unmount
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState !== "active" && episodeIdRef.current && watchedAccumulatorRef.current >= 1) {
        const remaining = Math.min(5, Math.max(1, watchedAccumulatorRef.current));
        watchedAccumulatorRef.current = 0;
        void recordWatchProgress({
          event: "last_event",
          session_id: sessionIdRef.current,
          episode_id: episodeIdRef.current,
          current_position: currentTimeRef.current,
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
          current_position: currentTimeRef.current,
          heartbeat_value: remaining,
        });
      }
    };
  }, []);

  return { onTimeUpdate };
}
