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
import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from "react-native-google-mobile-ads";

type AdRewardStatus = "idle" | "loading" | "showing" | "success" | "error";

type AdRewardModalProps = {
  visible: boolean;
  missionCode: string;
  onClose: () => void;
};

const adUnitId = process.env.EXPO_PUBLIC_ADMOB_REWARD_ID || TestIds.REWARDED;

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Da xay ra loi khong xac dinh.";

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

  const resetState = useCallback(() => {
    setStatus("idle");
    setErrorMessage("");
  }, []);

  const handleClose = useCallback(() => {
    lifecycleIdRef.current += 1;
    resetState();
    onClose();
  }, [onClose, resetState]);

  useEffect(() => {
    if (!visible || status === "success" || status === "error") return;

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => true,
    );

    return () => subscription.remove();
  }, [status, visible]);

  useEffect(() => {
    if (!visible) return;

    const accountId = user?.accountId;
    const lifecycleId = ++lifecycleIdRef.current;
    let hasEarnedReward = false;

    setStatus("loading");
    setErrorMessage("");

    if (!accountId) {
      setErrorMessage("Khong tim thay accountId cua nguoi dung.");
      setStatus("error");
      return;
    }

    if (!missionCode) {
      setErrorMessage("Khong tim thay ma nhiem vu quang cao.");
      setStatus("error");
      return;
    }

    const rewarded = RewardedAd.createForAdRequest(adUnitId, {
      serverSideVerificationOptions: {
        userId: accountId,
        customData: JSON.stringify({ accountId, missionCode }),
      },
    });

    const finishWithSuccess = async () => {
      try {
        await refreshRewardData();
        if (lifecycleId !== lifecycleIdRef.current) return;
        setStatus("success");
      } catch (error) {
        if (lifecycleId !== lifecycleIdRef.current) return;
        setErrorMessage(getErrorMessage(error));
        setStatus("error");
      }
    };

    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        if (lifecycleId !== lifecycleIdRef.current) return;
        setStatus("showing");
        rewarded.show().catch((error) => {
          if (lifecycleId !== lifecycleIdRef.current) return;
          setErrorMessage(getErrorMessage(error));
          setStatus("error");
        });
      },
    );

    const unsubscribeEarnedReward = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        if (lifecycleId !== lifecycleIdRef.current) return;
        hasEarnedReward = true;
      },
    );

    const unsubscribeClosed = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        if (lifecycleId !== lifecycleIdRef.current) return;

        if (!hasEarnedReward) {
          handleClose();
          return;
        }

        void finishWithSuccess();
      },
    );

    const unsubscribeError = rewarded.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        if (lifecycleId !== lifecycleIdRef.current) return;
        setErrorMessage(getErrorMessage(error));
        setStatus("error");
      },
    );

    rewarded.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarnedReward();
      unsubscribeClosed();
      unsubscribeError();

      if (lifecycleId === lifecycleIdRef.current) {
        lifecycleIdRef.current += 1;
      }
    };
  }, [handleClose, missionCode, refreshRewardData, user?.accountId, visible]);

  const canClose = status === "success" || status === "error";
  const isLoading =
    status === "idle" || status === "loading" || status === "showing";

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
                Dang tai quang cao...
              </Text>
              <Text className="mt-2 text-center text-sm leading-5 text-[#A19E95]">
                Vui long cho trong giay lat.
              </Text>
            </>
          )}

          {status === "success" && (
            <>
              <View className="h-16 w-16 items-center justify-center rounded-full bg-[#10B981]/10">
                <Feather name="check" size={34} color="#10B981" />
              </View>
              <Text className="mt-5 text-center text-xl font-black text-white">
                Nhan thuong thanh cong!
              </Text>
              <Text className="mt-2 text-center text-sm text-[#A19E95]">
                So du xu va nhiem vu cua ban da duoc cap nhat.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleClose}
                className="mt-7 h-12 w-full items-center justify-center rounded-xl bg-[#D4AF37]"
              >
                <Text className="font-black text-[#141210]">Dong</Text>
              </TouchableOpacity>
            </>
          )}

          {status === "error" && (
            <>
              <View className="h-16 w-16 items-center justify-center rounded-full bg-[#EF4444]/10">
                <Feather name="x" size={34} color="#EF4444" />
              </View>
              <Text className="mt-5 text-center text-xl font-black text-white">
                Xem quang cao that bai
              </Text>
              <Text className="mt-3 text-center text-sm leading-5 text-[#F87171]">
                {errorMessage || "Vui long thu lai sau."}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleClose}
                className="mt-7 h-12 w-full items-center justify-center rounded-xl bg-[#262628]"
              >
                <Text className="font-black text-[#E5E0D8]">Dong</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
