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
import { useReward } from "@/context/RewardContext";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootNavigator";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { getOwnCreator } from "@/services/creator";

export default function ProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { user, isAuthenticated, loading, refreshProfile, logout } = useAuth();
  const { balance, isLoading: isWalletLoading } = useReward();

  const [isCreator, setIsCreator] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      refreshProfile();

      if (isAuthenticated) {
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
    }, [refreshProfile, isAuthenticated]),
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

            {/* Title "Profile" Centered */}
            <View className="absolute left-0 right-0 items-center pointer-events-none">
              <Text className="text-white text-xl font-bold tracking-wider">
                Profile
              </Text>
            </View>

            {/* Right Action Icons */}
            <View className="flex-row items-center z-10">
              <TouchableOpacity className="p-1 mr-2 active:opacity-70">
                <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity className="p-1 active:opacity-70">
                <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
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
              : "Khách (TaleX User)"}
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
              <Text className="text-[#D4AF37] text-xs font-bold">
                Xem kênh sáng tạo
              </Text>
              <Feather
                name="chevron-right"
                size={12}
                color="#D4AF37"
                style={{ marginLeft: 2 }}
              />
            </TouchableOpacity>
          )}

          {/* Subscribe Now Pill Button - Synchronized to TaleX Brand Gold Theme (#D4AF37) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("SubscriptionPlans")}
            className="mt-5 w-full h-[52px] rounded-full border-2 border-[#D4AF37] bg-[#D4AF37]/15 flex-row items-center justify-center active:bg-[#D4AF37]/30 z-10"
          >
            <FontAwesome5 name="crown" size={15} color="#D4AF37" />
            <Text className="text-[#D4AF37] font-bold text-[17px] ml-3 tracking-wide">
              Subscribe Now
            </Text>
          </TouchableOpacity>
        </View>

        {/* ================= GIỮ NGUYÊN TOÀN BỘ CÁC KHỐI MENU TALEX Ở PHẦN DƯỚI ================= */}
        <View className="px-4">
          {/* ================= BIẾN ĐỔI KHỐI VÍ XU / REWARD ================= */}
          {isAuthenticated ? (
            /* CÓ VÍ XU KHI ĐÃ LOGGED IN */
            <View className="w-full mb-6 p-4 bg-[#161618] rounded-2xl border border-white/5 flex-row items-center justify-between shadow-sm">
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
          ) : (
            /* GUEST BANNER */
            <View className="w-full mb-6 px-4 py-3.5 bg-gradient-to-r from-amber-500/5 to-zinc-900/40 rounded-2xl border border-[#D4AF37]/15 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-2">
                <FontAwesome5 name="crown" size={14} color="#D4AF37" />
                <Text
                  className="text-amber-200/90 text-xs font-bold ml-2.5"
                  numberOfLines={1}
                >
                  Đăng nhập nhận ngay 100 xu tân thủ miễn phí!
                </Text>
              </View>
              <Feather name="arrow-right" size={14} color="#D4AF37" />
            </View>
          )}

          {/* ================= CARD 2.5: CREATOR STUDIO ================= */}
          {isAuthenticated && (
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
          )}

          {/* ================= CARD 3: QUYỀN LỢI ================= */}
          <View className="w-full bg-[#161618] rounded-[16px] overflow-hidden mb-4 border border-white/5">
            <Text className="text-white font-black text-[14px] tracking-wide ml-4 mt-3.5 mb-1">
              Quyền Lợi
            </Text>
            {renderMenuItem(
              <FontAwesome5 name="crown" size={14} color="#D4AF37" />,
              "Gói hội viên VIP",
            )}
            <View className="h-[1px] bg-zinc-800/40 mx-4" />
            {renderMenuItem(
              <MaterialCommunityIcons name="history" size={18} color="#A19E95" />,
              "Lịch sử giao dịch",
            )}
          </View>

          {/* ================= CARD 4: CÁ NHÂN ================= */}
          {isAuthenticated && (
            <View className="w-full bg-[#161618] rounded-[16px] overflow-hidden mb-4 border border-white/5">
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
                <MaterialCommunityIcons
                  name="comment-text-outline"
                  size={16}
                  color="#A19E95"
                />,
                "Bình luận của tôi",
              )}
            </View>
          )}

          {/* ================= CARD 5: HỖ TRỢ & PHÁP LÝ ================= */}
          <View className="w-full bg-[#161618] rounded-[16px] overflow-hidden mb-6 border border-white/5">
            <Text className="text-white font-black text-[14px] tracking-wide ml-4 mt-3.5 mb-1">
              Hỗ Trợ
            </Text>
            {isAuthenticated && (
              <>
                {renderMenuItem(
                  <SimpleLineIcons name="lock" size={14} color="#A19E95" />,
                  "Đổi mật khẩu tài khoản",
                )}
                <View className="h-[1px] bg-zinc-800/40 mx-4" />
              </>
            )}
            {renderMenuItem(
              <Ionicons name="help-circle-outline" size={18} color="#A19E95" />,
              "Phản hồi và Hỗ trợ",
            )}
            <View className="h-[1px] bg-zinc-800/40 mx-4" />
            {renderMenuItem(
              <Feather name="shield" size={16} color="#A19E95" />,
              "Chính sách bảo mật",
            )}
            <View className="h-[1px] bg-zinc-800/40 mx-4" />
            {renderMenuItem(
              <Feather name="info" size={16} color="#A19E95" />,
              "Giới thiệu chúng tôi",
            )}
          </View>

          {/* ================= NÚT ĐĂNG XUẤT / ĐĂNG NHẬP DƯỚI ĐÁY ================= */}
          <TouchableOpacity
            activeOpacity={0.8}
            className="w-full h-12 bg-[#262628] rounded-xl flex-row items-center justify-center border border-white/5 active:bg-zinc-800"
            onPress={async () => {
              if (isAuthenticated) {
                await logout();
                navigation.navigate("MainTabs", { screen: "Home" });
                Toast.show({
                  type: "success",
                  text1: "Đăng xuất thành công",
                });
              } else {
                navigation.navigate("LoginScreen");
              }
            }}
          >
            {isAuthenticated ? (
              <>
                <SimpleLineIcons name="logout" size={14} color="#FF5252" />
                <Text className="text-[#FF5252] font-black text-[15px] ml-2 tracking-wide">
                  Đăng Xuất
                </Text>
              </>
            ) : (
              <>
                <SimpleLineIcons name="login" size={14} color="#D4AF37" />
                <Text className="text-[#D4AF37] font-black text-[15px] ml-2 tracking-wide">
                  Đăng Nhập Ngay
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
