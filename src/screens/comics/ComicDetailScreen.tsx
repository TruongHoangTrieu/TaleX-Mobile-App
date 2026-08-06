import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  StatusBar,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  Feather,
} from "@expo/vector-icons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Animated } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { InteractiveStarRating } from "@/components/InteractiveStarRating";
import { getComicById, allComics } from "./comicMockData";
import {
  getPublicSeriesDetail,
  getSeriesSeasons,
  getSeasonEpisodes,
  getPublicCombos,
  formatWatchTime,
  formatAnalyticNumber,
  SeasonItem,
  EpisodeItem,
  ComboItem,
} from "@/services/series";
import { useCreatorFollow } from "@/hooks/useCreatorFollow";
import { FollowButton } from "@/components/FollowButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ShareButton } from "@/components/ShareButton";
import { EpisodeCommentsSection } from "@/components/comments/EpisodeCommentsSection";
import { useContentPurchase } from "@/hooks/useContentPurchase";

const { width } = Dimensions.get("window");

function SkeletonPulse({
  style,
  className,
}: {
  style?: any;
  className?: string;
}) {
  const opacity = React.useRef(new Animated.Value(0.25)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`bg-zinc-800/80 rounded-2xl ${className || ""}`}
      style={[{ opacity }, style]}
    />
  );
}

const formatAgeRating = (rating?: string) => {
  if (!rating || typeof rating !== "string" || !rating.trim()) return null;
  return rating.trim();
};

const getAgeRatingStyle = (ratingStr?: string | null) => {
  if (!ratingStr) return { bg: "bg-zinc-800", border: "border-zinc-700", text: "text-white" };
  const r = ratingStr.toUpperCase();
  if (r.includes("18")) return { bg: "bg-red-500/25", border: "border-red-500/50", text: "text-red-400" };
  if (r.includes("16")) return { bg: "bg-amber-500/25", border: "border-amber-500/50", text: "text-amber-400" };
  return { bg: "bg-emerald-500/25", border: "border-emerald-500/50", text: "text-emerald-400" };
};

type ComicDetailRouteParams = {
  comicId?: string;
};

export default function ComicDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { comicId } = (route.params || {}) as ComicDetailRouteParams;

  const [comic, setComic] = useState<any>(() => {
    if (comicId && comicId.length < 10) {
      return getComicById(comicId);
    }
    return null;
  });

  const [seasons, setSeasons] = useState<SeasonItem[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [episodesMap, setEpisodesMap] = useState<Record<string, EpisodeItem[]>>({});
  const [combos, setCombos] = useState<ComboItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isRead, setIsRead] = useState(false);

  // Tabs dưới: "about" | "comments"
  const [bottomTab, setBottomTab] = useState<"about" | "comments">("about");
  const [isAscending, setIsAscending] = useState(true);

  const creatorAccountId = comic?.creatorAccountId || comic?.authorAccountId || comic?.accountId;
  const {
    isFollowing,
    toggleFollow,
    isMutating: isFollowMutating,
  } = useCreatorFollow(creatorAccountId);

  // Tải chi tiết dữ liệu thực từ API đầy đủ tất cả các trường
  const loadData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);

      try {
        if (comicId && comicId.length >= 10) {
          const detailRes = await getPublicSeriesDetail(comicId);
          const detail = detailRes?.data;
          if (detail) {
            setComic({
              id: detail.seriesId || comicId,
              title: detail.title,
              coverUrl: detail.coverUrl || detail.bannerUrl,
              bannerUrl: detail.bannerUrl || detail.coverUrl,
              author: detail.creatorName || (detail as any).author || null,
              authorAccountId: detail.accountId || (detail as any).creatorId,
              creatorAccountId: detail.accountId || (detail as any).creatorId,
              creatorAvatar: (detail as any).creatorAvatar,
              totalCreatorFollowers: (detail as any).totalCreatorFollowers ?? null,
              description: detail.description,
              categories: (detail as any).categories || [],
              tags: (detail as any).tags || [],
              totalViews: detail.analyticData?.views ?? (detail as any).totalViews ?? null,
              totalSubscriptions: (detail as any).totalSubscriptions ?? null,
              likes: detail.analyticData?.likes ?? (detail as any).likes ?? null,
              analyticData: detail.analyticData || null,
              averageRating: detail.averageRating ?? (detail as any).rating ?? null,
              rating: detail.rating || null,
              year: (detail as any).year || null,
              ageRating: (detail as any).ageRating || null,
              language: (detail as any).language || null,
              status: (detail as any).status || null,
              contentType: (detail as any).contentType || "COMIC",
              createdAt: (detail as any).createdAt || null,
              updatedAt: (detail as any).updatedAt || null,
              chapters: (detail as any).chapters || [],
            });
          }
        }

        // Fetch Combo bundles (best-effort, doesn't block the rest of the screen)
        getPublicCombos()
          .then(setCombos)
          .catch(() => setCombos([]));

        // Fetch Seasons
        if (comicId) {
          try {
            const seasonsRes = await getSeriesSeasons(comicId);
            const seasonsList = seasonsRes?.data || [];
            if (seasonsList && seasonsList.length > 0) {
              const sorted = [...seasonsList].sort((a, b) => a.seasonNumber - b.seasonNumber);
              setSeasons(sorted);
              const firstSeasonId = sorted[0].seasonId;
              setSelectedSeasonId(firstSeasonId);

              const episodesRes = await getSeasonEpisodes(firstSeasonId);
              const epList = episodesRes?.data || [];
              if (epList) {
                setEpisodesMap({ [firstSeasonId]: epList });
              }
            }
          } catch (err) {
            // ignore
          }
        }
      } catch (err: any) {
        console.error("Lỗi tải chi tiết truyện:", err);
      } finally {
        if (!isSilent) setLoading(false);
        setRefreshing(false);
      }
    },
    [comicId],
  );

  useFocusEffect(
    useCallback(() => {
      loadData(true);
    }, [loadData]),
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const handleSeasonSelect = async (seasonId: string) => {
    setSelectedSeasonId(seasonId);
    if (!episodesMap[seasonId] && comicId) {
      try {
        const episodesRes = await getSeasonEpisodes(seasonId);
        const epList = episodesRes?.data || [];
        if (epList) {
          setEpisodesMap((prev) => ({ ...prev, [seasonId]: epList }));
        }
      } catch (err) {
        console.error("Lỗi tải danh sách tập truyện:", err);
      }
    }
  };

  const activeSeasonId =
    selectedSeasonId || (seasons.length > 0 ? seasons[0].seasonId : null);

  const currentEpisodes: EpisodeItem[] = activeSeasonId
    ? (episodesMap[activeSeasonId] || []).slice().sort((a, b) => a.episodeNumber - b.episodeNumber)
    : comic?.chapters || [];

  const firstEpisode = currentEpisodes.length > 0 ? currentEpisodes[0] : null;

  const seriesCombos = useMemo(() => {
    const seasonIds = new Set(seasons.map((s) => s.seasonId));
    return combos.filter((combo) => {
      if (!combo.episodes || combo.episodes.length === 0) return false;
      return combo.episodes.some(
        (ep) =>
          (ep.seasonId && seasonIds.has(ep.seasonId)) ||
          (comic?.title && ep.seriesTitle?.toLowerCase() === comic.title.toLowerCase())
      );
    });
  }, [combos, seasons, comic]);

  const { buy } = useContentPurchase();

  const displayEpisodes = useMemo(() => {
    const list = Array.isArray(currentEpisodes) ? [...currentEpisodes] : [];
    if (!isAscending) {
      list.reverse();
    }
    return list;
  }, [currentEpisodes, isAscending]);

  const recommendations = useMemo(() => {
    return allComics.filter((c) => c.id !== (comicId || comic?.id)).slice(0, 6);
  }, [comicId, comic]);

  const handleReadEpisode = (ep: EpisodeItem | null, index: number) => {
    const targetEp = ep || firstEpisode;
    if (!targetEp) {
      Alert.alert("Thông báo", "Truyện chưa có tập nào được phát hành.");
      return;
    }
    navigation.navigate("ComicReader", {
      comicId: comicId || comic?.id,
      chapterTitle: targetEp.title || `Tập ${targetEp.episodeNumber || index + 1}`,
      episodeTitle: targetEp.title,
      episodeIndex: index,
      episodeId: targetEp.episodeId,
    });
  };

  const handleCreatorPress = () => {
    if (!creatorAccountId) return;
    const isMyChannel =
      user?.accountId &&
      (String(user.accountId).toLowerCase() === String(creatorAccountId).toLowerCase() ||
        (comic?.creatorId && String(comic.creatorId).toLowerCase() === String(user.accountId).toLowerCase()));

    if (isMyChannel) {
      navigation.navigate("CreatorChannel");
    } else {
      navigation.navigate("PublicChannel", { creatorId: creatorAccountId });
    }
  };

  const categoriesArray = useMemo(() => {
    if (Array.isArray(comic?.categories) && comic.categories.length > 0) {
      return comic.categories
        .map((c: any) => (typeof c === "string" ? c : c.categoryName || c.name))
        .filter(Boolean);
    }
    return [];
  }, [comic]);

  const displayCategoryNames = useMemo(() => {
    if (categoriesArray.length > 0) {
      return categoriesArray.join(" · ");
    }
    return null;
  }, [categoriesArray]);

  const displayTagNames = useMemo<string[]>(() => {
    if (Array.isArray(comic?.tags) && comic.tags.length > 0) {
      return comic.tags
        .map((t: any) => (typeof t === "string" ? t : t.tagName || t.name))
        .filter(Boolean);
    }
    return [];
  }, [comic]);

  if (loading || !comic) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-[#121214]">
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Skeleton Hero Banner */}
          <View style={{ width, height: width * (9 / 16) + 40 }} className="relative bg-zinc-900 p-4 justify-between">
            <SkeletonPulse className="w-full h-full rounded-2xl" />
          </View>
          {/* Skeleton Meta Info */}
          <View className="px-4 mt-4">
            <SkeletonPulse className="w-3/4 h-7 rounded-xl mb-3" />
            <SkeletonPulse className="w-1/2 h-4 rounded-lg mb-4" />
            <View className="flex-row gap-2 mb-4">
              <SkeletonPulse className="w-20 h-6 rounded-md" />
              <SkeletonPulse className="w-16 h-6 rounded-md" />
              <SkeletonPulse className="w-24 h-6 rounded-md" />
            </View>
            <SkeletonPulse className="w-full h-24 rounded-2xl mb-6" />
            {/* Skeleton Episodes */}
            <View className="flex-row justify-between mb-3">
              <SkeletonPulse className="w-32 h-6 rounded-lg" />
              <SkeletonPulse className="w-16 h-6 rounded-lg" />
            </View>
            <View className="flex-row flex-wrap gap-2.5">
              {Array.from({ length: 6 }).map((_, idx) => (
                <SkeletonPulse key={idx} className="w-[30%] h-12 rounded-xl" />
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const bgImageSource =
    comic.coverUrl || comic.bannerUrl
      ? { uri: comic.coverUrl || comic.bannerUrl }
      : typeof comic.image === "object"
      ? comic.image
      : null;

  return (
    <View className="flex-1 bg-[#121214]">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D4AF37"
            colors={["#D4AF37"]}
          />
        }
      >
        {/* ================= 1. HERO 16:9 BANNER BACKDROP ================= */}
        <View style={{ width, height: width * (9 / 16) + 40 }} className="relative bg-zinc-900">
          {bgImageSource ? (
            <ImageBackground
              source={bgImageSource}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            >
              <LinearGradient
                colors={[
                  "rgba(18, 18, 20, 0.4)",
                  "rgba(18, 18, 20, 0.75)",
                  "#121214",
                ]}
                className="absolute inset-0 justify-between p-4"
              >
                {/* Top Navigation Bar */}
                <SafeAreaView edges={["top"]} className="flex-row justify-between items-center w-full z-20">
                  <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="w-9 h-9 rounded-full bg-black/50 items-center justify-center border border-white/10"
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
                  </TouchableOpacity>

                  <View className="flex-row items-center gap-2">
                    <ShareButton
                      episodeId={firstEpisode?.episodeId || comicId}
                      title={comic.title}
                      size="sm"
                    />
                    <BookmarkButton
                      episodeId={firstEpisode?.episodeId || comicId}
                      contentType="COMIC"
                      size="sm"
                    />
                  </View>
                </SafeAreaView>
              </LinearGradient>
            </ImageBackground>
          ) : (
            <View className="w-full h-full bg-zinc-900 justify-end p-4">
              <Text className="text-white text-2xl font-black">{comic.title}</Text>
            </View>
          )}
        </View>

        {/* ================= 2. OVERLAPPING HERO CARD (POSTER & META INFO) ================= */}
        <View className="px-4 flex-row items-end mt-[-70px] z-10 mb-4">
          {/* Poster Thumbnail with Age Rating Overlay Badge */}
          <View className="w-[105px] h-[148px] rounded-2xl border border-white/15 bg-zinc-800 shadow-2xl overflow-hidden relative">
            {bgImageSource ? (
              <Image
                source={bgImageSource}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center bg-zinc-800">
                <Ionicons name="book-outline" size={32} color="#D4AF37" />
              </View>
            )}

            {/* Age Rating Overlay Badge - Only if provided by API */}
            {(() => {
              const formatted = formatAgeRating(comic.ageRating);
              if (!formatted) return null;
              const style = getAgeRatingStyle(formatted);
              return (
                <View className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md border ${style.bg} ${style.border} shadow-md z-10`}>
                  <Text className={`text-[9px] font-black ${style.text}`}>
                    {formatted}
                  </Text>
                </View>
              );
            })()}
          </View>

          {/* Meta info right column */}
          <View className="flex-1 ml-3.5 justify-end pb-1">
            <Text className="text-white text-lg font-bold leading-6" numberOfLines={1}>
              {comic.title}
            </Text>

            {/* Clickable Author Name */}
            <TouchableOpacity
              onPress={handleCreatorPress}
              activeOpacity={0.7}
              className="flex-row items-center mt-1"
            >
              <Text className="text-zinc-400 text-xs font-semibold">Tác giả: </Text>
              <Text className="text-[#D4AF37] text-xs font-bold" numberOfLines={1}>
                {comic.author || comic.creatorName || "Tác giả TaleX"}
              </Text>
            </TouchableOpacity>

            {/* Interactive 5-Star Rating Badge Component */}
            <View className="mt-1.5 flex-row items-center">
              <InteractiveStarRating
                seriesId={comicId || comic.id}
                seriesTitle={comic.title}
                averageRating={comic.averageRating || 0}
                totalRatingsCount={comic.totalRatingsCount || 0}
                onRatingUpdated={() => loadData(true)}
              />
            </View>

            {/* Description */}
            {comic.description ? (
              <Text className="text-zinc-300 text-xs mt-1 leading-4" numberOfLines={2}>
                {comic.description}
              </Text>
            ) : null}

            {/* Category Pill Badges (Teal Theme) */}
            {categoriesArray.length > 0 && (
              <View className="flex-row items-center flex-wrap gap-1.5 mt-2">
                {categoriesArray.map((cat: string, idx: number) => (
                  <View key={`cat-${idx}`} className="px-2.5 py-0.5 rounded-full bg-teal-500/20 border border-teal-400/40">
                    <Text className="text-teal-300 text-[10px] font-bold">{cat}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tag Pill Badges (Amber/Gold Theme) */}
            {displayTagNames.length > 0 && (
              <View className="flex-row items-center flex-wrap gap-1.5 mt-1.5">
                {displayTagNames.map((tag: string, idx: number) => (
                  <View key={`tag-${idx}`} className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40">
                    <Text className="text-[#D4AF37] text-[10px] font-bold">#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ================= 3. TAB NAVIGATION BAR (Chỉ còn 2 Tab: Chi tiết & Bình luận) ================= */}
        <View className="flex-row border-b border-white/10 px-4 mt-2 mb-4">
          {[
            { key: "about", label: "Chi tiết" },
            { key: "comments", label: "Bình luận" },
          ].map((tab) => {
            const active = bottomTab === (tab.key as any);
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setBottomTab(tab.key as any)}
                className={`py-3 mr-8 relative ${active ? "" : "opacity-60"}`}
              >
                <Text className={`text-sm font-bold ${active ? "text-[#D4AF37]" : "text-zinc-400"}`}>
                  {tab.label}
                </Text>
                {active && (
                  <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ================= 4. TAB CONTENT ================= */}
        {bottomTab === "about" && (
          <View className="px-4">
            {/* ================= ANALYTIC DATA CARD ================= */}
            <View className="mb-5 bg-[#1E2024] border border-white/10 rounded-2xl p-4 shadow-lg">
              <View className="flex-row items-center gap-2 mb-3 border-b border-white/5 pb-2.5">
                <Ionicons name="bar-chart-outline" size={16} color="#D4AF37" />
                <Text className="text-white text-sm font-bold">Chỉ số tác phẩm</Text>
              </View>

              <View className="flex-row items-center justify-between">
                {/* Likes */}
                <View className="w-[31%] bg-zinc-900/60 border border-white/5 p-2.5 rounded-xl items-center">
                  <Ionicons name="heart-outline" size={16} color="#f43f5e" />
                  <Text className="text-white text-xs font-black mt-1">
                    {formatAnalyticNumber(comic.analyticData?.likes ?? comic.likes ?? 0)}
                  </Text>
                  <Text className="text-zinc-400 text-[10px] font-medium">Lượt thích</Text>
                </View>

                {/* Bookmarks */}
                <View className="w-[31%] bg-zinc-900/60 border border-white/5 p-2.5 rounded-xl items-center">
                  <Ionicons name="bookmark-outline" size={16} color="#fbbf24" />
                  <Text className="text-white text-xs font-black mt-1">
                    {formatAnalyticNumber(comic.analyticData?.bookmarks ?? 0)}
                  </Text>
                  <Text className="text-zinc-400 text-[10px] font-medium">Lượt lưu</Text>
                </View>

                {/* Shares */}
                <View className="w-[31%] bg-zinc-900/60 border border-white/5 p-2.5 rounded-xl items-center">
                  <Ionicons name="share-social-outline" size={16} color="#34d399" />
                  <Text className="text-white text-xs font-black mt-1">
                    {formatAnalyticNumber(comic.analyticData?.shares ?? 0)}
                  </Text>
                  <Text className="text-zinc-400 text-[10px] font-medium">Chia sẻ</Text>
                </View>
              </View>
            </View>

            {/* Badge Summary Row with Age Rating */}
            <View className="flex-row items-center gap-2 mb-3 flex-wrap">
              <Text className="text-white text-xs font-bold">Truyện tranh</Text>
              <Text className="text-zinc-500 text-xs">|</Text>
              <Text className="text-white text-xs font-bold">{comic.year || "2026"}</Text>
              <Text className="text-zinc-500 text-xs">|</Text>
              
              {/* Age Rating Pill */}
              <View className={`px-2 py-0.5 rounded-md border ${getAgeRatingStyle(comic.ageRating).bg} ${getAgeRatingStyle(comic.ageRating).border}`}>
                <Text className={`text-[11px] font-black ${getAgeRatingStyle(comic.ageRating).text}`}>
                  {formatAgeRating(comic.ageRating)}
                </Text>
              </View>
              
              <Text className="text-zinc-500 text-xs">|</Text>
              <Text className="text-[#D4AF37] text-xs font-bold">{comic.status || "Hoàn thành"}</Text>
            </View>

            {/* Description */}
            {comic.description && (
              <View className="mb-5">
                <Text className="text-zinc-300 text-xs leading-5 font-normal">
                  <Text className="text-white font-bold">Nội dung: </Text>
                  {showFullDesc ? comic.description : `${comic.description.slice(0, 150)}${comic.description.length > 150 ? "..." : ""}`}
                </Text>
                {comic.description.length > 150 && (
                  <TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)} className="mt-1">
                    <Text className="text-[#D4AF37] text-xs font-bold">
                      {showFullDesc ? "Thu gọn" : "Xem thêm"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ================= 4B. COMBO TIẾT KIỆM ================= */}
            {seriesCombos.length > 0 && (
              <View className="mt-2 mb-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <Ionicons name="pricetags" size={14} color="#D4AF37" />
                  <Text className="text-white text-base font-bold">Combo tiết kiệm</Text>
                </View>
                {seriesCombos.map((combo) => {
                  const originalPrice = combo.originalPriceVnd ?? combo.priceVnd;
                  const discount =
                    originalPrice > combo.priceVnd
                      ? Math.round(((originalPrice - combo.priceVnd) / originalPrice) * 100)
                      : 0;
                  const epCount = combo.episodes?.length ?? 0;
                  return (
                    <View
                      key={combo.comboId}
                      className="mb-3 bg-[#1E2024] border border-white/10 rounded-2xl p-4"
                    >
                      <View className="flex-row items-start justify-between">
                        <Text className="text-white font-bold text-[14px] flex-1 mr-2">
                          {combo.title}
                        </Text>
                        {discount > 0 && (
                          <View className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                            <Text className="text-[10px] font-black text-red-400">-{discount}%</Text>
                          </View>
                        )}
                      </View>
                      {combo.description ? (
                        <Text className="text-gray-400 text-[12px] mt-1" numberOfLines={2}>
                          {combo.description}
                        </Text>
                      ) : null}
                      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-white/5">
                        <View>
                          <Text className="text-gray-500 text-[11px]">{epCount} tập bao gồm</Text>
                          {originalPrice > combo.priceVnd ? (
                            <Text className="text-gray-600 text-[11px] line-through">
                              {originalPrice.toLocaleString("vi-VN")} đ
                            </Text>
                          ) : null}
                        </View>
                        <Text className="text-[#D4AF37] text-[18px] font-black">
                          {combo.priceVnd.toLocaleString("vi-VN")} đ
                        </Text>
                      </View>
                      <TouchableOpacity
                        className="mt-3 h-[40px] bg-[#D4AF37] rounded-xl items-center justify-center"
                        activeOpacity={0.8}
                        onPress={() =>
                          buy({
                            itemId: combo.comboId,
                            itemType: "COMBO",
                            title: combo.title,
                            returnScreen: "ComicDetailScreen",
                          })
                        }
                      >
                        <Text className="text-black font-bold text-[13px]">Mua Gói Ngay</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* ================= 5. DANH SÁCH TẬP (GRID 3 CỘT CHUẨN MẪU) ================= */}
            <View className="mt-2 mb-6">
              {/* Header: Danh sách tập (Trái) | Sắp xếp (Phải) */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-base font-bold">Danh sách tập</Text>
                <TouchableOpacity
                  onPress={() => setIsAscending(!isAscending)}
                  className="flex-row items-center"
                  activeOpacity={0.7}
                >
                  <Ionicons name="swap-vertical" size={15} color="#D4AF37" />
                  <Text className="text-[#D4AF37] text-xs font-bold ml-1">Sắp xếp</Text>
                </TouchableOpacity>
              </View>

              {/* Season Subheader: ≡ Phần 1 */}
              <View className="flex-row items-center mb-3">
                <Ionicons name="menu-outline" size={18} color="#D4AF37" />
                <Text className="text-white text-sm font-bold ml-1.5">
                  {seasons.find((s) => s.seasonId === activeSeasonId)?.title || "Phần 1"}
                </Text>
              </View>

              {/* Multi-Season Select Pills */}
              {seasons.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                  {seasons.map((se) => {
                    const active = activeSeasonId === se.seasonId;
                    return (
                      <TouchableOpacity
                        key={se.seasonId}
                        onPress={() => handleSeasonSelect(se.seasonId)}
                        className={`mr-2 px-3.5 py-1.5 rounded-full border ${
                          active
                            ? "bg-[#D4AF37] border-[#D4AF37]"
                            : "bg-[#25272B] border-white/10"
                        }`}
                      >
                        <Text className={`text-xs font-bold ${active ? "text-black" : "text-white"}`}>
                          {se.title || `Season ${se.seasonNumber}`}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* 3-Column Grid Buttons */}
              {displayEpisodes.length === 0 ? (
                <View className="py-8 items-center justify-center bg-[#1E2024] rounded-2xl border border-white/5">
                  <Text className="text-zinc-400 text-xs font-bold">Chưa có tập truyện nào</Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap gap-2.5">
                  {displayEpisodes.map((ep, idx) => (
                    <TouchableOpacity
                      key={ep.episodeId || idx}
                      onPress={() => handleReadEpisode(ep, idx)}
                      activeOpacity={0.8}
                      className="w-[31%] h-11 bg-[#282A2F] border border-white/15 rounded-xl items-center justify-center shadow-md relative"
                    >
                      <Text className="text-white text-xs font-bold" numberOfLines={1}>
                        Tập {ep.episodeNumber || idx + 1}
                      </Text>
                      {ep.unlockType === "PAID" && (
                        <View className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-amber-500/25 border border-amber-500/50 items-center justify-center">
                          <Feather name="lock" size={7} color="#fbbf24" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* ================= 6. ĐỀ XUẤT (GRID 3 CỘT CHUẨN MẪU) ================= */}
            <View className="mt-2 mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-base font-bold">Đề xuất</Text>
                <TouchableOpacity
                  onPress={() => onRefresh()}
                  className="flex-row items-center"
                  activeOpacity={0.7}
                >
                  <Text className="text-zinc-300 text-xs font-semibold mr-1">Làm mới</Text>
                  <Ionicons name="refresh-outline" size={14} color="#D4AF37" />
                </TouchableOpacity>
              </View>

              {/* 3-Column Recommendations Grid */}
              <View className="flex-row flex-wrap justify-between gap-y-3">
                {recommendations.map((rec) => (
                  <TouchableOpacity
                    key={rec.id}
                    onPress={() => {
                      navigation.replace("ComicDetailScreen", { comicId: rec.id });
                    }}
                    className="w-[31.5%]"
                    activeOpacity={0.85}
                  >
                    <View className="w-full h-[140px] rounded-xl overflow-hidden bg-zinc-800 border border-white/10 shadow-md">
                      <Image
                        source={rec.image}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    </View>
                    <Text className="text-white text-xs font-bold mt-1.5 leading-4" numberOfLines={2}>
                      {rec.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {bottomTab === "comments" && (
          <View className="px-4">
            <EpisodeCommentsSection episodeId={firstEpisode?.episodeId || comicId || ""} />
          </View>
        )}
      </ScrollView>

      {/* ================= 5. STICKY BOTTOM ACTION BUTTON ================= */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-[#121214]/95 border-t border-white/5 shadow-2xl">
        <TouchableOpacity
          onPress={() => handleReadEpisode(firstEpisode, 0)}
          activeOpacity={0.85}
          className="w-full h-12 bg-[#D4AF37] rounded-2xl flex-row items-center justify-center space-x-2 shadow-lg shadow-amber-500/20"
        >
          <Text className="text-[#141210] font-black text-sm uppercase tracking-wide">
            Xem ngay
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
