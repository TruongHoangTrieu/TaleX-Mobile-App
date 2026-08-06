import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import {
  FontAwesome5,
  Ionicons,
  Feather,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { getNextCreatorTier, type NextCreatorTierData } from "@/services/creator";

function formatWatchTime(seconds: number): string {
  if (seconds <= 0) return "0s";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = (seconds / 3600).toFixed(1);
  return `${hours}h`;
}

interface CreatorTierModalProps {
  visible: boolean;
  onClose: () => void;
  currentTierLevel?: number;
  currentFollowers?: number;
  currentViews?: number;
  currentWatchTime?: number;
}

export function CreatorTierModal({
  visible,
  onClose,
  currentTierLevel = 0,
  currentFollowers = 0,
  currentViews = 0,
  currentWatchTime = 0,
}: CreatorTierModalProps) {
  const [loading, setLoading] = useState(true);
  const [nextTier, setNextTier] = useState<NextCreatorTierData | null>(null);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      getNextCreatorTier(currentTierLevel)
        .then((data) => {
          setNextTier(data);
        })
        .catch(() => setNextTier(null))
        .finally(() => setLoading(false));
    }
  }, [visible, currentTierLevel]);

  const minFollowers = nextTier?.minFollowerRequired || 1;
  const minViews = nextTier?.minViewsRequired || 1;
  const minWatchTime = nextTier?.minWatchTimeRequired || 1;

  const followerPct = Math.min(100, Math.round((currentFollowers / minFollowers) * 100));
  const viewsPct = Math.min(100, Math.round((currentViews / minViews) * 100));
  const watchTimePct = Math.min(100, Math.round((currentWatchTime / minWatchTime) * 100));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 bg-black/75 items-center justify-center p-4"
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[#16171A] border border-[#D4AF37]/40 rounded-3xl p-5 shadow-2xl"
        >
          {/* Top Title & Close Button */}
          <View className="flex-row items-center justify-between pb-3 border-b border-white/10">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 items-center justify-center">
                <FontAwesome5 name="award" size={15} color="#D4AF37" />
              </View>
              <Text className="text-white text-base font-black tracking-wide">
                Cấp độ sáng tạo
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 items-center justify-center"
            >
              <Feather name="x" size={16} color="#A1A1AA" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="py-10 items-center justify-center">
              <ActivityIndicator size="large" color="#D4AF37" />
              <Text className="text-zinc-400 text-xs font-semibold mt-3">
                Đang kiểm tra điều kiện thăng cấp...
              </Text>
            </View>
          ) : !nextTier ? (
            <View className="py-8 items-center text-center">
              <Text className="text-3xl mb-2">🏆</Text>
              <Text className="text-[#D4AF37] font-black text-lg text-center">
                Cấp độ Tối Đa!
              </Text>
              <Text className="text-zinc-400 text-xs text-center mt-1">
                Bạn đã đạt hạng Creator cao nhất hệ thống TaleX. Xin chúc mừng!
              </Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} className="mt-4">
              {/* Header Goal Banner */}
              <View className="bg-zinc-900/80 border border-white/5 p-3.5 rounded-2xl mb-4 flex-row items-center justify-between">
                <View className="flex-1 mr-2">
                  <Text className="text-[#D4AF37] text-[10px] font-black uppercase tracking-wider">
                    MỤC TIÊU THĂNG CẤP KẾ TIẾP
                  </Text>
                  <Text className="text-white text-sm font-black mt-0.5" numberOfLines={1}>
                    Level {nextTier.tierLevel}: {nextTier.tierName}
                  </Text>
                </View>
                <View className="bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-2.5 py-1 rounded-full">
                  <Text className="text-[#D4AF37] text-[10px] font-extrabold">
                    Hiện tại: Lvl {currentTierLevel}
                  </Text>
                </View>
              </View>

              {/* Condition Progress Bars */}
              <View className="mb-4">
                <Text className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mb-3">
                  Điều kiện cần đạt để thăng cấp
                </Text>

                {/* 1. Followers */}
                <View className="mb-3.5">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="people-outline" size={13} color="#10B981" />
                      <Text className="text-zinc-200 text-xs font-semibold">
                        Người đăng ký (Followers)
                      </Text>
                    </View>
                    <Text className="text-xs font-bold text-white">
                      <Text className="text-[#10B981]">{currentFollowers.toLocaleString("vi-VN")}</Text> / {minFollowers.toLocaleString("vi-VN")}
                    </Text>
                  </View>
                  <View className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <View
                      className="h-full bg-[#10B981] rounded-full"
                      style={{ width: `${followerPct}%` }}
                    />
                  </View>
                </View>

                {/* 2. Views */}
                <View className="mb-3.5">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="eye-outline" size={13} color="#D4AF37" />
                      <Text className="text-zinc-200 text-xs font-semibold">
                        Tổng lượt xem (Views)
                      </Text>
                    </View>
                    <Text className="text-xs font-bold text-white">
                      <Text className="text-[#D4AF37]">{currentViews.toLocaleString("vi-VN")}</Text> / {minViews.toLocaleString("vi-VN")}
                    </Text>
                  </View>
                  <View className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <View
                      className="h-full bg-[#D4AF37] rounded-full"
                      style={{ width: `${viewsPct}%` }}
                    />
                  </View>
                </View>

                {/* 3. Watch Time */}
                <View className="mb-3.5">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="time-outline" size={13} color="#818CF8" />
                      <Text className="text-zinc-200 text-xs font-semibold">
                        Thời gian xem tích lũy (Watch Time)
                      </Text>
                    </View>
                    <Text className="text-xs font-bold text-white">
                      <Text className="text-[#818CF8]">{formatWatchTime(currentWatchTime)}</Text> / {formatWatchTime(minWatchTime)}
                    </Text>
                  </View>
                  <View className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <View
                      className="h-full bg-[#6366F1] rounded-full"
                      style={{ width: `${watchTimePct}%` }}
                    />
                  </View>
                </View>
              </View>

              {/* Perks Grid */}
              <View className="pt-3 border-t border-white/10 mb-4">
                <Text className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider mb-2 flex-row items-center">
                  🛡️ QUYỀN LỢI KHI ĐẠT LEVEL {nextTier.tierLevel}
                </Text>

                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl p-2.5">
                    <Text className="text-zinc-400 text-[10px] font-medium">Quỹ Premium</Text>
                    <Text className="text-[#10B981] text-xs font-black mt-0.5">
                      +{(nextTier.premiumFundShareRatio * 100).toFixed(0)}% chia sẻ
                    </Text>
                  </View>

                  <View className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl p-2.5">
                    <Text className="text-zinc-400 text-[10px] font-medium">Bán trực tiếp</Text>
                    <Text className="text-[#D4AF37] text-xs font-black mt-0.5">
                      +{(nextTier.directPurchaseShareRatio * 100).toFixed(0)}% chia sẻ
                    </Text>
                  </View>
                </View>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onClose}
                className="w-full h-11 bg-[#D4AF37] rounded-xl items-center justify-center shadow-lg active:scale-98"
              >
                <Text className="text-[#141210] font-black text-xs uppercase tracking-wide">
                  Đã hiểu
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
