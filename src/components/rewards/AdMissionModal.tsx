import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";
import { useReward } from "@/context/RewardContext";
import {
  completeAdMissionSession,
  getMissionAds,
  startAdMissionSession,
  trackMissionAdClick,
  trackMissionAdImpression,
} from "@/services/rewardService";
import type { AdCampaignData, AdSessionData } from "@/types/reward";

type AdMissionStatus =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "completing"
  | "success"
  | "error";

type AdMissionModalProps = {
  visible: boolean;
  missionCode: string;
  rewardAmount?: number;
  onClose: () => void;
};

const REQUIRED_WATCH_SECONDS = 15;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.";

function pickRandomAd(ads: AdCampaignData[]) {
  if (ads.length === 0) return null;
  return ads[Math.floor(Math.random() * ads.length)] ?? ads[0];
}

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

export default function AdMissionModal({
  visible,
  missionCode,
  rewardAmount,
  onClose,
}: AdMissionModalProps) {
  const { refreshRewardData } = useReward();
  const [status, setStatus] = useState<AdMissionStatus>("idle");
  const [session, setSession] = useState<AdSessionData | null>(null);
  const [ad, setAd] = useState<AdCampaignData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [watchTargetSeconds, setWatchTargetSeconds] = useState(
    REQUIRED_WATCH_SECONDS,
  );
  const [watchedSeconds, setWatchedSeconds] = useState(0);

  const lifecycleIdRef = useRef(0);
  const hasTrackedClickRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const watchedSecondsRef = useRef(0);
  const refreshRewardDataRef = useRef(refreshRewardData);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    refreshRewardDataRef.current = refreshRewardData;
  }, [refreshRewardData]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const videoSource = useMemo(() => {
    if (!ad?.mediaUrl) return null;
    return { uri: ad.mediaUrl };
  }, [ad?.mediaUrl]);

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.25;
  });

  const resetState = useCallback(() => {
    setStatus("idle");
    setSession(null);
    setAd(null);
    setErrorMessage("");
    setWatchedSeconds(0);
    watchedSecondsRef.current = 0;
    setWatchTargetSeconds(REQUIRED_WATCH_SECONDS);
    hasTrackedClickRef.current = false;
    hasCompletedRef.current = false;
  }, []);

  const handleClose = useCallback(() => {
    lifecycleIdRef.current += 1;
    try {
      player.pause();
    } catch {}
    resetState();
    onCloseRef.current();
  }, [player, resetState]);

  const completeCurrentSession = useCallback(async () => {
    if (!session?.sessionId || hasCompletedRef.current) return;

    hasCompletedRef.current = true;
    setStatus("completing");

    try {
      try {
        player.pause();
      } catch {}

      await completeAdMissionSession(session.sessionId);
      if (ad?.campaignId) {
        trackMissionAdImpression(ad.campaignId).catch((error) => {
          console.warn("[AdMission] Impression tracking failed:", error);
        });
      }
      await refreshRewardDataRef.current();
      setStatus("success");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setStatus("error");
    }
  }, [ad?.campaignId, player, session?.sessionId]);

  const handleVideoPress = useCallback(() => {
    if (!ad?.targetUrl) return;

    if (ad.campaignId && !hasTrackedClickRef.current) {
      hasTrackedClickRef.current = true;
      trackMissionAdClick(ad.campaignId).catch((error) => {
        console.warn("[AdMission] Click tracking failed:", error);
      });
    }

    Linking.openURL(ad.targetUrl).catch((error) => {
      console.warn("[AdMission] Cannot open ad target URL:", error);
    });
  }, [ad?.campaignId, ad?.targetUrl]);

  useEffect(() => {
    if (!visible) {
      try {
        player.pause();
      } catch {}
      resetState();
      return;
    }

    const normalizedMissionCode = missionCode.trim();
    const lifecycleId = ++lifecycleIdRef.current;

    if (!normalizedMissionCode) {
      setErrorMessage("Không tìm thấy mã nhiệm vụ quảng cáo.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage("");
    setSession(null);
    setAd(null);
    setWatchedSeconds(0);
    watchedSecondsRef.current = 0;
    setWatchTargetSeconds(REQUIRED_WATCH_SECONDS);
    hasTrackedClickRef.current = false;
    hasCompletedRef.current = false;

    const loadAdMission = async () => {
      try {
        const [sessionData, ads] = await Promise.all([
          startAdMissionSession(normalizedMissionCode),
          getMissionAds(),
        ]);

        if (lifecycleId !== lifecycleIdRef.current) return;

        const selectedAd = pickRandomAd(ads);
        if (!selectedAd) {
          setErrorMessage("Hiện tại chưa có quảng cáo phù hợp để phát.");
          setStatus("error");
          return;
        }

        setSession(sessionData);
        setAd(selectedAd);
        setStatus("ready");
      } catch (error) {
        if (lifecycleId !== lifecycleIdRef.current) return;
        setErrorMessage(getErrorMessage(error));
        setStatus("error");
      }
    };

    void loadAdMission();

    return () => {
      if (lifecycleId === lifecycleIdRef.current) {
        lifecycleIdRef.current += 1;
      }
    };
  }, [missionCode, resetState, visible]);

  useEffect(() => {
    if (visible) return;

    try {
      player.pause();
    } catch {}
  }, [player, visible]);

  useEffect(() => {
    if (!visible || !ad || status !== "ready") return;

    try {
      player.currentTime = 0;
      player.play();
      setStatus("playing");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setStatus("error");
    }
  }, [ad, player, status, visible]);

  useEffect(() => {
    if (!visible || !ad) return;

    const sourceLoadSub = player.addListener("sourceLoad", ({ duration }) => {
      const target =
        duration && duration > 0
          ? Math.min(REQUIRED_WATCH_SECONDS, duration)
          : REQUIRED_WATCH_SECONDS;
      setWatchTargetSeconds(target);
    });

    const statusSub = player.addListener("statusChange", ({ status, error }) => {
      if (status === "error") {
        setErrorMessage(error?.message || "Không thể phát video quảng cáo.");
        setStatus("error");
      }
    });

    const timeSub = player.addListener("timeUpdate", ({ currentTime }) => {
      const safeCurrentTime = Math.max(0, currentTime || 0);
      watchedSecondsRef.current = safeCurrentTime;
      setWatchedSeconds(Math.min(safeCurrentTime, watchTargetSeconds));

      if (safeCurrentTime >= watchTargetSeconds) {
        void completeCurrentSession();
      }
    });

    const endSub = player.addListener("playToEnd", () => {
      if (watchedSecondsRef.current >= watchTargetSeconds) {
        void completeCurrentSession();
      }
    });

    return () => {
      sourceLoadSub.remove();
      statusSub.remove();
      timeSub.remove();
      endSub.remove();
    };
  }, [
    ad,
    completeCurrentSession,
    player,
    visible,
    watchTargetSeconds,
  ]);

  useEffect(() => {
    if (!visible) return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (status !== "completing") {
          handleClose();
        }
        return true;
      },
    );

    return () => subscription.remove();
  }, [handleClose, status, visible]);

  const canClose = status !== "completing";
  const progressPercent = Math.max(
    0,
    Math.min(100, (watchedSeconds / (watchTargetSeconds || 1)) * 100),
  );
  const remainingSeconds = Math.max(
    0,
    Math.ceil(watchTargetSeconds - watchedSeconds),
  );
  const remainingTime = formatCountdown(remainingSeconds);
  const formattedRewardAmount =
    typeof rewardAmount === "number" && Number.isFinite(rewardAmount)
      ? rewardAmount.toLocaleString("vi-VN")
      : null;

  const title =
    status === "success"
      ? "Nhận thưởng thành công"
      : status === "error"
        ? "Không thể xem quảng cáo"
        : "Nhiệm vụ xem quảng cáo";

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
      onRequestClose={() => {
        if (canClose) handleClose();
      }}
    >
      <View className="flex-1 justify-center bg-black/95 px-5">
        <View className="overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-[#141210]">
          <View className="flex-row items-start justify-between border-b border-white/10 px-5 py-4">
            <View className="flex-1 pr-3">
              <Text className="text-lg font-black text-white">{title}</Text>
              {ad?.title && status !== "success" && status !== "error" ? (
                <Text className="mt-1 text-xs font-semibold text-[#A19E95]">
                  {ad.title}
                </Text>
              ) : null}
            </View>
            {canClose ? (
              <TouchableOpacity
                accessibilityLabel="Đóng quảng cáo"
                activeOpacity={0.8}
                onPress={handleClose}
                className="h-9 w-9 items-center justify-center rounded-full bg-white/10"
              >
                <Feather name="x" size={20} color="#E5E0D8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {status === "loading" || status === "idle" ? (
            <View className="items-center px-6 py-12">
              <ActivityIndicator size="large" color="#D4AF37" />
              <Text className="mt-4 text-center text-sm font-semibold text-[#E5E0D8]">
                Đang chuẩn bị quảng cáo...
              </Text>
            </View>
          ) : status === "ready" || status === "playing" || status === "completing" ? (
            <>
              <TouchableOpacity
                activeOpacity={1}
                onPress={handleVideoPress}
                className="aspect-video w-full bg-black"
              >
                <VideoView
                  player={player}
                  style={{ width: "100%", height: "100%" }}
                  nativeControls={false}
                  allowsFullscreen={false}
                  allowsPictureInPicture={false}
                />
                {status === "completing" ? (
                  <View className="absolute inset-0 items-center justify-center bg-black/80">
                    <ActivityIndicator size="large" color="#D4AF37" />
                    <Text className="mt-3 text-sm font-bold text-white">
                      Đang ghi nhận phần thưởng...
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>

              <View className="px-5 py-5">
                <View className="mb-2 flex-row items-center justify-between">
                  <Text className="text-xs font-bold text-[#A19E95]">
                    Tiến độ xem
                  </Text>
                  <Text className="text-xs font-black text-[#D4AF37]">
                    Còn {remainingTime}
                  </Text>
                </View>
                <View className="h-2 overflow-hidden rounded-full bg-[#262628]">
                  <View
                    className="h-full rounded-full bg-[#D4AF37]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </View>
                <Text className="mt-3 text-center text-xs leading-5 text-[#A19E95]">
                  Vui lòng xem đủ quảng cáo để hệ thống cộng thưởng cho nhiệm vụ.
                </Text>
              </View>
            </>
          ) : status === "success" ? (
            <View className="items-center px-6 py-8">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-[#10B981]/10">
                <Feather name="check" size={34} color="#10B981" />
              </View>
              <Text className="mt-4 text-center text-sm leading-5 text-[#A19E95]">
                {formattedRewardAmount
                  ? `Nhận thưởng thành công +${formattedRewardAmount} Xu. Ví Coin và danh sách nhiệm vụ đã được cập nhật.`
                  : "Nhận thưởng thành công. Ví Coin và danh sách nhiệm vụ đã được cập nhật."}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleClose}
                className="mt-6 h-12 w-full items-center justify-center rounded-xl bg-[#D4AF37]"
              >
                <Text className="font-black text-[#141210]">Đóng</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="items-center px-6 py-8">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-[#EF4444]/10">
                <Feather name="x" size={34} color="#EF4444" />
              </View>
              <Text className="mt-4 text-center text-sm leading-5 text-[#F87171]">
                {errorMessage || "Vui lòng thử lại sau."}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleClose}
                className="mt-6 h-12 w-full items-center justify-center rounded-xl bg-[#262628]"
              >
                <Text className="font-black text-[#E5E0D8]">Đóng</Text>
              </TouchableOpacity>
            </View>
          )}

          {status !== "success" && status !== "error" ? (
            <View className="flex-row items-center justify-center border-t border-white/10 px-5 py-3">
              <FontAwesome5 name="coins" size={12} color="#D4AF37" />
              <Text className="ml-2 text-[11px] font-bold text-[#A19E95]">
                Không đóng màn hình cho đến khi hoàn tất nhiệm vụ.
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
