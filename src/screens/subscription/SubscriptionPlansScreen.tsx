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

// Chỉnh sửa 9: Định dạng tiền tệ kết thúc bằng 'đ' Thay vì 'VNĐ'
const formatCurrency = (price: number) =>
  `${price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}đ`;

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
        className={`relative mr-4 rounded-2xl bg-[#1C1A18] px-5 pb-5 pt-6 ${
          isPopular ? "border border-[#D4AF37]" : "border border-white/5"
        }`}
        // Chỉnh sửa 3: Card có chiều cao cố định 390 và rộng 300
        style={{
          width: 300,
          height: 390,
          overflow: "visible",
        }}
      >
        {isPopular && (
          <View className="absolute -top-3 self-center rounded-full bg-[#D4AF37] px-4 py-1">
            <Text className="text-[10px] font-black tracking-wider text-[#141210]">
              PHỔ BIẾN NHẤT
            </Text>
          </View>
        )}

        {/* Chỉnh sửa 8: Thêm icon vương miện lớn phía trên tên gói */}
        <View className="mb-5 h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/10">
          <MaterialCommunityIcons name="crown" size={30} color="#D4AF37" />
        </View>

        <View className="flex-row items-start justify-between">
          <View className="mr-4 flex-1">
            <Text className="text-xl font-black text-white">{plan.tier}</Text>
            {/* Chỉnh sửa 4: Bỏ hoàn toàn phần plan.description cũ ở đây */}
          </View>
        </View>

        {/* Chỉnh sửa 9: Cấu trúc hiển thị Giá mới kèm Đơn vị thời hạn bên dưới */}
        <View className="mt-3">
          <Text className="text-4xl font-black text-[#D4AF37]">
            {formatCurrency(plan.price)}
          </Text>
          <Text className="mt-1 text-sm font-semibold text-[#B7B2AA]">
            / {plan.duration} {formatDurationUnit(plan.durationUnit)}
          </Text>
        </View>

        <View className="my-5 h-[1px] bg-white/10" />

        {/* Chỉnh sửa 6: Thêm flex-1 vào View bọc danh sách để chiếm khoảng trống đẩy nút xuống đáy */}
        <View className="flex-1">
          {/* Chỉnh sửa 5: Giới hạn chỉ lấy tối đa 3 quyền lợi hiển thị trên Card */}
          {benefits.slice(0, 3).map((benefit) => (
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

        {/* Chỉnh sửa 7: Thay mt-3 thành mt-auto giúp Button luôn dính sát dưới đáy Card */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert("Thông báo", `Tiến hành thanh toán gói ${plan.tier}`)
          }
          className="mt-auto h-12 items-center justify-center rounded-xl bg-[#D4AF37]"
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
          paddingBottom: 40, // Đã giảm bớt bottom padding để cân đối với section thanh toán mới
        }}
      >
        {/* Chỉnh sửa 1: Thay đổi toàn bộ phần Header trung tâm */}
        <View className="items-center mb-8">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-[#D4AF37]/10">
            <MaterialCommunityIcons name="crown" size={42} color="#D4AF37" />
          </View>
          <Text className="mt-5 text-[32px] font-black text-white">
            TaleX Premium
          </Text>
          <Text className="mt-3 text-center text-base leading-6 text-[#A19E95]">
            Mở khóa toàn bộ trải nghiệm phim và truyện, thưởng thức nội dung
            chất lượng cao không quảng cáo.
          </Text>
        </View>

        {/* Chỉnh sửa 2: Bổ sung Section "Premium bao gồm" tổng quát ngay dưới Header */}
        <View className="mb-8 rounded-3xl bg-[#1C1A18] p-5">
          <Text className="mb-4 text-lg font-black text-white">
            Premium bao gồm
          </Text>
          {[
            "Không quảng cáo",
            "Mở khóa toàn bộ phim & series",
            "Đọc truyện không giới hạn",
            "4K HDR & Âm thanh vòm",
            "Ưu tiên nội dung mới",
          ].map((item) => (
            <View key={item} className="mb-4 flex-row items-center">
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color="#D4AF37"
              />
              <Text className="ml-3 text-base text-[#E5E0D8]">{item}</Text>
            </View>
          ))}
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingRight: 16,
              paddingTop: 12,
              paddingBottom: 12,
            }}
          >
            {plans.map(renderPlanCard)}
          </ScrollView>
        )}

        {/* Chỉnh sửa 10: Thêm phần chân trang "Thanh toán an toàn" bảo mật cuối màn hình */}
        <View className="mt-8 items-center">
          <MaterialCommunityIcons
            name="shield-check"
            size={26}
            color="#D4AF37"
          />
          <Text className="mt-2 text-center text-[#A19E95]">
            Thanh toán an toàn • Hủy bất cứ lúc nào
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
