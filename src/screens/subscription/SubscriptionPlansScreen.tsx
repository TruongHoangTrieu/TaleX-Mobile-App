import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import {
  getSubscriptions,
  type SubscriptionDurationUnit,
  type SubscriptionPlan,
} from "@/services/subscription";
import { useAuth } from "@/context/AuthContext";
import { getSsoHandoffCode } from "@/services/auth";
import { buildPremiumWebUrl } from "@/utils/web-checkout-links";

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

export default function SubscriptionPlansScreen() {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

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
    () => plans.find((p) => p.subscriptionId === selectedPlanId) || plans[0],
    [plans, selectedPlanId],
  );

  return (
    <View className="flex-1 bg-[#141210]">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ================= PREMIUM BACKGROUND IMAGE FROM ASSETS (CRISP, NO BLUR) ================= */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 420 }} pointerEvents="none">
        <Image
          source={require("@assets/premium.jpg")}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </View>

      <SafeAreaView edges={[]} className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingTop: 48,
            paddingBottom: 30,
          }}
        >
          {/* Top Bar with Back Button - Direct clean icon without any dark blur box */}
          <View className="flex-row items-center justify-between w-full h-12 mb-2">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.goBack()}
              className="p-1 active:opacity-70"
            >
              <Feather name="chevron-left" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <View className="w-10" />
          </View>

          {/* Centered Crown Halo Badge (Gold Theme) */}
          <View className="items-center justify-center my-4">
            <View className="w-24 h-24 rounded-full bg-[#D4AF37]/20 items-center justify-center border border-[#D4AF37]/40 shadow-2xl shadow-[#D4AF37]">
              <MaterialCommunityIcons name="crown" size={48} color="#D4AF37" />
            </View>
          </View>

          {/* Subscribe Title (Gold Theme) */}
          <Text className="text-center text-[30px] font-black text-[#D4AF37] tracking-wide mb-6">
            Đăng Ký Gói Premium
          </Text>

          {/* Feature Checkmarks (Gold Theme, Pure Vietnamese, No 4K) */}
          <View className="mb-8 px-2">
            {[
              "Xem mượt mà trên tất cả thiết bị",
              "Trải nghiệm xem không quảng cáo",
              "Mở khóa toàn bộ phim & truyện tranh",
            ].map((feature, idx) => (
              <View key={idx} className="flex-row items-center mb-3.5">
                <View className="w-6 h-6 rounded-full bg-[#D4AF37]/20 items-center justify-center mr-3 border border-[#D4AF37]/40">
                  <Feather name="check" size={14} color="#D4AF37" />
                </View>
                <Text className="text-white text-[15px] font-semibold flex-1">
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* Plans Loading / Error / Radio Selection Cards */}
          {loading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="large" color="#D4AF37" />
              <Text className="mt-3 text-sm font-semibold text-[#A19E95]">
                Đang tải danh sách gói Premium...
              </Text>
            </View>
          ) : error ? (
            <View className="items-center justify-center rounded-2xl border border-red-500/20 bg-red-950/10 px-5 py-8 mb-6">
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={38}
                color="#EF4444"
              />
              <Text className="mt-3 text-center text-sm font-semibold text-red-400">
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
            <View className="items-center justify-center rounded-2xl border border-white/5 bg-[#1C1A18] px-5 py-10 mb-6">
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
            /* Selectable Plan Cards with Radio Buttons (Gold Theme) */
            <View className="mb-6">
              {plans.map((plan) => {
                const isSelected = selectedPlanId === plan.subscriptionId;

                return (
                  <TouchableOpacity
                    key={plan.subscriptionId}
                    activeOpacity={0.85}
                    onPress={() => setSelectedPlanId(plan.subscriptionId)}
                    className={`w-full p-4 rounded-2xl flex-row items-center justify-between border mb-3 ${
                      isSelected
                        ? "bg-[#D4AF37]/15 border-2 border-[#D4AF37]"
                        : "bg-[#1C1A18] border-white/10"
                    }`}
                  >
                    {/* Radio Button & Plan Details */}
                    <View className="flex-row items-center flex-1 mr-3">
                      <View
                        className={`w-6 h-6 rounded-full items-center justify-center mr-3.5 border ${
                          isSelected
                            ? "border-[#D4AF37] bg-[#D4AF37]"
                            : "border-[#7C766B] bg-transparent"
                        }`}
                      >
                        {isSelected && (
                          <View className="w-2.5 h-2.5 rounded-full bg-[#141210]" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-white text-lg font-bold">
                          {plan.tier}
                        </Text>
                        <Text className="text-[#A19E95] text-xs font-medium mt-0.5">
                          {plan.duration} {formatDurationUnit(plan.durationUnit)} - Trải nghiệm Premium
                        </Text>
                      </View>
                    </View>

                    {/* Price Right Aligned */}
                    <View className="items-end">
                      <Text
                        className={`text-xl font-black ${
                          isSelected ? "text-[#D4AF37]" : "text-white"
                        }`}
                      >
                        {formatCurrency(plan.price)}
                      </Text>
                      <Text className="text-[#A19E95] text-[11px] font-medium">
                        / {formatDurationUnit(plan.durationUnit)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Action Button: Continue For Payment (Gold Gradient) */}
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!selectedPlan || loading}
            onPress={() => {
              if (!selectedPlan) return;
              if (!isAuthenticated) {
                navigation.navigate("LoginScreen");
                return;
              }
              // Premium chỉ mua được trên website — báo trước cho người dùng
              // rồi mới chuyển sang trang Premium trên web.
              Alert.alert(
                "Thanh toán trên Website",
                "Ứng dụng di động TaleX hiện chưa hỗ trợ thanh toán trực tiếp. Vui lòng hoàn tất đăng ký gói Premium trên website chính thức của chúng tôi tại talex.pro.vn.",
                [
                  { text: "Để sau", style: "cancel" },
                  {
                    text: "Đến Website",
                    onPress: async () => {
                      const code = await getSsoHandoffCode();
                      Linking.openURL(buildPremiumWebUrl(code));
                    },
                  },
                ],
              );
            }}
            className="mt-2 mb-6"
          >
            <LinearGradient
              colors={["#D4AF37", "#E6B800"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: "100%",
                height: 54,
                borderRadius: 9999,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text className="text-[#141210] font-black text-lg tracking-wide">
                Tiếp Tục Thanh Toán
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Footer Terms & Policy Links */}
          <View className="items-center pb-2">
            <Text className="text-[#7C766B] text-xs font-medium">
              Điều khoản sử dụng | Chính sách bảo mật | Khôi phục
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
