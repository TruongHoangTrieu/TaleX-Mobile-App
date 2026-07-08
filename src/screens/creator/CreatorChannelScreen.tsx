import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";
import { getOwnCreator, type OwnCreatorResponse } from "@/services/creator";
import { listSeriesByCreator, type SeriesItem } from "@/services/creatorContent";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function CreatorChannelScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<OwnCreatorResponse | null>(null);
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [activeTab, setActiveTab] = useState<"comics" | "movies" | "about">("comics");
  const [isNotCreator, setIsNotCreator] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PUBLIC" | "PRIVATE">("ALL");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "oldest">("latest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchChannelData();
  }, []);

  const fetchChannelData = async () => {
    setLoading(true);
    setIsNotCreator(false);
    try {
      // 1. Lấy thông tin Creator
      const creatorData = await getOwnCreator();
      setCreator(creatorData);

      // 2. Lấy danh sách series của Creator này
      const seriesList = await listSeriesByCreator();
      setSeries(seriesList || []);
    } catch (err: any) {
      console.log("[Channel] Fetch error:", err);
      if (err.code === 4041) {
        setIsNotCreator(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const getSortedAndFilteredList = (list: SeriesItem[]) => {
    let result = [...list];
    
    // 1. Lọc theo trạng thái/visibility
    if (filterStatus === "PUBLIC") {
      result = result.filter(
        (item) => item.status === "PUBLISHED" || item.visibility === "PUBLIC"
      );
    } else if (filterStatus === "PRIVATE") {
      result = result.filter(
        (item: any) =>
          item.status === "DRAFT" ||
          item.status === "HIDDEN" ||
          item.visibility === "PRIVATE"
      );
    }

    // 2. Sắp xếp
    result.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (sortBy === "latest") {
        return dateB - dateA;
      } else if (sortBy === "oldest") {
        return dateA - dateB;
      } else if (sortBy === "popular") {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

    return result;
  };

  const comicsList = getSortedAndFilteredList(series.filter((item) => item.contentType?.toUpperCase() === "COMIC"));
  const moviesList = getSortedAndFilteredList(series.filter((item) => item.contentType?.toUpperCase() === "VIDEO"));
  const selectedItem = series.find((s) => s.seriesId === activeMenuId);

  // Điều hướng tới trang chi tiết tác phẩm tương ứng
  const handleItemPress = (item: SeriesItem) => {
    if (item.contentType?.toUpperCase() === "COMIC") {
      navigation.navigate("ComicDetailScreen", { comicId: item.seriesId });
    } else {
      navigation.navigate("MovieDetailScreen", { movieId: item.seriesId, seriesItem: item });
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0F0F0F]">
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  // Trường hợp chưa đăng ký làm Creator
  if (isNotCreator) {
    return (
      <SafeAreaView className="flex-1 bg-[#0F0F0F] justify-center items-center px-6">
        <StatusBar barStyle="light-content" />
        <View className="items-center">
          <View className="w-20 h-20 bg-zinc-800 rounded-full items-center justify-center mb-6">
            <MaterialCommunityIcons name="youtube-studio" size={44} color="#D4AF37" />
          </View>
          <Text className="text-white text-xl font-bold tracking-wide mb-2 text-center">
            Bạn chưa đăng ký Kênh Sáng Tạo
          </Text>
          <Text className="text-zinc-500 text-sm text-center mb-8 leading-5">
            Hãy tham gia chương trình sáng tạo nội dung của TaleX để đăng tải truyện tranh, phim ảnh và bắt đầu kiếm tiền ngay hôm nay!
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.replace("CreatorGuard")}
            className="w-full max-w-[240px]"
          >
            <LinearGradient
              colors={["#D4AF37", "#E6B800"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 48,
                borderRadius: 999,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#141210", fontWeight: "900", fontSize: 15 }}>
                Đăng ký kênh ngay
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderContentGrid = (list: SeriesItem[], typeLabel: string) => {
    if (list.length === 0) {
      return (
        <View className="py-16 items-center justify-center">
          <MaterialCommunityIcons name="folder-open-outline" size={48} color="#3F3F46" />
          <Text className="text-zinc-500 text-sm mt-3 italic">
            Chưa có {typeLabel} nào được tải lên
          </Text>
        </View>
      );
    }

    return (
      <View className="px-4 py-3">
        {list.map((item) => {
          const isComic = item.contentType?.toUpperCase() === "COMIC";
          const isPublic = item.status === "PUBLISHED" || item.visibility === "PUBLIC";
          
          // Tạo dữ liệu mock ổn định dựa trên mã seriesId để không bị thay đổi ngẫu nhiên mỗi lần render
          const seed = item.seriesId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const mockViewsVal = (seed * 17) % 89000 + 120;
          const mockViews = mockViewsVal >= 1000 ? `${(mockViewsVal / 1000).toFixed(1)}K` : `${mockViewsVal}`;
          const mockLikes = Math.floor(mockViewsVal * 0.08) + 5;
          const mockComments = Math.floor(mockViewsVal * 0.02) + 1;
          
          const timeOptions = ["2 ngày trước", "5 ngày trước", "1 tuần trước", "3 tuần trước", "1 tháng trước", "3 tháng trước"];
          const mockTime = timeOptions[seed % timeOptions.length];

          return (
            <TouchableOpacity
              key={item.seriesId}
              activeOpacity={0.8}
              onPress={() => handleItemPress(item)}
              className="flex-row mb-4 p-2 bg-[#161618] rounded-xl border border-white/5 items-center relative"
            >
              {/* Cover/Thumbnail (Left) */}
              {isComic ? (
                <View className="w-[80px] h-[112px] bg-[#27272A] rounded-lg overflow-hidden relative">
                  {item.coverUrl ? (
                    <Image source={{ uri: item.coverUrl }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Feather name="book-open" size={20} color="#71717A" />
                    </View>
                  )}
                  {/* Badge trạng thái trên ảnh bìa */}
                  <View className="absolute top-1.5 left-1.5 bg-[#141210]/75 px-1.5 py-0.5 rounded border border-white/5 shadow-sm">
                    <Text className={`text-[8px] font-black uppercase ${item.status === "PUBLISHED" ? "text-green-400" : "text-zinc-400"}`}>
                      {item.status === "PUBLISHED" ? "Công khai" : "Nháp"}
                    </Text>
                  </View>
                </View>
              ) : (
                <View className="w-[128px] h-[72px] bg-[#27272A] rounded-lg overflow-hidden relative">
                  {item.coverUrl ? (
                    <Image source={{ uri: item.coverUrl }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Feather name="video" size={20} color="#71717A" />
                    </View>
                  )}
                  {/* Play icon overlay for movie */}
                  <View className="absolute bottom-1.5 right-1.5 w-5 h-5 bg-[#D4AF37] rounded-full items-center justify-center shadow">
                    <FontAwesome5 name="play" size={7} color="#141210" style={{ marginLeft: 0.5 }} />
                  </View>
                  {/* Badge trạng thái trên ảnh bìa */}
                  <View className="absolute top-1.5 left-1.5 bg-[#141210]/75 px-1.5 py-0.5 rounded border border-white/5 shadow-sm">
                    <Text className={`text-[8px] font-black uppercase ${item.status === "PUBLISHED" ? "text-green-400" : "text-zinc-400"}`}>
                      {item.status === "PUBLISHED" ? "Công khai" : "Nháp"}
                    </Text>
                  </View>
                </View>
              )}

              {/* Info Block (Right) */}
              <View className="flex-1 ml-4 py-0.5">
                {/* Tiêu đề (Sạch sẽ, chừa khoảng trống cho nút 3 chấm) */}
                <Text className="text-white font-extrabold text-[14px] pr-6 tracking-wide" numberOfLines={1}>
                  {item.title}
                </Text>

                {/* Mô tả chi tiết */}
                <Text className="text-[#A19E95] text-[11px] font-semibold mt-1 pr-6" numberOfLines={1}>
                  {item.description || "Chưa có mô tả chi tiết cho tác phẩm này."}
                </Text>
                
                {/* Loại tác phẩm • Lượt xem • Thời gian xuất bản */}
                <Text className="text-stone-400 text-[10px] font-bold mt-1.5">
                  {isComic ? "Truyện tranh" : "Phim bộ"} • {mockViews} lượt xem • {mockTime}
                </Text>

                {/* Hàng tương tác & Bảo mật (Cùng một hàng) */}
                <View className="flex-row items-center mt-2 pr-2">
                  {/* Thích */}
                  <View className="flex-row items-center mr-3">
                    <Feather name="thumbs-up" size={11} color="#A19E95" />
                    <Text className="text-[#A19E95] text-[10px] font-bold ml-1">{mockLikes}</Text>
                  </View>
                  
                  {/* Bình luận */}
                  <View className="flex-row items-center mr-3">
                    <Feather name="message-square" size={11} color="#A19E95" />
                    <Text className="text-[#A19E95] text-[10px] font-bold ml-1">{mockComments}</Text>
                  </View>

                  {/* Quyền riêng tư (Quả cầu / Ổ khóa) */}
                  <View className="flex-row items-center">
                    <Feather
                      name={isPublic ? "globe" : "lock"}
                      size={11}
                      color={isPublic ? "#60A5FA" : "#A19E95"}
                    />
                    <Text className="text-[#A19E95] text-[10px] font-bold ml-1">
                      {isPublic ? "Công khai" : "Riêng tư"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Nút Ba chấm dọc (Góc phải trên cùng) */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setActiveMenuId(activeMenuId === item.seriesId ? null : item.seriesId);
                }}
                className="absolute top-2 right-2 p-1 z-30"
              >
                <Feather name="more-vertical" size={16} color="#71717A" />
              </TouchableOpacity>

              {/* Chevron arrow */}
              <Feather name="chevron-right" size={16} color="#3F3F46" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#0F0F0F]">
      <StatusBar barStyle="light-content" />

      {/* HEADER QUAY LẠI */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-white text-base font-bold">Kênh sáng tạo</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("CreatorDashboard")}
          className="p-1"
        >
          <MaterialCommunityIcons name="youtube-studio" size={24} color="#D4AF37" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* BANNER KÊNH */}
        <View className="w-full h-[120px] bg-zinc-800 relative">
          {creator?.bannerUrl ? (
            <Image source={{ uri: creator.bannerUrl }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Image source={require("@assets/background.webp")} className="w-full h-full" resizeMode="cover" />
          )}
        </View>

        {/* THÔNG TIN KÊNH */}
        <View className="px-4 -mt-10 mb-6">
          <View className="flex-row items-end justify-between">
            {/* Avatar */}
            <View className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#0F0F0F] bg-zinc-900">
              {creator?.avatarUrl ? (
                <Image source={{ uri: creator.avatarUrl }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Image source={require("@assets/icon.png")} className="w-full h-full" resizeMode="cover" />
              )}
            </View>

            {/* Nút chỉnh sửa / studio */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate("CreatorDashboard")}
              className="bg-[#262628] border border-white/5 px-4 py-1.5 rounded-full flex-row items-center mb-1"
            >
              <MaterialCommunityIcons name="view-dashboard-outline" size={14} color="#D4AF37" />
              <Text className="text-stone-300 text-xs font-bold ml-1.5">Quản lý kênh</Text>
            </TouchableOpacity>
          </View>

          {/* Name & Bio */}
          <Text className="text-white text-2xl font-black tracking-wide mt-3">
            {creator?.displayName || user?.fullName || "Kênh sáng tạo"}
          </Text>
          <Text className="text-zinc-400 text-xs font-bold mt-1.5">
            {user?.email || "Email không xác định"} • {series.length} Tác phẩm
          </Text>
          <Text className="text-stone-200 text-[13px] font-semibold mt-3 leading-5">
            {creator?.bio || "Chưa có tiểu sử giới thiệu. Hãy thêm tiểu sử trong Studio sáng tạo."}
          </Text>
        </View>

        {/* TAB BAR STYLE YOUTUBE */}
        <View className="flex-row border-b border-white/5 px-2">
          <TouchableOpacity
            onPress={() => setActiveTab("comics")}
            className={`py-3 px-4 border-b-2 ${activeTab === "comics" ? "border-[#D4AF37]" : "border-transparent"}`}
          >
            <Text className={`text-xs font-bold ${activeTab === "comics" ? "text-[#D4AF37]" : "text-zinc-500"}`}>
              TRUYỆN TRANH ({comicsList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("movies")}
            className={`py-3 px-4 border-b-2 ${activeTab === "movies" ? "border-[#D4AF37]" : "border-transparent"}`}
          >
            <Text className={`text-xs font-bold ${activeTab === "movies" ? "text-[#D4AF37]" : "text-zinc-500"}`}>
              PHIM ẢNH ({moviesList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("about")}
            className={`py-3 px-4 border-b-2 ${activeTab === "about" ? "border-[#D4AF37]" : "border-transparent"}`}
          >
            <Text className={`text-xs font-bold ${activeTab === "about" ? "text-[#D4AF37]" : "text-zinc-500"}`}>
              GIỚI THIỆU
            </Text>
          </TouchableOpacity>
        </View>

        {/* BỘ LỌC VÀ SẮP XẾP */}
        {(activeTab === "comics" || activeTab === "movies") && (
          <View className="flex-row items-center justify-between px-4 py-3 bg-[#161618]/30 border-b border-white/5 z-50">
            {/* Category Bar: Công khai / Riêng tư */}
            <View className="flex-row items-center">
              {(["ALL", "PUBLIC", "PRIVATE"] as const).map((status) => {
                const label =
                  status === "ALL"
                    ? "Tất cả"
                    : status === "PUBLIC"
                    ? "Công khai"
                    : "Riêng tư";
                const isActive = filterStatus === status;
                return (
                  <TouchableOpacity
                    key={status}
                    onPress={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-full mr-2 ${
                      isActive ? "bg-[#D4AF37]" : "bg-zinc-800"
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        isActive ? "text-[#141210]" : "text-zinc-400"
                      }`}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Dropdown Sắp xếp */}
            <View className="relative">
              <TouchableOpacity
                onPress={() => setShowSortMenu(!showSortMenu)}
                activeOpacity={0.8}
                className="flex-row items-center bg-[#262628] border border-white/5 rounded-lg px-2.5 py-1.5"
              >
                <Text className="text-stone-300 text-[11px] font-semibold mr-1">
                  {sortBy === "latest"
                    ? "Mới nhất"
                    : sortBy === "popular"
                    ? "Phổ biến"
                    : "Cũ nhất"}
                </Text>
                <Feather name="chevron-down" size={12} color="#A19E95" />
              </TouchableOpacity>

              {showSortMenu && (
                <View className="absolute right-0 top-8 bg-[#1A1A1C] border border-white/10 rounded-lg w-28 py-1 z-50 shadow-lg" style={{ zIndex: 999 }}>
                  {(["latest", "popular", "oldest"] as const).map((option) => {
                    const optionLabel =
                      option === "latest"
                        ? "Mới nhất"
                        : option === "popular"
                        ? "Phổ biến"
                        : "Cũ nhất";
                    const isOptionActive = sortBy === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        onPress={() => {
                          setSortBy(option);
                          setShowSortMenu(false);
                        }}
                        className="px-3 py-2 active:bg-zinc-800"
                      >
                        <Text
                          className={`text-[11px] ${
                            isOptionActive ? "text-[#D4AF37] font-bold" : "text-stone-300"
                          }`}
                        >
                          {optionLabel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        {/* TAB CONTENTS */}
        {activeTab === "comics" && renderContentGrid(comicsList, "truyện tranh")}
        {activeTab === "movies" && renderContentGrid(moviesList, "phim ảnh")}
        {activeTab === "about" && (
          <View className="p-5">
            <Text className="text-white font-bold text-sm mb-2">Tiểu sử</Text>
            <Text className="text-zinc-400 text-xs leading-5 mb-6">
              {creator?.bio || "Kênh chưa cập nhật tiểu sử."}
            </Text>

            <Text className="text-white font-bold text-sm mb-2">Thông tin kênh</Text>
            <View className="flex-row items-center mb-3">
              <Feather name="mail" size={14} color="#71717A" />
              <Text className="text-zinc-400 text-xs ml-3">{user?.email || "Không có email công khai"}</Text>
            </View>
            <View className="flex-row items-center mb-3">
              <Feather name="calendar" size={14} color="#71717A" />
              <Text className="text-zinc-400 text-xs ml-3">
                Tham gia ngày {creator?.createdAt ? new Date(creator.createdAt).toLocaleDateString("vi-VN") : "không xác định"}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Feather name="info" size={14} color="#71717A" />
              <Text className="text-zinc-400 text-xs ml-3">Trạng thái: {creator?.status === "ACTIVE" ? "Hoạt động" : "Đang kiểm duyệt"}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* BOTTOM SHEET CHO MENU BA CHẤM DỌC */}
      <Modal
        visible={activeMenuId !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveMenuId(null)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setActiveMenuId(null)}
          style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.6)", justifyContent: "flex-end" }}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{
              backgroundColor: "#161618",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 34,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.05)",
            }}
          >
            {/* Grab Bar */}
            <View className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-5" />

            {/* Title / Header */}
            {selectedItem && (
              <View className="mb-4">
                <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Tác phẩm</Text>
                <Text className="text-white text-base font-extrabold mt-0.5" numberOfLines={1}>
                  {selectedItem.title}
                </Text>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                const isComic = selectedItem?.contentType?.toUpperCase() === "COMIC";
                setActiveMenuId(null);
                if (isComic) {
                  navigation.navigate("UploadComic", { editSeriesId: selectedItem?.seriesId });
                } else {
                  navigation.navigate("UploadMovie", { editSeriesId: selectedItem?.seriesId });
                }
              }}
              className="py-3.5 flex-row items-center border-b border-white/5 active:opacity-70"
            >
              <View className="w-8 h-8 rounded-full bg-[#D4AF37]/10 items-center justify-center mr-3">
                <Feather name="edit-2" size={14} color="#D4AF37" />
              </View>
              <Text className="text-stone-300 text-sm font-semibold flex-1">Chỉnh sửa tác phẩm</Text>
              <Feather name="chevron-right" size={16} color="#444446" />
            </TouchableOpacity>

            {/* Option 2: Xóa */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setActiveMenuId(null);
                // Mock action
              }}
              className="py-3.5 flex-row items-center border-b border-white/5 active:opacity-70"
            >
              <View className="w-8 h-8 rounded-full bg-red-500/10 items-center justify-center mr-3">
                <Feather name="trash-2" size={14} color="#EF4444" />
              </View>
              <Text className="text-red-400 text-sm font-semibold flex-1">Xóa tác phẩm</Text>
              <Feather name="chevron-right" size={16} color="#444446" />
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveMenuId(null)}
              className="mt-4 py-3 bg-zinc-800 rounded-xl items-center justify-center active:bg-zinc-700"
            >
              <Text className="text-stone-300 text-sm font-bold">Hủy bỏ</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
