import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useReward } from "@/context/RewardContext";
import { startAdSession } from "@/services/rewardService";
import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

type AdRewardStatus =
  | "idle"
  | "loading"
  | "showing"
  | "verifying"
  | "success"
  | "error";

type AdRewardModalProps = {
  visible: boolean;
  missionCode: string;
  onClose: () => void;
};

const adUnitId = process.env.EXPO_PUBLIC_ADMOB_REWARD_ID || TestIds.REWARDED;
const SSV_POLL_INTERVAL_MS = 3000;
const SSV_MAX_POLL_ATTEMPTS = 3;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.";

export default function AdRewardModal({
  visible,
  missionCode,
  onClose,
}: AdRewardModalProps) {
  const { user } = useAuth();
  const { refreshRewardData } = useReward();
  const [status, setStatus] = useState<AdRewardStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const lifecycleIdRef = useRef(0);
  const activeRequestKeyRef = useRef<string | null>(null);
  const hasEarnedRewardRef = useRef(false);
  const hasAdClosedRef = useRef(false);
  const isVerifyingRewardRef = useRef(false);
  const refreshRewardDataRef = useRef(refreshRewardData);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    refreshRewardDataRef.current = refreshRewardData;
  }, [refreshRewardData]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const resetState = useCallback(() => {
    setStatus("idle");
    setErrorMessage("");
    activeRequestKeyRef.current = null;
    hasEarnedRewardRef.current = false;
    hasAdClosedRef.current = false;
    isVerifyingRewardRef.current = false;
  }, []);

  const handleClose = useCallback(() => {
    lifecycleIdRef.current += 1;
    resetState();
    onCloseRef.current();
  }, [resetState]);

  useEffect(() => {
    if (!visible || status === "success" || status === "error") return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true,
    );

    return () => subscription.remove();
  }, [status, visible]);

  useEffect(() => {
    if (visible) return;
    resetState();
  }, [resetState, visible]);

  useEffect(() => {
    if (!visible) return;

    const accountId = user?.accountId;
    const requestKey = `${accountId ?? "missing-account"}:${missionCode}`;

    if (activeRequestKeyRef.current === requestKey) return;

    setStatus("loading");
    setErrorMessage("");

    if (!accountId) {
      setErrorMessage("Không tìm thấy accountId của người dùng.");
      setStatus("error");
      return;
    }

    if (!missionCode) {
      setErrorMessage("Không tìm thấy mã nhiệm vụ quảng cáo.");
      setStatus("error");
      return;
    }

    activeRequestKeyRef.current = requestKey;
    hasEarnedRewardRef.current = false;
    hasAdClosedRef.current = false;
    isVerifyingRewardRef.current = false;

    const lifecycleId = ++lifecycleIdRef.current;
    let rewardNotEarnedTimeout: ReturnType<typeof setTimeout> | undefined;
    let pollRewardTimeout: ReturnType<typeof setTimeout> | undefined;
    let pollAttemptCount = 0;
    let unsubscribeLoaded: (() => void) | undefined;
    let unsubscribeEarnedReward: (() => void) | undefined;
    let unsubscribeClosed: (() => void) | undefined;
    let unsubscribeError: (() => void) | undefined;

    const failCurrentSession = (message: string) => {
      if (lifecycleId !== lifecycleIdRef.current) return;
      setErrorMessage(message);
      setStatus("error");
    };

    const startRewardVerificationPolling = () => {
      if (
        lifecycleId !== lifecycleIdRef.current ||
        !hasEarnedRewardRef.current ||
        !hasAdClosedRef.current ||
        isVerifyingRewardRef.current
      ) {
        return;
      }

      isVerifyingRewardRef.current = true;
      pollAttemptCount = 0;
      setStatus("verifying");
      console.log("[AdMob] Verifying rewarded ad reward through SSV polling");

      const pollRewardData = async () => {
        if (lifecycleId !== lifecycleIdRef.current) return;

        pollAttemptCount += 1;

        try {
          await refreshRewardDataRef.current({ silent: true });
        } catch (error) {
          console.warn(
            "[AdMob] Reward verification polling failed:",
            getErrorMessage(error),
          );
        }

        if (lifecycleId !== lifecycleIdRef.current) return;

        if (pollAttemptCount >= SSV_MAX_POLL_ATTEMPTS) {
          isVerifyingRewardRef.current = false;
          setStatus("success");
          return;
        }

        pollRewardTimeout = setTimeout(() => {
          void pollRewardData();
        }, SSV_POLL_INTERVAL_MS);
      };

      pollRewardTimeout = setTimeout(() => {
        void pollRewardData();
      }, SSV_POLL_INTERVAL_MS);
    };

    const loadRewardedAd = async () => {
      try {
        await startAdSession(missionCode);
        if (lifecycleId !== lifecycleIdRef.current) return;

        const rewarded = RewardedAd.createForAdRequest(adUnitId, {
          serverSideVerificationOptions: {
            userId: accountId,
            customData: JSON.stringify({
              accountId,
              missionCode,
            }),
          },
        });

        unsubscribeLoaded = rewarded.addAdEventListener(
          RewardedAdEventType.LOADED,
          () => {
            if (lifecycleId !== lifecycleIdRef.current) return;
            console.log("[AdMob] Rewarded ad loaded");
            setStatus("showing");
            rewarded.show().catch((error) => {
              if (lifecycleId !== lifecycleIdRef.current) return;
              setErrorMessage(getErrorMessage(error));
              setStatus("error");
            });
          },
        );

        unsubscribeEarnedReward = rewarded.addAdEventListener(
          RewardedAdEventType.EARNED_REWARD,
          () => {
            if (lifecycleId !== lifecycleIdRef.current) return;
            console.log("[AdMob] User earned rewarded ad reward");
            hasEarnedRewardRef.current = true;
            startRewardVerificationPolling();
          },
        );

        unsubscribeClosed = rewarded.addAdEventListener(
          AdEventType.CLOSED,
          () => {
            if (lifecycleId !== lifecycleIdRef.current) return;
            console.log("[AdMob] Rewarded ad closed");
            hasAdClosedRef.current = true;
            startRewardVerificationPolling();

            rewardNotEarnedTimeout = setTimeout(() => {
              if (
                lifecycleId !== lifecycleIdRef.current ||
                hasEarnedRewardRef.current ||
                isVerifyingRewardRef.current
              ) {
                return;
              }

              failCurrentSession("Bạn cần xem hết quảng cáo để nhận thưởng.");
            }, 1000);
          },
        );

        unsubscribeError = rewarded.addAdEventListener(
          AdEventType.ERROR,
          (error) => {
            if (lifecycleId !== lifecycleIdRef.current) return;
            setErrorMessage(getErrorMessage(error));
            setStatus("error");
          },
        );

        rewarded.load();
      } catch (error) {
        failCurrentSession(getErrorMessage(error));
      }
    };

    void loadRewardedAd();

    return () => {
      if (rewardNotEarnedTimeout) clearTimeout(rewardNotEarnedTimeout);
      if (pollRewardTimeout) clearTimeout(pollRewardTimeout);
      unsubscribeLoaded?.();
      unsubscribeEarnedReward?.();
      unsubscribeClosed?.();
      unsubscribeError?.();

      if (lifecycleId === lifecycleIdRef.current) {
        lifecycleIdRef.current += 1;
      }
    };
  }, [missionCode, user?.accountId, visible]);

  const canClose = status === "success" || status === "error";
  const isLoading =
    status === "idle" ||
    status === "loading" ||
    status === "showing" ||
    status === "verifying";
  const loadingTitle =
    status === "verifying"
      ? "Đang xác minh phần thưởng từ hệ thống..."
      : status === "showing"
        ? "Đang chạy quảng cáo..."
        : "Đang tải quảng cáo...";
  const loadingDescription =
    status === "verifying"
      ? "Vui lòng chờ trong giây lát."
      : "Vui lòng chờ trong giây lát.";

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
      <View className="flex-1 items-center justify-center bg-black/95 px-6">
        <View className="w-full max-w-[380px] items-center rounded-3xl border border-[#D4AF37] bg-[#1C1A18] px-6 py-8">
          {isLoading && (
            <>
              <ActivityIndicator size="large" color="#D4AF37" />
              <Text className="mt-5 text-center text-base font-bold text-[#E5E0D8]">
                {loadingTitle}
              </Text>
              <Text className="mt-2 text-center text-sm leading-5 text-[#A19E95]">
                {loadingDescription}
              </Text>
            </>
          )}

          {status === "success" && (
            <>
              <View className="h-16 w-16 items-center justify-center rounded-full bg-[#10B981]/10">
                <Feather name="check" size={34} color="#10B981" />
              </View>
              <Text className="mt-5 text-center text-xl font-black text-white">
                Nhận thưởng thành công!
              </Text>
              <Text className="mt-2 text-center text-sm text-[#A19E95]">
                Số dư xu và nhiệm vụ của bạn đã được cập nhật.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleClose}
                className="mt-7 h-12 w-full items-center justify-center rounded-xl bg-[#D4AF37]"
              >
                <Text className="font-black text-[#141210]">Đóng</Text>
              </TouchableOpacity>
            </>
          )}

          {status === "error" && (
            <>
              <View className="h-16 w-16 items-center justify-center rounded-full bg-[#EF4444]/10">
                <Feather name="x" size={34} color="#EF4444" />
              </View>
              <Text className="mt-5 text-center text-xl font-black text-white">
                Xem quảng cáo thất bại
              </Text>
              <Text className="mt-3 text-center text-sm leading-5 text-[#F87171]">
                {errorMessage || "Vui lòng thử lại sau."}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleClose}
                className="mt-7 h-12 w-full items-center justify-center rounded-xl bg-[#262628]"
              >
                <Text className="font-black text-[#E5E0D8]">Đóng</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
