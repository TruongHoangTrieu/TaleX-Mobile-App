import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getSubscriptions,
  type SubscriptionDurationUnit,
  type SubscriptionPlan,
} from "@/services/subscription";

const formatCurrency = (price: number) =>
  `${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} VNĐ`;

const formatDurationUnit = (unit: SubscriptionDurationUnit) => {
  switch (unit) {
    case "DAYS":
      return "ngày";
    case "MONTHS":
      return "tháng";
    case "YEARS":
      return "năm";
  }
};

const getBenefits = (plan: SubscriptionPlan) => [
  ...(plan.isAdBlocked ? ["Trải nghiệm xem không quảng cáo"] : []),
  ...(plan.isStoryUnlocked
    ? ["Đọc truyện tranh kỹ thuật số không giới hạn"]
    : []),
  ...(plan.isMovieUnlocked ? ["Mở khóa toàn bộ kho phim & series"] : []),
  "Hỗ trợ chất lượng 4K HDR & Âm thanh vòm",
];

export default function SubscriptionPlansScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  const maxPrice = useMemo(
    () => plans.reduce((max, plan) => Math.max(max, plan.price), 0),
    [plans],
  );

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = await getSubscriptions();

    if (result.success) {
      setPlans(result.data ?? []);
    } else {
      setPlans([]);
      setError(result.message || "Không thể tải danh sách gói Premium.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const isPopular =
      plan.tier.toLowerCase().includes("premium") || plan.price === maxPrice;
    const benefits = getBenefits(plan);

    return (
      <View
        key={plan.subscriptionId}
        className={`relative mb-5 rounded-2xl bg-[#1C1A18] px-5 pb-5 pt-6 ${
          isPopular ? "border border-[#D4AF37]" : "border border-white/5"
        }`}
      >
        {isPopular && (
          <View className="absolute -top-3 self-center rounded-full bg-[#D4AF37] px-4 py-1">
            <Text className="text-[10px] font-black tracking-wider text-[#141210]">
              PHỔ BIẾN NHẤT
            </Text>
          </View>
        )}

        <View className="flex-row items-start justify-between">
          <View className="mr-4 flex-1">
            <Text className="text-xl font-black text-white">{plan.tier}</Text>
            <Text className="mt-2 text-sm leading-5 text-[#A19E95]">
              {plan.description}
            </Text>
          </View>

          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/10">
            <MaterialCommunityIcons name="crown" size={25} color="#D4AF37" />
          </View>
        </View>

        <View className="mt-5 flex-row items-end">
          <Text className="text-3xl font-black text-[#D4AF37]">
            {formatCurrency(plan.price)}
          </Text>
        </View>

        <Text className="mt-1 text-sm font-semibold text-[#E5E0D8]">
          {plan.duration} {formatDurationUnit(plan.durationUnit)}
        </Text>

        <View className="my-5 h-[1px] bg-white/10" />

        <View>
          {benefits.map((benefit) => (
            <View key={benefit} className="mb-3 flex-row items-start">
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color="#D4AF37"
              />
              <Text className="ml-3 flex-1 text-sm leading-5 text-[#E5E0D8]">
                {benefit}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert("Thông báo", `Tiến hành thanh toán gói ${plan.tier}`)
          }
          className="mt-3 h-12 items-center justify-center rounded-xl bg-[#D4AF37]"
        >
          <Text className="text-sm font-black uppercase tracking-wide text-[#141210]">
            Chọn Gói Này
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#141210]">
      <StatusBar barStyle="light-content" backgroundColor="#141210" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingTop: 28,
          paddingBottom: 110,
        }}
      >
        <View className="mb-7">
          <Text className="text-[32px] font-black text-white">
            TaleX Premium
          </Text>
          <Text className="mt-2 text-sm leading-5 text-[#A19E95]">
            Mở khóa trải nghiệm giải trí trọn vẹn với phim, truyện tranh và đặc
            quyền không quảng cáo.
          </Text>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center py-24">
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text className="mt-4 text-sm font-semibold text-[#A19E95]">
              Đang tải gói Premium...
            </Text>
          </View>
        ) : error ? (
          <View className="items-center justify-center rounded-2xl border border-red-500/20 bg-red-950/10 px-5 py-8">
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={38}
              color="#EF4444"
            />
            <Text className="mt-3 text-center text-sm font-semibold leading-5 text-red-400">
              {error}
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={loadSubscriptions}
              className="mt-5 h-11 items-center justify-center rounded-xl bg-[#D4AF37] px-6"
            >
              <Text className="text-sm font-black text-[#141210]">Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : plans.length === 0 ? (
          <View className="items-center justify-center rounded-2xl border border-white/5 bg-[#1C1A18] px-5 py-10">
            <MaterialCommunityIcons
              name="crown-outline"
              size={42}
              color="#7C766B"
            />
            <Text className="mt-3 text-center text-sm font-semibold text-[#A19E95]">
              Chưa có gói Premium nào.
            </Text>
          </View>
        ) : (
          plans.map(renderPlanCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
