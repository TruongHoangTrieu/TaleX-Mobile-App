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
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
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
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop",
    rating: 5,
    time: "2 giờ trước",
    text: "Phim quá hay, cốt truyện hấp dẫn và kỹ xảo đỉnh cao! Rất đáng xem.",
  },
  {
    id: "c2",
    userName: "Hoàng Yến",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop",
    rating: 5,
    time: "5 giờ trước",
    text: "Tập mới nhất kịch tính quá, mong chờ các tập tiếp theo của tác giả!",
  },
];

export default function MovieDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
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
        description: seriesItem.description || "Tác phẩm điện ảnh đặc sắc mang lại những trải nghiệm hình ảnh và âm thanh sống động.",
        creatorName: seriesItem.author || seriesItem.creatorName || "Tác giả TaleX",
        creatorAvatar: seriesItem.creatorAvatar,
      };
    }
    return getMovieById(movieId);
  });

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Tabs: "episodes" | "trailers"
  const [bottomTab, setBottomTab] = useState<"recommend" | "about" | "comments">("recommend");

  // Seasons and episodes
  const [seasons, setSeasons] = useState<SeasonItem[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [episodesMap, setEpisodesMap] = useState<Record<string, EpisodeItem[]>>({});
  const [combos, setCombos] = useState<ComboItem[]>([]);

  // Category & Tag API Lookups
  const [allCategoriesMap, setAllCategoriesMap] = useState<Record<string, string>>({});
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

  const displayCategoryNames = useMemo(() => {
    if (Array.isArray(movie?.categories) && movie.categories.length > 0) {
      const names = movie.categories
        .map((c: any) => {
          if (typeof c === "string") return allCategoriesMap[c] || c;
          return c.categoryName || c.name || allCategoriesMap[c.categoryId];
        })
        .filter(Boolean);
      if (names.length > 0) return names.join(" · ");
    }
    if (movie?.category) return movie.category;
    return movie?.regionAndGenre || "Việt Nam · Hành Động";
  }, [movie, allCategoriesMap]);

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
  const [initialIsFollowing, setInitialIsFollowing] = useState<boolean | null>(null);
  const [showFollowersModal, setShowFollowersModal] = useState(false);

  const creatorAccountId = movie?.creatorAccountId || movie?.authorAccountId;

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
    [seasons]
  );
  const activeSeasonId =
    selectedSeasonId || (sortedSeasons.length > 0 ? sortedSeasons[0].seasonId : null);
  const currentEpisodes: EpisodeItem[] = activeSeasonId
    ? (episodesMap[activeSeasonId] || []).slice().sort(
        (a, b) => a.episodeNumber - b.episodeNumber
      )
    : [];

  const firstEpisode = currentEpisodes.length > 0 ? currentEpisodes[0] : null;

  const totalViews = useMemo(() => {
    if (movie?.views != null && movie.views > 0) return movie.views;
    let total = 0;
    Object.values(episodesMap).forEach((eps) => {
      eps.forEach((ep) => { total += ep.views || 0; });
    });
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
                  detail.creatorName || detail.creator?.username || detail.author || "Tác giả TaleX",
                creatorAvatar: detail.creatorAvatar || detail.creator?.avatarUrl,
                totalCreatorFollowers: detail.totalCreatorFollowers,
                image:
                  detail.coverUrl || detail.bannerUrl || detail.thumbnailUrl
                    ? {
                        uri:
                          detail.coverUrl ||
                          detail.bannerUrl ||
                          detail.thumbnailUrl,
                      }
                    : require("@assets/movie2.jpg"),
                coverUrl: detail.coverUrl,
                bannerUrl: detail.bannerUrl,
                subtitle: detail.subtitle || "Trọn bộ",
                category: detail.category || "Phim Bộ",
                categories: detail.categories || [],
                tags: detail.tags || [],
                rating: detail.rating || "9.8",
                year: detail.year || "2026",
                ageRating: detail.ageRating || "T16",
                language: detail.language || "Việt Nam",
                translation: detail.translation || detail.language || "Vietsub",
                regionAndGenre: detail.regionAndGenre || "Việt Nam · Hành Động",
                description: detail.description || "Nội dung đang được cập nhật bởi tác giả.",
                views: detail.views ?? detail.totalViews ?? 0,
              });
              setBaseFollowerCount(detail.totalCreatorFollowers ?? 0);
            }
          } catch (e) {
            console.log("Real API fetch skipped or returned fallback for ID:", movieId);
          }
        }

        const seasonsRes = await getSeriesSeasons(movieId);
        if (seasonsRes && seasonsRes.code === 200 && seasonsRes.data && seasonsRes.data.length > 0) {
          const sorted = [...seasonsRes.data].sort(
            (a, b) => a.seasonNumber - b.seasonNumber
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
            })
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
    [movieId, navigation]
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData(true);
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  const handlePlayEpisode = (ep?: EpisodeItem | null, index: number = 0) => {
    const targetEp = ep || firstEpisode || (movie.episodes ? movie.episodes[0] : null);
    navigation.navigate("MoviePlayer", {
      movieId: movie.id,
      movieTitle: movie.title,
      seasonId: activeSeasonId,
      episodeId: targetEp?.episodeId || "ep1",
      episodeTitle: targetEp?.title || "Tập 1",
      episodeIndex: index,
      episodesList: currentEpisodes.length > 0 ? currentEpisodes : movie.episodes || [],
    });
  };



  const recommendations = allMovies
    .filter((m) => m.id !== movie?.id)
    .slice(0, 4);

  const [isWatched, setIsWatched] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);

  if (loading || !movie) {
    return (
      <SafeAreaView className="flex-1 bg-[#141619] items-center justify-center">
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text className="text-zinc-400 text-xs mt-3">
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
    <SafeAreaView edges={[]} className="flex-1 bg-[#141619]">
      <StatusBar barStyle="light-content" translucent />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D4AF37"
            colors={["#D4AF37"]}
          />
        }
      >
        {/* ================= 1. HERO BACKDROP AREA (Chuẩn 100% hình mẫu mới) ================= */}
        <View className="w-full h-[370px] relative bg-zinc-900">
          <ImageBackground
            source={bgImageSource}
            className="w-full h-full"
            resizeMode="cover"
          >
            <LinearGradient
              colors={[
                "rgba(20, 22, 25, 0.35)",
                "rgba(20, 22, 25, 0.65)",
                "#141619",
              ]}
              className="absolute inset-0 p-4 justify-between"
            >
              {/* Top Navigation Bar: Back Left, Share & Ellipsis Right */}
              <SafeAreaView edges={["top"]} className="flex-row justify-between items-center w-full">
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  className="w-10 h-10 rounded-full bg-black/40 items-center justify-center border border-white/10"
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>

                <View className="flex-row items-center space-x-3">
                  <TouchableOpacity
                    onPress={() => Alert.alert("Chia sẻ", movie.title)}
                    className="w-10 h-10 rounded-full bg-black/40 items-center justify-center border border-white/10"
                    activeOpacity={0.8}
                  >
                    <Ionicons name="share-outline" size={20} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => Alert.alert("Tùy chọn", movie.title)}
                    className="w-10 h-10 rounded-full bg-black/40 items-center justify-center border border-white/10 ml-2"
                    activeOpacity={0.8}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>

              {/* Backdrop Bottom Info */}
              <View className="mb-1">
                {/* Title */}
                <Text
                  className="text-white text-3xl font-black tracking-tight"
                  numberOfLines={2}
                >
                  {movie.title} {movie.year ? `(${movie.year})` : "(2026)"}
                </Text>

                {/* Metadata Row 1: IMDb Badge + Score + Duration + Age Rating */}
                <View className="flex-row items-center flex-wrap gap-2 mt-2">
                  <View className="bg-[#F5C518] px-1.5 py-0.5 rounded">
                    <Text className="text-black font-black text-[10px]">IMDb</Text>
                  </View>
                  <Text className="text-white text-xs font-bold">
                    {movie.rating || "8.6"} / 10
                  </Text>
                  <Text className="text-zinc-500 text-xs">·</Text>
                  <Text className="text-zinc-300 text-xs font-semibold">1h 48m</Text>
                  <Text className="text-zinc-500 text-xs">·</Text>
                  <Text className="text-zinc-300 text-xs font-semibold">{movie.ageRating || "TV-MA"}</Text>
                  <Text className="text-zinc-500 text-xs">·</Text>
                  <Text className="text-zinc-300 text-xs font-semibold">{movie.year || "2026"}</Text>
                </View>

                {/* Metadata Row 2: Category Bullet list & Tags */}
                <View className="flex-row items-center flex-wrap gap-1.5 mt-2">
                  <View className="px-2 py-0.5 rounded bg-white/15 border border-white/10">
                    <Text className="text-zinc-200 text-[10px] font-bold">
                      {movie.ageRating || "14+"}
                    </Text>
                  </View>
                  <Text className="text-zinc-300 text-xs font-medium ml-1">
                    {displayCategoryNames}
                  </Text>
                </View>

                {displayTagNames.length > 0 && (
                  <View className="flex-row items-center flex-wrap gap-1.5 mt-1.5">
                    {displayTagNames.map((tag, idx) => (
                      <View key={idx} className="px-2 py-0.5 rounded bg-[#D4AF37]/15 border border-[#D4AF37]/30">
                        <Text className="text-[#D4AF37] text-[10px] font-bold">#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Available On Badges */}
                <View className="flex-row items-center space-x-2 mt-2.5">
                  <Text className="text-zinc-400 text-xs font-medium mr-1">Phát trên:</Text>
                  <View className="bg-[#D4AF37] px-2 py-0.5 rounded-md">
                    <Text className="text-[#141210] font-extrabold text-[10px]">TaleX HD</Text>
                  </View>
                  <View className="bg-white/15 px-2 py-0.5 rounded-md border border-white/10">
                    <Text className="text-white font-bold text-[10px]">Full HD</Text>
                  </View>
                  <View className="bg-white/15 px-2 py-0.5 rounded-md border border-white/10">
                    <Text className="text-white font-bold text-[10px]">Vietsub</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        <View className="px-4">
          {/* ================= 2. PRIMARY ACTION BUTTONS (Chuẩn 100% hình mẫu: Nút Trailer Màu Đỏ) ================= */}
          {/* Nút chính lớn: Trailer màu Đỏ */}
          <TouchableOpacity
            onPress={() => handlePlayEpisode(firstEpisode, 0)}
            activeOpacity={0.85}
            className="w-full h-12 bg-[#E50914] rounded-2xl flex-row items-center justify-center space-x-2 mt-4 shadow-lg shadow-red-600/40"
          >
            <Ionicons name="film-outline" size={20} color="#FFFFFF" />
            <Text className="text-white font-black text-sm uppercase tracking-wide ml-1">
              Trailer
            </Text>
          </TouchableOpacity>

          {/* Hàng 3 Nút Chữ Nhật Bo Góc Nền Tối (+ Danh sách | ✓ Đã xem | 👍 Đánh giá) */}
          <View className="flex-row items-center justify-between gap-x-2.5 mt-3">
            {/* Nút 1: + Danh sách */}
            <TouchableOpacity
              onPress={() => Alert.alert("Thông báo", "Đã thêm vào Danh sách của tôi.")}
              activeOpacity={0.8}
              className="flex-1 h-11 bg-[#1E2024] border border-white/10 rounded-2xl flex-row items-center justify-center space-x-1.5 shadow-sm"
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold ml-1">
                Danh sách
              </Text>
            </TouchableOpacity>

            {/* Nút 2: ✓ Đã xem */}
            <TouchableOpacity
              onPress={() => setIsWatched(!isWatched)}
              activeOpacity={0.8}
              className={`flex-1 h-11 ${
                isWatched ? "bg-[#D4AF37]/20 border-[#D4AF37]" : "bg-[#1E2024] border-white/10"
              } border rounded-2xl flex-row items-center justify-center space-x-1.5 shadow-sm`}
            >
              <Ionicons
                name={isWatched ? "checkmark-circle" : "checkmark-circle-outline"}
                size={17}
                color={isWatched ? "#D4AF37" : "#FFFFFF"}
              />
              <Text
                className={`text-xs font-bold ml-1 ${
                  isWatched ? "text-[#D4AF37]" : "text-white"
                }`}
              >
                {isWatched ? "Đã xem" : "Đã xem"}
              </Text>
            </TouchableOpacity>

            {/* Nút 3: 👍 Đánh giá */}
            <TouchableOpacity
              onPress={() => {
                const newScore = userRating === 5 ? null : 5;
                setUserRating(newScore);
                Alert.alert("Đánh giá", newScore ? "Cảm ơn bạn đã đánh giá 5 sao!" : "Đã hủy đánh giá.");
              }}
              activeOpacity={0.8}
              className={`flex-1 h-11 ${
                userRating ? "bg-[#D4AF37]/20 border-[#D4AF37]" : "bg-[#1E2024] border-white/10"
              } border rounded-2xl flex-row items-center justify-center space-x-1.5 shadow-sm`}
            >
              <Ionicons
                name={userRating ? "thumbs-up" : "thumbs-up-outline"}
                size={16}
                color={userRating ? "#D4AF37" : "#FFFFFF"}
              />
              <Text
                className={`text-xs font-bold ml-1 ${
                  userRating ? "text-[#D4AF37]" : "text-white"
                }`}
              >
                Đánh giá
              </Text>
            </TouchableOpacity>
          </View>

          {/* ================= 3. DESCRIPTION ================= */}
          <View className="mt-4">
            <Text
              className="text-zinc-300 text-xs leading-relaxed font-normal"
              numberOfLines={showFullDesc ? undefined : 3}
            >
              {movie.description}
            </Text>
            {movie.description && movie.description.length > 120 && (
              <TouchableOpacity
                onPress={() => setShowFullDesc(!showFullDesc)}
                activeOpacity={0.7}
                className="mt-1 flex-row justify-end"
              >
                <Text className="text-[#D4AF37] text-xs font-bold">
                  {showFullDesc ? "Thu gọn ▲" : "Xem thêm ▼"}
                </Text>
              </TouchableOpacity>
            )}
          </View>



          {/* ================= 6. SEASONS & EPISODES SECTION ================= */}
          <View className="mt-7">
            {/* Season Tabs */}
            <View className="flex-row items-center border-b border-white/10 pb-2 mb-4 space-x-6">
              {(sortedSeasons.length > 0 ? sortedSeasons : [{ seasonId: "s1", seasonNumber: 1, title: "Season 1" }]).map((se: any) => {
                const isActive = activeSeasonId === se.seasonId || (!activeSeasonId && se.seasonNumber === 1);
                return (
                  <TouchableOpacity
                    key={se.seasonId}
                    onPress={() => setSelectedSeasonId(se.seasonId)}
                    activeOpacity={0.8}
                    className="relative pb-2"
                  >
                    <Text
                      className={`text-sm font-bold ${
                        isActive ? "text-[#D4AF37]" : "text-zinc-400"
                      }`}
                    >
                      {se.title || `Season ${se.seasonNumber}`}
                    </Text>
                    {isActive && (
                      <View className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37] rounded-full" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Episodes List */}
            <View className="space-y-3">
              {(currentEpisodes.length > 0 ? currentEpisodes : (movie.episodes || [
                { episodeId: "ep1", episodeNumber: 1, title: "Tập 1: Khởi Đầu", publishedAt: "2026-06-22", duration: "45 min" },
                { episodeId: "ep2", episodeNumber: 2, title: "Tập 2: Vương Quốc Mới", publishedAt: "2026-06-29", duration: "45 min" }
              ])).map((ep: any, index: number) => (
                <TouchableOpacity
                  key={ep.episodeId || index}
                  onPress={() => handlePlayEpisode(ep, index)}
                  className="flex-row items-center bg-[#1E2024] p-2.5 rounded-2xl border border-white/10 shadow-md"
                  activeOpacity={0.85}
                >
                  {/* Thumbnail 16:9 */}
                  <View className="w-[115px] h-[72px] rounded-xl overflow-hidden bg-zinc-800 relative border border-white/10">
                    <Image
                      source={bgImageSource}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    <View className="absolute inset-0 bg-black/35 items-center justify-center">
                      <View className="w-8 h-8 rounded-full bg-[#D4AF37] items-center justify-center shadow-md">
                        <Ionicons name="play" size={13} color="#141210" style={{ marginLeft: 1 }} />
                      </View>
                    </View>
                  </View>

                  {/* Episode details */}
                  <View className="flex-1 ml-3 justify-between">
                    <View>
                      <Text className="text-white font-bold text-xs" numberOfLines={1}>
                        E{ep.episodeNumber || index + 1}: {ep.title}
                      </Text>
                      <Text className="text-zinc-400 text-[11px] mt-0.5">
                        22 Tháng 6, 2026 · {ep.duration || "45 phút"}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between mt-2">
                      <View className="flex-row items-center space-x-1">
                        <Ionicons name="download-outline" size={12} color="#D4AF37" />
                        <Text className="text-[#D4AF37] text-[11px] font-semibold ml-0.5">
                          Tải về
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ================= 7. BOTTOM TABS (Tương Tự | Thông Tin | Bình Luận) ================= */}
          <View className="mt-8">
            <View className="flex-row items-center justify-between border-b border-white/10 pb-2 mb-4">
              <TouchableOpacity
                onPress={() => setBottomTab("recommend")}
                activeOpacity={0.8}
                className="flex-1 items-center justify-center relative pb-2 px-1"
              >
                <Text
                  className={`text-xs font-bold ${
                    bottomTab === "recommend" ? "text-[#D4AF37]" : "text-zinc-400"
                  }`}
                  numberOfLines={1}
                >
                  Tương Tự
                </Text>
                {bottomTab === "recommend" && (
                  <View className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#D4AF37] rounded-full" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setBottomTab("about")}
                activeOpacity={0.8}
                className="flex-1 items-center justify-center relative pb-2 px-1"
              >
                <Text
                  className={`text-xs font-bold ${
                    bottomTab === "about" ? "text-[#D4AF37]" : "text-zinc-400"
                  }`}
                  numberOfLines={1}
                >
                  Thông Tin
                </Text>
                {bottomTab === "about" && (
                  <View className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#D4AF37] rounded-full" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setBottomTab("comments")}
                activeOpacity={0.8}
                className="flex-1 items-center justify-center relative pb-2 px-1"
              >
                <Text
                  className={`text-xs font-bold ${
                    bottomTab === "comments" ? "text-[#D4AF37]" : "text-zinc-400"
                  }`}
                  numberOfLines={1}
                >
                  Bình Luận
                </Text>
                {bottomTab === "comments" && (
                  <View className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#D4AF37] rounded-full" />
                )}
              </TouchableOpacity>
            </View>

            {/* TAB 1: TƯƠNG TỰ (MORE LIKE THIS) */}
            {bottomTab === "recommend" && (
              <View className="flex-row flex-wrap justify-between gap-y-4">
                {recommendations.map((rec) => (
                  <TouchableOpacity
                    key={rec.id}
                    onPress={() => {
                      navigation.replace("MovieDetailScreen", { movieId: rec.id });
                    }}
                    className="w-[48%]"
                    activeOpacity={0.85}
                  >
                    <View className="w-full h-[190px] rounded-2xl overflow-hidden bg-zinc-800 border border-white/10 shadow-md">
                      <Image source={rec.image} className="w-full h-full" resizeMode="cover" />
                    </View>
                    <Text className="text-white text-xs font-bold mt-2" numberOfLines={1}>
                      {rec.title}
                    </Text>
                    <Text className="text-zinc-400 text-[11px] mt-0.5">
                      ⭐ {rec.rating} · {rec.category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* TAB 2: THÔNG TIN & TÁC GIẢ (ABOUT & CREATOR) */}
            {bottomTab === "about" && (
              <View className="bg-[#1E2024] p-4 rounded-2xl border border-white/10 space-y-4 shadow-md">
                {/* Khối Tác Giả (Creator Profile Card) */}
                <View className="flex-row items-center justify-between pb-3 border-b border-white/10">
                  <TouchableOpacity
                    onPress={() => creatorAccountId && setShowFollowersModal(true)}
                    className="flex-row items-center space-x-3 flex-1"
                    activeOpacity={0.8}
                  >
                    <View className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border border-[#D4AF37]/40">
                      {movie.creatorAvatar ? (
                        <Image
                          source={{ uri: movie.creatorAvatar }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-full h-full items-center justify-center bg-zinc-800">
                          <FontAwesome5 name="user-ninja" size={18} color="#D4AF37" />
                        </View>
                      )}
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                        Tác Giả / Sản Xuất
                      </Text>
                      <Text className="text-white text-sm font-black mt-0.5" numberOfLines={1}>
                        {movie.creatorName || "Tác giả TaleX"}
                      </Text>
                      <Text className="text-zinc-500 text-[11px]">
                        {displayFollowerCount.toLocaleString("vi-VN")} người theo dõi
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {creatorAccountId && (
                    <FollowButton
                      isFollowing={isFollowing}
                      onFollowToggle={toggleFollow}
                      isMutating={isFollowMutating}
                      size="small"
                    />
                  )}
                </View>

                {/* Chi tiết sản xuất */}
                <View className="space-y-2 pt-2">
                  <View className="flex-row">
                    <Text className="text-zinc-400 text-xs w-28">Đạo diễn:</Text>
                    <Text className="text-white text-xs font-semibold flex-1">
                      {movie.director || movie.creatorName || "TaleX Studio"}
                    </Text>
                  </View>

                  <View className="flex-row">
                    <Text className="text-zinc-400 text-xs w-28">Thể loại:</Text>
                    <Text className="text-white text-xs font-semibold flex-1">
                      {movie.regionAndGenre || movie.category || "Phim Bộ, Hành Động"}
                    </Text>
                  </View>

                  <View className="flex-row">
                    <Text className="text-zinc-400 text-xs w-28">Năm phát hành:</Text>
                    <Text className="text-white text-xs font-semibold flex-1">
                      {movie.year || "2026"}
                    </Text>
                  </View>

                  <View className="flex-row">
                    <Text className="text-zinc-400 text-xs w-28">Độ tuổi:</Text>
                    <Text className="text-white text-xs font-semibold flex-1">
                      {movie.ageRating || "T16"}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* TAB 3: BÌNH LUẬN (COMMENTS - KẾT NỐI API THẬT) */}
            {bottomTab === "comments" && (
              <View className="space-y-4">
                {firstEpisode?.episodeId ? (
                  <EpisodeCommentsSection episodeId={firstEpisode.episodeId} />
                ) : (
                  <View className="bg-[#1E2024] p-4 rounded-2xl border border-white/10 items-center justify-center py-8">
                    <Ionicons name="chatbubbles-outline" size={32} color="#D4AF37" />
                    <Text className="text-zinc-300 text-xs font-semibold mt-2 text-center">
                      Bộ phim chưa có danh sách tập để hiển thị bình luận.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Followers Modal */}
      {creatorAccountId && (
        <FollowersModal
          visible={showFollowersModal}
          creatorAccountId={creatorAccountId}
          onClose={() => setShowFollowersModal(false)}
        />
      )}
    </SafeAreaView>
  );
}
