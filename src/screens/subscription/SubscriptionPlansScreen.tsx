import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import CinematicBackground from "@/components/CinematicBackground";
import {
  getSubscriptions,
  type SubscriptionDurationUnit,
  type SubscriptionPlan,
} from "@/services/subscription";
import { useAuth } from "@/context/AuthContext";
import { buildPremiumWebUrl } from "@/utils/web-checkout-links";

const formatCurrency = (price?: number | null) => {
  if (price == null || isNaN(Number(price))) return "0đ";
  return `${Number(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}đ`;
};

const formatDurationUnit = (unit?: SubscriptionDurationUnit | string) => {
  if (!unit) return "tháng";
  const normalized = unit.toUpperCase();
  if (normalized.includes("DAY")) return "ngày";
  if (normalized.includes("MONTH")) return "tháng";
  if (normalized.includes("YEAR")) return "năm";
  return "tháng";
};

const calculateDailyRate = (price: number, duration: number, unit?: string) => {
  if (!price || !duration) return null;
  let days = duration;
  const normalized = (unit || "").toUpperCase();
  if (normalized.includes("MONTH")) days = duration * 30;
  else if (normalized.includes("YEAR")) days = duration * 365;
  if (days <= 0) return null;
  const rate = Math.round(price / days);
  return `~${rate.toLocaleString("vi-VN")}đ / ngày`;
};

// Danh sách 3 đặc quyền VIP
const VIP_PERKS = [
  {
    icon: <Feather name="slash" size={19} color="#D4AF37" />,
    title: "100% Không Quảng Cáo",
    desc: "Thưởng thức trọn vẹn từng khung hình liền mạch, không gián đoạn.",
  },
  {
    icon: <FontAwesome5 name="unlock-alt" size={17} color="#D4AF37" />,
    title: "Mở Khóa Toàn Bộ Kho VIP",
    desc: "Xem trước các tập phim & truyện tranh mới nhất không cần chờ đợi.",
  },
  {
    icon: <FontAwesome5 name="crown" size={17} color="#D4AF37" />,
    title: "Huy Hiệu VIP Danh Giá",
    desc: "Vương miện vàng hoàng kim độc quyền trên trang cá nhân & bình luận.",
  },
];

export default function SubscriptionPlansScreen() {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [showWebPaymentModal, setShowWebPaymentModal] = useState<boolean>(false);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = await getSubscriptions();

    if (result.success && result.data && result.data.length > 0) {
      setPlans(result.data);
      setSelectedPlanId(result.data[0].subscriptionId);
    } else {
      setPlans([]);
      setError(result.message || "Không thể tải danh sách gói Premium.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.subscriptionId === selectedPlanId) || (plans.length > 0 ? plans[0] : null),
    [plans, selectedPlanId],
  );

  return (
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <CinematicBackground>
        {/* ================= TOP NAVIGATION BAR ================= */}
        <View
          style={{ backgroundColor: "transparent", borderColor: "rgba(255, 255, 255, 0.08)" }}
          className="h-14 px-4 flex-row items-center justify-between border-b relative"
        >
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.goBack()}
            style={{ backgroundColor: "#18181C", borderColor: "rgba(255, 255, 255, 0.12)" }}
            className="h-10 w-10 items-center justify-center rounded-full border z-20"
          >
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View pointerEvents="none" className="absolute left-0 right-0 items-center justify-center z-10">
            <Text className="text-base font-black text-white tracking-wide">
              Hội Viên VIP TaleX
            </Text>
          </View>

          <View className="w-10 h-10" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 40,
          }}
        >
          {/* ================= HERO SECTION VỚI VƯƠNG MIỆN PHÁT SÁNG ================= */}
          <View className="items-center justify-center mt-2 mb-6">
            {/* Glowing Ambient Halo Circle */}
            <View
              style={{
                backgroundColor: "rgba(212, 175, 55, 0.12)",
                borderColor: "rgba(212, 175, 55, 0.35)",
              }}
              className="w-24 h-24 rounded-full items-center justify-center border shadow-2xl relative"
            >
              <View
                style={{
                  position: "absolute",
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: "rgba(212, 175, 55, 0.08)",
                }}
              />
              <FontAwesome5 name="crown" size={40} color="#D4AF37" />
            </View>

            {/* Subtitle Badge */}
            <View
              style={{
                backgroundColor: "rgba(212, 175, 55, 0.15)",
                borderColor: "rgba(212, 175, 55, 0.4)",
              }}
              className="flex-row items-center border px-3.5 py-1 rounded-full mt-4"
            >
              <Ionicons name="sparkles" size={12} color="#D4AF37" />
              <Text className="text-[#D4AF37] text-[11px] font-black tracking-widest ml-1.5 uppercase">
                TALEX VIP MEMBERSHIP
              </Text>
            </View>

            <Text className="text-center text-2xl font-black text-white mt-3 tracking-wide">
              Nâng Cấp Hội Viên VIP
            </Text>

            <Text className="text-center text-xs text-zinc-400 mt-1 px-4 leading-relaxed font-medium">
              Mở khóa thế giới phim ảnh và truyện tranh bản quyền đỉnh cao không giới hạn
            </Text>
          </View>

          {/* ================= 3 ĐẶC QUYỀN VIP BENTO GRID ================= */}
          <View className="mb-7">
            <Text className="text-xs font-black uppercase tracking-wider text-[#D4AF37] mb-3 px-1">
              ĐẶC QUYỀN HỘI VIÊN DÀNH CHO BẠN
            </Text>

            <View className="gap-y-2.5">
              {VIP_PERKS.map((perk, idx) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor: "#141418",
                    borderColor: "rgba(255, 255, 255, 0.07)",
                  }}
                  className="p-3.5 rounded-2xl border flex-row items-center"
                >
                  <View
                    style={{
                      backgroundColor: "rgba(212, 175, 55, 0.12)",
                      borderColor: "rgba(212, 175, 55, 0.25)",
                    }}
                    className="w-11 h-11 rounded-xl border items-center justify-center mr-3.5"
                  >
                    {perk.icon}
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-sm font-black">
                      {perk.title}
                    </Text>
                    <Text className="text-zinc-400 text-xs mt-0.5 leading-4 font-normal">
                      {perk.desc}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* ================= DANH SÁCH CÁC GÓI SUBSCRIPTION (DYNAMIC DATA TỪ SERVER) ================= */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Text className="text-xs font-black uppercase tracking-wider text-[#D4AF37]">
                CHỌN GÓI HỘI VIÊN PHÙ HỢP
              </Text>
              {plans.length > 0 && (
                <Text className="text-[11px] font-bold text-zinc-400">
                  {plans.length} lựa chọn
                </Text>
              )}
            </View>

            {loading ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="large" color="#D4AF37" />
                <Text className="mt-3 text-xs font-semibold text-zinc-400">
                  Đang tải danh sách gói VIP...
                </Text>
              </View>
            ) : error ? (
              <View className="items-center justify-center rounded-2xl border border-red-500/20 bg-red-950/10 px-5 py-8 mb-4">
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={36}
                  color="#EF4444"
                />
                <Text className="mt-2.5 text-center text-xs font-semibold text-red-400">
                  {error}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={loadSubscriptions}
                  className="mt-4 h-10 items-center justify-center rounded-xl bg-[#D4AF37] px-6"
                >
                  <Text className="text-xs font-black text-black">Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : plans.length === 0 ? (
              <View className="items-center justify-center rounded-2xl border border-white/5 bg-[#141418] px-5 py-10 mb-4">
                <MaterialCommunityIcons
                  name="crown-outline"
                  size={40}
                  color="#71717A"
                />
                <Text className="mt-3 text-center text-xs font-semibold text-zinc-400">
                  Hiện tại chưa có gói VIP nào khả dụng.
                </Text>
              </View>
            ) : (
              <View className="gap-y-3">
                {plans.map((plan, idx) => {
                  const isSelected = selectedPlanId === plan.subscriptionId;
                  const isBestValue = idx === plans.length - 1 || plan.duration >= 6;
                  const dailyRate = calculateDailyRate(plan.price, plan.duration, plan.durationUnit);
                  const durationText = `${plan.duration} ${formatDurationUnit(plan.durationUnit)}`;

                  return (
                    <TouchableOpacity
                      key={plan.subscriptionId}
                      activeOpacity={0.85}
                      onPress={() => setSelectedPlanId(plan.subscriptionId)}
                      style={{
                        backgroundColor: isSelected ? "rgba(212, 175, 55, 0.12)" : "#141418",
                        borderColor: isSelected ? "#D4AF37" : "rgba(255, 255, 255, 0.08)",
                        borderWidth: isSelected ? 2 : 1,
                      }}
                      className="w-full p-4 rounded-2xl relative shadow-lg"
                    >
                      {/* Best Value Ribbon Badge */}
                      {isBestValue && (
                        <View
                          style={{ backgroundColor: "#D4AF37" }}
                          className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full shadow-md"
                        >
                          <Text className="text-black text-[9px] font-black uppercase tracking-wider">
                            TIẾT KIỆM NHẤT
                          </Text>
                        </View>
                      )}

                      <View className="flex-row items-center justify-between">
                        {/* Left: Radio & Name & Dynamic Description */}
                        <View className="flex-row items-center flex-1 mr-3">
                          <View
                            style={{
                              borderColor: isSelected ? "#D4AF37" : "#52525B",
                              backgroundColor: isSelected ? "#D4AF37" : "transparent",
                            }}
                            className="w-5 h-5 rounded-full items-center justify-center mr-3 border"
                          >
                            {isSelected && (
                              <Ionicons name="checkmark-sharp" size={13} color="#0A0A0C" />
                            )}
                          </View>

                          <View className="flex-1">
                            <Text className="text-white text-[15px] font-black" numberOfLines={1}>
                              {plan.tier ? plan.tier : `Gói ${durationText}`}
                            </Text>

                            {/* Mô tả từ server hoặc thời hạn thực tế */}
                            <Text className="text-zinc-400 text-xs font-medium mt-0.5" numberOfLines={1}>
                              {plan.description ? plan.description : `Thời hạn sử dụng: ${durationText}`}
                            </Text>

                            {/* Dynamic feature tags directly from backend booleans */}
                            <View className="flex-row items-center flex-wrap gap-1.5 mt-2">
                              {plan.isAdBlocked && (
                                <View
                                  style={{ backgroundColor: "rgba(212, 175, 55, 0.15)", borderColor: "rgba(212, 175, 55, 0.3)" }}
                                  className="px-2 py-0.5 rounded-md border"
                                >
                                  <Text className="text-[10px] font-black text-[#D4AF37]">
                                    Không QC
                                  </Text>
                                </View>
                              )}
                              {plan.isMovieUnlocked && (
                                <View
                                  style={{ backgroundColor: "rgba(56, 189, 248, 0.12)", borderColor: "rgba(56, 189, 248, 0.3)" }}
                                  className="px-2 py-0.5 rounded-md border"
                                >
                                  <Text className="text-[10px] font-black text-sky-400">
                                    Mở Phim
                                  </Text>
                                </View>
                              )}
                              {plan.isStoryUnlocked && (
                                <View
                                  style={{ backgroundColor: "rgba(52, 211, 153, 0.12)", borderColor: "rgba(52, 211, 153, 0.3)" }}
                                  className="px-2 py-0.5 rounded-md border"
                                >
                                  <Text className="text-[10px] font-black text-emerald-400">
                                    Mở Truyện
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>

                        {/* Right: Price & Daily Rate */}
                        <View className="items-end">
                          <Text
                            className={`text-lg font-black ${
                              isSelected ? "text-[#D4AF37]" : "text-white"
                            }`}
                          >
                            {formatCurrency(plan.price)}
                          </Text>
                          {dailyRate && (
                            <Text className="text-zinc-400 text-[11px] font-medium mt-0.5">
                              {dailyRate}
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

        {/* ================= NÚT THANH TOÁN CTA LỚN ================= */}
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!selectedPlan || loading}
          onPress={() => {
            if (!selectedPlan) return;
            if (!isAuthenticated) {
              navigation.navigate("LoginScreen");
              return;
            }
            setShowWebPaymentModal(true);
          }}
          className="mt-2 mb-4"
        >
          <LinearGradient
            colors={["#D4AF37", "#F5D46E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#D4AF37",
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <View className="flex-row items-center">
              <FontAwesome5 name="crown" size={15} color="#0A0A0C" />
              <Text className="text-black font-black text-sm uppercase tracking-wider ml-2">
                {selectedPlan
                  ? `KÍCH HOẠT VIP NGAY • ${formatCurrency(selectedPlan.price)}`
                  : "KÍCH HOẠT VIP NGAY"}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Trust Badges & Footer */}
        <View className="items-center pb-2">
          <View className="flex-row items-center mb-1">
            <Ionicons name="shield-checkmark-outline" size={13} color="#71717A" />
            <Text className="text-zinc-500 text-[11px] font-medium ml-1.5">
              Thanh toán an toàn • Hỗ trợ VNPAY, MoMo, Thẻ quốc tế
            </Text>
          </View>
          <Text className="text-zinc-600 text-[10px] font-medium">
            Có thể hủy bất cứ lúc nào qua trang quản lý tài khoản
          </Text>
        </View>
      </ScrollView>

      {/* ================= CUSTOM DARK GOLD WEB PAYMENT MODAL ================= */}
      <Modal
        visible={showWebPaymentModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowWebPaymentModal(false)}
      >
        <View className="flex-1 bg-black/80 items-center justify-center p-5">
          <View
            style={{ backgroundColor: "#151418", borderColor: "rgba(255, 255, 255, 0.1)" }}
            className="w-full max-w-sm rounded-3xl p-5 border shadow-2xl"
          >
            {/* 1. Header with Lock Icon & Close Button */}
            <View className="flex-row items-center justify-between pb-4 border-b border-white/5">
              <View className="flex-row items-center">
                <View
                  style={{
                    backgroundColor: "rgba(212, 175, 55, 0.15)",
                    borderColor: "rgba(212, 175, 55, 0.4)",
                  }}
                  className="w-9 h-9 rounded-xl items-center justify-center border mr-2.5"
                >
                  <Ionicons name="lock-closed" size={16} color="#D4AF37" />
                </View>
                <Text className="text-white font-black text-base">
                  Thanh Toán Gói VIP
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setShowWebPaymentModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:opacity-75"
              >
                <Ionicons name="close" size={18} color="#A1A1AA" />
              </TouchableOpacity>
            </View>

            {/* 2. Selected Plan Top Card */}
            {selectedPlan && (
              <View
                style={{
                  backgroundColor: "rgba(212, 175, 55, 0.08)",
                  borderColor: "rgba(212, 175, 55, 0.25)",
                }}
                className="mt-4 p-3.5 rounded-2xl border"
              >
                <Text className="text-[#D4AF37] text-[10px] font-black uppercase tracking-wider">
                  GÓI ĐƯỢC CHỌN
                </Text>
                <Text className="text-white font-black text-sm mt-0.5" numberOfLines={1}>
                  {selectedPlan.tier || "VIP"} • {selectedPlan.duration} {formatDurationUnit(selectedPlan.durationUnit)}
                </Text>
              </View>
            )}

            {/* 3. Center Web Icon & Headline */}
            <View className="items-center my-4">
              <View
                style={{
                  backgroundColor: "rgba(212, 175, 55, 0.15)",
                  borderColor: "rgba(212, 175, 55, 0.35)",
                }}
                className="w-14 h-14 rounded-2xl items-center justify-center border mb-3 shadow-md shadow-[#D4AF37]/20"
              >
                <MaterialCommunityIcons name="credit-card-outline" size={28} color="#D4AF37" />
              </View>

              <Text className="text-white font-black text-base text-center">
                Thanh Toán Trên Website TaleX
              </Text>

              <Text className="text-zinc-400 text-xs text-center mt-1.5 leading-relaxed font-normal px-2">
                Để đảm bảo bảo mật và hỗ trợ nhiều phương thức thanh toán (VNPAY, MoMo, ATM), bạn sẽ được chuyển đến trang thanh toán chính thức của TaleX.
              </Text>
            </View>

            {/* 4. Price & Duration Detail Card */}
            {selectedPlan && (
              <View
                style={{
                  backgroundColor: "#1C1B20",
                  borderColor: "rgba(255, 255, 255, 0.08)",
                }}
                className="p-3.5 rounded-2xl border mb-5"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-zinc-400 text-xs">Gói hội viên:</Text>
                  <Text className="text-white font-bold text-xs">
                    {selectedPlan.tier || "VIP"}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-zinc-400 text-xs">Tổng thanh toán:</Text>
                  <Text className="text-[#D4AF37] font-black text-sm">
                    {formatCurrency(selectedPlan.price)}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between">
                  <Text className="text-zinc-400 text-xs">Thời hạn sử dụng:</Text>
                  <Text className="text-zinc-300 font-semibold text-xs">
                    {selectedPlan.duration} {formatDurationUnit(selectedPlan.durationUnit)}
                  </Text>
                </View>
              </View>
            )}

            {/* 5. Action Buttons */}
            <View className="gap-y-2.5">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setShowWebPaymentModal(false);
                  Linking.openURL(buildPremiumWebUrl(selectedPlan?.subscriptionId));
                }}
                style={{ backgroundColor: "#D4AF37" }}
                className="w-full h-12 rounded-2xl items-center justify-center flex-row shadow-lg active:scale-[0.98]"
              >
                <Feather name="external-link" size={16} color="#000000" style={{ marginRight: 6 }} />
                <Text className="text-black font-black text-xs uppercase tracking-wider">
                  MỞ TRANG THANH TOÁN
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowWebPaymentModal(false)}
                className="w-full h-11 rounded-2xl bg-white/10 items-center justify-center active:opacity-75"
              >
                <Text className="text-zinc-300 font-bold text-xs">
                  Đóng
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </CinematicBackground>
    </SafeAreaView>
  );
}
