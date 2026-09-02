import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Modal,
  StyleSheet,
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
import {
  getPublicSeries,
  getPublicCombos,
  type SeriesItem,
  type ComboItem,
} from "@/services/series";
import { listSeriesByCreator } from "@/services/creatorContent";
import { useCreatorFollow } from "@/hooks/useCreatorFollow";
import { useAuth } from "@/context/AuthContext";
import { ComboCard } from "@/components/combo/ComboCard";
import QuickUnlockModal from "@/components/checkout/QuickUnlockModal";

const { width } = Dimensions.get("window");

type TabType = "home" | "comics" | "movies" | "combos" | "about";

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
  const [combosList, setCombosList] = useState<ComboItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [unlockModalConfig, setUnlockModalConfig] = useState<{
    visible: boolean;
    itemId?: string | null;
    itemTitle?: string;
  }>({
    visible: false,
    itemId: null,
    itemTitle: "",
  });

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

        // 4. Lấy danh sách Gói Combo
        try {
          const combosRes = await getPublicCombos();
          if (isMounted && Array.isArray(combosRes)) {
            setCombosList(combosRes);
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
      bio: null,
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

  // Lọc danh sách Combo của riêng Tác giả này
  const creatorCombos = useMemo(() => {
    const target = String(effectiveAccountId || paramCreatorId || "").toLowerCase();
    return combosList.filter((combo) => {
      const cId = combo.creatorId ? String(combo.creatorId).toLowerCase() : "";
      const aId = combo.creatorAccountId || combo.accountId ? String(combo.creatorAccountId || combo.accountId).toLowerCase() : "";
      const matchesEp = combo.episodes?.some((ep: any) =>
        seriesList.some((s) => s.seriesId === ep.seriesId)
      );
      return (cId && cId === target) || (aId && aId === target) || matchesEp;
    });
  }, [combosList, effectiveAccountId, paramCreatorId, seriesList]);

  const handlePurchaseCombo = (combo: ComboItem) => {
    if (!user) {
      navigation.navigate("LoginScreen");
      return;
    }
    setUnlockModalConfig({
      visible: true,
      itemId: combo.comboId,
      itemTitle: combo.title,
    });
  };

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
          Đang tải kênh...
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
  const rawBio =
    creatorDetail?.bio ||
    creatorDetail?.description;
  const bioText =
    rawBio && typeof rawBio === "string" && rawBio.trim().length > 0
      ? rawBio.trim()
      : null;

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
          {bioText && (
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
          )}

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
            { id: "combos", label: `Combo (${creatorCombos.length})` },
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
                        className="relative rounded-3xl overflow-hidden border border-white/15 bg-zinc-900 shadow-2xl min-h-[190px]"
                      >
                        {seriesList[0].coverUrl || seriesList[0].bannerUrl ? (
                          <Image
                            source={{
                              uri:
                                seriesList[0].bannerUrl ||
                                seriesList[0].coverUrl,
                            }}
                            style={StyleSheet.absoluteFillObject}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <Image
                            source={require("@assets/background.webp")}
                            style={StyleSheet.absoluteFillObject}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        )}
                        {/* Top Left: TRUYỆN / PHIM */}
                        <View
                          style={{
                            backgroundColor: seriesList[0].contentType?.toUpperCase() === "COMIC" ? "#2563EB" : "#DC2626",
                            borderColor: seriesList[0].contentType?.toUpperCase() === "COMIC" ? "#60A5FA" : "#F87171",
                          }}
                          className="absolute top-3 left-3 px-2.5 py-0.5 rounded-lg border z-20 shadow-lg"
                        >
                          <Text className="text-white text-[9px] font-black uppercase tracking-wider">
                            {seriesList[0].contentType?.toUpperCase() === "COMIC" ? "TRUYỆN" : "PHIM"}
                          </Text>
                        </View>

                        {/* Top Right: Age Rating Badge */}
                        {(() => {
                          const formatted = formatAgeRating(
                            seriesList[0].ageRating ||
                              (seriesList[0] as any).targetAudience ||
                              (seriesList[0] as any).contentRating,
                          );
                          if (!formatted) return null;
                          const style = getAgeRatingStyle(formatted);
                          return (
                            <View
                              className={`absolute top-3 right-3 px-2 py-0.5 rounded-lg border ${style.bg} ${style.border} shadow-md z-20`}
                            >
                              <Text
                                className={`text-[9px] font-black ${style.text}`}
                              >
                                {formatted}
                              </Text>
                            </View>
                          );
                        })()}

                        <LinearGradient
                          colors={[
                            "transparent",
                            "rgba(10,8,6,0.5)",
                            "rgba(10,8,6,0.98)",
                          ]}
                          locations={[0, 0.4, 1]}
                          style={[
                            StyleSheet.absoluteFillObject,
                            {
                              justifyContent: "flex-end",
                              padding: 16,
                              paddingBottom: 14,
                            },
                          ]}
                        >
                          <View style={{ marginTop: "auto" }}>
                            <Text
                              className="text-white font-extrabold text-xl leading-tight shadow-md"
                              numberOfLines={1}
                            >
                              {seriesList[0].title}
                            </Text>
                            <Text
                              className="text-[#D1D5DB] text-xs mt-1 leading-snug font-medium"
                              numberOfLines={2}
                            >
                              {seriesList[0].description ||
                                "Cuộc chiến giữa các thế lực kịch tính và hấp dẫn kéo theo những lựa chọn không thể quay đầu."}
                            </Text>
                          </View>
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

                          {/* Top Left: TRUYỆN / PHIM */}
                          <View
                            style={{
                              backgroundColor: isComic ? "#2563EB" : "#DC2626",
                              borderColor: isComic ? "#60A5FA" : "#F87171",
                            }}
                            className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md border z-20 shadow-md"
                          >
                            <Text className="text-white text-[8px] font-black uppercase tracking-wider">
                              {isComic ? "TRUYỆN" : "PHIM"}
                            </Text>
                          </View>

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

          {/* TAB 4: GÓI COMBO CỦA TÁC GIẢ (CHUẨN GIAO DIỆN WEB) */}
          {activeTab === "combos" && (
            <View className="space-y-4">
              <View className="flex-row items-center justify-between pb-3 border-b border-white/5 mb-3">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="fire"
                    size={20}
                    color="#FF4E4E"
                    style={{ marginRight: 6 }}
                  />
                  <Text className="text-white text-base font-black">
                    Gói Combo Của Tác Giả ({creatorCombos.length})
                  </Text>
                </View>
                {creatorCombos.length > 0 && (
                  <View className="bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-2.5 py-0.5 rounded-full">
                    <Text className="text-[#D4AF37] font-black text-[10px]">
                      Ưu đãi trọn bộ
                    </Text>
                  </View>
                )}
              </View>

              {creatorCombos.length > 0 ? (
                <View className="flex-row flex-wrap justify-between gap-y-2.5">
                  {creatorCombos.map((combo) => {
                    const isSingle = creatorCombos.length === 1;
                    return (
                      <View
                        key={combo.comboId}
                        style={{ width: isSingle ? "100%" : "48.5%" }}
                      >
                        <ComboCard
                          combo={combo}
                          variant="grid2"
                          onPurchase={handlePurchaseCombo}
                        />
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View className="py-16 items-center justify-center bg-zinc-900/40 rounded-2xl border border-white/5">
                  <MaterialCommunityIcons
                    name="package-variant-closed"
                    size={48}
                    color="#3F3F46"
                  />
                  <Text className="text-zinc-400 text-sm font-bold mt-3 text-center">
                    Chưa có gói Combo ưu đãi nào từ tác giả này
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* TAB 5: GIỚI THIỆU (ABOUT KÊNH) */}
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
                    {bioText || "Kênh chưa cập nhật phần giới thiệu."}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODAL THÔNG TIN GIỚI THIỆU KÊNH (ELEVATED BOTTOM SHEET) */}
      <Modal
        visible={showAboutModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={StyleSheet.absoluteFillObject} className="bg-black/85 justify-end z-50">
          <TouchableWithoutFeedback onPress={() => setShowAboutModal(false)}>
            <View style={StyleSheet.absoluteFillObject} />
          </TouchableWithoutFeedback>

          <View
            style={{ minHeight: "55%", maxHeight: "85%" }}
            className="bg-[#18181B] rounded-t-3xl p-6 border-t border-white/10 shadow-2xl"
          >
            {/* Top drag bar indicator */}
            <View className="w-12 h-1 rounded-full bg-zinc-600 self-center mb-4" />

            <View className="flex-row items-center justify-between pb-3 border-b border-white/10 mb-4">
              <Text className="text-white text-base font-black">
                Giới thiệu về kênh
              </Text>
              <TouchableOpacity
                onPress={() => setShowAboutModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center border border-white/10"
              >
                <Feather name="x" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text className="text-white text-xl font-black">
                {creatorName}
              </Text>
              <Text className="text-[#D4AF37] text-xs font-bold mt-1 mb-4">
                @{effectiveCreator?.username || "creator"}
              </Text>

              <View className="bg-zinc-900/60 p-4 rounded-2xl border border-white/5 mb-5">
                <Text className="text-zinc-300 text-sm leading-6">
                  {bioText || "Kênh chưa cập nhật phần giới thiệu."}
                </Text>
              </View>

              <View className="space-y-3 pt-2 border-t border-white/10">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-zinc-800/80 items-center justify-center mr-3 border border-white/5">
                    <Feather name="users" size={14} color="#D4AF37" />
                  </View>
                  <Text className="text-zinc-300 text-xs font-semibold">
                    {followersCount} người đăng ký kênh
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-zinc-800/80 items-center justify-center mr-3 border border-white/5">
                    <Feather name="layers" size={14} color="#D4AF37" />
                  </View>
                  <Text className="text-zinc-300 text-xs font-semibold">
                    {seriesList.length} tác phẩm đã đăng
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-zinc-800/80 items-center justify-center mr-3 border border-white/5">
                    <Feather name="globe" size={14} color="#D4AF37" />
                  </View>
                  <Text className="text-zinc-300 text-xs font-semibold">
                    Gia nhập cộng đồng TaleX Mobile
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* QUICK UNLOCK MODAL CHO COMBO */}
      <QuickUnlockModal
        visible={unlockModalConfig.visible}
        itemId={unlockModalConfig.itemId}
        itemType="COMBO"
        itemTitle={unlockModalConfig.itemTitle}
        onClose={() =>
          setUnlockModalConfig((prev) => ({ ...prev, visible: false }))
        }
        onSuccess={() => {
          Toast.show({
            type: "success",
            text1: "Thành công",
            text2: "Đã mở khóa gói Combo thành công!",
          });
        }}
      />
    </View>
  );
}
