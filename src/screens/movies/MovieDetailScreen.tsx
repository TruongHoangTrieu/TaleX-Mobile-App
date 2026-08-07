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
import { Animated } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { InteractiveStarRating } from "@/components/InteractiveStarRating";
import { getMovieById, allMovies } from "./movieMockData";
import {
  getPublicSeriesDetail,
  getPublicSeries,
  getSeriesSeasons,
  getSeasonEpisodes,
  getPublicCombos,
  formatWatchTime,
  formatAnalyticNumber,
  SeasonItem,
  EpisodeItem,
  ComboItem,
  SeriesItem,
} from "@/services/series";
import { getEpisodeLikes, getMyLikedEpisodes } from "@/services/like";
import { useCreatorFollow } from "@/hooks/useCreatorFollow";
import { FollowButton } from "@/components/FollowButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ShareButton } from "@/components/ShareButton";
import { FollowersModal } from "@/components/FollowersModal";
import { EpisodeCommentsSection } from "@/components/comments/EpisodeCommentsSection";
import { getCategories, getTags } from "@/services/creatorContent";
import { useContentPurchase } from "@/hooks/useContentPurchase";

const { width: screenWidth } = Dimensions.get("window");

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
  const [realRecommendations, setRealRecommendations] = useState<SeriesItem[]>([]);
  const [recPage, setRecPage] = useState<number>(1);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false);

  const fetchMovieRecommendations = useCallback(
    async (pageToFetch = 1) => {
      setLoadingRecs(true);
      try {
        const res = await getPublicSeries(pageToFetch, 20, "VIDEO");
        if (res?.data?.content) {
          const filtered = res.data.content.filter(
            (item: any) =>
              (item.seriesId || item.id) !== movieId &&
              (item.contentType?.toUpperCase() === "VIDEO" || item.contentType?.toUpperCase() === "MOVIE" || !item.contentType)
          );
          const shuffled = [...filtered].sort(() => 0.5 - Math.random());
          setRealRecommendations(shuffled.slice(0, 6));
        }
      } catch (err) {
        console.error("Lỗi tải đề xuất phim:", err);
      } finally {
        setLoadingRecs(false);
      }
    },
    [movieId],
  );

  const handleRefreshRecommendations = () => {
    const nextPage = recPage >= 3 ? 1 : recPage + 1;
    setRecPage(nextPage);
    fetchMovieRecommendations(nextPage);
  };

  useEffect(() => {
    fetchMovieRecommendations(1);
  }, [fetchMovieRecommendations]);

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

  const seriesCombos = useMemo(() => {
    const seasonIds = new Set(seasons.map((s) => s.seasonId));
    return combos.filter((combo) => {
      if (!combo.episodes || combo.episodes.length === 0) return false;
      return combo.episodes.some(
        (ep) =>
          (ep.seasonId && seasonIds.has(ep.seasonId)) ||
          (movie?.title && ep.seriesTitle?.toLowerCase() === movie.title.toLowerCase())
      );
    });
  }, [combos, seasons, movie]);

  const { buy } = useContentPurchase();

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
                averageRating: detail.averageRating ?? (detail as any).rating ?? null,
                analyticData: detail.analyticData || null,
                year: detail.year || null,
                ageRating: detail.ageRating || null,
                language: detail.language || null,
                status: detail.status || null,
                createdAt: (detail as any).createdAt || null,
                updatedAt: (detail as any).updatedAt || null,
                description: detail.description || null,
                views: detail.analyticData?.views ?? detail.views ?? (detail as any).totalViews ?? null,
                likes: detail.analyticData?.likes ?? (detail as any).likes ?? null,
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
      <SafeAreaView edges={["top"]} className="flex-1 bg-[#121214]">
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Skeleton Hero Banner */}
          <View style={{ width: screenWidth, height: screenWidth * (9 / 16) + 40 }} className="relative bg-zinc-900 p-4 justify-between">
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
          <View className="w-[105px] h-[148px] rounded-2xl border border-white/15 bg-zinc-800 shadow-2xl overflow-hidden relative">
            <Image
              source={bgImageSource}
              className="w-full h-full"
              resizeMode="cover"
            />

            {/* Age Rating Overlay Badge - Only if provided by API */}
            {(() => {
              const formatted = formatAgeRating(movie.ageRating);
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
              {movie.title}
            </Text>

            {/* Clickable Director/Author Name */}
            <TouchableOpacity
              onPress={handleCreatorPress}
              activeOpacity={0.7}
              className="flex-row items-center mt-1"
            >
              <Text className="text-zinc-400 text-xs font-semibold">Tác giả: </Text>
              <Text className="text-[#D4AF37] text-xs font-bold" numberOfLines={1}>
                {movie.creatorName || movie.author || "Tác giả TaleX"}
              </Text>
            </TouchableOpacity>

            {/* Rating & Compact Inline Stats Badge Row (Single Horizontal Scrollable Row) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-1.5"
              contentContainerStyle={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <InteractiveStarRating
                seriesId={movieId || movie.id}
                seriesTitle={movie.title}
                averageRating={movie.averageRating || 0}
                totalRatingsCount={movie.totalRatingsCount || 0}
                onRatingUpdated={() => loadData(true)}
              />

              <View className="flex-row items-center bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 rounded-lg">
                <Ionicons name="heart" size={10} color="#f43f5e" />
                <Text className="text-rose-400 text-[10px] font-extrabold ml-1">
                  {formatAnalyticNumber(movie.analyticData?.likes ?? movie.likes ?? 0)}
                </Text>
              </View>

              <View className="flex-row items-center bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-lg">
                <Ionicons name="bookmark" size={10} color="#fbbf24" />
                <Text className="text-amber-400 text-[10px] font-extrabold ml-1">
                  {formatAnalyticNumber(movie.analyticData?.bookmarks ?? 0)}
                </Text>
              </View>

              <View className="flex-row items-center bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded-lg">
                <Ionicons name="share-social" size={10} color="#34d399" />
                <Text className="text-emerald-400 text-[10px] font-extrabold ml-1">
                  {formatAnalyticNumber(movie.analyticData?.shares ?? 0)}
                </Text>
              </View>
            </ScrollView>

            {/* Description */}
            {movie.description ? (
              <Text className="text-zinc-300 text-xs mt-1 leading-4" numberOfLines={2}>
                {movie.description}
              </Text>
            ) : null}

            {/* Category Pill Badges Row (Max 3 items, well-spaced) */}
            {categoriesArray.length > 0 && (
              <View className="flex-row items-center flex-wrap gap-2 mt-2">
                {categoriesArray.slice(0, 3).map((cat: string, idx: number) => (
                  <View key={`cat-${idx}`} className="px-2.5 py-0.5 rounded-md bg-teal-500/15 border border-teal-400/35">
                    <Text className="text-teal-300 text-[10px] font-extrabold">{cat}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tag Pill Badges Row (Max 3 items, well-spaced) */}
            {displayTagNames.length > 0 && (
              <View className="flex-row items-center flex-wrap gap-2 mt-1.5">
                {displayTagNames.slice(0, 3).map((tag: string, idx: number) => (
                  <View key={`tag-${idx}`} className="px-2.5 py-0.5 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/35">
                    <Text className="text-[#D4AF37] text-[10px] font-extrabold">#{tag}</Text>
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
                            returnScreen: "MovieDetailScreen",
                            seriesId: movieId,
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

            {/* ================= 6. ĐỀ XUẤT PHIM HAY CÙNG THỂ LOẠI (API GET /api/v1/public/series?contentType=VIDEO) ================= */}
            <View className="mt-2 mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-base font-bold">Đề xuất phim hay</Text>
                <TouchableOpacity
                  onPress={handleRefreshRecommendations}
                  disabled={loadingRecs}
                  className="flex-row items-center px-2.5 py-1 bg-zinc-800/80 border border-white/10 rounded-full active:scale-95 shadow-sm"
                  activeOpacity={0.7}
                >
                  <Text className="text-zinc-300 text-xs font-semibold mr-1.5">
                    {loadingRecs ? "Đang tải..." : "Làm mới"}
                  </Text>
                  {loadingRecs ? (
                    <ActivityIndicator size="small" color="#D4AF37" />
                  ) : (
                    <Ionicons name="refresh-outline" size={14} color="#D4AF37" />
                  )}
                </TouchableOpacity>
              </View>

              {/* 3-Column Recommendations Grid */}
              <View className="flex-row flex-wrap justify-between gap-y-3">
                {(realRecommendations.length > 0 ? realRecommendations : recommendations).map((rec: any) => {
                  const recId = rec.seriesId || rec.id;
                  const recImg = rec.coverUrl || rec.bannerUrl || rec.thumbnailUrl || rec.image;
                  return (
                    <TouchableOpacity
                      key={recId}
                      onPress={() => {
                        navigation.replace("MovieDetailScreen", { movieId: recId, seriesItem: rec });
                      }}
                      className="w-[31.5%]"
                      activeOpacity={0.85}
                    >
                      <View className="w-full h-[140px] rounded-xl overflow-hidden bg-zinc-800 border border-white/10 shadow-md">
                        {typeof recImg === "string" ? (
                          <Image source={{ uri: recImg }} className="w-full h-full" resizeMode="cover" />
                        ) : recImg ? (
                          <Image source={recImg} className="w-full h-full" resizeMode="cover" />
                        ) : (
                          <Image source={require("@assets/movie2.jpg")} className="w-full h-full" resizeMode="cover" />
                        )}
                      </View>
                      <Text className="text-white text-xs font-bold mt-1.5 leading-4" numberOfLines={2}>
                        {rec.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
