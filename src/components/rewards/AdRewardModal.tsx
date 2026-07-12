import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useReward } from "@/context/RewardContext";
import {
  completeAdSession,
  RewardApiError,
  startAdSession,
} from "@/services/rewardService";

type AdRewardStatus =
  | "idle"
  | "starting"
  | "playing"
  | "completing"
  | "success"
  | "error";

type AdRewardModalProps = {
  visible: boolean;
  missionCode: string;
  onClose: () => void;
};

const AD_COUNTDOWN_SECONDS = 15;

const getErrorMessage = (error: unknown) => {
  if (error instanceof RewardApiError) {
    return error.message;
  }
  return error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.";
};

export default function AdRewardModal({
  visible,
  missionCode,
  onClose,
}: AdRewardModalProps) {
  const { refreshRewardData } = useReward();
  const [status, setStatus] = useState<AdRewardStatus>("idle");
  const [countdown, setCountdown] = useState(AD_COUNTDOWN_SECONDS);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const lifecycleIdRef = useRef(0);

  const resetState = useCallback(() => {
    setStatus("idle");
    setCountdown(AD_COUNTDOWN_SECONDS);
    setSessionId(null);
    setErrorMessage("");
  }, []);

  const handleClose = useCallback(() => {
    lifecycleIdRef.current += 1;
    resetState();
    onClose();
  }, [onClose, resetState]);

  useEffect(() => {
    if (!visible) return;

    const lifecycleId = ++lifecycleIdRef.current;
    setStatus("starting");
    setCountdown(AD_COUNTDOWN_SECONDS);
    setSessionId(null);
    setErrorMessage("");

    const startSession = async () => {
      try {
        const session = await startAdSession(missionCode);
        if (lifecycleId !== lifecycleIdRef.current) return;

        setSessionId(session.sessionId);
        setCountdown(AD_COUNTDOWN_SECONDS);
        setStatus("playing");
      } catch (error) {
        if (lifecycleId !== lifecycleIdRef.current) return;
        setErrorMessage(getErrorMessage(error));
        setStatus("error");
      }
    };

    void startSession();

    return () => {
      if (lifecycleId === lifecycleIdRef.current) {
        lifecycleIdRef.current += 1;
      }
    };
  }, [missionCode, visible]);

  useEffect(() => {
    if (!visible || status === "success" || status === "error") return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true,
    );

    return () => subscription.remove();
  }, [status, visible]);

  useEffect(() => {
    if (!visible || status !== "playing") return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background") {
        lifecycleIdRef.current += 1;
        setSessionId(null);
        setErrorMessage("Quá trình xem bị gián đoạn");
        setStatus("error");
      }
    });

    return () => subscription.remove();
  }, [status, visible]);

  useEffect(() => {
    if (!visible || status !== "playing") return;

    const interval = setInterval(() => {
      setCountdown((current) => Math.max(0, current - 1));
    }, 1_000);

    return () => clearInterval(interval);
  }, [status, visible]);

  useEffect(() => {
    if (
      !visible ||
      status !== "playing" ||
      countdown > 0 ||
      !sessionId
    ) {
      return;
    }

    const lifecycleId = lifecycleIdRef.current;
    setStatus("completing");

    const completeSession = async () => {
      try {
        await completeAdSession(sessionId);
        if (lifecycleId !== lifecycleIdRef.current) return;

        await refreshRewardData();
        if (lifecycleId !== lifecycleIdRef.current) return;

        setStatus("success");
      } catch (error) {
        if (lifecycleId !== lifecycleIdRef.current) return;
        setErrorMessage(getErrorMessage(error));
        setStatus("error");
      }
    };

    void completeSession();
  }, [countdown, refreshRewardData, sessionId, status, visible]);

  const canClose = status === "success" || status === "error";

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
          {(status === "idle" || status === "starting") && (
            <>
              <ActivityIndicator size="large" color="#D4AF37" />
              <Text className="mt-5 text-center text-base font-bold text-[#E5E0D8]">
                Đang tải dữ liệu quảng cáo...
              </Text>
            </>
          )}

          {status === "playing" && (
            <>
              <View className="h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37]/10">
                <Feather name="play" size={25} color="#D4AF37" />
              </View>
              <Text className="mt-5 text-center text-lg font-black text-white">
                Vui lòng không đóng ứng dụng
              </Text>
              <Text className="mt-2 text-center text-sm leading-5 text-[#A19E95]">
                Phần thưởng sẽ được xác nhận sau khi quảng cáo kết thúc.
              </Text>
              <Text className="my-8 text-7xl font-black text-[#D4AF37]">
                {countdown}
              </Text>
              <Text className="text-xs font-bold uppercase tracking-widest text-[#7C766B]">
                Giây còn lại
              </Text>
            </>
          )}

          {status === "completing" && (
            <>
              <ActivityIndicator size="large" color="#D4AF37" />
              <Text className="mt-5 text-center text-base font-bold text-[#E5E0D8]">
                Đang xác nhận phần thưởng...
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
