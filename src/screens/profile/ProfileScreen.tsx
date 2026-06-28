import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
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
import { useNavigation, useFocusEffect } from "@react-navigation/native"; // Thêm điều hướng sang trang Đăng nhập khi cần

export default function ProfileScreen() {
  const navigation = useNavigation<any>();

  const { user, isAuthenticated, loading, refreshProfile, logout } = useAuth();

  const [activeShelfTab, setActiveShelfTab] = useState<"history" | "follow">(
    "history",
  );

  useFocusEffect(
    React.useCallback(() => {
      // refresh profile when screen focused
      refreshProfile();
    }, [refreshProfile]),
  );

  const renderMenuItem = (
    icon: React.ReactNode,
    title: string,
    onPress?: () => void,
  ) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row h-14 items-center px-4 justify-between active:bg-zinc-800/30"
    >
      <View className="flex-row items-center">
        <View className="w-6 items-center justify-center mr-3">{icon}</View>
        <Text className="text-stone-300 text-[14px] font-medium">{title}</Text>
      </View>
      <Feather name="chevron-right" size={16} color="#444446" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-[#0F0F0F]">
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 60,
          paddingBottom: 120,
        }}
      >
        {/* ================= HEADER UTILS (GUEST hoặc USER đều có thể xem Cài đặt) ================= */}
        <View className="flex-row justify-end items-center mb-4 w-full">
          <TouchableOpacity className="p-1 mr-4 active:opacity-70">
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity className="p-1 active:opacity-70">
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ================= BIẾN ĐỔI KHỐI THÔNG TIN CÁ NHÂN ================= */}
        {isAuthenticated ? (
          /* CHẾ ĐỘ ĐÃ ĐĂNG NHẬP */
          <View className="flex-row items-center mb-6 w-full">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate("EditProfileScreen")} // Thay "EditProfileScreen" đúng với tên định nghĩa trong Router của bạn
              className="w-[68px] h-[68px] rounded-full overflow-hidden items-center justify-center border-2 border-yellow-500/50"
            >
              <Image
                source={require("@assets/icon.png")}
                className="w-full h-full"
                resizeMode="cover"
              />
            </TouchableOpacity>
            <View className="ml-4 flex-1 justify-center">
              <Text className="text-white text-lg font-bold tracking-wide">
                {user?.username || user?.fullName || "Người dùng"}
              </Text>
              <View className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 self-start px-2 py-0.5 rounded-md mt-1.5">
                <Text className="text-[#D4AF37] text-[10px] font-black uppercase tracking-wider">
                  {user?.roleName || "Thành viên"}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          /* CHẾ ĐỘ GUEST: BANNER KÊU GỌI ĐĂNG NHẬP KHÔNG GIAN SANG TRỌNG */
          <View className="w-full bg-[#161618] rounded-[24px] p-5 mb-6 border border-white/5 flex-row items-center justify-between shadow-xl">
            <View className="flex-1 mr-4">
              <Text className="text-white text-lg font-black tracking-wide">
                Xin Chào!
              </Text>
              <Text className="text-zinc-500 text-xs font-medium mt-1 leading-4">
                Đăng nhập để lưu lịch sử xem phim, truyện và nhận xu thưởng mỗi
                ngày.
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.getParent()?.navigate("LoginScreen")}
            >
              <LinearGradient
                colors={["#D4AF37", "#E6B800"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 38,
                  paddingHorizontal: 18,
                  borderRadius: 12,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: "#141210", fontWeight: "900", fontSize: 13 }}
                >
                  Đăng Nhập
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

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
                  {user?.coins ?? 0}{" "}
                  <Text className="text-xs font-bold text-stone-400">Xu</Text>
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                Toast.show({
                  type: "success",
                  text1: "Điểm danh thành công! Bạn nhận được +10 Xu.",
                })
              }
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
                  Điểm Danh
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          /* GUEST: CARD QUẢNG CÁO PHÚC LỢI KHÍ CHẤT CHUẨN IQIYI */
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

        {/* ================= CARD 1: NỘI DUNG CỦA TÔI (GUEST & USER ĐỀU ĐƯỢC XEM KHUNG TRỐNG) ================= */}
        <View className="w-full bg-[#161618] rounded-[16px] p-4 mb-4 border border-white/5 shadow-sm">
          <View className="flex-row justify-between items-center">
            <Text className="text-white font-black text-[14px] tracking-wider">
              NỘI DUNG CỦA TÔI
            </Text>
            <Feather name="chevron-right" size={16} color="#666666" />
          </View>

          <View className="flex-row items-center mt-3.5">
            <TouchableOpacity
              onPress={() => setActiveShelfTab("history")}
              className={`px-5 py-2 rounded-full mr-2.5 ${activeShelfTab === "history" ? "bg-[#D4AF37]/10 border border-[#D4AF37]/20" : "bg-transparent"}`}
            >
              <Text
                className={`text-xs font-bold ${activeShelfTab === "history" ? "text-[#D4AF37]" : "text-zinc-500"}`}
              >
                Lịch sử xem
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveShelfTab("follow")}
              className={`px-5 py-2 rounded-full ${activeShelfTab === "follow" ? "bg-[#D4AF37]/10 border border-[#D4AF37]/20" : "bg-transparent"}`}
            >
              <Text
                className={`text-xs font-bold ${activeShelfTab === "follow" ? "text-[#D4AF37]" : "text-zinc-500"}`}
              >
                Đang theo dõi
              </Text>
            </TouchableOpacity>
          </View>

          <View className="w-full h-[120px] items-center justify-center mt-2">
            <MaterialCommunityIcons
              name="movie-roll"
              size={32}
              color="#3f3f46"
            />
            <Text className="text-zinc-600 text-xs mt-2 italic">
              {isAuthenticated
                ? "Không có phim hoặc truyện nào"
                : "Đăng nhập để xem lại nội dung của bạn"}
            </Text>
          </View>
        </View>

        {/* ================= CARD 2: HỆ THỐNG SÁNG TÁC (ẨN HOẶC KHÓA KHI LÀ GUEST) ================= */}
        <View className="w-full bg-[#161618] rounded-[16px] p-4 mb-4 border border-white/5">
          <Text className="text-white font-black text-[14px] tracking-wide mb-4">
            Hệ Thống Sáng Tác
          </Text>

          <View className="flex-row w-full justify-between items-start px-2 opacity-100">
            {/* Mục 1: Đăng ký Creator */}
            <TouchableOpacity
              className="items-center justify-center w-[28%]"
              activeOpacity={0.7}
              onPress={() => {
                if (!isAuthenticated) {
                  Toast.show({
                    type: "info",
                    text1: "Bạn cần đăng nhập để sử dụng tính năng này!",
                  });
                  return;
                }

                navigation.navigate("CreatorGuard");
              }}
            >
              <View className="w-11 h-11 bg-purple-900/10 border border-purple-500/20 rounded-2xl items-center justify-center mb-2">
                <Feather
                  name="user-plus"
                  size={18}
                  color={isAuthenticated ? "#A855F7" : "#52525b"}
                />
              </View>
              <Text
                className={`text-[11px] font-bold text-center ${isAuthenticated ? "text-stone-400" : "text-zinc-600"}`}
                numberOfLines={2}
              >
                Trở thành Creator
              </Text>
            </TouchableOpacity>

            {/* Mục 2: Gửi truyện */}
            <TouchableOpacity
              className="items-center justify-center w-[28%]"
              activeOpacity={0.7}
              onPress={() =>
                !isAuthenticated &&
                Toast.show({
                  type: "info",
                  text1: "Bạn cần đăng nhập để sử dụng tính năng này!",
                })
              }
            >
              <View className="w-11 h-11 bg-blue-900/10 border border-blue-500/20 rounded-2xl items-center justify-center mb-2">
                <FontAwesome5
                  name="book-open"
                  size={15}
                  color={isAuthenticated ? "#3B82F6" : "#52525b"}
                />
              </View>
              <Text
                className={`text-[11px] font-bold text-center ${isAuthenticated ? "text-stone-400" : "text-zinc-600"}`}
                numberOfLines={2}
              >
                Gửi bản thảo Truyện
              </Text>
            </TouchableOpacity>

            {/* Mục 3: Gửi phim */}
            <TouchableOpacity
              className="items-center justify-center w-[28%]"
              activeOpacity={0.7}
              onPress={() =>
                !isAuthenticated &&
                Toast.show({
                  type: "info",
                  text1: "Bạn cần đăng nhập để sử dụng tính năng này!",
                })
              }
            >
              <View className="w-11 h-11 bg-amber-900/10 border border-amber-500/20 rounded-2xl items-center justify-center mb-2">
                <MaterialCommunityIcons
                  name="video-plus-outline"
                  size={19}
                  color={isAuthenticated ? "#F59E0B" : "#52525b"}
                />
              </View>
              <Text
                className={`text-[11px] font-bold text-center ${isAuthenticated ? "text-stone-400" : "text-zinc-600"}`}
                numberOfLines={2}
              >
                Đăng tải Video Phim
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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

        {/* ================= CARD 4: CÁ NHÂN (ẨN HOẶC CHẶN NẾU GUEST) ================= */}
        {isAuthenticated && (
          <View className="w-full bg-[#161618] rounded-[16px] overflow-hidden mb-4 border border-white/5">
            <Text className="text-white font-black text-[14px] tracking-wide ml-4 mt-3.5 mb-1">
              Cá Nhân
            </Text>
            {renderMenuItem(
              <Feather name="user" size={16} color="#A19E95" />,
              "Hồ sơ cá nhân",
              () => navigation.navigate("EditProfileScreen"),
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

        {/* ================= BIẾN ĐỔI NÚT CHỨC NĂNG DƯỚI ĐÁY ĐĂNG NHẬP / ĐĂNG XUẤT ================= */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="w-full h-12 bg-[#262628] rounded-xl flex-row items-center justify-center border border-white/5 active:bg-zinc-800"
          onPress={async () => {
            if (isAuthenticated) {
              await logout();
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
      </ScrollView>
    </SafeAreaView>
  );
}
