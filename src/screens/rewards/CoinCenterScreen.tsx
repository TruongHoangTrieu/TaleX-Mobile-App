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

  const nextStreak =
    checkInStatus.nextStreak ??
    (checkInStatus.currentStreak + (checkInStatus.isCheckedInToday ? 0 : 1));
  const todayRewardAmount = checkInStatus.todayRewardAmount;

  // Sắp xếp danh sách mốc theo ngày tăng dần
  const milestones = useMemo(() => {
    if (!Array.isArray(checkInStatus.milestones) || checkInStatus.milestones.length === 0) {
      return [];
    }
    return [...checkInStatus.milestones].sort((a, b) => a.day - b.day);
  }, [checkInStatus.milestones]);

  // Mốc tối đa và mốc tiếp theo cần đạt
  const maxMilestoneDay = useMemo(() => {
    if (milestones.length === 0) return 30;
    return Math.max(...milestones.map((m) => m.day));
  }, [milestones]);

  const nextTargetMilestone = useMemo(() => {
    return milestones.find((m) => m.day > checkInStatus.currentStreak) ?? milestones[milestones.length - 1];
  }, [checkInStatus.currentStreak, milestones]);

  // % Tiến độ chuỗi tổng thể
  const overallProgress = useMemo(() => {
    if (maxMilestoneDay <= 0) return 0;
    return Math.min(100, Math.max(0, (checkInStatus.currentStreak / maxMilestoneDay) * 100));
  }, [checkInStatus.currentStreak, maxMilestoneDay]);

  const getMilestoneIcon = (day: number, isReached: boolean, isNextTarget: boolean) => {
    if (isReached) {
      return <Ionicons name="checkmark-circle" size={24} color="#10B981" />;
    }
    if (day >= 30) {
      return <FontAwesome5 name="trophy" size={20} color={isNextTarget ? "#F59E0B" : "#A1A1AA"} />;
    }
    if (day >= 14) {
      return <FontAwesome5 name="crown" size={19} color={isNextTarget ? "#EAB308" : "#A1A1AA"} />;
    }
    if (day >= 7) {
      return <FontAwesome5 name="gift" size={20} color={isNextTarget ? "#D4AF37" : "#A1A1AA"} />;
    }
    return <FontAwesome5 name="coins" size={18} color={isNextTarget ? "#D4AF37" : "#A1A1AA"} />;
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#000000" }}
      edges={["top", "bottom"]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <CinematicBackground>
        {/* 1. HEADER BAR */}
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
          {/* 2. SỐ DƯ VÍ & CHUỖI ĐIỂM DANH */}
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

          {/* 3. HERO CARD: TỔNG QUAN ĐIỂM DANH HOÀNG KIM */}
          <View
            style={{
              backgroundColor: "#141418",
              borderColor: checkInStatus.isCheckedInToday ? "rgba(16, 185, 129, 0.35)" : "rgba(212, 175, 55, 0.4)",
            }}
            className="mb-6 rounded-3xl border p-5 shadow-2xl relative overflow-hidden"
          >
            {/* Top Row: Flame Streak & Today Reward Badge */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center flex-1 mr-2">
                <View
                  style={{
                    backgroundColor: checkInStatus.isCheckedInToday
                      ? "rgba(16, 185, 129, 0.18)"
                      : "rgba(212, 175, 55, 0.18)",
                    borderColor: checkInStatus.isCheckedInToday
                      ? "rgba(16, 185, 129, 0.45)"
                      : "rgba(212, 175, 55, 0.45)",
                  }}
                  className="w-12 h-12 rounded-2xl border items-center justify-center mr-3"
                >
                  <FontAwesome5
                    name={checkInStatus.isCheckedInToday ? "check-circle" : "calendar-check"}
                    size={22}
                    color={checkInStatus.isCheckedInToday ? "#10B981" : "#D4AF37"}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-black text-white">
                    Điểm danh ngày {nextStreak}
                  </Text>
                  <Text className="text-xs text-zinc-400 mt-0.5">
                    {checkInStatus.isCheckedInToday
                      ? "Hôm nay bạn đã nhận thưởng điểm danh"
                      : todayRewardAmount
                        ? `Hôm nay nhận +${todayRewardAmount.toLocaleString("vi-VN")} Xu`
                        : "Điểm danh hàng ngày nhận xu khủng"}
                  </Text>
                </View>
              </View>

              {/* Reward Coin Badge Top Right */}
              {todayRewardAmount ? (
                <View
                  style={{
                    backgroundColor: checkInStatus.isCheckedInToday
                      ? "rgba(16, 185, 129, 0.15)"
                      : "rgba(212, 175, 55, 0.15)",
                    borderColor: checkInStatus.isCheckedInToday
                      ? "rgba(16, 185, 129, 0.35)"
                      : "rgba(212, 175, 55, 0.35)",
                  }}
                  className="flex-row items-center border px-3 py-1.5 rounded-xl"
                >
                  <FontAwesome5
                    name="coins"
                    size={12}
                    color={checkInStatus.isCheckedInToday ? "#10B981" : "#D4AF37"}
                  />
                  <Text
                    className={`ml-1.5 text-xs font-black ${
                      checkInStatus.isCheckedInToday ? "text-emerald-400" : "text-[#D4AF37]"
                    }`}
                  >
                    +{todayRewardAmount.toLocaleString("vi-VN")}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Check-In Action Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={checkInStatus.isCheckedInToday || isCheckingIn}
              onPress={handleCheckIn}
              style={{
                backgroundColor: checkInStatus.isCheckedInToday ? "#222228" : "#D4AF37",
                borderColor: checkInStatus.isCheckedInToday ? "rgba(255, 255, 255, 0.1)" : "#D4AF37",
                height: 48,
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 16,
                borderWidth: 1,
              }}
              className="shadow-lg"
            >
              {isCheckingIn ? (
                <ActivityIndicator size="small" color="#141210" />
              ) : checkInStatus.isCheckedInToday ? (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: "#A1A1AA",
                      marginLeft: 8,
                      letterSpacing: 0.5,
                    }}
                  >
                    ĐÃ ĐIỂM DANH HÔM NAY
                  </Text>
                </>
              ) : (
                <>
                  <FontAwesome5 name="gift" size={14} color="#141210" />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "800",
                      color: "#141210",
                      marginLeft: 8,
                      letterSpacing: 0.5,
                    }}
                  >
                    {todayRewardAmount
                      ? `ĐIỂM DANH +${todayRewardAmount.toLocaleString("vi-VN")} XU`
                      : "ĐIỂM DANH NGAY"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* 4. MỐC THƯỞNG CHUỖI: BENTO GRID 2X2 (HIỂN THỊ TRỌN VẸN, KHÔNG CẦN VUỐT) */}
          {milestones.length > 0 && (
            <View
              style={{ backgroundColor: "#141418", borderColor: "rgba(255, 255, 255, 0.08)" }}
              className="mb-7 rounded-3xl border p-5 shadow-xl"
            >
              {/* Header Mục Mốc Thưởng */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View
                    style={{ backgroundColor: "rgba(212, 175, 55, 0.15)" }}
                    className="w-8 h-8 rounded-xl items-center justify-center mr-2.5"
                  >
                    <FontAwesome5 name="gem" size={13} color="#D4AF37" />
                  </View>
                  <View>
                    <Text className="text-base font-black text-white">
                      Mốc Thưởng Chuỗi Ngày
                    </Text>
                    <Text className="text-xs text-zinc-400 mt-0.5">
                      Tích lũy chuỗi ngày để mở khóa rương xu khủng
                    </Text>
                  </View>
                </View>

                {/* Badge chuỗi hiện tại */}
                <View
                  style={{ backgroundColor: "rgba(251, 146, 60, 0.15)", borderColor: "rgba(251, 146, 60, 0.35)" }}
                  className="flex-row items-center border px-2.5 py-1 rounded-xl"
                >
                  <MaterialCommunityIcons name="fire" size={14} color="#FB923C" />
                  <Text className="text-[11px] font-black text-white ml-1">
                    {checkInStatus.currentStreak} ngày
                  </Text>
                </View>
              </View>

              {/* Bento Grid 2 Cột - Hiển thị gọn gàng, trực quan */}
              <View className="flex-row flex-wrap justify-between gap-y-3">
                {milestones.map((item) => {
                  const isReached = checkInStatus.currentStreak >= item.day;
                  const isNextTarget =
                    !isReached &&
                    (nextTargetMilestone?.day === item.day || nextStreak === item.day);

                  const milestoneName =
                    item.day >= 30
                      ? "Mốc Siêu Quà 30 Ngày"
                      : item.day >= 14
                        ? "Mốc Thưởng 14 Ngày"
                        : item.day >= 7
                          ? "Mốc Tuần 7 Ngày"
                          : "Mốc Khởi Đầu 1 Ngày";

                  const remainingDays = Math.max(0, item.day - checkInStatus.currentStreak);

                  return (
                    <View
                      key={`bento-card-${item.day}`}
                      style={{
                        width: milestones.length <= 2 ? "100%" : "48.5%",
                        backgroundColor: isReached
                          ? "rgba(16, 185, 129, 0.1)"
                          : isNextTarget
                            ? "rgba(212, 175, 55, 0.14)"
                            : "#1B1B20",
                        borderColor: isReached
                          ? "rgba(16, 185, 129, 0.45)"
                          : isNextTarget
                            ? "#D4AF37"
                            : "rgba(255, 255, 255, 0.08)",
                        borderWidth: isNextTarget ? 1.5 : 1,
                      }}
                      className="p-3.5 rounded-2xl justify-between shadow-sm"
                    >
                      {/* Top: Header Card */}
                      <View className="flex-row items-center justify-between mb-2">
                        <View
                          style={{
                            backgroundColor: isReached
                              ? "rgba(16, 185, 129, 0.2)"
                              : isNextTarget
                                ? "rgba(212, 175, 55, 0.2)"
                                : "rgba(255, 255, 255, 0.06)",
                          }}
                          className="px-2.5 py-0.5 rounded-md"
                        >
                          <Text
                            className={`text-[10px] font-black uppercase ${
                              isReached
                                ? "text-emerald-400"
                                : isNextTarget
                                  ? "text-[#D4AF37]"
                                  : "text-zinc-400"
                            }`}
                          >
                            MỐC {item.day} NGÀY
                          </Text>
                        </View>

                        {getMilestoneIcon(item.day, isReached, isNextTarget)}
                      </View>

                      {/* Center: Title & Reward Amount */}
                      <View className="my-1">
                        <Text className="text-[11px] font-bold text-zinc-400" numberOfLines={1}>
                          {milestoneName}
                        </Text>
                        <Text
                          className={`text-base font-black tracking-tight mt-0.5 ${
                            isReached
                              ? "text-emerald-400"
                              : isNextTarget
                                ? "text-[#D4AF37]"
                                : "text-white"
                          }`}
                        >
                          +{item.rewardAmount.toLocaleString("vi-VN")} Xu
                        </Text>
                      </View>

                      {/* Bottom: Status Tag */}
                      <View
                        style={{
                          backgroundColor: isReached
                            ? "rgba(16, 185, 129, 0.18)"
                            : isNextTarget
                              ? "rgba(212, 175, 55, 0.2)"
                              : "rgba(255, 255, 255, 0.04)",
                        }}
                        className="mt-2 py-1 rounded-xl items-center"
                      >
                        <Text
                          className={`text-[9px] font-black uppercase ${
                            isReached
                              ? "text-emerald-400"
                              : isNextTarget
                                ? "text-[#D4AF37]"
                                : "text-zinc-500"
                          }`}
                        >
                          {isReached
                            ? "✓ ĐÃ ĐẠT MỐC"
                            : isNextTarget
                              ? "★ ĐANG TIẾN TỚI"
                              : `CÒN ${remainingDays} NGÀY`}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

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
