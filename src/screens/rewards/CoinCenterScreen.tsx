import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { useReward } from "@/context/RewardContext";
import {
  getCheckInStatus,
  performCheckIn,
  RewardApiError,
} from "@/services/rewardService";
import type { CheckInStatus, MissionData } from "@/types/reward";

const INITIAL_CHECK_IN_STATUS: CheckInStatus = {
  isCheckedInToday: false,
  currentStreak: 0,
};

const COIN_CENTER_SYNC_INTERVAL_MS = 60_000;

function MissionCard({
  mission,
}: {
  mission: MissionData;
}) {
  const progress =
    mission.targetValue > 0
      ? Math.min(
          100,
          Math.max(0, (mission.currentValue / mission.targetValue) * 100),
        )
      : 0;
  const isOnlineMission = mission.code.startsWith("ONLINE_");

  return (
    <View className="mb-4 rounded-2xl border border-white/5 bg-[#1C1A18] p-4">
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <Text className="text-[15px] font-black text-[#E5E0D8]">
            {mission.title}
          </Text>
          <Text className="mt-1 text-xs leading-5 text-[#7C766B]">
            {mission.description}
          </Text>
        </View>
        <Text className="text-sm font-black text-[#D4AF37]">
          + {mission.rewardAmount} Xu
        </Text>
      </View>

      <View className="mt-4 h-2 overflow-hidden rounded-full bg-[#262628]">
        <View
          className="h-full rounded-full bg-[#D4AF37]"
          style={{ width: `${progress}%` }}
        />
      </View>
      <Text className="mt-2 text-[11px] font-semibold text-[#A19E95]">
        Tiến độ: {mission.currentValue}/{mission.targetValue}
      </Text>

      {mission.isCompleted ? (
        <View className="mt-4 h-11 items-center justify-center rounded-xl border border-[#10B981] bg-[#10B981]/10">
          <Text className="text-xs font-black uppercase tracking-wide text-[#10B981]">
            Đã Nhận Thưởng
          </Text>
        </View>
      ) : isOnlineMission ? (
        <View className="mt-4 h-11 flex-row items-center justify-center rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10">
          <ActivityIndicator size="small" color="#D4AF37" />
          <Text className="ml-2 text-xs font-black text-[#D4AF37]">
            Đang Online • Tự Động Nhận Thưởng
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function CoinCenterScreen() {
  const navigation = useNavigation();
  const { balance, missions, isLoading, refreshRewardData } = useReward();
  const [checkInStatus, setCheckInStatus] = useState<CheckInStatus>(
    INITIAL_CHECK_IN_STATUS,
  );
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const visibleMissions = missions.filter(
    (mission) => !mission.code.startsWith("WATCH_AD_"),
  );
  const hasPendingOnlineMission = missions.some(
    (mission) => mission.code.startsWith("ONLINE_") && !mission.isCompleted,
  );

  const loadCheckInStatus = useCallback(async () => {
    try {
      const status = await getCheckInStatus();
      setCheckInStatus(status);
    } catch (error) {
      console.warn(
        "[CoinCenter] Không thể tải trạng thái điểm danh:",
        error instanceof Error ? error.message : error,
      );
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void Promise.all([
        loadCheckInStatus(),
        refreshRewardData({ silent: true }),
      ]);

      const syncInterval = setInterval(() => {
        // While an Online mission is pending, heartbeat already refreshes the
        // same global data after every successful minute. Poll only when there
        // is no Online mission so newly-created Admin missions can be found.
        if (!hasPendingOnlineMission) {
          void refreshRewardData({ silent: true });
        }
      }, COIN_CENTER_SYNC_INTERVAL_MS);

      return () => clearInterval(syncInterval);
    }, [hasPendingOnlineMission, loadCheckInStatus, refreshRewardData]),
  );

  const handleCheckIn = async () => {
    if (isCheckingIn || checkInStatus.isCheckedInToday) return;
    setIsCheckingIn(true);

    try {
      await performCheckIn();
      Toast.show({
        type: "success",
        text1: "Điểm danh thành công",
        text2: "Phần thưởng xu đã được cộng vào ví của bạn.",
      });
      await Promise.all([loadCheckInStatus(), refreshRewardData()]);
    } catch (error) {
      const code =
        error instanceof RewardApiError ? Number(error.code) : undefined;
      const text1 =
        code === 6029
          ? "Hệ thống đang bận"
          : code === 6002
            ? "Bạn đã điểm danh hôm nay"
            : "Điểm danh thất bại";

      Toast.show({
        type: "error",
        text1,
        text2: error instanceof Error ? error.message : "Vui lòng thử lại.",
      });

      if (code === 6002) {
        await loadCheckInStatus();
      }
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#141210]" edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#141210" />

      <View className="h-14 flex-row items-center px-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#262628]"
        >
          <Feather name="chevron-left" size={22} color="#E5E0D8" />
        </TouchableOpacity>
        <Text className="ml-3 text-xl font-black text-white">Trung Tâm Xu</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        <View className="mb-5 rounded-3xl border border-[#D4AF37]/20 bg-[#1C1A18] p-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-bold uppercase tracking-widest text-[#A19E95]">
                Số dư hiện tại
              </Text>
              <View className="mt-2 flex-row items-center">
                <FontAwesome5 name="coins" size={22} color="#D4AF37" />
                <Text className="ml-3 text-3xl font-black text-white">
                  {isLoading ? "..." : balance}
                </Text>
                <Text className="ml-2 mt-2 text-sm font-bold text-[#A19E95]">
                  Xu
                </Text>
              </View>
            </View>
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/10">
              <FontAwesome5 name="gift" size={22} color="#D4AF37" />
            </View>
          </View>

          <View className="my-5 h-[1px] bg-white/5" />

          <Text className="text-sm font-bold text-[#E5E0D8]">
            Chuỗi điểm danh: {checkInStatus.currentStreak} ngày
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={checkInStatus.isCheckedInToday || isCheckingIn}
            onPress={handleCheckIn}
            className={`mt-4 h-12 flex-row items-center justify-center rounded-xl ${
              checkInStatus.isCheckedInToday ? "bg-[#262628]" : "bg-[#D4AF37]"
            }`}
          >
            {isCheckingIn && <ActivityIndicator size="small" color="#141210" />}
            <Text
              className={`font-black ${isCheckingIn ? "ml-2" : ""} ${
                checkInStatus.isCheckedInToday
                  ? "text-[#7C766B]"
                  : "text-[#141210]"
              }`}
            >
              {checkInStatus.isCheckedInToday
                ? "Đã Điểm Danh"
                : "Điểm Danh Nhận Quà"}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-lg font-black text-white">
            Nhiệm Vụ Hôm Nay
          </Text>
          <Text className="text-xs font-bold text-[#7C766B]">
            {visibleMissions.length} nhiệm vụ
          </Text>
        </View>

        {isLoading && visibleMissions.length === 0 ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text className="mt-3 text-sm text-[#A19E95]">
              Đang tải nhiệm vụ...
            </Text>
          </View>
        ) : visibleMissions.length === 0 ? (
          <View className="items-center rounded-2xl border border-white/5 bg-[#1C1A18] px-5 py-12">
            <FontAwesome5 name="tasks" size={28} color="#7C766B" />
            <Text className="mt-3 text-center text-sm font-semibold text-[#A19E95]">
              Hôm nay chưa có nhiệm vụ nào.
            </Text>
          </View>
        ) : (
          visibleMissions.map((mission) => (
            <MissionCard
              key={mission.missionId}
              mission={mission}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
