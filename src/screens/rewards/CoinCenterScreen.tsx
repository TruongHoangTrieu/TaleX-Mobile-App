import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import CinematicBackground from "@/components/CinematicBackground";
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

// Lộ trình 7 ngày điểm danh
const SEVEN_DAYS = [
  { day: 1, label: "Ngày 1" },
  { day: 2, label: "Ngày 2" },
  { day: 3, label: "Ngày 3" },
  { day: 4, label: "Ngày 4" },
  { day: 5, label: "Ngày 5" },
  { day: 6, label: "Ngày 6" },
  { day: 7, label: "Ngày 7", isSuper: true },
];

function MissionCard({
  mission,
  onPressAd,
}: {
  mission: MissionData;
  onPressAd?: () => void;
}) {
  const progress =
    mission.targetValue > 0
      ? Math.min(
          100,
          Math.max(0, (mission.currentValue / mission.targetValue) * 100),
        )
      : 0;
  const isOnlineMission = mission.code.startsWith("ONLINE_");
  const isAdMission =
    mission.code === "WATCH_AD" || mission.code.startsWith("WATCH_AD_");

  const getMissionIcon = () => {
    if (isAdMission) {
      return <Feather name="tv" size={19} color="#FB7185" />;
    }
    if (isOnlineMission) {
      return <Feather name="clock" size={19} color="#38BDF8" />;
    }
    if (mission.code.includes("READ") || mission.code.includes("COMIC")) {
      return <Ionicons name="book-outline" size={19} color="#34D399" />;
    }
    if (mission.code.includes("WATCH") || mission.code.includes("MOVIE")) {
      return <Ionicons name="film-outline" size={19} color="#FBBF24" />;
    }
    return <FontAwesome5 name="tasks" size={16} color="#D4AF37" />;
  };

  return (
    <View
      style={{ backgroundColor: "#141417", borderColor: "rgba(255, 255, 255, 0.08)" }}
      className="mb-4 rounded-3xl border p-5 shadow-sm"
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-row items-center flex-1 mr-3">
          <View
            style={{ backgroundColor: "#1F1F24", borderColor: "rgba(255, 255, 255, 0.1)" }}
            className="w-11 h-11 rounded-2xl border items-center justify-center mr-3.5"
          >
            {getMissionIcon()}
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-black text-white leading-5" numberOfLines={1}>
              {mission.title}
            </Text>
            <Text className="mt-1 text-xs text-zinc-400 leading-5" numberOfLines={2}>
              {mission.description}
            </Text>
          </View>
        </View>

        <View
          style={{ backgroundColor: "rgba(212, 175, 55, 0.15)", borderColor: "rgba(212, 175, 55, 0.35)" }}
          className="flex-row items-center border px-3 py-1.5 rounded-xl"
        >
          <FontAwesome5 name="coins" size={11} color="#D4AF37" />
          <Text className="ml-1.5 text-xs font-black text-[#D4AF37]">
            +{mission.rewardAmount}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View className="mt-4 flex-row items-center justify-between">
        <View
          style={{ backgroundColor: "#222228" }}
          className="flex-1 mr-3 h-2.5 overflow-hidden rounded-full"
        >
          <View
            style={{ width: `${progress}%`, backgroundColor: "#D4AF37" }}
            className="h-full rounded-full"
          />
        </View>
        <Text className="text-xs font-bold text-zinc-400">
          {mission.currentValue}/{mission.targetValue}
        </Text>
      </View>

      {/* Action status button */}
      {mission.isCompleted ? (
        <View
          style={{ backgroundColor: "rgba(16, 185, 129, 0.12)", borderColor: "rgba(16, 185, 129, 0.3)" }}
          className="mt-4 h-11 flex-row items-center justify-center rounded-2xl border"
        >
          <Ionicons name="checkmark-circle" size={17} color="#10B981" />
          <Text className="ml-2 text-xs font-black uppercase tracking-wider text-emerald-400">
            Đã Nhận Thưởng
          </Text>
        </View>
      ) : isOnlineMission ? (
        <View
          style={{ backgroundColor: "rgba(56, 189, 248, 0.12)", borderColor: "rgba(56, 189, 248, 0.3)" }}
          className="mt-4 h-11 flex-row items-center justify-center rounded-2xl border"
        >
          <ActivityIndicator size="small" color="#38BDF8" />
          <Text className="ml-2 text-xs font-black text-sky-400">
            Đang Online • Tự Động Nhận Thưởng
          </Text>
        </View>
      ) : isAdMission ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPressAd}
          style={{ backgroundColor: "#E11D48" }}
          className="mt-4 h-11 flex-row items-center justify-center rounded-2xl shadow-md shadow-rose-900/30"
        >
          <Feather name="play-circle" size={16} color="#FFFFFF" />
          <Text className="ml-2 text-xs font-black uppercase tracking-wider text-white">
            Xem Quảng Cáo Nhận Xu
          </Text>
        </TouchableOpacity>
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
  const [refreshing, setRefreshing] = useState(false);

  const visibleMissions = missions;
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCheckInStatus(), refreshRewardData()]);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      void Promise.all([
        loadCheckInStatus(),
        refreshRewardData({ silent: true }),
      ]);

      const syncInterval = setInterval(() => {
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

  // Tính số ngày hiện tại trong chu kỳ 7 ngày (1 -> 7)
  const currentStreakDay = useMemo(() => {
    const raw = checkInStatus.currentStreak || 0;
    const cycle = raw % 7;
    return cycle === 0 && raw > 0 ? 7 : (cycle || 1);
  }, [checkInStatus.currentStreak]);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#000000" }}
      edges={["top", "bottom"]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <CinematicBackground>
        {/* 1. HEADER BAR - Tiêu đề đầy đủ "Điểm Danh Hằng Ngày" */}
        <View
          style={{ backgroundColor: "transparent", borderColor: "rgba(255, 255, 255, 0.08)" }}
          className="h-14 flex-row items-center justify-between px-4 border-b"
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ backgroundColor: "#1A1A20", borderColor: "rgba(255, 255, 255, 0.12)" }}
            className="h-10 w-10 items-center justify-center rounded-full border"
            activeOpacity={0.75}
          >
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View className="flex-1 px-3 items-center justify-center">
            <Text
              style={{ fontSize: 17 }}
              className="font-black text-white text-center"
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.85}
            >
              Điểm Danh Hằng Ngày
            </Text>
          </View>

          {/* Placeholder for perfect symmetry */}
          <View className="w-10 h-10" />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 60 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#D4AF37"
              colors={["#D4AF37"]}
            />
          }
        >
          {/* 2. SỐ DƯ VÍ & CHUỖI ĐIỂM DANH (OPEN, SPACIOUS & CLEAN) */}
          <View className="mb-6 px-1 flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] font-extrabold uppercase tracking-widest text-[#D4AF37]">
                Ví Thưởng TaleX
              </Text>
              <View className="mt-1 flex-row items-center">
                <Text className="text-3xl font-black text-white tracking-tight">
                  {isLoading ? "..." : (balance ?? 0).toLocaleString("vi-VN")}
                </Text>
                <Text className="ml-2 text-xl font-black text-[#D4AF37]">
                  Xu
                </Text>
              </View>
            </View>

            <View
              style={{ backgroundColor: "rgba(212, 175, 55, 0.12)", borderColor: "rgba(212, 175, 55, 0.3)" }}
              className="flex-row items-center border px-3.5 py-2 rounded-2xl shadow-sm"
            >
              <MaterialCommunityIcons name="fire" size={18} color="#FB923C" />
              <Text className="ml-1.5 text-xs font-black text-white">
                Chuỗi {checkInStatus.currentStreak} ngày
              </Text>
            </View>
          </View>

          {/* 3. LỘ TRÌNH 7 NGÀY ĐIỂM DANH */}
          <View
            style={{ backgroundColor: "#141417", borderColor: "rgba(255, 255, 255, 0.08)" }}
            className="mb-7 rounded-3xl border p-5 shadow-xl"
          >
            <View className="flex-row items-center mb-5">
              <View
                style={{ backgroundColor: "rgba(212, 175, 55, 0.15)" }}
                className="w-9 h-9 rounded-xl items-center justify-center mr-3"
              >
                <Ionicons name="calendar-outline" size={18} color="#D4AF37" />
              </View>
              <View>
                <Text className="text-base font-black text-white">
                  Lộ Trình Điểm Danh 7 Ngày
                </Text>
                <Text className="text-xs text-zinc-400 mt-0.5">
                  Duy trì chuỗi liên tục để nhận thưởng mốc lớn
                </Text>
              </View>
            </View>

            {/* 7-Day Grid Matrix - Rộng rãi, thoáng đãng */}
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {SEVEN_DAYS.map((item) => {
                const isPastChecked =
                  checkInStatus.isCheckedInToday
                    ? item.day <= currentStreakDay
                    : item.day < currentStreakDay;
                const isToday = item.day === currentStreakDay;

                if (item.isSuper) {
                  // Day 7 Super Box Card
                  return (
                    <View
                      key={`day-${item.day}`}
                      style={{
                        backgroundColor: isPastChecked
                          ? "rgba(16, 185, 129, 0.12)"
                          : isToday && !checkInStatus.isCheckedInToday
                            ? "rgba(212, 175, 55, 0.18)"
                            : "#1B1B20",
                        borderColor: isPastChecked
                          ? "rgba(16, 185, 129, 0.4)"
                          : isToday && !checkInStatus.isCheckedInToday
                            ? "#D4AF37"
                            : "rgba(212, 175, 55, 0.3)",
                      }}
                      className="w-full mt-1.5 p-4 rounded-2xl border flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center">
                        <View
                          style={{ backgroundColor: "rgba(212, 175, 55, 0.2)", borderColor: "rgba(212, 175, 55, 0.4)" }}
                          className="w-12 h-12 rounded-2xl border items-center justify-center mr-3.5"
                        >
                          <FontAwesome5 name="gift" size={22} color="#D4AF37" />
                        </View>
                        <View>
                          <Text className="text-xs font-black text-[#D4AF37]">
                            NGÀY 7 • SIÊU PHẦN THƯỞNG
                          </Text>
                          <Text className="text-xs text-zinc-300 font-medium mt-0.5">
                            Rương quà bí ẩn mốc 7 ngày
                          </Text>
                        </View>
                      </View>

                      {isPastChecked ? (
                        <View
                          style={{ backgroundColor: "rgba(16, 185, 129, 0.2)", borderColor: "rgba(16, 185, 129, 0.4)" }}
                          className="flex-row items-center px-3 py-1.5 rounded-full border"
                        >
                          <Ionicons name="checkmark-sharp" size={14} color="#10B981" />
                          <Text className="text-[11px] font-black text-emerald-400 ml-1">Đã nhận</Text>
                        </View>
                      ) : (
                        <View
                          style={{ backgroundColor: "rgba(212, 175, 55, 0.2)", borderColor: "rgba(212, 175, 55, 0.4)" }}
                          className="flex-row items-center px-3 py-1.5 rounded-full border"
                        >
                          <FontAwesome5 name="gift" size={12} color="#D4AF37" />
                          <Text className="text-[11px] font-black text-[#D4AF37] ml-1.5">Siêu quà</Text>
                        </View>
                      )}
                    </View>
                  );
                }

                // Days 1 to 6
                return (
                  <View
                    key={`day-${item.day}`}
                    style={{
                      width: "31%",
                      height: 90,
                      backgroundColor: isPastChecked
                        ? "rgba(16, 185, 129, 0.12)"
                        : isToday && !checkInStatus.isCheckedInToday
                          ? "rgba(212, 175, 55, 0.18)"
                          : "#1B1B20",
                      borderColor: isPastChecked
                        ? "rgba(16, 185, 129, 0.4)"
                        : isToday && !checkInStatus.isCheckedInToday
                          ? "#D4AF37"
                          : "rgba(255, 255, 255, 0.08)",
                    }}
                    className="p-3 rounded-2xl border items-center justify-between"
                  >
                    <Text
                      className={`text-[11px] font-black uppercase tracking-wide ${
                        isPastChecked
                          ? "text-emerald-400"
                          : isToday && !checkInStatus.isCheckedInToday
                            ? "text-[#D4AF37]"
                            : "text-zinc-400"
                      }`}
                    >
                      {item.label}
                    </Text>

                    <View className="my-1">
                      {isPastChecked ? (
                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                      ) : isToday && !checkInStatus.isCheckedInToday ? (
                        <FontAwesome5 name="gift" size={20} color="#D4AF37" />
                      ) : (
                        <FontAwesome5 name="coins" size={18} color="#71717A" />
                      )}
                    </View>

                    <Text
                      className={`text-[11px] font-black ${
                        isPastChecked
                          ? "text-emerald-400"
                          : isToday && !checkInStatus.isCheckedInToday
                            ? "text-[#D4AF37]"
                            : "text-zinc-400"
                      }`}
                    >
                      {isPastChecked ? "Đã nhận" : isToday ? "Hôm nay" : "Quà tặng"}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Big Check-in Action Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={checkInStatus.isCheckedInToday || isCheckingIn}
              onPress={handleCheckIn}
              style={{
                backgroundColor: checkInStatus.isCheckedInToday ? "#26262E" : "#D4AF37",
                borderColor: checkInStatus.isCheckedInToday ? "rgba(255, 255, 255, 0.1)" : "#D4AF37",
              }}
              className="mt-5 h-13 py-3.5 flex-row items-center justify-center rounded-2xl border shadow-lg"
            >
              {isCheckingIn ? (
                <ActivityIndicator size="small" color="#141210" />
              ) : checkInStatus.isCheckedInToday ? (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text className="ml-2 font-black text-zinc-400 text-sm uppercase tracking-wide">
                    Đã Điểm Danh Hôm Nay
                  </Text>
                </>
              ) : (
                <>
                  <FontAwesome5 name="gift" size={16} color="#141210" />
                  <Text className="ml-2 font-black text-[#141210] text-sm uppercase tracking-wide">
                    Điểm Danh Hôm Nay
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* 4. DAILY QUEST / MISSION SECTION */}
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-lg font-black text-white">
                Nhiệm Vụ Kiếm Xu
              </Text>
              <View
                style={{ backgroundColor: "rgba(212, 175, 55, 0.15)", borderColor: "rgba(212, 175, 55, 0.35)" }}
                className="ml-3 px-2.5 py-0.5 rounded-full border"
              >
                <Text className="text-[10px] font-extrabold text-[#D4AF37]">
                  Hôm Nay
                </Text>
              </View>
            </View>

            <Text className="text-xs font-bold text-zinc-400">
              {visibleMissions.length} nhiệm vụ
            </Text>
          </View>

          {isLoading && visibleMissions.length === 0 ? (
            <View className="items-center py-14">
              <ActivityIndicator size="large" color="#D4AF37" />
              <Text className="mt-3 text-xs text-zinc-400">
                Đang tải nhiệm vụ...
              </Text>
            </View>
          ) : visibleMissions.length === 0 ? (
            <View
              style={{ backgroundColor: "#141417", borderColor: "rgba(255, 255, 255, 0.08)" }}
              className="items-center rounded-3xl border px-5 py-12"
            >
              <FontAwesome5 name="tasks" size={28} color="#71717A" />
              <Text className="mt-3 text-center text-xs font-semibold text-zinc-400">
                Hôm nay chưa có nhiệm vụ nào mới.
              </Text>
            </View>
          ) : (
            visibleMissions.map((mission) => (
              <MissionCard
                key={mission.missionId}
                mission={mission}
                onPressAd={() => {
                  (navigation as any).navigate("WatchAd", {
                    missionCode: mission.code,
                    rewardAmount: mission.rewardAmount,
                    missionTitle: mission.title,
                  });
                }}
              />
            ))
          )}
        </ScrollView>
      </CinematicBackground>
    </SafeAreaView>
  );
}
