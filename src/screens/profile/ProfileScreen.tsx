import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
  Feather,
  MaterialCommunityIcons,
  Ionicons,
  FontAwesome5,
  SimpleLineIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { useReward } from "@/context/RewardContext";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootNavigator";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getOwnCreator } from "@/services/creator";
import { useUserFeature } from "@/hooks/useUserFeature";

export default function ProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const scrollViewRef = React.useRef<ScrollView>(null);

  const { user, isAuthenticated, loading, refreshProfile, logout } = useAuth();
  const { unreadCount, refreshUnreadCount } = useNotifications();
  const { balance, isLoading: isWalletLoading, refreshRewardData } = useReward();
  const {
    profile: userFeatureProfile,
    isMissingProfile,
    refetch: refetchUserFeature,
  } = useUserFeature();

  const [isCreator, setIsCreator] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      // Auto reset scroll position to top whenever screen is focused
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });

      if (isAuthenticated) {
        refreshProfile();
        void refreshUnreadCount({ silent: true });
        void refreshRewardData({ silent: true });
        refetchUserFeature();

        getOwnCreator()
          .then((res) => {
            if (res && (res.id || res.creatorId)) {
              setIsCreator(true);
            } else {
              setIsCreator(false);
            }
          })
          .catch(() => {
            setIsCreator(false);
          });
      } else {
        setIsCreator(false);
      }
    }, [
      refreshProfile,
      refreshUnreadCount,
      refreshRewardData,
      refetchUserFeature,
      isAuthenticated,
    ]),
  );

  const renderMenuItem = (
    icon: React.ReactNode,
    title: string,
    onPress?: () => void,
  ) => {
    const handlePress =
      onPress ||
      (title.toLowerCase().includes("vip")
        ? () => navigation.navigate("SubscriptionPlans")
        : undefined);

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.7}
        className="flex-row h-14 items-center px-4 justify-between active:bg-zinc-800/30"
      >
        <View className="flex-row items-center">
          <View className="w-6 items-center justify-center mr-3">{icon}</View>
          <Text className="text-stone-300 text-[14px] font-medium">
            {title}
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color="#444446" />
      </TouchableOpacity>
    );
  };

  const avatarSource =
    isAuthenticated && user?.avatarUrl
      ? { uri: user.avatarUrl }
      : require("@assets/icon.png");

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-[#0F0F0F]">
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        alwaysBounceVertical={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 120,
        }}
      >
        {/* ================= HEADER PHẦN ĐẦU TRANG ================= */}
        <View className="relative w-full pt-14 pb-6 px-5 items-center overflow-hidden mb-6">
          {/* Header Background Container - Strictly Eliminates Android Horizontal Texture Stripes */}
          <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
            <Image
              source={avatarSource}
              style={{ width: "100%", height: "100%", opacity: 0.4 }}
              resizeMode="cover"
            />
          </View>

          {/* Top Header Bar */}
          <View className="flex-row justify-between items-center w-full mb-6 relative z-10 h-10 px-1">
            {/* App Brand Logo Icon - Direct image without any background box/frame */}
            <View className="flex-row items-center">
              <Image
                source={require("@assets/icon.png")}
                className="w-14 h-14"
                resizeMode="contain"
              />
            </View>

            {/* Title "Tài Khoản" Centered */}
            <View className="absolute left-0 right-0 items-center pointer-events-none">
              <Text className="text-white text-xl font-bold tracking-wider">
                Tài Khoản
              </Text>
            </View>

            {/* Right Action Icons */}
            <View className="flex-row items-center z-10">
              <TouchableOpacity
                className="relative p-1 active:opacity-70"
                onPress={() => {
                  if (isAuthenticated) {
                    navigation.navigate("Notifications");
                  } else {
                    navigation.navigate("LoginScreen");
                  }
                }}
              >
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color="#FFFFFF"
                />
                {isAuthenticated && unreadCount > 0 && (
                  <View className="absolute -right-1 -top-1 min-w-[17px] h-[17px] items-center justify-center rounded-full bg-[#D4AF37] px-1 border border-[#161618]">
                    <Text className="text-[9px] font-black text-[#141210]">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Centered Avatar */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (isAuthenticated) {
                navigation.navigate("EditProfileScreen");
              } else {
                navigation.getParent()?.navigate("LoginScreen");
              }
            }}
            className="mb-3.5 relative z-10"
          >
            <View className="w-[92px] h-[92px] rounded-full overflow-hidden items-center justify-center">
              <Image
                source={avatarSource}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>

          {/* User Name */}
          <Text className="text-white text-2xl font-bold tracking-wide text-center z-10">
            {isAuthenticated
              ? user?.username || user?.fullName || "Dima"
              : "Khách "}
          </Text>

          {/* User Email */}
          <Text className="text-white text-sm font-medium mt-1 text-center z-10">
            {isAuthenticated
              ? user?.email || "dimakurilenko.dk@gmail.com"
              : "Đăng nhập để xem đầy đủ tính năng"}
          </Text>

          {/* Creator Channel link if applicable */}
          {isAuthenticated && isCreator && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate("CreatorChannel")}
              className="flex-row items-center mt-2.5 bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30 z-10"
            >
              <Text className="text-[#D4AF37] text-xs font-bold">Xem Kênh</Text>
              <Feather
                name="chevron-right"
                size={12}
                color="#D4AF37"
                style={{ marginLeft: 2 }}
              />
            </TouchableOpacity>
          )}

          {/* Subscribe Pill Button - Chỉ hiện khi đã đăng nhập */}
          {isAuthenticated && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate("SubscriptionPlans")}
              className="mt-5 w-full h-[52px] rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]/15 flex-row items-center justify-center active:bg-[#D4AF37]/30 z-10"
            >
              <FontAwesome5 name="crown" size={15} color="#D4AF37" />
              <Text className="text-[#D4AF37] font-bold text-[17px] ml-3 tracking-wide">
                Đăng Ký Hội Viên
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ================= NỘI DUNG MENU CÁC TÍNH NĂNG HOẠT ĐỘNG ================= */}
        {isAuthenticated ? (
          /* ===== GIAO DIỆN KHI ĐÃ ĐĂNG NHẬP (LOGGED IN USER) ===== */
          <View className="px-4">
            {/* ================= KHỐI VÍ XU / REWARD ================= */}
            <View className="w-full mb-4 p-4 bg-[#161618] rounded-2xl border border-white/5 flex-row items-center justify-between shadow-sm">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-[#D4AF37]/10 rounded-xl items-center justify-center mr-3.5">
                  <FontAwesome5 name="coins" size={16} color="#D4AF37" />
                </View>
                <View>
                  <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                    Số dư xu hiện tại
                  </Text>
                  <Text className="text-white text-2xl font-black mt-0.5">
                    {isWalletLoading ? "..." : balance}{" "}
                    <Text className="text-xs font-bold text-stone-400">Xu</Text>
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate("CoinCenter")}
              >
                <LinearGradient
                  colors={["#D4AF37", "#E6B800"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: 36,
                    paddingHorizontal: 16,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FontAwesome5 name="gift" size={11} color="#141210" />
                  <Text
                    style={{
                      color: "#141210",
                      fontWeight: "900",
                      fontSize: 12,
                      marginLeft: 6,
                    }}
                  >
                    Nhận Xu
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* ================= CARD 2: CREATOR STUDIO ================= */}
            <View className="w-full bg-[#161618] rounded-[16px] overflow-hidden mb-4 border border-[#D4AF37]/20 shadow-lg shadow-yellow-500/5">
              <View className="p-4 flex-row justify-between items-center bg-[#D4AF37]/5 border-b border-[#D4AF37]/10">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="youtube-studio"
                    size={20}
                    color="#D4AF37"
                  />
                  <Text className="text-[#D4AF37] font-black text-[14px] tracking-wide ml-2">
                    Kênh Sáng Tạo
                  </Text>
                </View>
                <View className="bg-[#D4AF37]/20 px-2 py-0.5 rounded">
                  <Text className="text-[#D4AF37] text-[9px] font-bold uppercase">
                    Studio Active
                  </Text>
                </View>
              </View>
              {renderMenuItem(
                <MaterialCommunityIcons
                  name="view-dashboard-outline"
                  size={18}
                  color="#A19E95"
                />,
                "TaleX Creator Studio",
                () => navigation.navigate("CreatorDashboard"),
              )}
            </View>

            {/* ================= CARD 3: QUYỀN LỢI ================= */}
            <View className="w-full bg-[#161618] rounded-[16px] overflow-hidden mb-4 border border-white/5">
              <Text className="text-white font-black text-[14px] tracking-wide ml-4 mt-3.5 mb-1">
                Quyền Lợi & Giao Dịch
              </Text>
              {renderMenuItem(
                <FontAwesome5 name="crown" size={14} color="#D4AF37" />,
                "Gói hội viên VIP",
                () => navigation.navigate("SubscriptionPlans"),
              )}
              <View className="h-[1px] bg-zinc-800/40 mx-4" />
              {renderMenuItem(
                <MaterialCommunityIcons
                  name="history"
                  size={18}
                  color="#A19E95"
                />,
                "Lịch sử giao dịch",
                () => navigation.navigate("TransactionHistoryScreen"),
              )}
            </View>

            {/* ================= CARD 4: CÁ NHÂN & BẢO MẬT ================= */}
            <View className="w-full bg-[#161618] rounded-[16px] overflow-hidden mb-5 border border-white/5">
              <Text className="text-[#D4AF37] font-black text-[14px] tracking-wide ml-4 mt-3.5 mb-1">
                Cá Nhân & Yêu Thích
              </Text>
              {renderMenuItem(
                <Feather name="user" size={16} color="#A19E95" />,
                "Hồ sơ cá nhân",
                () => navigation.navigate("EditProfileScreen"),
              )}
              <View className="h-[1px] bg-zinc-800/40 mx-4" />
              {renderMenuItem(
                <MaterialCommunityIcons name="history" size={18} color="#D4AF37" />,
                "Lịch sử xem",
                () => navigation.navigate("HistoryScreen"),
              )}
              <View className="h-[1px] bg-zinc-800/40 mx-4" />
              {renderMenuItem(
                <Ionicons name="heart-outline" size={18} color="#EF4444" />,
                "Tập phim & Truyện đã thích",
                () => navigation.navigate("LikedScreen"),
              )}
              <View className="h-[1px] bg-zinc-800/40 mx-4" />
              {renderMenuItem(
                <Feather name="users" size={16} color="#D4AF37" />,
                "Kênh đang theo dõi",
                () => navigation.navigate("SubscriptionsScreen"),
              )}
              <View className="h-[1px] bg-zinc-800/40 mx-4" />
              {renderMenuItem(
                <Ionicons name="bookmark-outline" size={17} color="#D4AF37" />,
                "Danh sách đã lưu (Bookmark)",
                () => navigation.navigate("BookmarkedScreen"),
              )}
              <View className="h-[1px] bg-zinc-800/40 mx-4" />
              {renderMenuItem(
                <SimpleLineIcons name="lock" size={14} color="#A19E95" />,
                "Đổi mật khẩu tài khoản",
                () => navigation.navigate("ChangePasswordScreen"),
              )}
            </View>

            {/* ================= NÚT ĐĂNG XUẤT ================= */}
            <TouchableOpacity
              activeOpacity={0.8}
              className="w-full h-12 bg-[#262628] rounded-xl flex-row items-center justify-center border border-white/5 active:bg-zinc-800"
              onPress={async () => {
                await logout();
                navigation.navigate("MainTabs", { screen: "Home" });
                Toast.show({
                  type: "success",
                  text1: "Đăng xuất thành công",
                });
              }}
            >
              <SimpleLineIcons name="logout" size={14} color="#FF5252" />
              <Text className="text-[#FF5252] font-black text-[15px] ml-2 tracking-wide">
                Đăng Xuất
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ===== GIAO DIỆN KHÁCH CÂN ĐỐI, ĐẸP MẮT (GUEST STATE) ===== */
          <View className="px-4">
            {/* CARD QUYỀN LỢI THÀNH VIÊN TALEX */}
            <View className="w-full bg-[#161618] rounded-2xl p-5 border border-white/5 mb-5 shadow-sm">
              <View className="flex-row items-center mb-4">
                <View className="w-8 h-8 rounded-lg bg-[#D4AF37]/15 items-center justify-center mr-2.5">
                  <FontAwesome5 name="gem" size={14} color="#D4AF37" />
                </View>
                <Text className="text-[#D4AF37] font-black text-[15px] tracking-wide">
                  Quyền Lợi Thành Viên TaleX
                </Text>
              </View>

              {/* Lợi ích 1 */}
              <View className="flex-row items-start mb-3.5">
                <View className="w-7 h-7 rounded-full bg-white/5 items-center justify-center mr-3 mt-0.5">
                  <FontAwesome5 name="crown" size={12} color="#D4AF37" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-xs">
                    Kho nội dung độc quyền
                  </Text>
                  <Text className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
                    Hàng ngàn bộ phim và truyện tranh bản quyền chất lượng .
                  </Text>
                </View>
              </View>

              <View className="h-[1px] bg-zinc-800/40 mb-3.5" />

              {/* Lợi ích 2 */}
              <View className="flex-row items-start mb-3.5">
                <View className="w-7 h-7 rounded-full bg-white/5 items-center justify-center mr-3 mt-0.5">
                  <FontAwesome5 name="coins" size={12} color="#D4AF37" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-xs">
                    Tích xu & Nhận thưởng
                  </Text>
                  <Text className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
                    Điểm danh nhận xu mỗi ngày để mở khóa tập phim yêu thích.
                  </Text>
                </View>
              </View>

              <View className="h-[1px] bg-zinc-800/40 mb-3.5" />

              {/* Lợi ích 3 */}
              <View className="flex-row items-start">
                <View className="w-7 h-7 rounded-full bg-white/5 items-center justify-center mr-3 mt-0.5">
                  <Ionicons name="bookmark" size={12} color="#D4AF37" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-xs">
                    Đồng bộ & Lưu trữ
                  </Text>
                  <Text className="text-zinc-400 text-[11px] mt-0.5 leading-relaxed">
                    Lưu lịch sử xem và danh sách yêu thích trên mọi thiết bị.
                  </Text>
                </View>
              </View>
            </View>

            {/* NÚT ĐĂNG NHẬP / ĐĂNG KÝ NỔI BẬT */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate("LoginScreen")}
              className="w-full h-12 rounded-xl bg-[#D4AF37] flex-row items-center justify-center active:bg-[#c49f2e] shadow-md mb-3"
            >
              <SimpleLineIcons name="login" size={15} color="#141210" />
              <Text className="text-[#141210] font-black text-[15px] ml-2 tracking-wide">
                Đăng Nhập / Đăng Ký Ngay
              </Text>
            </TouchableOpacity>

            <Text className="text-zinc-500 text-[11px] text-center font-medium">
              Tham gia TaleX để tận hưởng trải nghiệm giải trí đỉnh cao
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
