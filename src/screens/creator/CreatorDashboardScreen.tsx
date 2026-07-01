import React, { useState } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
} from "react-native";
import {
  MaterialCommunityIcons,
  Feather,
  Ionicons,
  FontAwesome5,
  Octicons,
} from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function CreatorDashboardScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "content" | "comments" | "revenue">(
    "overview"
  );

  // Mock Data
  const channelStats = {
    subscribers: "15,420",
    views28d: "45.2K",
    viewsTrend: "+12.4%",
    watchTime28d: "1.8K",
    watchTimeTrend: "+8.2%",
    revenue28d: "$380.50",
    revenueTrend: "+15.1%",
    subscribers28d: "+850",
    subscribersTrend: "+20.4%",
  };

  const recentContent = [
    {
      id: "1",
      title: "Chiến Binh Rồng - Tập 1 (Thuyết Minh)",
      type: "video",
      views: "2.5K",
      likes: "124",
      comments: "48",
      duration: "14:20",
      date: "2 ngày trước",
      thumbnail: "#3B82F6", // Blue
    },
    {
      id: "2",
      title: "Hương Vị Tình Yêu - Tập 5",
      type: "video",
      views: "1.8K",
      likes: "95",
      comments: "32",
      duration: "22:15",
      date: "5 ngày trước",
      thumbnail: "#EF4444", // Red
    },
    {
      id: "3",
      title: "Thần Thoại Phương Đông - Chương 45",
      type: "comic",
      views: "5.2K",
      likes: "342",
      comments: "88",
      duration: "Manga",
      date: "1 tuần trước",
      thumbnail: "#10B981", // Green
    },
  ];

  const recentComments = [
    {
      id: "c1",
      user: "nguyenvana",
      avatar: "NV",
      comment: "Phim hay quá, chất lượng hình ảnh đỉnh thật sự! Mong ngóng tập sau của ad ghê.",
      time: "5 phút trước",
      contentTitle: "Chiến Binh Rồng - Tập 1",
    },
    {
      id: "c2",
      user: "tranb_reader",
      avatar: "TB",
      comment: "Vẽ đẹp xuất sắc luôn ad ơi, nội dung cuốn nữa. Cố gắng phát huy nhé!",
      time: "2 giờ trước",
      contentTitle: "Thần Thoại Phương Đông - Chương 45",
    },
  ];

  const revenueReports = [
    { month: "Tháng 6, 2026", amount: "$150.20", status: "Đã thanh toán" },
    { month: "Tháng 5, 2026", amount: "$130.40", status: "Đã thanh toán" },
    { month: "Tháng 4, 2026", amount: "$99.90", status: "Đã thanh toán" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#0F0F10]">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F10" />

      {/* ================= HEADER ================= */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-950">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 mr-2 active:opacity-60"
          >
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="youtube-studio" size={24} color="#FF4E4E" />
            <Text className="text-white text-lg font-black tracking-tight ml-1.5">
              Creator Studio
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <TouchableOpacity className="p-2 mr-1 active:opacity-60">
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity className="p-2 active:opacity-60">
            <Ionicons name="logo-usd" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ================= SCROLLABLE CONTENT ================= */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ================= CHANNEL INFO CARD ================= */}
        <LinearGradient
          colors={["#2E1E1E", "#1E1E22"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mx-4 mt-4 p-5 rounded-3xl border border-zinc-800"
        >
          <View className="flex-row items-center">
            <View className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#D4AF37]">
              <Image
                source={require("@assets/icon.png")}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>
            <View className="ml-4 flex-1">
              <View className="flex-row items-center">
                <Text className="text-white text-lg font-black tracking-wide">
                  {user?.fullName || user?.username || "TaleX Creator"}
                </Text>
                <View className="ml-2 bg-[#D4AF37]/15 border border-[#D4AF37]/35 px-1.5 py-0.5 rounded">
                  <Text className="text-[#D4AF37] text-[8px] font-black tracking-wide uppercase">
                    Partner
                  </Text>
                </View>
              </View>
              <Text className="text-zinc-400 text-xs font-semibold mt-1">
                {channelStats.subscribers} người đăng ký
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ================= TAB BAR (YOUTUBE STUDIO STYLE) ================= */}
        <View className="flex-row justify-between px-4 mt-6 border-b border-zinc-900">
          {(["overview", "content", "comments", "revenue"] as const).map((tab) => {
            const isSelected = activeTab === tab;
            let tabLabel = "";
            switch (tab) {
              case "overview":
                tabLabel = "Tổng quan";
                break;
              case "content":
                tabLabel = "Nội dung";
                break;
              case "comments":
                tabLabel = "Bình luận";
                break;
              case "revenue":
                tabLabel = "Doanh thu";
                break;
            }

            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className="pb-2.5 flex-1 items-center"
                style={{
                  borderBottomWidth: isSelected ? 3 : 0,
                  borderBottomColor: "#FF4E4E",
                }}
              >
                <Text
                  className={`text-[13px] font-bold ${
                    isSelected ? "text-white" : "text-zinc-500"
                  }`}
                >
                  {tabLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ================= TỔNG QUAN (OVERVIEW) TAB ================= */}
        {activeTab === "overview" && (
          <View className="px-4 mt-6">
            <Text className="text-white text-base font-black tracking-wide mb-3">
              Số liệu phân tích kênh
            </Text>
            <Text className="text-zinc-500 text-xs font-medium mb-4">28 ngày qua</Text>

            {/* 4 Stats Grid */}
            <View className="flex-row flex-wrap justify-between">
              {/* Stat 1: Views */}
              <View className="w-[48%] bg-[#1E1E22] border border-zinc-800 rounded-2xl p-4 mb-3.5">
                <Text className="text-zinc-400 text-xs font-bold">Số lượt xem</Text>
                <Text className="text-white text-xl font-black mt-1.5">{channelStats.views28d}</Text>
                <View className="flex-row items-center mt-2.5">
                  <Feather name="arrow-up-right" size={14} color="#10B981" />
                  <Text className="text-[#10B981] text-[11px] font-black ml-1">
                    {channelStats.viewsTrend}
                  </Text>
                </View>
              </View>

              {/* Stat 2: Watch Time */}
              <View className="w-[48%] bg-[#1E1E22] border border-zinc-800 rounded-2xl p-4 mb-3.5">
                <Text className="text-zinc-400 text-xs font-bold">Thời gian xem (giờ)</Text>
                <Text className="text-white text-xl font-black mt-1.5">{channelStats.watchTime28d}</Text>
                <View className="flex-row items-center mt-2.5">
                  <Feather name="arrow-up-right" size={14} color="#10B981" />
                  <Text className="text-[#10B981] text-[11px] font-black ml-1">
                    {channelStats.watchTimeTrend}
                  </Text>
                </View>
              </View>

              {/* Stat 3: New Subs */}
              <View className="w-[48%] bg-[#1E1E22] border border-zinc-800 rounded-2xl p-4 mb-3.5">
                <Text className="text-zinc-400 text-xs font-bold">Người đăng ký mới</Text>
                <Text className="text-white text-xl font-black mt-1.5">{channelStats.subscribers28d}</Text>
                <View className="flex-row items-center mt-2.5">
                  <Feather name="arrow-up-right" size={14} color="#10B981" />
                  <Text className="text-[#10B981] text-[11px] font-black ml-1">
                    {channelStats.subscribersTrend}
                  </Text>
                </View>
              </View>

              {/* Stat 4: Revenue */}
              <View className="w-[48%] bg-[#1E1E22] border border-[#D4AF37]/20 rounded-2xl p-4 mb-3.5 shadow-md shadow-yellow-500/5">
                <Text className="text-zinc-400 text-xs font-bold">Doanh thu ước tính</Text>
                <Text className="text-[#D4AF37] text-xl font-black mt-1.5">{channelStats.revenue28d}</Text>
                <View className="flex-row items-center mt-2.5">
                  <Feather name="arrow-up-right" size={14} color="#10B981" />
                  <Text className="text-[#10B981] text-[11px] font-black ml-1">
                    {channelStats.revenueTrend}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Actions Bar */}
            <View className="bg-[#1E1E22] border border-zinc-800 rounded-2xl p-4 mt-2.5 flex-row justify-around">
              <TouchableOpacity className="items-center justify-center p-2">
                <View className="w-10 h-10 rounded-full bg-red-500/10 items-center justify-center mb-1">
                  <MaterialCommunityIcons name="video-plus" size={20} color="#FF4E4E" />
                </View>
                <Text className="text-stone-300 text-[10px] font-bold">Đăng video</Text>
              </TouchableOpacity>

              <TouchableOpacity className="items-center justify-center p-2">
                <View className="w-10 h-10 rounded-full bg-green-500/10 items-center justify-center mb-1">
                  <MaterialCommunityIcons name="book-plus" size={20} color="#10B981" />
                </View>
                <Text className="text-stone-300 text-[10px] font-bold">Đăng truyện</Text>
              </TouchableOpacity>

              <TouchableOpacity className="items-center justify-center p-2">
                <View className="w-10 h-10 rounded-full bg-blue-500/10 items-center justify-center mb-1">
                  <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={20} color="#3B82F6" />
                </View>
                <Text className="text-stone-300 text-[10px] font-bold">Xem báo cáo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= NỘI DUNG (CONTENT) TAB ================= */}
        {(activeTab === "content" || activeTab === "overview") && (
          <View className="px-4 mt-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-base font-black tracking-wide">
                Nội dung mới đăng
              </Text>
              {activeTab === "overview" && (
                <TouchableOpacity onPress={() => setActiveTab("content")}>
                  <Text className="text-[#FF4E4E] text-xs font-bold">Xem tất cả</Text>
                </TouchableOpacity>
              )}
            </View>

            {recentContent.map((item) => (
              <View
                key={item.id}
                className="flex-row bg-[#1E1E22] border border-zinc-800 rounded-2xl p-3 mb-3 items-center"
              >
                {/* Thumbnail Block */}
                <View
                  style={{ backgroundColor: item.thumbnail }}
                  className="w-20 h-14 rounded-lg items-center justify-center mr-3 relative overflow-hidden"
                >
                  <MaterialCommunityIcons
                    name={item.type === "video" ? "play" : "book-open-page-variant"}
                    size={22}
                    color="#FFFFFF"
                  />
                  <View className="absolute bottom-1 right-1 bg-black/60 px-1 rounded">
                    <Text className="text-white text-[8px] font-black uppercase">
                      {item.duration}
                    </Text>
                  </View>
                </View>

                {/* Info Text */}
                <View className="flex-1 justify-center">
                  <Text className="text-white text-xs font-bold leading-4" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text className="text-zinc-500 text-[10px] font-bold mt-1">
                    {item.date} • {item.type === "video" ? "Video" : "Truyện tranh"}
                  </Text>

                  {/* Metrics */}
                  <View className="flex-row items-center mt-2">
                    <View className="flex-row items-center mr-3">
                      <Feather name="eye" size={10} color="#71717A" />
                      <Text className="text-zinc-400 text-[10px] font-semibold ml-1">
                        {item.views}
                      </Text>
                    </View>
                    <View className="flex-row items-center mr-3">
                      <Feather name="thumbs-up" size={10} color="#71717A" />
                      <Text className="text-zinc-400 text-[10px] font-semibold ml-1">
                        {item.likes}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons name="comment-text-outline" size={10} color="#71717A" />
                      <Text className="text-zinc-400 text-[10px] font-semibold ml-1">
                        {item.comments}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================= BÌNH LUẬN (COMMENTS) TAB ================= */}
        {(activeTab === "comments" || activeTab === "overview") && (
          <View className="px-4 mt-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-base font-black tracking-wide">
                Bình luận mới nhất
              </Text>
              {activeTab === "overview" && (
                <TouchableOpacity onPress={() => setActiveTab("comments")}>
                  <Text className="text-[#FF4E4E] text-xs font-bold">Xem tất cả</Text>
                </TouchableOpacity>
              )}
            </View>

            {recentComments.map((item) => (
              <View
                key={item.id}
                className="bg-[#1E1E22] border border-zinc-800 rounded-2xl p-4 mb-3"
              >
                {/* User Info */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center">
                      <Text className="text-white text-[11px] font-black">{item.avatar}</Text>
                    </View>
                    <View className="ml-2.5">
                      <Text className="text-white text-xs font-black">{item.user}</Text>
                      <Text className="text-zinc-500 text-[9px] font-bold mt-0.5">{item.time}</Text>
                    </View>
                  </View>
                  <View className="bg-zinc-800/80 px-2 py-0.5 rounded">
                    <Text className="text-zinc-400 text-[8px] font-bold" numberOfLines={1}>
                      {item.contentTitle}
                    </Text>
                  </View>
                </View>

                {/* Comment Text */}
                <Text className="text-stone-300 text-xs mt-3 leading-5">
                  {item.comment}
                </Text>

                {/* Quick Actions */}
                <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-zinc-900">
                  <View className="flex-row items-center">
                    <TouchableOpacity className="flex-row items-center mr-4 active:opacity-60">
                      <Feather name="thumbs-up" size={12} color="#71717A" />
                      <Text className="text-zinc-500 text-[10px] font-bold ml-1">Thích</Text>
                    </TouchableOpacity>
                    <TouchableOpacity className="flex-row items-center active:opacity-60">
                      <MaterialCommunityIcons name="heart-outline" size={13} color="#71717A" />
                      <Text className="text-zinc-500 text-[10px] font-bold ml-1 font-bold">Thả tim</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl active:opacity-60">
                    <Text className="text-[#FF4E4E] text-[10px] font-bold">Phản hồi</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================= DOANH THU (REVENUE) TAB ================= */}
        {activeTab === "revenue" && (
          <View className="px-4 mt-6">
            <Text className="text-white text-base font-black tracking-wide mb-3">
              Quản lý tài chính
            </Text>
            <Text className="text-zinc-500 text-xs font-medium mb-5">Thông tin và lịch sử rút tiền</Text>

            {/* Wallet Balance Card */}
            <LinearGradient
              colors={["#27272A", "#18181B"]}
              className="border border-zinc-800 rounded-3xl p-5 mb-5"
            >
              <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                Tổng Thu Nhập Chưa Rút
              </Text>
              <Text className="text-[#D4AF37] text-3xl font-black mt-2">
                $125.80
              </Text>
              <Text className="text-zinc-500 text-[10px] mt-1.5 font-bold">
                Cập nhật lần cuối: Hôm nay lúc 18:00
              </Text>

              <TouchableOpacity className="bg-[#D4AF37] h-11 justify-center items-center rounded-xl mt-5 shadow-lg shadow-yellow-500/10 active:opacity-90">
                <Text className="text-stone-950 font-black text-xs uppercase tracking-wide">
                  Yêu Cầu Rút Tiền
                </Text>
              </TouchableOpacity>
            </LinearGradient>

            {/* Income History list */}
            <Text className="text-white text-xs font-black uppercase tracking-wider mb-3 mt-2">
              Lịch sử nhận thanh toán
            </Text>
            {revenueReports.map((report, idx) => (
              <View
                key={idx}
                className="flex-row justify-between items-center bg-[#1E1E22] border border-zinc-800 rounded-2xl p-4 mb-2.5"
              >
                <View>
                  <Text className="text-white text-xs font-bold">{report.month}</Text>
                  <Text className="text-zinc-500 text-[10px] font-medium mt-1">Đăng ký VIP & Lượt xem</Text>
                </View>
                <View className="items-end">
                  <Text className="text-green-500 text-sm font-black">{report.amount}</Text>
                  <View className="bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded mt-1">
                    <Text className="text-green-500 text-[8px] font-black uppercase">
                      {report.status}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
