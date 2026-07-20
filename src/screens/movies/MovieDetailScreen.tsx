import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootNavigator";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMovieById, allMovies } from "./movieMockData";
import {
  getPublicSeriesDetail,
  getSeriesSeasons,
  getSeasonEpisodes,
  getEpisodePlayback,
  SeasonItem,
} from "@/services/series";
import { useCreatorFollow } from "@/hooks/useCreatorFollow";
import { useEpisodeLikes } from "@/hooks/useEpisodeLikes";
import { FollowButton } from "@/components/FollowButton";
import { LikeButton } from "@/components/LikeButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ShareButton } from "@/components/ShareButton";
import { LikedUsersModal } from "@/components/LikedUsersModal";
import { FollowersModal } from "@/components/FollowersModal";

type MovieDetailRouteParams = {
  movieId?: string;
};

function MoviePlayer({
  videoUrl,
  replayCounter,
  onFinishedChange,
}: {
  videoUrl: string;
  replayCounter: number;
  onFinishedChange: (finished: boolean) => void;
}) {
  const source = React.useMemo(() => {
    const headers: Record<string, string> = {};
    try {
      if (
        videoUrl &&
        videoUrl.includes("Policy=") &&
        videoUrl.includes("Signature=")
      ) {
        const urlObj = new URL(videoUrl);
        const policy = urlObj.searchParams.get("Policy");
        const signature = urlObj.searchParams.get("Signature");
        const keyPairId = urlObj.searchParams.get("Key-Pair-Id");
        if (policy && signature && keyPairId) {
          headers.Cookie = `CloudFront-Policy=${policy}; CloudFront-Signature=${signature}; CloudFront-Key-Pair-Id=${keyPairId}`;
        }
      }
    } catch (e) {
      console.error("Error parsing CloudFront URL for cookies:", e);
    }
    return {
      uri: videoUrl,
      headers,
    };
  }, [videoUrl]);

  const player = useVideoPlayer(source, (playerInstance) => {
    playerInstance.play();
  });

  // Listen to player end event
  useEffect(() => {
    if (!player) return;

    const endSub = player.addListener("playToEnd", () => {
      onFinishedChange(true);
    });

    const playSub = player.addListener("playingChange", (isPlaying) => {
      if (isPlaying) {
        onFinishedChange(false);
      }
    });

    return () => {
      endSub.remove();
      playSub.remove();
    };
  }, [player, onFinishedChange]);

  // Trigger replay when replayCounter changes (if > 0)
  useEffect(() => {
    if (replayCounter > 0 && player) {
      player.currentTime = 0;
      player.play();
      onFinishedChange(false);
    }
  }, [onFinishedChange, player, replayCounter]);

  return (
    <VideoView
      player={player}
      style={{ width: "100%", height: "100%" }}
      fullscreenOptions={{ enable: true }}
      allowsPictureInPicture
    />
  );
}

export default function MovieDetailScreen() {
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, "MovieDetailScreen">
    >();
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
        subtitle: seriesItem.subtitle || "Trọn bộ",
        category: seriesItem.category || "Phim Bộ",
        rating: seriesItem.rating || "10.0",
        year: seriesItem.year || "2026",
        ageRating: seriesItem.ageRating || "T16",
        translation: seriesItem.translation || "Vietsub",
        regionAndGenre: seriesItem.regionAndGenre || "Việt Nam",
        description: seriesItem.description || "Chưa có mô tả.",
        actors: seriesItem.actors || [],
      };
    }
    return getMovieById(movieId);
  });

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"episodes" | "recommend">("episodes");

  // New States for API Data
  const [seasons, setSeasons] = useState<SeasonItem[]>([]);
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [activeEpisodeIndex, setActiveEpisodeIndex] = useState(0);
  const [playbackUrl, setPlaybackUrl] = useState<string>("");
  const [loadingPlayback, setLoadingPlayback] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [replayCounter, setReplayCounter] = useState(0);

  const currentEpisodeId = episodes[activeEpisodeIndex]?.episodeId;
  const creatorAccountId = movie?.creatorAccountId || movie?.authorAccountId;

  const {
    isFollowing,
    toggleFollow,
    isMutating: isFollowMutating,
  } = useCreatorFollow(creatorAccountId);
  const {
    isLiked,
    likeCount,
    toggleLike,
    isMutating: isLikeMutating,
  } = useEpisodeLikes(currentEpisodeId);

  const [showLikedUsersModal, setShowLikedUsersModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const handleReplay = () => {
    const isMock =
      !movieId ||
      movieId.startsWith("tm") ||
      movieId.startsWith("am") ||
      movieId.startsWith("nm");
    if (isMock) {
      setReplayCounter((prev) => prev + 1);
    } else {
      const currentEp = episodes[activeEpisodeIndex];
      if (currentEp) {
        fetchPlaybackUrl(currentEp.episodeId, activeEpisodeIndex);
      } else {
        setReplayCounter((prev) => prev + 1);
      }
    }
    setIsFinished(false);
  };

  // 1. Reset and fetch detail / seasons when movieId changes
  useEffect(() => {
    const isMock =
      !movieId ||
      movieId.startsWith("tm") ||
      movieId.startsWith("am") ||
      movieId.startsWith("nm");

    if (isMock) {
      const mockMovie = getMovieById(movieId);
      setMovie(mockMovie);
      setSeasons([]);
      setActiveSeasonId(null);
      setEpisodes(mockMovie.episodes || []);
      setActiveEpisodeIndex(0);
      setPlaybackUrl(
        mockMovie.episodes?.[0]?.videoUrl ||
          "https://www.w3schools.com/html/mov_bbb.mp4",
      );
      setIsFinished(false);
      setLoading(false);
      return;
    }

    // Real API Series
    setLoading(true);

    // Fetch series details
    getPublicSeriesDetail(movieId)
      .then((res) => {
        if (res && res.code === 200 && res.data) {
          const detail = res.data;
          if (detail.status === "HIDDEN") {
            Alert.alert("Thông báo", "Tác phẩm này đã bị ẩn bởi tác giả.", [
              { text: "OK", onPress: () => navigation.goBack() },
            ]);
            return;
          }
          setMovie({
            id: detail.seriesId || detail.id,
            title: detail.title,
            creatorAccountId:
              detail.accountId ||
              detail.creatorAccountId ||
              detail.authorAccountId ||
              detail.creator?.accountId,
            creatorName:
              detail.creatorName || detail.creator?.username || detail.author,
            creatorAvatar: detail.creatorAvatar || detail.creator?.avatarUrl,
            totalCreatorFollowers:
              detail.totalCreatorFollowers ?? detail.creator?.followersCount,
            image:
              detail.coverUrl || detail.bannerUrl || detail.thumbnailUrl
                ? {
                    uri:
                      detail.coverUrl ||
                      detail.bannerUrl ||
                      detail.thumbnailUrl,
                  }
                : require("@assets/movie2.jpg"),
            subtitle: detail.subtitle,
            category: detail.category,
            rating: detail.rating,
            year: detail.year,
            ageRating: detail.ageRating,
            translation: detail.translation || detail.language,
            regionAndGenre: detail.regionAndGenre,
            description: detail.description,
            actors: detail.actors,
          });
        }
      })
      .catch((err) => console.error("Error fetching series detail:", err));

    // Fetch seasons
    getSeriesSeasons(movieId)
      .then((res) => {
        if (res && res.code === 200 && res.data && res.data.length > 0) {
          setSeasons(res.data);
          setActiveSeasonId(res.data[0].seasonId);
        } else {
          setSeasons([]);
          setActiveSeasonId(null);
          setEpisodes([]);
          setPlaybackUrl("");
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching seasons:", err);
        setLoading(false);
      });
  }, [movieId]);

  // 2. Fetch episodes when activeSeasonId changes
  useEffect(() => {
    if (!activeSeasonId) return;

    setEpisodes([]);
    setActiveEpisodeIndex(0);
    setIsFinished(false);
    setLoading(true);

    getSeasonEpisodes(activeSeasonId)
      .then((res) => {
        if (res && res.code === 200 && res.data && res.data.length > 0) {
          setEpisodes(res.data);
          // Fetch playback for the first episode
          fetchPlaybackUrl(res.data[0].episodeId, 0);
        } else {
          setEpisodes([]);
          setPlaybackUrl("");
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching episodes:", err);
        setLoading(false);
      });
  }, [activeSeasonId]);

  // 3. Helper to fetch playback URL for an episode
  const fetchPlaybackUrl = (episodeId: string, episodeIndex: number) => {
    setLoadingPlayback(true);
    setIsFinished(false);
    getEpisodePlayback(episodeId)
      .then((res) => {
        if (res && res.code === 200 && res.data && res.data.playbackUrl) {
          setPlaybackUrl(res.data.playbackUrl);
          setActiveEpisodeIndex(episodeIndex);
        }
      })
      .catch((err) => {
        console.error("Error fetching playback URL:", err);
      })
      .finally(() => {
        setLoadingPlayback(false);
        setLoading(false);
      });
  };

  // 4. Handle when an episode is selected
  const handleEpisodePress = (ep: any, index: number) => {
    const isMock =
      !movieId ||
      movieId.startsWith("tm") ||
      movieId.startsWith("am") ||
      movieId.startsWith("nm");
    if (index === activeEpisodeIndex) {
      handleReplay();
      return;
    }

    setIsFinished(false);
    if (isMock) {
      setActiveEpisodeIndex(index);
      setPlaybackUrl(
        ep.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4",
      );
    } else {
      fetchPlaybackUrl(ep.episodeId, index);
    }
  };

  const recommendations = allMovies
    .filter((m) => m.id !== movie?.id)
    .slice(0, 4);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#141210]">
      <StatusBar barStyle="light-content" />

      {/* ================= HEADER WITH BACK BUTTON ================= */}
      <View className="h-[56px] px-4 flex-row items-center justify-between border-b border-white/5 bg-[#141210]">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center rounded-full bg-[#252830]"
          activeOpacity={0.75}
        >
          <Feather name="arrow-left" size={22} color="#E5E0D8" />
        </TouchableOpacity>
        <Text
          className="text-[#E5E0D8] text-[16px] font-bold max-w-[70%]"
          numberOfLines={1}
        >
          {movie?.title}
        </Text>
        <View className="w-10 items-center justify-center">
          {loading && <ActivityIndicator size="small" color="#D4AF37" />}
        </View>
      </View>

      {/* ================= VIDEO PLAYER ================= */}
      <View className="w-full h-[220px] bg-black relative justify-center items-center">
        {playbackUrl ? (
          <MoviePlayer
            key={playbackUrl}
            videoUrl={playbackUrl}
            replayCounter={replayCounter}
            onFinishedChange={setIsFinished}
          />
        ) : (
          <Text className="text-gray-400 text-xs">
            Không có luồng phát video
          </Text>
        )}
        {loadingPlayback && (
          <View className="absolute inset-0 bg-black/60 items-center justify-center">
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text className="text-white text-xs mt-2">
              Đang tải luồng phát...
            </Text>
          </View>
        )}
        {isFinished && (
          <View className="absolute inset-0 bg-black/80 items-center justify-center">
            <TouchableOpacity
              onPress={handleReplay}
              className="bg-[#D4AF37] px-5 py-2.5 rounded-full flex-row items-center"
              activeOpacity={0.8}
            >
              <Feather name="rotate-ccw" size={16} color="#141210" />
              <Text className="text-[#141210] font-bold text-sm ml-2">
                Phát lại
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ================= BODY ================= */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* ===== VIP BANNER ===== */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("SubscriptionPlans")}
          className="flex-row justify-between items-center bg-[#D4AF37]/10 border-y border-[#D4AF37]/20 px-4 py-2"
        >
          <View className="flex-row items-center">
            <View className="bg-[#D4AF37] px-2 py-0.5 rounded mr-2">
              <Text className="text-[#141210] text-[10px] font-bold">
                Đăng Ký Ngay
              </Text>
            </View>
            <Text className="text-[#D4AF37] font-bold text-sm">
              đ 199.000/Năm
            </Text>
          </View>

          <Text className="text-white font-bold text-xs">Ưu Đãi Có Hạn</Text>
        </TouchableOpacity>

        {/* ===== TITLE ===== */}
        <View className="px-4 pt-4">
          <Text className="text-white text-[22px] font-bold">
            {movie.title}
          </Text>

          {/* META INFO (Render conditionally) */}
          {movie.rating ||
          movie.year ||
          movie.ageRating ||
          movie.translation ||
          movie.regionAndGenre ||
          movie.category ? (
            <View className="flex-row flex-wrap items-center mt-2">
              {movie.rating ? (
                <Text className="text-[#D4AF37] font-bold mr-3">
                  ⭐ {movie.rating}
                </Text>
              ) : null}

              {movie.category ? (
                <View className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-2 py-0.5 rounded mr-2">
                  <Text className="text-[#D4AF37] text-xs font-semibold">
                    {movie.category}
                  </Text>
                </View>
              ) : null}

              {movie.year ? (
                <View className="bg-[#252830] px-2 py-1 rounded mr-2">
                  <Text className="text-[#7C766B] text-xs">{movie.year}</Text>
                </View>
              ) : null}

              {movie.ageRating ? (
                <View className="bg-[#252830] px-2 py-1 rounded mr-2">
                  <Text className="text-[#7C766B] text-xs">
                    {movie.ageRating}
                  </Text>
                </View>
              ) : null}

              {movie.translation ? (
                <View className="bg-[#252830] px-2 py-1 rounded mr-2">
                  <Text className="text-[#7C766B] text-xs">
                    {movie.translation}
                  </Text>
                </View>
              ) : null}

              {movie.regionAndGenre ? (
                <Text className="text-[#B5AFA5] text-xs">
                  {movie.regionAndGenre}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* ===== DESCRIPTION ===== */}
          {movie.description ? (
            <View className="mt-3">
              <Text className="text-[#7C766B] text-sm leading-5">
                {movie.description}
              </Text>
            </View>
          ) : null}

          {/* ===== CREATOR & SUBSCRIPTION CARD ===== */}
          {movie.creatorName || creatorAccountId ? (
            <View className="flex-row items-center justify-between bg-[#1C1A17] p-3.5 rounded-2xl border border-white/5 mt-4">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-11 h-11 rounded-full bg-[#252830] overflow-hidden border border-white/10 mr-3 justify-center items-center">
                  {movie.creatorAvatar ? (
                    <Image
                      source={{ uri: movie.creatorAvatar }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <Feather name="user" size={20} color="#7C766B" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                    Tác giả
                  </Text>
                  <Text
                    className="text-white font-bold text-sm"
                    numberOfLines={1}
                  >
                    {movie.creatorName || "Tác giả TaleX"}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      creatorAccountId && setShowFollowersModal(true)
                    }
                    activeOpacity={0.7}
                  >
                    <Text className="text-[#D4AF37] text-[11px] font-semibold mt-0.5">
                      {movie.totalCreatorFollowers != null
                        ? `${movie.totalCreatorFollowers.toLocaleString("vi-VN")} người theo dõi`
                        : "Xem người theo dõi"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {creatorAccountId ? (
                <FollowButton
                  isFollowing={isFollowing}
                  onFollowToggle={toggleFollow}
                  isMutating={isFollowMutating}
                  size="small"
                />
              ) : null}
            </View>
          ) : null}

          {creatorAccountId && (
            <FollowersModal
              visible={showFollowersModal}
              creatorAccountId={creatorAccountId}
              onClose={() => setShowFollowersModal(false)}
            />
          )}

          {/* ===== ACTION BUTTONS ===== */}
          <View className="flex-row items-center flex-wrap gap-2 mt-4">
            <LikeButton
              isLiked={isLiked}
              likeCount={likeCount}
              onLikeToggle={toggleLike}
              isMutating={isLikeMutating}
              size="md"
            />

            <BookmarkButton
              episodeId={currentEpisodeId}
              contentType="VIDEO"
              size="md"
              showLabel
            />

            <ShareButton
              episodeId={currentEpisodeId}
              title={movie?.title || "Phim TaleX"}
              size="md"
              showLabel
            />

            {currentEpisodeId ? (
              <TouchableOpacity
                onPress={() => setShowLikedUsersModal(true)}
                className="flex-row items-center px-3.5 py-2.5 rounded-full bg-white/[0.04] border border-white/10"
              >
                <Feather name="users" size={14} color="#E5E0D8" />
                <Text className="text-[#E5E0D8] text-xs font-bold ml-1.5">
                  Lượt thích
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {currentEpisodeId && (
            <LikedUsersModal
              visible={showLikedUsersModal}
              episodeId={currentEpisodeId}
              onClose={() => setShowLikedUsersModal(false)}
            />
          )}

          <View className="h-[1px] bg-[#252830] mt-4" />
        </View>

        {/* ================= ACTORS (Only show if non-empty) ================= */}
        {movie.actors && movie.actors.length > 0 ? (
          <View className="mt-4 px-4">
            <Text className="text-white font-bold mb-2">Diễn viên</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {movie.actors.map((actor: { name?: string }, i: number) => (
                <View key={i} className="mr-4 items-center">
                  <View className="w-14 h-14 bg-[#252830] rounded-full items-center justify-center border border-white/5">
                    <Feather name="user" size={24} color="#7C766B" />
                  </View>
                  <Text
                    className="text-[#7C766B] text-xs mt-1.5 font-medium text-center w-16"
                    numberOfLines={1}
                  >
                    {actor.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* ================= TABS ================= */}
        <View className="flex-row px-4 mt-5">
          <TouchableOpacity
            onPress={() => setTab("episodes")}
            className="mr-6"
            activeOpacity={0.7}
          >
            <Text
              className={`font-bold ${
                tab === "episodes" ? "text-white" : "text-[#7C766B]"
              }`}
            >
              Chọn tập ({episodes.length})
            </Text>
            {tab === "episodes" && (
              <View className="h-[2px] w-8 bg-[#D4AF37] mt-1" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTab("recommend")}
            activeOpacity={0.7}
          >
            <Text
              className={`font-bold ${
                tab === "recommend" ? "text-white" : "text-[#7C766B]"
              }`}
            >
              Đề xuất cho bạn
            </Text>
            {tab === "recommend" && (
              <View className="h-[2px] w-8 bg-[#D4AF37] mt-1" />
            )}
          </TouchableOpacity>
        </View>

        {/* ================= TAB CONTENT ================= */}
        <View className="px-4 mt-4 pb-20">
          {/* ===== EPISODES ===== */}
          {tab === "episodes" ? (
            <>
              <Text className="text-[#7C766B] text-xs">
                Cập nhật đầy đủ · VIP cập nhật nhanh hơn
              </Text>

              {/* ===== SEASONS SELECTOR ===== */}
              {seasons.length > 1 && (
                <View className="mt-3 mb-1">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {seasons.map((season) => {
                      const isSelected = activeSeasonId === season.seasonId;
                      return (
                        <TouchableOpacity
                          key={season.seasonId}
                          onPress={() => setActiveSeasonId(season.seasonId)}
                          className={`px-4 py-2 rounded-full mr-3 border ${
                            isSelected
                              ? "bg-[#D4AF37] border-[#D4AF37]"
                              : "bg-[#252830] border-white/5"
                          }`}
                          activeOpacity={0.8}
                        >
                          <Text
                            className={`text-xs font-semibold ${
                              isSelected ? "text-[#141210]" : "text-[#E5E0D8]"
                            }`}
                          >
                            {season.title || `Season ${season.seasonNumber}`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              <View className="mt-4">
                {episodes.map((ep, i) => {
                  const isActive = activeEpisodeIndex === i;
                  return (
                    <TouchableOpacity
                      key={ep.episodeId || ep.title || i}
                      onPress={() => handleEpisodePress(ep, i)}
                      className={`p-3.5 rounded-xl mb-2 flex-row justify-between items-center border border-white/5 ${
                        isActive ? "bg-[#D4AF37]" : "bg-[#252830]"
                      }`}
                      activeOpacity={0.8}
                    >
                      <Text
                        className={
                          isActive ? "text-[#141210] font-bold" : "text-white"
                        }
                      >
                        {ep.title || `Tập ${ep.episodeNumber || i + 1}`}
                      </Text>
                      <View className="flex-row items-center gap-2">
                        {ep.episodeId ? (
                          <BookmarkButton
                            episodeId={ep.episodeId}
                            contentType="VIDEO"
                            size="sm"
                          />
                        ) : null}
                        {isActive ? (
                          isFinished ? (
                            <Feather
                              name="rotate-ccw"
                              size={14}
                              color="#141210"
                            />
                          ) : (
                            <Feather name="pause" size={14} color="#141210" />
                          )
                        ) : (
                          <Feather name="play" size={14} color="#7C766B" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {episodes.length === 0 && (
                  <Text className="text-[#7C766B] text-xs italic py-2">
                    Không có tập phim nào
                  </Text>
                )}
              </View>
            </>
          ) : (
            <>
              {/* ===== RECOMMENDATIONS ===== */}
              {recommendations.map((rec) => (
                <TouchableOpacity
                  key={rec.id}
                  onPress={() => {
                    navigation.replace("MovieDetailScreen", {
                      movieId: rec.id,
                    });
                  }}
                  className="bg-[#252830] p-3 rounded-xl mb-3 flex-row items-center border border-white/5"
                  activeOpacity={0.85}
                >
                  <Image
                    source={rec.image}
                    className="w-[100px] h-[60px] rounded-lg mr-3 bg-zinc-800"
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <Text className="text-white font-bold" numberOfLines={1}>
                      {rec.title}
                    </Text>
                    <Text className="text-[#7C766B] text-xs mt-1">
                      ⭐ {rec.rating} · {rec.category}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="#7C766B" />
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
