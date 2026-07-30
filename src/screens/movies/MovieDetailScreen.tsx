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
  TextInput,
  FlatList,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  Feather,
  FontAwesome,
  FontAwesome5,
} from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { getMovieById, allMovies } from "./movieMockData";
import {
  getPublicSeriesDetail,
  getSeriesSeasons,
  getSeasonEpisodes,
  getPublicCombos,
  SeasonItem,
  EpisodeItem,
  ComboItem,
} from "@/services/series";
import { getEpisodeLikes, getMyLikedEpisodes } from "@/services/like";
import { useCreatorFollow } from "@/hooks/useCreatorFollow";
import { FollowButton } from "@/components/FollowButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ShareButton } from "@/components/ShareButton";
import { FollowersModal } from "@/components/FollowersModal";
import { EpisodeCommentsSection } from "@/components/comments/EpisodeCommentsSection";
import { getCategories, getTags } from "@/services/creatorContent";

const { width: screenWidth } = Dimensions.get("window");

const formatAgeRating = (rating?: string) => {
  if (!rating) return "16+";
  const str = String(rating).toUpperCase();
  if (str.includes("18")) return "18+";
  if (str.includes("16")) return "16+";
  if (str.includes("13")) return "13+";
  if (str === "P" || str.includes("ALL")) return "P";
  return rating;
};

const getAgeRatingStyle = (rating?: string) => {
  const formatted = formatAgeRating(rating);
  if (formatted === "18+") return { bg: "bg-red-500/25", border: "border-red-500/50", text: "text-red-400" };
  if (formatted === "16+") return { bg: "bg-amber-500/25", border: "border-amber-500/50", text: "text-amber-400" };
  return { bg: "bg-emerald-500/25", border: "border-emerald-500/50", text: "text-emerald-400" };
};

interface CommentItem {
  id: string;
  userName: string;
  avatar: string;
  rating: number;
  time: string;
  text: string;
}

const mockCommentsData: CommentItem[] = [
  {
    id: "c1",
    userName: "Minh Tuấn",
    avatar:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop",
    rating: 5,
    time: "2 giờ trước",
    text: "Phim quá hay, cốt truyện hấp dẫn và kỹ xảo đỉnh cao! Rất đáng xem.",
  },
  {
    id: "c2",
    userName: "Hoàng Yến",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop",
    rating: 5,
    time: "5 giờ trước",
    text: "Tập mới nhất kịch tính quá, mong chờ các tập tiếp theo của tác giả!",
  },
];

export default function MovieDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { movieId, seriesItem } = (route.params || {}) as any;

  const [movie, setMovie] = useState<any>(() => {
    if (seriesItem) {
      return {
        id: seriesItem.seriesId || seriesItem.id,
        title: seriesItem.title,
        image:
          seriesItem.coverUrl || seriesItem.bannerUrl || seriesItem.thumbnailUrl
            ? {
                uri:
                  seriesItem.coverUrl ||
                  seriesItem.bannerUrl ||
                  seriesItem.thumbnailUrl,
              }
            : require("@assets/movie2.jpg"),
        coverUrl: seriesItem.coverUrl || seriesItem.bannerUrl,
        bannerUrl: seriesItem.bannerUrl || seriesItem.coverUrl,
        subtitle: seriesItem.subtitle || "Trọn bộ HD",
        category: seriesItem.category || "Phim Bộ",
        rating: seriesItem.rating || "9.8",
        year: seriesItem.year || "2026",
        ageRating: seriesItem.ageRating || "T16",
        translation: seriesItem.translation || "Vietsub",
        regionAndGenre: seriesItem.regionAndGenre || "Việt Nam · Hành Động",
        description:
          seriesItem.description ||
          "Tác phẩm điện ảnh đặc sắc mang lại những trải nghiệm hình ảnh và âm thanh sống động.",
        creatorName:
          seriesItem.author || seriesItem.creatorName || "Tác giả TaleX",
        creatorAvatar: seriesItem.creatorAvatar,
      };
    }
    return getMovieById(movieId);
  });

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Tabs: "about" | "comments"
  const [bottomTab, setBottomTab] = useState<"about" | "comments">("about");
  const [isAscending, setIsAscending] = useState(true);

  // Seasons and episodes
  const [seasons, setSeasons] = useState<SeasonItem[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [episodesMap, setEpisodesMap] = useState<Record<string, EpisodeItem[]>>(
    {},
  );
  const [combos, setCombos] = useState<ComboItem[]>([]);

  // Category & Tag API Lookups
  const [allCategoriesMap, setAllCategoriesMap] = useState<
    Record<string, string>
  >({});
  const [allTagsMap, setAllTagsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    getCategories()
      .then((res) => {
        if (res?.content) {
          const map: Record<string, string> = {};
          res.content.forEach((cat) => {
            if (cat.categoryId) map[cat.categoryId] = cat.categoryName;
          });
          setAllCategoriesMap(map);
        }
      })
      .catch(() => {});

    getTags()
      .then((res) => {
        if (res?.content) {
          const map: Record<string, string> = {};
          res.content.forEach((t) => {
            if (t.tagId) map[t.tagId] = t.tagName;
          });
          setAllTagsMap(map);
        }
      })
      .catch(() => {});
  }, []);

  const categoriesArray = useMemo(() => {
    if (Array.isArray(movie?.categories) && movie.categories.length > 0) {
      return movie.categories
        .map((c: any) => {
          if (typeof c === "string") return allCategoriesMap[c] || c;
          return c.categoryName || c.name || allCategoriesMap[c.categoryId];
        })
        .filter(Boolean);
    }
    if (movie?.category) return [movie.category];
    return [];
  }, [movie, allCategoriesMap]);

  const displayCategoryNames = useMemo(() => {
    if (categoriesArray.length > 0) {
      return categoriesArray.join(" · ");
    }
    return null;
  }, [categoriesArray]);

  const displayTagNames = useMemo<string[]>(() => {
    if (Array.isArray(movie?.tags) && movie.tags.length > 0) {
      return movie.tags
        .map((t: any) => {
          if (typeof t === "string") return allTagsMap[t] || t;
          return t.tagName || t.name || allTagsMap[t.tagId];
        })
        .filter(Boolean);
    }
    return [];
  }, [movie, allTagsMap]);

  const [baseFollowerCount, setBaseFollowerCount] = useState(0);
  const [initialIsFollowing, setInitialIsFollowing] = useState<boolean | null>(
    null,
  );
  const [showFollowersModal, setShowFollowersModal] = useState(false);

  const creatorAccountId = movie?.creatorAccountId || movie?.authorAccountId;

  const handleCreatorPress = () => {
    if (!creatorAccountId) {
      Alert.alert("Thông báo", "Tác phẩm này chưa liên kết kênh tác giả.");
      return;
    }
    const isMyChannel =
      user?.accountId &&
      String(user.accountId).toLowerCase() === String(creatorAccountId).toLowerCase();

    if (isMyChannel) {
      navigation.navigate("CreatorChannel");
    } else {
      navigation.navigate("PublicChannel", { creatorId: creatorAccountId });
    }
  };

  const {
    isFollowing,
    toggleFollow,
    isMutating: isFollowMutating,
  } = useCreatorFollow(creatorAccountId);

  useEffect(() => {
    if (initialIsFollowing === null && isFollowing !== undefined) {
      setInitialIsFollowing(isFollowing);
    }
  }, [isFollowing, initialIsFollowing]);

  const displayFollowerCount = useMemo(() => {
    const base = baseFollowerCount;
    if (initialIsFollowing === null) {
      return isFollowing ? Math.max(1, base) : base;
    }
    if (initialIsFollowing) {
      return isFollowing ? Math.max(1, base) : Math.max(0, base - 1);
    } else {
      return isFollowing ? Math.max(1, base + 1) : base;
    }
  }, [baseFollowerCount, isFollowing, initialIsFollowing]);

  const sortedSeasons = useMemo(
    () => [...seasons].sort((a, b) => a.seasonNumber - b.seasonNumber),
    [seasons],
  );
  const activeSeasonId =
    selectedSeasonId ||
    (sortedSeasons.length > 0 ? sortedSeasons[0].seasonId : null);
  const currentEpisodes: EpisodeItem[] = activeSeasonId
    ? (episodesMap[activeSeasonId] || [])
        .slice()
        .sort((a, b) => a.episodeNumber - b.episodeNumber)
    : [];

  const firstEpisode = currentEpisodes.length > 0 ? currentEpisodes[0] : null;

  const displayEpisodes = useMemo(() => {
    const list = Array.isArray(currentEpisodes) ? [...currentEpisodes] : [];
    if (!isAscending) {
      list.reverse();
    }
    return list;
  }, [currentEpisodes, isAscending]);

  const totalViews = useMemo(() => {
    if (movie?.views != null && movie.views > 0) return movie.views;
    let total = 0;
    if (episodesMap && typeof episodesMap === "object") {
      Object.values(episodesMap).forEach((eps) => {
        if (Array.isArray(eps)) {
          eps.forEach((ep) => {
            if (ep && typeof ep.views === "number") {
              total += ep.views;
            }
          });
        }
      });
    }
    return total || 12500;
  }, [movie, episodesMap]);

  const loadData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);

      try {
        let hasRealData = false;

        if (movieId) {
          try {
            const detailRes = await getPublicSeriesDetail(movieId);
            if (detailRes && detailRes.code === 200 && detailRes.data) {
              const detail = detailRes.data;
              if (detail.status === "HIDDEN") {
                Alert.alert("Thông báo", "Tác phẩm này đã bị ẩn bởi tác giả.", [
                  { text: "OK", onPress: () => navigation.goBack() },
                ]);
                return;
              }

              hasRealData = true;
              setMovie({
                id: detail.seriesId || detail.id,
                title: detail.title,
                contentType: detail.contentType,
                creatorAccountId:
                  detail.accountId ||
                  detail.creatorAccountId ||
                  detail.authorAccountId ||
                  detail.creator?.accountId,
                creatorName:
                  detail.creatorName ||
                  detail.creator?.username ||
                  detail.author ||
                  "Tác giả TaleX",
                creatorAvatar: detail.creatorAvatar || detail.creator?.avatarUrl,
                totalCreatorFollowers: detail.totalCreatorFollowers ?? (detail as any).creator?.totalFollowers ?? null,
                totalSubscriptions: (detail as any).totalSubscriptions ?? null,
                image:
                  detail.coverUrl || detail.bannerUrl || detail.thumbnailUrl
                    ? {
                        uri:
                          detail.coverUrl ||
                          detail.bannerUrl ||
                          detail.thumbnailUrl,
                      }
                    : null,
                coverUrl: detail.coverUrl,
                bannerUrl: detail.bannerUrl,
                categories: detail.categories || [],
                tags: detail.tags || [],
                rating: detail.rating || null,
                year: detail.year || null,
                ageRating: detail.ageRating || null,
                language: detail.language || null,
                status: detail.status || null,
                createdAt: (detail as any).createdAt || null,
                updatedAt: (detail as any).updatedAt || null,
                description: detail.description || null,
                views: detail.views ?? (detail as any).totalViews ?? null,
              });
              setBaseFollowerCount(detail.totalCreatorFollowers ?? 0);
            }
          } catch (e) {
            console.log(
              "Real API fetch skipped or returned fallback for ID:",
              movieId,
            );
          }
        }

        const seasonsRes = await getSeriesSeasons(movieId);
        if (
          seasonsRes &&
          seasonsRes.code === 200 &&
          seasonsRes.data &&
          seasonsRes.data.length > 0
        ) {
          const sorted = [...seasonsRes.data].sort(
            (a, b) => a.seasonNumber - b.seasonNumber,
          );
          setSeasons(sorted);
          const firstSeasonId = sorted[0].seasonId;
          setSelectedSeasonId((prev) => prev || firstSeasonId);

          const newEpisodesMap: Record<string, EpisodeItem[]> = {};
          const allEpisodesList: EpisodeItem[] = [];

          await Promise.all(
            sorted.map(async (se) => {
              try {
                const epRes = await getSeasonEpisodes(se.seasonId);
                if (epRes && epRes.code === 200 && epRes.data) {
                  const eps: EpisodeItem[] = epRes.data;
                  newEpisodesMap[se.seasonId] = eps;
                  allEpisodesList.push(...eps);
                }
              } catch (err) {
                console.error("Error fetching season episodes:", err);
              }
            }),
          );

          setEpisodesMap(newEpisodesMap);
        }

        if (!hasRealData) {
          const mockMovie = getMovieById(movieId);
          if (mockMovie) {
            setMovie(mockMovie);
            setEpisodesMap({
              default: (mockMovie.episodes || []).map((e: any) => ({
                episodeId: e.id || String(e.episodeNumber),
                seasonId: "default",
                episodeNumber: e.episodeNumber || 1,
                title: e.title || `Tập ${e.episodeNumber || 1}`,
                videoUrl: e.videoUrl,
                duration: "45 phút",
              })) as EpisodeItem[],
            });
          }
        }

        getPublicCombos()
          .then(setCombos)
          .catch(() => setCombos([]));
      } catch (err) {
        console.error("Error loading movie detail data:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [movieId, navigation],
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData(true);
    }, [loadData]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  const handlePlayEpisode = (ep?: EpisodeItem | null, index: number = 0) => {
    const targetEp =
      ep || firstEpisode || (movie.episodes ? movie.episodes[0] : null);
    navigation.navigate("MoviePlayer", {
      movieId: movie.id,
      movieTitle: movie.title,
      seasonId: activeSeasonId,
      episodeId: targetEp?.episodeId || "ep1",
      episodeTitle: targetEp?.title || "Tập 1",
      episodeIndex: index,
      episodesList:
        currentEpisodes.length > 0 ? currentEpisodes : movie.episodes || [],
    });
  };

  const recommendations = allMovies
    .filter((m) => m.id !== movie?.id)
    .slice(0, 6);

  const [isWatched, setIsWatched] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);

  if (loading || !movie) {
    return (
      <SafeAreaView className="flex-1 bg-[#141619] items-center justify-center">
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text className="text-zinc-400 text-xs mt-3 font-bold">
          Đang tải chi tiết phim...
        </Text>
      </SafeAreaView>
    );
  }

  const bgImageSource =
    movie.coverUrl || movie.bannerUrl
      ? { uri: movie.coverUrl || movie.bannerUrl }
      : typeof movie.image === "object"
        ? movie.image
        : require("@assets/movie2.jpg");

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
        <View style={{ width: screenWidth, height: screenWidth * (9 / 16) + 40 }} className="relative bg-zinc-900">
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
                    episodeId={firstEpisode?.episodeId || movieId}
                    title={movie.title}
                    size="sm"
                  />
                  <BookmarkButton
                    episodeId={firstEpisode?.episodeId || movieId}
                    contentType="VIDEO"
                    size="sm"
                  />
                </View>
              </SafeAreaView>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* ================= 2. OVERLAPPING HERO CARD (POSTER & META INFO) ================= */}
        <View className="px-4 flex-row items-end mt-[-70px] z-10 mb-4">
          {/* Poster Thumbnail */}
          <View className="w-[105px] h-[148px] rounded-2xl border border-white/15 bg-zinc-800 shadow-2xl overflow-hidden">
            <Image
              source={bgImageSource}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>

          {/* Meta info right column */}
          <View className="flex-1 ml-3.5 justify-end pb-1">
            <Text className="text-white text-lg font-bold leading-6" numberOfLines={2}>
              {movie.title}
            </Text>

            {/* Clickable Director Name */}
            <TouchableOpacity
              onPress={handleCreatorPress}
              activeOpacity={0.7}
              className="flex-row items-center mt-1.5"
            >
              <Text className="text-zinc-300 text-xs font-semibold">Tác giả: </Text>
              <Text className="text-[#D4AF37] text-xs font-bold" numberOfLines={1}>
                {movie.creatorName || movie.author || "Ushiro Shinji"}
              </Text>

            </TouchableOpacity>

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

            {/* Tag Pill Badges (Amber/Gold Theme with # prefix) */}
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
            {/* Badge Summary Row with Age Rating */}
            <View className="flex-row items-center gap-2 mb-3 flex-wrap">
              <Text className="text-white text-xs font-bold">Phim bộ</Text>
              <Text className="text-zinc-500 text-xs">|</Text>
              <Text className="text-white text-xs font-bold">{movie.year || "2026"}</Text>
              <Text className="text-zinc-500 text-xs">|</Text>
              
              {/* Age Rating Pill */}
              <View className={`px-2 py-0.5 rounded-md border ${getAgeRatingStyle(movie.ageRating).bg} ${getAgeRatingStyle(movie.ageRating).border}`}>
                <Text className={`text-[11px] font-black ${getAgeRatingStyle(movie.ageRating).text}`}>
                  {formatAgeRating(movie.ageRating)}
                </Text>
              </View>

              <Text className="text-zinc-500 text-xs">|</Text>
              <Text className="text-[#D4AF37] text-xs font-bold">{movie.status || "Hoàn thành"}</Text>
            </View>

            {/* Description */}
            {movie.description && (
              <View className="mb-5">
                <Text className="text-zinc-300 text-xs leading-5 font-normal">
                  <Text className="text-white font-bold">Nội dung: </Text>
                  {showFullDesc ? movie.description : `${movie.description.slice(0, 150)}${movie.description.length > 150 ? "..." : ""}`}
                </Text>
                {movie.description.length > 150 && (
                  <TouchableOpacity onPress={() => setShowFullDesc(!showFullDesc)} className="mt-1">
                    <Text className="text-[#D4AF37] text-xs font-bold">
                      {showFullDesc ? "Thu gọn" : "Xem thêm"}
                    </Text>
                  </TouchableOpacity>
                )}
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
                  {sortedSeasons.find((s) => s.seasonId === activeSeasonId)?.title || "Phần 1"}
                </Text>
              </View>

              {/* Multi-Season Select Pills */}
              {sortedSeasons.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                  {sortedSeasons.map((se) => {
                    const active = activeSeasonId === se.seasonId;
                    return (
                      <TouchableOpacity
                        key={se.seasonId}
                        onPress={() => setSelectedSeasonId(se.seasonId)}
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
                  <Text className="text-zinc-400 text-xs font-bold">Chưa có tập phim nào</Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap gap-2.5">
                  {displayEpisodes.map((ep, idx) => (
                    <TouchableOpacity
                      key={ep.episodeId || idx}
                      onPress={() => handlePlayEpisode(ep, idx)}
                      activeOpacity={0.8}
                      className="w-[31%] h-11 bg-[#282A2F] border border-white/15 rounded-xl items-center justify-center shadow-md"
                    >
                      <Text className="text-white text-xs font-bold" numberOfLines={1}>
                        Tập {ep.episodeNumber || idx + 1}
                      </Text>
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
              {recommendations && recommendations.length > 0 && (
                <View className="flex-row flex-wrap justify-between gap-y-3">
                  {recommendations.map((rec) => (
                    <TouchableOpacity
                      key={rec.id}
                      onPress={() => {
                        navigation.replace("MovieDetailScreen", { movieId: rec.id });
                      }}
                      className="w-[31.5%]"
                      activeOpacity={0.85}
                    >
                      <View className="w-full h-[140px] rounded-xl overflow-hidden bg-zinc-800 border border-white/10 shadow-md">
                        <Image source={rec.image} className="w-full h-full" resizeMode="cover" />
                      </View>
                      <Text className="text-white text-xs font-bold mt-1.5 leading-4" numberOfLines={2}>
                        {rec.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {bottomTab === "comments" && (
          <View className="px-4">
            {firstEpisode?.episodeId ? (
              <EpisodeCommentsSection episodeId={firstEpisode.episodeId} />
            ) : (
              <View className="bg-[#1E2024] p-4 rounded-2xl border border-white/10 items-center justify-center py-8">
                <Ionicons name="chatbubbles-outline" size={32} color="#D4AF37" />
                <Text className="text-zinc-300 text-xs font-semibold mt-2 text-center">
                  Bộ phim chưa có bình luận.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ================= 5. STICKY BOTTOM ACTION BUTTON ================= */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-[#121214]/95 border-t border-white/5 shadow-2xl">
        <TouchableOpacity
          onPress={() => handlePlayEpisode(firstEpisode, 0)}
          activeOpacity={0.85}
          className="w-full h-12 bg-[#D4AF37] rounded-2xl flex-row items-center justify-center space-x-2 shadow-lg shadow-amber-500/20"
        >
          <Text className="text-[#141210] font-black text-sm uppercase tracking-wide">
            Xem ngay
          </Text>
        </TouchableOpacity>
      </View>

      {/* Followers Modal */}
      {creatorAccountId && (
        <FollowersModal
          visible={showFollowersModal}
          creatorAccountId={creatorAccountId}
          onClose={() => setShowFollowersModal(false)}
        />
      )}
    </View>
  );
}
