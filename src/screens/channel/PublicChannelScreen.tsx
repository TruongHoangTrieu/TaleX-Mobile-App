import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { getCreatorDetail, getFollowers } from "@/services/follow";
import { getPublicSeries, type SeriesItem } from "@/services/series";
import { listSeriesByCreator } from "@/services/creatorContent";
import { useCreatorFollow } from "@/hooks/useCreatorFollow";
import { useAuth } from "@/context/AuthContext";

const { width } = Dimensions.get("window");

type TabType = "home" | "comics" | "movies" | "about";

const formatAgeRating = (rating?: string) => {
  if (!rating || typeof rating !== "string" || !rating.trim()) return null;
  return rating.trim();
};

const getAgeRatingStyle = (ratingStr?: string | null) => {
  if (!ratingStr)
    return { bg: "bg-zinc-800", text: "text-white", border: "border-zinc-700" };
  const r = ratingStr.toUpperCase();
  if (r.includes("18"))
    return { bg: "bg-red-600", text: "text-white", border: "border-red-500" };
  if (r.includes("16"))
    return {
      bg: "bg-amber-600",
      text: "text-white",
      border: "border-amber-500",
    };
  if (r.includes("13"))
    return { bg: "bg-blue-600", text: "text-white", border: "border-blue-500" };
  return {
    bg: "bg-amber-500/90",
    text: "text-black",
    border: "border-amber-400",
  };
};

export default function PublicChannelScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const paramCreatorId =
    route.params?.creatorId || route.params?.id || route.params?.accountId;

  const [loading, setLoading] = useState(true);
  const [creatorDetail, setCreatorDetail] = useState<any>(null);
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [showAboutModal, setShowAboutModal] = useState(false);

  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && paramCreatorId) {
      const target = String(paramCreatorId).toLowerCase();
      const myAccId = user?.accountId
        ? String(user.accountId).toLowerCase()
        : "";

      if (myAccId && myAccId === target) {
        navigation.replace("CreatorChannel");
        return;
      }
    }
  }, [isAuthenticated, paramCreatorId, user]);

  useEffect(() => {
    let isMounted = true;
    const fetchPublicChannelData = async () => {
      if (!paramCreatorId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const target = String(paramCreatorId).toLowerCase();

        // 1. Thử lấy thông tin Creator Detail
        let detailData: any = null;
        try {
          detailData = await getCreatorDetail(paramCreatorId);
        } catch (e) {
          // Bắt 404 lỗi không tìm thấy creator_id -> sử dụng fallback từ series bên dưới (giống Web)
        }

        if (isMounted && detailData) {
          setCreatorDetail(detailData);
        }

        // 2. Tải danh sách tất cả các Series công khai
        let allSeries: SeriesItem[] = [];
        try {
          const publicRes = await getPublicSeries(1, 100);
          if (publicRes?.data?.content) {
            allSeries = publicRes.data.content;
          }
        } catch (e) {
          try {
            const listRes = await listSeriesByCreator();
            if (listRes) allSeries = listRes as any[];
          } catch (err) {
            // ignore
          }
        }

        // Lọc series công khai theo creatorId/accountId
        const matchedSeries = allSeries.filter((item: any) => {
          if (
            item.status === "HIDDEN" ||
            item.status === "DELETED" ||
            item.visibility === "PRIVATE"
          ) {
            return false;
          }
          const cId = item.creatorId
            ? String(item.creatorId).toLowerCase()
            : "";
          const aId = item.accountId
            ? String(item.accountId).toLowerCase()
            : "";
          const cName = item.creatorName
            ? String(item.creatorName).toLowerCase()
            : "";
          const sId = item.seriesId ? String(item.seriesId).toLowerCase() : "";

          return (
            cId === target ||
            aId === target ||
            cName === target ||
            sId === target
          );
        });

        if (isMounted) {
          setSeriesList(matchedSeries.length > 0 ? matchedSeries : allSeries);
        }

        // 3. Lấy số lượng người theo dõi
        try {
          const targetAccId = detailData?.accountId || paramCreatorId;
          const followersRes = await getFollowers(0, 10, targetAccId);
          if (isMounted && followersRes) {
            setFollowersCount(followersRes.totalElements || 0);
          }
        } catch (e) {
          // ignore
        }
      } catch (err: any) {
        console.error("Lỗi tải Kênh công khai:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPublicChannelData();
    return () => {
      isMounted = false;
    };
  }, [paramCreatorId]);

  // Fallback thông tin Tác giả từ danh sách Series (Giống Web /public-channel)
  const seriesCreatorFallback = useMemo(() => {
    if (!seriesList || seriesList.length === 0) return null;
    const first: any = seriesList[0];
    return {
      channelName: first.creatorName || first.author || "Tác giả TaleX",
      username: first.username || first.creatorName || "creator",
      avatarUrl: first.creatorAvatar || first.coverUrl,
      bannerUrl: first.bannerUrl,
      accountId: first.accountId || first.creatorId || paramCreatorId,
      bio:
        first.description ||
        "Chào mừng bạn đến với kênh sáng tạo chính thức trên TaleX!",
    };
  }, [seriesList, paramCreatorId]);

  const effectiveCreator = creatorDetail || seriesCreatorFallback;
  const effectiveAccountId =
    effectiveCreator?.accountId ||
    effectiveCreator?.creatorId ||
    paramCreatorId;

  // Hook Theo dõi / Hủy theo dõi nhà sáng tạo
  const { isFollowing, toggleFollow, isMutating } =
    useCreatorFollow(effectiveAccountId);

  // Phân loại danh sách Truyện tranh và Phim
  const comicSeries = useMemo(
    () =>
      seriesList.filter((s: any) => s.contentType?.toUpperCase() === "COMIC"),
    [seriesList],
  );

  const movieSeries = useMemo(
    () =>
      seriesList.filter((s: any) => s.contentType?.toUpperCase() === "VIDEO"),
    [seriesList],
  );

  const handleSeriesPress = (item: any) => {
    const sId = item.seriesId || item.id;
    if (item.contentType?.toUpperCase() === "COMIC") {
      navigation.navigate("ComicDetailScreen", { comicId: sId });
    } else {
      navigation.navigate("MovieDetailScreen", {
        seriesItem: item,
        movieId: sId,
      });
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0F0F0F]">
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text className="text-zinc-500 text-xs mt-3">
          Đang tải kênh YouTube Style...
        </Text>
      </View>
    );
  }

  const creatorName =
    effectiveCreator?.channelName ||
    effectiveCreator?.displayName ||
    effectiveCreator?.fullName ||
    effectiveCreator?.username ||
    "Kênh sáng tạo TaleX";

  const creatorAvatar =
    effectiveCreator?.avatarUrl ||
    (seriesList.length > 0 ? (seriesList[0] as any).creatorAvatar : null) ||
    effectiveCreator?.coverUrl;

  // Background phía sau luôn luôn lấy trực tiếp ảnh của Avatar:
  const creatorBanner = creatorAvatar;
  const bioText =
    effectiveCreator?.bio ||
    effectiveCreator?.description ||
    "Chào mừng bạn đến với kênh sáng tạo chính thức trên TaleX! Hãy nhấn Đăng ký để không bỏ lỡ nội dung mới nhất.";

  return (
    <View className="flex-1 bg-[#0F0F0F]">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F0F" />

      {/* NÚt BACK FLOATING */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
        className="absolute left-4 z-50 w-9 h-9 rounded-full bg-black/40 border border-white/20 items-center justify-center shadow-lg"
        style={{ top: Math.max(insets.top, 16) }}
      >
        <Feather name="arrow-left" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView
        className="flex-1 bg-[#0F0F0F]"
        alwaysBounceVertical={true}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. CHANNEL BANNER (YOUTUBE STYLE 16:9 BANNER) */}
        <View className="w-full h-[220px] bg-zinc-900 relative">
          {creatorBanner ? (
            <Image
              source={{ uri: creatorBanner }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Image
              source={require("@assets/background.webp")}
              className="w-full h-full"
              resizeMode="cover"
            />
          )}
          <View className="absolute inset-0 bg-black/20" />
        </View>

        {/* 2. CREATOR PROFILE INFO HEADER (YOUTUBE MOBILE LAYOUT) */}
        <View className="px-4 pt-3 pb-4">
          <View className="flex-row items-center">
            {/* Avatar Tròn YouTube */}
            <View className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 border-2 border-white/10 mr-4">
              {creatorAvatar ? (
                <Image
                  source={{ uri: creatorAvatar }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={require("@assets/icon.png")}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              )}
            </View>

            {/* Title & Stats */}
            <View className="flex-1 justify-center">
              <View className="flex-row items-center">
                <Text
                  className="text-white text-xl font-black tracking-tight mr-1.5"
                  numberOfLines={1}
                >
                  {creatorName}
                </Text>
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={16}
                  color="#D4AF37"
                />
              </View>

              <Text
                className="text-zinc-400 text-xs font-medium mt-0.5"
                numberOfLines={1}
              >
                @{effectiveCreator?.username || "creator"} • {followersCount}{" "}
                người đăng ký • {seriesList.length} tác phẩm
              </Text>
            </View>
          </View>

          {/* BIO SNIPPET VỚI NÚT XEM THÊM (YOUTUBE BIO LINK) */}
          <TouchableOpacity
            onPress={() => setShowAboutModal(true)}
            activeOpacity={0.7}
            className="flex-row items-center justify-between mt-3 bg-zinc-900/60 px-3 py-2 rounded-xl border border-white/5"
          >
            <Text
              className="text-zinc-300 text-xs flex-1 mr-2"
              numberOfLines={1}
            >
              {bioText}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-[#D4AF37] text-xs font-bold mr-0.5">
                xem thêm
              </Text>
              <Feather name="chevron-right" size={14} color="#D4AF37" />
            </View>
          </TouchableOpacity>

          {/* NÚT ĐĂNG KÝ / THEO DÕI STYLE YOUTUBE PILL BUTTON */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={toggleFollow}
            disabled={isMutating}
            className={`w-full h-11 rounded-full items-center justify-center mt-3 flex-row ${
              isFollowing
                ? "bg-zinc-800 border border-zinc-700"
                : "bg-[#D4AF37]"
            }`}
          >
            {isMutating ? (
              <ActivityIndicator
                size="small"
                color={isFollowing ? "#FFFFFF" : "#141210"}
              />
            ) : (
              <>
                <Feather
                  name={isFollowing ? "bell" : "user-plus"}
                  size={16}
                  color={isFollowing ? "#FFFFFF" : "#141210"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  className={`text-sm font-black tracking-wide ${
                    isFollowing ? "text-white" : "text-[#141210]"
                  }`}
                >
                  {isFollowing ? "Đã đăng ký ▾" : "Đăng ký kênh"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 3. YOUTUBE HORIZONTAL SCROLLABLE TAB BAR */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="border-b border-white/10 px-2 bg-[#0F0F0F]"
        >
          {[
            { id: "home", label: "Trang chủ" },
            { id: "comics", label: `Truyện (${comicSeries.length})` },
            { id: "movies", label: `Phim (${movieSeries.length})` },
            { id: "about", label: "Giới thiệu" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id as TabType)}
                className={`py-3 px-4 border-b-2 ${
                  isActive ? "border-[#D4AF37]" : "border-transparent"
                }`}
              >
                <Text
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isActive ? "text-[#D4AF37]" : "text-zinc-400"
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 4. TAB CONTENT AREA */}
        <View className="px-4 py-4 pb-12">
          {/* TAB 1: TRANG CHỦ (YOUTUBE HOME FEED) */}
          {activeTab === "home" && (
            <View className="space-y-6">
              {seriesList.length === 0 ? (
                <View className="py-16 items-center justify-center">
                  <MaterialCommunityIcons
                    name="youtube"
                    size={48}
                    color="#3F3F46"
                  />
                  <Text className="text-zinc-500 text-sm mt-3 font-bold">
                    Kênh này chưa có nội dung nào
                  </Text>
                </View>
              ) : (
                <View>
                  {/* ================= SPOTLIGHT HERO BANNER CARD (MATCHING USER REFERENCE IMAGE) ================= */}
                  {seriesList.length > 0 && (
                    <View className="mb-6">
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => handleSeriesPress(seriesList[0])}
                        className="relative rounded-3xl overflow-hidden border border-white/15 bg-zinc-900 shadow-2xl"
                      >
                        {seriesList[0].coverUrl || seriesList[0].bannerUrl ? (
                          <Image
                            source={{
                              uri:
                                seriesList[0].coverUrl ||
                                seriesList[0].bannerUrl,
                            }}
                            className="w-full h-[185px]"
                            resizeMode="cover"
                          />
                        ) : (
                          <Image
                            source={require("@assets/background.webp")}
                            className="w-full h-[185px]"
                            resizeMode="cover"
                          />
                        )}
                        <LinearGradient
                          colors={[
                            "transparent",
                            "rgba(18,18,20,0.45)",
                            "rgba(18,18,20,0.95)",
                          ]}
                          className="absolute inset-0 p-4 justify-end"
                        >
                          <View className="bg-[#D4AF37] self-start px-2.5 py-1 rounded-lg mb-2 flex-row items-center shadow-md">
                            <Ionicons name="flame" size={13} color="#141210" />
                            <Text className="text-[#141210] text-[10px] font-black uppercase tracking-wider ml-1">
                              SIÊU PHẨM TUẦN NÀY
                            </Text>
                          </View>
                          <Text
                            className="text-white font-extrabold text-xl leading-tight"
                            numberOfLines={1}
                          >
                            {seriesList[0].title}
                          </Text>
                          <Text
                            className="text-[#D1D5DB] text-xs mt-1 leading-snug"
                            numberOfLines={2}
                          >
                            {seriesList[0].description ||
                              "Cuộc chiến giữa các thế lực kịch tính và hấp dẫn kéo theo những lựa chọn không thể quay đầu."}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}

                  <Text className="text-white text-sm font-black mb-3">
                    Danh sách tác phẩm ({seriesList.length})
                  </Text>
                  <View className="flex-row flex-wrap justify-between">
                    {seriesList.map((item: any) => {
                      const sId = item.seriesId || item.id;
                      const isComic =
                        item.contentType?.toUpperCase() === "COMIC";

                      return (
                        <TouchableOpacity
                          key={sId}
                          activeOpacity={0.85}
                          onPress={() => handleSeriesPress(item)}
                          style={{ width: (width - 44) / 2 }}
                          className="mb-4 aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 relative shadow-xl"
                        >
                          {item.coverUrl || item.bannerUrl ? (
                            <Image
                              source={{ uri: item.coverUrl || item.bannerUrl! }}
                              className="w-full h-full"
                              resizeMode="cover"
                            />
                          ) : (
                            <View className="w-full h-full items-center justify-center">
                              <Feather
                                name={isComic ? "book-open" : "film"}
                                size={28}
                                color="#71717A"
                              />
                            </View>
                          )}
                          {/* Age Rating Overlay Badge Top Right - Only if provided by API */}
                          {(() => {
                            const formatted = formatAgeRating(
                              item.ageRating ||
                                item.targetAudience ||
                                item.contentRating,
                            );
                            if (!formatted) return null;
                            const style = getAgeRatingStyle(formatted);
                            return (
                              <View
                                className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md border ${style.bg} ${style.border} shadow-md z-10`}
                              >
                                <Text
                                  className={`text-[9px] font-black ${style.text}`}
                                >
                                  {formatted}
                                </Text>
                              </View>
                            );
                          })()}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* TAB 2: TRUYỆN TRANH (YOUTUBE COMICS FEED) */}
          {activeTab === "comics" && (
            <View>
              {comicSeries.length === 0 ? (
                <View className="py-16 items-center justify-center">
                  <Feather name="book-open" size={44} color="#3F3F46" />
                  <Text className="text-zinc-500 text-sm mt-3 font-bold">
                    Chưa có bộ truyện tranh nào
                  </Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap justify-between">
                  {comicSeries.map((item: any) => {
                    const sId = item.seriesId || item.id;
                    return (
                      <TouchableOpacity
                        key={sId}
                        activeOpacity={0.85}
                        onPress={() => handleSeriesPress(item)}
                        style={{ width: (width - 44) / 2 }}
                        className="mb-4 aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 relative shadow-xl"
                      >
                        {item.coverUrl ? (
                          <Image
                            source={{ uri: item.coverUrl }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-full h-full items-center justify-center">
                            <Feather
                              name="book-open"
                              size={28}
                              color="#71717A"
                            />
                          </View>
                        )}
                        {/* Age Rating Overlay Badge Top Right - Only if provided by API */}
                        {(() => {
                          const formatted = formatAgeRating(
                            item.ageRating ||
                              item.targetAudience ||
                              item.contentRating,
                          );
                          if (!formatted) return null;
                          const style = getAgeRatingStyle(formatted);
                          return (
                            <View
                              className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md border ${style.bg} ${style.border} shadow-md z-10`}
                            >
                              <Text
                                className={`text-[9px] font-black ${style.text}`}
                              >
                                {formatted}
                              </Text>
                            </View>
                          );
                        })()}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* TAB 3: PHIM ẢNH (YOUTUBE MOVIES FEED) */}
          {activeTab === "movies" && (
            <View>
              {movieSeries.length === 0 ? (
                <View className="py-16 items-center justify-center">
                  <Feather name="video" size={44} color="#3F3F46" />
                  <Text className="text-zinc-500 text-sm mt-3 font-bold">
                    Chưa có phim ảnh nào được xuất bản
                  </Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap justify-between">
                  {movieSeries.map((item: any) => {
                    const sId = item.seriesId || item.id;
                    return (
                      <TouchableOpacity
                        key={sId}
                        activeOpacity={0.85}
                        onPress={() => handleSeriesPress(item)}
                        style={{ width: (width - 44) / 2 }}
                        className="mb-4 aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 relative shadow-xl"
                      >
                        {item.coverUrl || item.bannerUrl ? (
                          <Image
                            source={{ uri: item.coverUrl || item.bannerUrl! }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-full h-full items-center justify-center">
                            <Feather name="film" size={28} color="#71717A" />
                          </View>
                        )}
                        {/* Age Rating Overlay Badge Top Right - Only if provided by API */}
                        {(() => {
                          const formatted = formatAgeRating(
                            item.ageRating ||
                              item.targetAudience ||
                              item.contentRating,
                          );
                          if (!formatted) return null;
                          const style = getAgeRatingStyle(formatted);
                          return (
                            <View
                              className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md border ${style.bg} ${style.border} shadow-md z-10`}
                            >
                              <Text
                                className={`text-[9px] font-black ${style.text}`}
                              >
                                {formatted}
                              </Text>
                            </View>
                          );
                        })()}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* TAB 4: GIỚI THIỆU (ABOUT KÊNH) */}
          {activeTab === "about" && (
            <View className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 space-y-4">
              <View className="flex-row items-center pb-3 border-b border-white/5">
                <Feather
                  name="info"
                  size={16}
                  color="#D4AF37"
                  style={{ marginRight: 8 }}
                />
                <Text className="text-white text-sm font-bold">
                  Thông tin chi tiết Kênh
                </Text>
              </View>

              <View className="space-y-3">
                <View className="flex-row justify-between">
                  <Text className="text-zinc-400 text-xs">Tên Kênh:</Text>
                  <Text className="text-white text-xs font-bold">
                    {creatorName}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-zinc-400 text-xs">
                    Biệt danh handle:
                  </Text>
                  <Text className="text-[#D4AF37] text-xs font-bold">
                    @{effectiveCreator?.username || "creator"}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-zinc-400 text-xs">
                    Số người đăng ký:
                  </Text>
                  <Text className="text-white text-xs font-bold">
                    {followersCount} người
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-zinc-400 text-xs">Tổng tác phẩm:</Text>
                  <Text className="text-white text-xs font-bold">
                    {seriesList.length} bài đăng
                  </Text>
                </View>

                <View className="pt-2 border-t border-white/5">
                  <Text className="text-zinc-400 text-xs mb-1 font-bold">
                    Mô tả kênh:
                  </Text>
                  <Text className="text-zinc-300 text-xs leading-5">
                    {bioText}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODAL THÔNG TIN GIỚI THIỆU KÊNH (STYLE YOUTUBE ABOUT MODAL) */}
      <Modal visible={showAboutModal} transparent animationType="slide">
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-[#18181B] rounded-t-3xl p-5 border-t border-white/10 max-h-[80%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-white/10 mb-4">
              <Text className="text-white text-base font-bold">
                Giới thiệu về kênh
              </Text>
              <TouchableOpacity
                onPress={() => setShowAboutModal(false)}
                className="p-1"
              >
                <Feather name="x" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-white text-lg font-black">
                {creatorName}
              </Text>
              <Text className="text-[#D4AF37] text-xs font-bold mt-0.5 mb-3">
                @{effectiveCreator?.username || "creator"}
              </Text>

              <Text className="text-zinc-300 text-sm leading-6 mb-4">
                {bioText}
              </Text>

              <View className="space-y-3 pt-3 border-t border-white/10">
                <View className="flex-row items-center">
                  <Feather
                    name="users"
                    size={16}
                    color="#A1A1AA"
                    style={{ marginRight: 10 }}
                  />
                  <Text className="text-zinc-300 text-xs">
                    {followersCount} người đăng ký kênh
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Feather
                    name="layers"
                    size={16}
                    color="#A1A1AA"
                    style={{ marginRight: 10 }}
                  />
                  <Text className="text-zinc-300 text-xs">
                    {seriesList.length} tác phẩm đã đăng
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Feather
                    name="globe"
                    size={16}
                    color="#A1A1AA"
                    style={{ marginRight: 10 }}
                  />
                  <Text className="text-zinc-300 text-xs">
                    Gia nhập cộng đồng TaleX Mobile
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
