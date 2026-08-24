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
} from "@expo/vector-icons";
import {
  getNextCreatorTier,
  getCreatorTiers,
  type NextCreatorTierData,
} from "@/services/creator";

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
  const [tiersList, setTiersList] = useState<NextCreatorTierData[]>([]);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      Promise.all([
        getNextCreatorTier(currentTierLevel),
        getCreatorTiers(),
      ])
        .then(([nextData, listData]) => {
          setNextTier(nextData);
          setTiersList(listData);
        })
        .catch(() => {
          setNextTier(null);
          setTiersList([]);
        })
        .finally(() => setLoading(false));
    }
  }, [visible, currentTierLevel]);

  const currentTier =
    tiersList.find((t) => t.tierLevel === currentTierLevel) ||
    (currentTierLevel === 0 ? tiersList.find((t) => t.isDefault) : null);

  const minFollowers = nextTier?.minFollowerRequired || 1;
  const minViews = nextTier?.minViewsRequired || 1;
  const minWatchTime = nextTier?.minWatchTimeRequired || 1;

  const followerPct = Math.min(100, Math.round((currentFollowers / minFollowers) * 100));
  const viewsPct = Math.min(100, Math.round((currentViews / minViews) * 100));
  const watchTimePct = Math.min(100, Math.round((currentWatchTime / minWatchTime) * 100));

  const currentPremiumRatio =
    currentTier?.premiumFundShareRatio != null
      ? (currentTier.premiumFundShareRatio * 100).toFixed(0)
      : "0";
  const currentDirectRatio =
    currentTier?.directPurchaseShareRatio != null
      ? (currentTier.directPurchaseShareRatio * 100).toFixed(0)
      : "0";

  const nextPremiumRatio =
    nextTier?.premiumFundShareRatio != null
      ? (nextTier.premiumFundShareRatio * 100).toFixed(0)
      : "0";
  const nextDirectRatio =
    nextTier?.directPurchaseShareRatio != null
      ? (nextTier.directPurchaseShareRatio * 100).toFixed(0)
      : "0";

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
        className="flex-1 bg-transparent items-center justify-center p-4"
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[#16171A] border border-[#D4AF37]/50 rounded-3xl p-5 shadow-2xl"
        >
          {/* Top Title & Close Button */}
          <View className="flex-row items-center justify-between pb-3 border-b border-white/10">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 items-center justify-center">
                <FontAwesome5 name="award" size={15} color="#D4AF37" />
              </View>
              <View>
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-white text-sm font-black tracking-wide">
                    Level {currentTierLevel}
                  </Text>
                  {currentTier?.tierName ? (
                    <Text className="text-[#D4AF37] text-xs font-bold">
                      • {currentTier.tierName}
                    </Text>
                  ) : null}
                </View>
                {nextTier ? (
                  <Text className="text-zinc-400 text-[10.5px] font-medium">
                    Mục tiêu: <Text className="text-zinc-200 font-bold">Level {nextTier.tierLevel} ({nextTier.tierName})</Text>
                  </Text>
                ) : null}
              </View>
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
                Đang tải dữ liệu cấp bậc...
              </Text>
            </View>
          ) : !nextTier ? (
            /* TRƯỜNG HỢP CẤP TỐI ĐA */
            <View className="py-5 space-y-4">
              <View className="flex-row items-center gap-2.5 pb-2">
                <View className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 items-center justify-center">
                  <FontAwesome5 name="award" size={18} color="#D4AF37" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-sm font-black">
                    Level {currentTierLevel}: {currentTier?.tierName || "Cấp Độ Tối Đa"}
                  </Text>
                  <Text className="text-amber-400 text-[11px] font-bold mt-0.5">
                    Hạng Creator cao nhất hệ thống
                  </Text>
                </View>
              </View>

              <View className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2">
                <View className="flex-row items-center gap-1.5">
                  <Feather name="shield" size={13} color="#F59E0B" />
                  <Text className="text-amber-400 text-[11px] font-bold uppercase tracking-wider">
                    Đặc quyền tối đa đang sở hữu
                  </Text>
                </View>
                <View className="flex-row gap-2 mt-1">
                  <View className="flex-1 rounded-xl bg-black/50 border border-white/5 p-2.5">
                    <Text className="text-zinc-400 text-[10px]">Quỹ Premium</Text>
                    <Text className="text-emerald-400 font-black text-xs mt-0.5">
                      +{currentPremiumRatio}% chia sẻ
                    </Text>
                  </View>
                  <View className="flex-1 rounded-xl bg-black/50 border border-white/5 p-2.5">
                    <Text className="text-zinc-400 text-[10px]">Bán trực tiếp</Text>
                    <Text className="text-amber-400 font-black text-xs mt-0.5">
                      +{currentDirectRatio}% chia sẻ
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onClose}
                className="w-full h-11 bg-[#D4AF37] rounded-xl items-center justify-center mt-2 shadow-lg"
              >
                <Text className="text-[#141210] font-black text-xs uppercase tracking-wide">
                  Đã hiểu
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* TẤT CẢ THÔNG TIN TRONG 1 KHUNG NHẤT QUÁN (KHÔNG CẦN CHIA TAB, KHÔNG EMOJI) */
            <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
              {/* PHẦN 1: TIẾN ĐỘ THĂNG CẤP */}
              <View className="mb-4">
                <Text className="text-zinc-400 text-[10.5px] font-bold uppercase tracking-wider mb-2.5">
                  Điều kiện thăng cấp
                </Text>

                {/* 1. Followers */}
                <View className="mb-2.5">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="people-outline" size={13} color="#10B981" />
                      <Text className="text-zinc-200 text-xs font-semibold">
                        Followers (Người đăng ký)
                      </Text>
                    </View>
                    <Text className="text-xs font-bold text-white">
                      <Text className="text-[#10B981]">{currentFollowers.toLocaleString("vi-VN")}</Text> / {minFollowers.toLocaleString("vi-VN")}
                    </Text>
                  </View>
                  <View className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <View
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${followerPct}%` }}
                    />
                  </View>
                </View>

                {/* 2. Views */}
                <View className="mb-2.5">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="eye-outline" size={13} color="#D4AF37" />
                      <Text className="text-zinc-200 text-xs font-semibold">
                        Tổng Lượt xem (Views)
                      </Text>
                    </View>
                    <Text className="text-xs font-bold text-white">
                      <Text className="text-[#D4AF37]">{currentViews.toLocaleString("vi-VN")}</Text> / {minViews.toLocaleString("vi-VN")}
                    </Text>
                  </View>
                  <View className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <View
                      className="h-full bg-[#D4AF37] rounded-full"
                      style={{ width: `${viewsPct}%` }}
                    />
                  </View>
                </View>

                {/* 3. Watch Time */}
                <View className="mb-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="time-outline" size={13} color="#818CF8" />
                      <Text className="text-zinc-200 text-xs font-semibold">
                        Thời gian xem (Watch Time)
                      </Text>
                    </View>
                    <Text className="text-xs font-bold text-white">
                      <Text className="text-[#818CF8]">{formatWatchTime(currentWatchTime)}</Text> / {formatWatchTime(minWatchTime)}
                    </Text>
                  </View>
                  <View className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <View
                      className="h-full bg-[#6366F1] rounded-full"
                      style={{ width: `${watchTimePct}%` }}
                    />
                  </View>
                </View>
              </View>

              {/* PHẦN 2: SO SÁNH ĐẶC QUYỀN DOANH THU (HIỂN THỊ CÙNG 1 KHUNG) */}
              <View className="pt-3 border-t border-white/10 mb-4">
                <Text className="text-[#D4AF37] text-[10.5px] font-bold uppercase tracking-wider mb-2.5">
                  So sánh đặc quyền chia sẻ doanh thu
                </Text>

                <View className="flex-row gap-2.5">
                  {/* Cấp hiện tại */}
                  <View className="flex-1 rounded-2xl border border-white/10 bg-black/40 p-3">
                    <View className="flex-row items-center justify-between mb-2 pb-1.5 border-b border-white/5">
                      <Text className="text-zinc-400 text-[10px] font-bold uppercase">
                        Cấp hiện tại
                      </Text>
                      <View className="bg-white/10 px-1.5 py-0.5 rounded">
                        <Text className="text-zinc-300 text-[9px] font-black">
                          Lvl {currentTierLevel}
                        </Text>
                      </View>
                    </View>

                    <View className="space-y-1.5">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-zinc-400 text-[10.5px]">Premium:</Text>
                        <Text className="text-zinc-200 font-bold text-xs">
                          +{currentPremiumRatio}%
                        </Text>
                      </View>
                      <View className="flex-row justify-between items-center">
                        <Text className="text-zinc-400 text-[10.5px]">Bán trực tiếp:</Text>
                        <Text className="text-zinc-200 font-bold text-xs">
                          +{currentDirectRatio}%
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Mục tiêu tiếp theo */}
                  <View className="flex-1 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-3">
                    <View className="flex-row items-center justify-between mb-2 pb-1.5 border-b border-amber-500/20">
                      <Text className="text-amber-400 text-[10px] font-bold uppercase">
                        Mục tiêu kế tiếp
                      </Text>
                      <View className="bg-amber-500/20 px-1.5 py-0.5 rounded">
                        <Text className="text-amber-300 text-[9px] font-black">
                          Lvl {nextTier.tierLevel}
                        </Text>
                      </View>
                    </View>

                    <View className="space-y-1.5">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-zinc-400 text-[10.5px]">Premium:</Text>
                        <Text className="text-emerald-400 font-black text-xs">
                          +{nextPremiumRatio}%
                        </Text>
                      </View>
                      <View className="flex-row justify-between items-center">
                        <Text className="text-zinc-400 text-[10.5px]">Bán trực tiếp:</Text>
                        <Text className="text-amber-400 font-black text-xs">
                          +{nextDirectRatio}%
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Nút Đã hiểu */}
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
