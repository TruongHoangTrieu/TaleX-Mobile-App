import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Share,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  Ionicons,
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getEpisodePlayback,
  getSeasonEpisodes,
  getPublicSeriesDetail,
  EpisodeItem,
} from "@/services/series";
import { useAuth } from "@/context/AuthContext";
import { useEpisodeLikes } from "@/hooks/useEpisodeLikes";
import { useEpisodeBookmarks } from "@/hooks/useEpisodeBookmarks";
import { useCreatorFollow } from "@/hooks/useCreatorFollow";
import { FollowButton } from "@/components/FollowButton";
import { FollowersModal } from "@/components/FollowersModal";
import { EpisodeCommentsSection } from "@/components/comments/EpisodeCommentsSection";
import ContentPaywall from "@/components/purchase/ContentPaywall";
import { allMovies } from "./movieMockData";

const { width: screenWidth } = Dimensions.get("window");

type MoviePlayerRouteParams = {
  movieId?: string;
  movieTitle?: string;
  seasonId?: string;
  episodeId?: string;
  episodeTitle?: string;
  episodeIndex?: number;
  episodesList?: EpisodeItem[];
};

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

function VideoPlayerCore({
  videoUrl,
  apiDuration,
  isLocked,
  replayCounter,
  playbackSpeed,
  onNavigateToPlans,
  onFinishedChange,
}: {
  videoUrl: string;
  apiDuration: number;
  isLocked: boolean;
  replayCounter: number;
  playbackSpeed: number;
  onNavigateToPlans: () => void;
  onFinishedChange: (finished: boolean) => void;
}) {
  const [displayTime, setDisplayTime] = useState<number>(0);
  const [isUnlockFormVisible, setIsUnlockFormVisible] = useState<boolean>(false);
  const [showOverlayControls, setShowOverlayControls] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [barWidth, setBarWidth] = useState<number>(1);

  const source = useMemo(() => {
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
    playerInstance.timeUpdateEventInterval = 0.25;
    playerInstance.play();
  });

  useEffect(() => {
    if (player) {
      player.playbackRate = playbackSpeed;
    }
  }, [player, playbackSpeed]);

  useEffect(() => {
    setDisplayTime(0);
    setIsUnlockFormVisible(false);
    setIsPlaying(true);
  }, [videoUrl]);

  useEffect(() => {
    if (!player) return;

    const endSub = player.addListener("playToEnd", () => {
      if (isLocked) {
        try {
          player.pause();
        } catch (e) {}
        setIsPlaying(false);
        setIsUnlockFormVisible(true);
        setDisplayTime(10);
      } else {
        onFinishedChange(true);
      }
    });

    const playSub = player.addListener("playingChange", (payload) => {
      setIsPlaying(payload.isPlaying);
      if (payload.isPlaying) {
        onFinishedChange(false);
      }
    });

    const timeSub = player.addListener("timeUpdate", ({ currentTime }) => {
      if (isLocked) {
        if (currentTime >= 9.8) {
          try {
            player.pause();
          } catch (e) {}
          setIsPlaying(false);
          setIsUnlockFormVisible(true);
          setDisplayTime(10);
          return;
        }
        if (!isUnlockFormVisible) {
          setDisplayTime(currentTime);
        }
      } else {
        setDisplayTime(currentTime);
      }
    });

    return () => {
      endSub.remove();
      playSub.remove();
      timeSub.remove();
    };
  }, [player, isLocked, isUnlockFormVisible, onFinishedChange]);

  useEffect(() => {
    if (replayCounter > 0 && player) {
      try {
        player.currentTime = 0;
        player.play();
      } catch (e) {}
      setIsUnlockFormVisible(false);
      setDisplayTime(0);
      onFinishedChange(false);
    }
  }, [onFinishedChange, player, replayCounter]);

  const handleSeek = useCallback(
    (targetSeconds: number) => {
      const clampedTarget = Math.max(0, Math.min(targetSeconds, apiDuration));
      if (isLocked) {
        if (clampedTarget >= 10) {
          // Tua vượt mốc 10s xem thử -> Kịch kim ở 10s, pause và hiện Form mở khóa
          try {
            player.currentTime = 9.99;
            player.pause();
          } catch (e) {}
          setIsPlaying(false);
          setDisplayTime(clampedTarget);
          setIsUnlockFormVisible(true);
        } else {
          // Tua ngược lại dưới mốc 10s -> Tắt Form mở khóa, xóa làm mờ và cho xem lại
          if (isUnlockFormVisible) {
            setIsUnlockFormVisible(false);
          }
          try {
            player.currentTime = clampedTarget;
            player.play();
          } catch (e) {}
          setDisplayTime(clampedTarget);
          setIsPlaying(true);
        }
      } else {
        try {
          player.currentTime = clampedTarget;
        } catch (e) {}
        setDisplayTime(clampedTarget);
      }
    },
    [apiDuration, isLocked, isUnlockFormVisible, player],
  );

  const togglePlayPause = () => {
    if (!player) return;
    if (isPlaying) {
      try {
        player.pause();
      } catch (e) {}
    } else {
      if (isLocked && displayTime >= 10) {
        handleSeek(0);
      } else {
        try {
          player.play();
        } catch (e) {}
      }
    }
  };

  const handleProgressBarPress = (evt: any) => {
    const touchX = evt.nativeEvent.locationX;
    if (barWidth > 0) {
      const seekRatio = Math.max(0, Math.min(1, touchX / barWidth));
      const targetSeconds = seekRatio * apiDuration;
      handleSeek(targetSeconds);
    }
  };

  const currentProgressPercent = Math.max(
    0,
    Math.min(100, (displayTime / (apiDuration || 1)) * 100),
  );

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => setShowOverlayControls((prev) => !prev)}
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%" }}
        nativeControls={false}
        allowsPictureInPicture
      />

      {/* B. BLUR FRAME & UNLOCK FORM OVERLAY (Hiển thị khi video 10s kết thúc hoặc tua > 10s) */}
      {isUnlockFormVisible && (
        <View className="absolute inset-0 bg-black/90 items-center justify-center p-4 z-30">
          <View className="w-12 h-12 rounded-full bg-[#E50914]/20 items-center justify-center border border-[#E50914]/50 mb-2">
            <Ionicons name="lock-closed" size={24} color="#E50914" />
          </View>

          <Text className="text-white text-base font-extrabold text-center tracking-wide">
            Nội dung trả phí - Mở khóa nội dung
          </Text>

          <Text className="text-zinc-400 text-xs text-center mt-1 mb-4 leading-relaxed max-w-xs font-medium">
            Bạn đã xem hết 10 giây xem thử. Vui lòng mở khóa hoặc đăng ký gói Premium để tiếp tục xem đầy đủ {formatTime(apiDuration)}.
          </Text>

          <View className="w-full flex-col gap-2 max-w-xs">
            <TouchableOpacity
              onPress={onNavigateToPlans}
              className="bg-[#E50914] py-2.5 rounded-full items-center justify-center active:opacity-85 shadow-lg flex-row"
            >
              <Ionicons name="sparkles" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text className="text-white font-black text-xs uppercase tracking-wider">
                Mở khóa / Gói Premium
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSeek(0)}
              className="bg-white/10 border border-white/15 py-2.5 rounded-full items-center justify-center active:opacity-80 flex-row"
            >
              <Ionicons name="reload-outline" size={14} color="#D4AF37" style={{ marginRight: 6 }} />
              <Text className="text-white font-bold text-xs">
                Xem lại đoạn xem thử (10s)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* OVERLAY PLAYBACK CONTROLS & TIMELINE SCRUBBER */}
      {!isUnlockFormVisible && showOverlayControls && (
        <View className="absolute inset-0 bg-black/40 justify-between p-3 z-20">
          <View className="flex-row justify-end items-center">
            {isLocked && (
              <View className="bg-[#E50914]/80 px-2.5 py-1 rounded-full flex-row items-center border border-white/20">
                <Ionicons name="lock-closed" size={11} color="#FFFFFF" />
                <Text className="text-white font-extrabold text-[10px] ml-1">
                  Xem thử 10s
                </Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center justify-center space-x-6">
            <TouchableOpacity
              onPress={() => handleSeek(displayTime - 10)}
              className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
              style={{ marginRight: 16 }}
            >
              <MaterialCommunityIcons name="rewind-10" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlayPause}
              className="w-14 h-14 rounded-full bg-[#E50914] items-center justify-center shadow-lg"
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={28}
                color="#FFFFFF"
                style={{ marginLeft: isPlaying ? 0 : 3 }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSeek(displayTime + 10)}
              className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
              style={{ marginLeft: 16 }}
            >
              <MaterialCommunityIcons name="fast-forward-10" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* A. SMART TIMELINE SCRUBBER */}
          <View className="w-full space-y-1">
            <View className="flex-row justify-between items-center px-1 mb-1">
              <Text className="text-white font-black text-[11px]">
                {formatTime(displayTime)}
              </Text>
              <Text className="text-zinc-400 font-bold text-[11px]">
                {formatTime(apiDuration)}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleProgressBarPress}
              onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
              className="w-full h-3 justify-center"
            >
              <View className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden relative">
                <View
                  style={{ width: `${currentProgressPercent}%` }}
                  className="h-full bg-[#E50914] rounded-full"
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function MoviePlayerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = (route.params || {}) as MoviePlayerRouteParams;

  const { user } = useAuth();

  const {
    movieId,
    movieTitle,
    seasonId,
    episodeId: initialEpisodeId,
    episodeIndex: initialIndex = 0,
    episodesList: passedEpisodes = [],
  } = params;

  const [episodes, setEpisodes] = useState<EpisodeItem[]>(passedEpisodes);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [playbackUrl, setPlaybackUrl] = useState<string>("");
  const [apiDuration, setApiDuration] = useState<number>(900);
  const [playbackType, setPlaybackType] = useState<string>("HLS");
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [loadingPlayback, setLoadingPlayback] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [replayCounter, setReplayCounter] = useState(0);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showEpisodesModal, setShowEpisodesModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [paywallEpisodeId, setPaywallEpisodeId] = useState<string | null>(null);

  // Active Tab state ("recommend" | "comments" | "episodes")
  const [activeTab, setActiveTab] = useState<"recommend" | "comments" | "episodes">("recommend");

  // Video Speed state
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Author / Channel state
  const [creatorInfo, setCreatorInfo] = useState<{
    accountId?: string;
    name?: string;
    avatar?: string;
    followers?: number;
  }>({});

  const currentEp = episodes[currentIndex];
  const activeEpisodeId = currentEp?.episodeId || initialEpisodeId;

  const {
    isLiked,
    likeCount,
    toggleLike,
    isMutating: isLikeMutating,
  } = useEpisodeLikes(activeEpisodeId);

  const {
    isBookmarked,
    isMutating: isBookmarkMutating,
    toggleBookmark,
  } = useEpisodeBookmarks(activeEpisodeId);

  const {
    isFollowing,
    toggleFollow,
    isMutating: isFollowMutating,
  } = useCreatorFollow(creatorInfo.accountId);

  useEffect(() => {
    if (!movieId) return;
    getPublicSeriesDetail(movieId)
      .then((res) => {
        if (res && res.code === 200 && res.data) {
          const d = res.data;
          setCreatorInfo({
            accountId:
              d.accountId ||
              d.creatorAccountId ||
              d.authorAccountId ||
              d.creator?.accountId,
            name:
              d.creatorName ||
              d.creator?.username ||
              d.author ||
              "TaleX Channel",
            avatar: d.creatorAvatar || d.creator?.avatarUrl,
            followers: d.totalCreatorFollowers ?? 12500,
          });
        }
      })
      .catch(() => {});
  }, [movieId]);

  useEffect(() => {
    if (passedEpisodes.length > 0) return;
    if (!seasonId) return;

    getSeasonEpisodes(seasonId)
      .then((res) => {
        if (res && res.code === 200 && res.data) {
          setEpisodes(res.data);
        }
      })
      .catch((err) => console.error("Error fetching season episodes:", err));
  }, [seasonId, passedEpisodes]);

  const fetchPlayback = useCallback(
    (epId: string) => {
      if (!epId) return;
      setLoadingPlayback(true);
      setIsFinished(false);
      setPaywallEpisodeId(null);
      setPlaybackUrl("");

    getEpisodePlayback(epId, user?.accountId)
      .then((res) => {
        if (res && res.code === 200 && res.data) {
          const data = res.data;
          const url = data.playbackUrl || data.hlsUrl;
          setPlaybackUrl(url || "https://www.w3schools.com/html/mov_bbb.mp4");

          const dur = data.duration && data.duration > 0 ? data.duration : 900;
          setApiDuration(dur);

          const pType = data.playbackType || "HLS";
          setPlaybackType(pType);

          const locked = Boolean(
            data.isLocked === true ||
            data.isEntitled === false ||
            pType === "MP4"
          );
          setIsLocked(locked);
        } else {
          setPlaybackUrl("https://www.w3schools.com/html/mov_bbb.mp4");
          setApiDuration(900);
          setIsLocked(false);
        }
      })
      .catch((err: any) => {
        if (err?.status === 403 || (err?.message && err.message.includes("403"))) {
          setPaywallEpisodeId(epId);
        } else {
          setPlaybackUrl("https://www.w3schools.com/html/mov_bbb.mp4");
          setApiDuration(900);
          setIsLocked(false);
        }
      })
      .finally(() => {
        setLoadingPlayback(false);
      });
  }, [user?.accountId]);

  useEffect(() => {
    if (activeEpisodeId) {
      fetchPlayback(activeEpisodeId);
    }
  }, [activeEpisodeId, fetchPlayback]);

  const handleSelectEpisode = (index: number) => {
    if (index === currentIndex) {
      handleReplay();
      return;
    }
    setCurrentIndex(index);
    const ep = episodes[index];
    if (ep?.episodeId) {
      fetchPlayback(ep.episodeId);
    }
    setShowEpisodesModal(false);
  };

  const handleNextEpisode = () => {
    if (currentIndex < episodes.length - 1) {
      handleSelectEpisode(currentIndex + 1);
    }
  };

  const handlePrevEpisode = () => {
    if (currentIndex > 0) {
      handleSelectEpisode(currentIndex - 1);
    }
  };

  const handleReplay = () => {
    setReplayCounter((prev) => prev + 1);
    setIsFinished(false);
  };

  const handleCycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  const recommendations = allMovies.slice(0, 5);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#0F0F0F]">
      <StatusBar barStyle="light-content" translucent />

      {/* ================= 1. YOUTUBE VIDEO PLAYER FRAME ================= */}
      <View className="w-full h-[225px] bg-black relative justify-center items-center">
        {/* Top Floating Back & Home Buttons Over Video */}
        <View className="absolute top-2 left-2 right-2 flex-row justify-between items-center z-20">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-9 h-9 rounded-full bg-black/60 items-center justify-center border border-white/10"
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("MainTabs")}
            className="w-9 h-9 rounded-full bg-black/60 items-center justify-center border border-white/10"
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {playbackUrl ? (
          <VideoPlayerCore
            key={playbackUrl}
            videoUrl={playbackUrl}
            apiDuration={apiDuration}
            isLocked={isLocked}
            replayCounter={replayCounter}
            playbackSpeed={playbackSpeed}
            onNavigateToPlans={() => navigation.navigate("SubscriptionPlans")}
            onFinishedChange={setIsFinished}
          />
        ) : paywallEpisodeId && paywallEpisodeId === activeEpisodeId ? (
          <View className="w-full px-6">
            <ContentPaywall
              episodeId={activeEpisodeId}
              itemType="EPISODE"
              title={currentEp?.title || movieTitle}
              priceVnd={currentEp?.priceVnd}
              returnScreen="MoviePlayer"
            />
          </View>
        ) : !loadingPlayback ? (
          <Text className="text-zinc-400 text-xs">Không có nguồn video</Text>
        ) : null}

        {loadingPlayback && (
          <View className="absolute inset-0 bg-black/75 items-center justify-center space-y-2">
            <ActivityIndicator size="large" color="#E50914" />
            <Text className="text-zinc-300 text-xs font-semibold">Đang tải luồng video HD...</Text>
          </View>
        )}

        {isFinished && (
          <View className="absolute inset-0 bg-black/85 items-center justify-center space-y-3">
            <TouchableOpacity
              onPress={handleReplay}
              className="bg-[#E50914] px-6 py-2.5 rounded-full flex-row items-center shadow-lg"
              activeOpacity={0.8}
            >
              <Ionicons name="reload" size={16} color="#FFFFFF" />
              <Text className="text-white font-black text-xs ml-2 uppercase tracking-wide">
                Phát lại
              </Text>
            </TouchableOpacity>

            {currentIndex < episodes.length - 1 && (
              <TouchableOpacity
                onPress={handleNextEpisode}
                className="bg-white/15 border border-white/20 px-5 py-2 rounded-full flex-row items-center"
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-xs mr-1.5">Tập tiếp theo</Text>
                <Ionicons name="play-skip-forward" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* ================= 2. MAIN YOUTUBE PAGE CONTENT ================= */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* VIDEO TITLE & STATS SECTION */}
        <TouchableOpacity
          onPress={() => setShowFullDesc(!showFullDesc)}
          className="px-4 pt-3 pb-2"
          activeOpacity={0.9}
        >
          <Text className="text-white text-base font-bold leading-snug" numberOfLines={showFullDesc ? undefined : 2}>
            {movieTitle}: {currentEp?.title || `Tập ${currentIndex + 1}`}
          </Text>

          <View className="flex-row items-center flex-wrap gap-1.5 mt-1.5">
            <Text className="text-zinc-400 text-xs">12.5K lượt xem</Text>
            <Text className="text-zinc-500 text-xs">·</Text>
            <Text className="text-zinc-300 text-xs font-semibold">
              {likeCount > 0 ? `${likeCount.toLocaleString("vi-VN")}` : "1.2K"} lượt thích
            </Text>
            <Text className="text-zinc-500 text-xs">·</Text>
            <Text className="text-zinc-400 text-xs">2 ngày trước</Text>
            <Text className="text-zinc-500 text-xs">·</Text>
            <Text className="text-[#D4AF37] text-xs font-semibold">#TaleX #PhimBo</Text>
            <Text className="text-zinc-400 text-xs font-bold ml-1">
              {showFullDesc ? "... Thu gọn" : "... Xem thêm"}
            </Text>
          </View>

          {showFullDesc && currentEp?.description && (
            <Text className="text-zinc-300 text-xs leading-relaxed mt-2 pt-2 border-t border-white/10">
              {currentEp.description}
            </Text>
          )}
        </TouchableOpacity>

        {/* ================= 3. YOUTUBE-STYLE CLEAN CHANNEL & ACTIONS BAR ================= */}
        <View className="flex-row items-center justify-between px-4 py-2.5 border-y border-white/10 my-1">
          {/* BÊN TRÁI: HÌNH CHỦ KÊNH + NÚT THEO DÕI (KHÔNG CÓ TÊN HAY SỐ NGƯỜI ĐĂNG KÝ) */}
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => creatorInfo.accountId && setShowFollowersModal(true)}
              activeOpacity={0.8}
              className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 border border-[#D4AF37]/40"
              style={{ marginRight: 8 }}
            >
              {creatorInfo.avatar ? (
                <Image
                  source={{ uri: creatorInfo.avatar }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full items-center justify-center bg-zinc-800">
                  <FontAwesome5 name="user-ninja" size={16} color="#D4AF37" />
                </View>
              )}
            </TouchableOpacity>

            {creatorInfo.accountId && (
              <FollowButton
                isFollowing={isFollowing}
                onFollowToggle={toggleFollow}
                isMutating={isFollowMutating}
                size="small"
              />
            )}
          </View>

          {/* BÊN PHẢI: TIM, LƯU VÀ CHIA SẺ (KHÔNG CÓ VÒNG TRÒN, ICON DÀY 24PX) */}
          <View className="flex-row items-center space-x-3">
            {/* Tim / Like Icon */}
            <TouchableOpacity
              onPress={toggleLike}
              disabled={isLikeMutating}
              activeOpacity={0.75}
              className="p-1"
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={25}
                color={isLiked ? "#E50914" : "#FFFFFF"}
              />
            </TouchableOpacity>

            {/* Lưu / Bookmark Icon */}
            <TouchableOpacity
              onPress={() => toggleBookmark("VIDEO")}
              disabled={isBookmarkMutating}
              activeOpacity={0.75}
              className="p-1"
            >
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={24}
                color={isBookmarked ? "#D4AF37" : "#FFFFFF"}
              />
            </TouchableOpacity>

            {/* Chia sẻ / Share Icon */}
            <TouchableOpacity
              onPress={() => {
                Share.share({
                  title: movieTitle || "Phim TaleX",
                  message: `Xem ngay phim ${movieTitle || "TaleX"}!`,
                });
              }}
              activeOpacity={0.75}
              className="p-1"
            >
              <Ionicons
                name="share-social-outline"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {/* Danh sách tập phim Icon */}
            {episodes.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowEpisodesModal(true)}
                activeOpacity={0.75}
                className="p-1"
              >
                <Ionicons name="list" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ================= 4. THREE BOTTOM TABS (ĐỀ XUẤT | BÌNH LUẬN | TẬP PHIM) ================= */}
        <View className="flex-row items-center justify-between border-b border-white/10 mt-3 mb-4">
          <TouchableOpacity
            onPress={() => setActiveTab("recommend")}
            activeOpacity={0.8}
            className="flex-1 items-center justify-center relative pb-2.5"
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === "recommend" ? "text-[#D4AF37]" : "text-zinc-400"
              }`}
              numberOfLines={1}
            >
              Đề Xuất
            </Text>
            {activeTab === "recommend" && (
              <View className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#D4AF37] rounded-full" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("comments")}
            activeOpacity={0.8}
            className="flex-1 items-center justify-center relative pb-2.5"
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === "comments" ? "text-[#D4AF37]" : "text-zinc-400"
              }`}
              numberOfLines={1}
            >
              Bình Luận
            </Text>
            {activeTab === "comments" && (
              <View className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#D4AF37] rounded-full" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("episodes")}
            activeOpacity={0.8}
            className="flex-1 items-center justify-center relative pb-2.5"
          >
            <Text
              className={`text-xs font-bold ${
                activeTab === "episodes" ? "text-[#D4AF37]" : "text-zinc-400"
              }`}
              numberOfLines={1}
            >
              Tập Phim ({episodes.length})
            </Text>
            {activeTab === "episodes" && (
              <View className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#D4AF37] rounded-full" />
            )}
          </TouchableOpacity>
        </View>

        {/* TAB 1: ĐỀ XUẤT */}
        {activeTab === "recommend" && (
          <View className="px-4">
            <View className="space-y-3">
              {recommendations.map((rec) => (
                <TouchableOpacity
                  key={rec.id}
                  onPress={() => {
                    navigation.replace("MovieDetailScreen", { movieId: rec.id });
                  }}
                  className="flex-row space-x-3 mb-3"
                  activeOpacity={0.85}
                >
                  {/* 16:9 Thumbnail */}
                  <View className="w-[135px] h-[80px] rounded-xl overflow-hidden bg-zinc-800 relative border border-white/10">
                    <Image source={rec.image} className="w-full h-full" resizeMode="cover" />
                    <View className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded">
                      <Text className="text-white text-[9px] font-bold">45:00</Text>
                    </View>
                  </View>

                  {/* Details */}
                  <View className="flex-1 ml-2.5 justify-between py-0.5">
                    <View>
                      <Text className="text-white font-bold text-xs leading-snug" numberOfLines={2}>
                        {rec.title} - Tập Đặc Biệt 2026
                      </Text>
                      <Text className="text-zinc-400 text-[11px] mt-1">
                        {creatorInfo.name || "TaleX Official"} · ⭐ {rec.rating}
                      </Text>
                      <Text className="text-zinc-500 text-[10px] mt-0.5">
                        45K lượt xem · 3 ngày trước
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* TAB 2: BÌNH LUẬN */}
        {activeTab === "comments" && activeEpisodeId && (
          <View className="px-4">
            <EpisodeCommentsSection episodeId={activeEpisodeId} />
          </View>
        )}

        {/* TAB 3: DANH SÁCH TẬP PHIM */}
        {activeTab === "episodes" && (
          <View className="px-4 space-y-2.5">
            {episodes.map((ep, idx) => {
              const isActive = idx === currentIndex;
              const isPaid = ep.unlockType === "PAID";
              return (
                <TouchableOpacity
                  key={ep.episodeId || idx}
                  onPress={() => handleSelectEpisode(idx)}
                  activeOpacity={0.85}
                  className={`flex-row p-3 rounded-2xl border items-center justify-between mb-2 ${
                    isActive
                      ? "bg-[#D4AF37]/20 border-[#D4AF37]"
                      : "bg-[#1E2024] border-white/10"
                  }`}
                >
                  <View className="flex-row items-center flex-1 mr-2 space-x-3">
                    <View className={`w-8 h-8 rounded-xl items-center justify-center ${isActive ? "bg-[#D4AF37]" : "bg-white/10"}`}>
                      {isActive ? (
                        <Ionicons name="play" size={14} color="#141210" style={{ marginLeft: 1 }} />
                      ) : (
                        <Text className="text-xs font-black text-white">
                          {ep.episodeNumber || idx + 1}
                        </Text>
                      )}
                    </View>

                    <View className="flex-1 ml-2">
                      <Text className={`font-bold text-xs ${isActive ? "text-[#D4AF37]" : "text-white"}`} numberOfLines={1}>
                        Tập {ep.episodeNumber || idx + 1}: {ep.title}
                      </Text>
                      <Text className="text-zinc-400 text-[11px] mt-0.5">
                        45 phút · HD Vietsub
                      </Text>
                    </View>
                  </View>

                  {isPaid ? (
                    <View className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                      <Text className="text-[9px] font-black text-amber-400">Trả phí</Text>
                    </View>
                  ) : (
                    <View className="px-2 py-0.5 rounded bg-green-500/20 border border-green-500/30">
                      <Text className="text-[9px] font-black text-green-400">Miễn phí</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ================= 7. EPISODES SELECTION MODAL (Danh Sách Tập Phim Modal) ================= */}
      <Modal
        visible={showEpisodesModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEpisodesModal(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-[#1F1F1F] rounded-t-3xl h-[65%] p-4 border-t border-white/10">
            <View className="flex-row items-center justify-between border-b border-white/10 pb-3 mb-3">
              <Text className="text-white font-bold text-sm">
                Danh sách tập phim ({episodes.length})
              </Text>
              <TouchableOpacity
                onPress={() => setShowEpisodesModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              <View className="space-y-2.5">
                {episodes.map((ep, idx) => {
                  const isActive = idx === currentIndex;
                  const isPaid = ep.unlockType === "PAID";
                  return (
                    <TouchableOpacity
                      key={ep.episodeId || idx}
                      onPress={() => handleSelectEpisode(idx)}
                      activeOpacity={0.85}
                      className={`flex-row p-3 rounded-2xl border items-center justify-between ${
                        isActive
                          ? "bg-[#D4AF37]/20 border-[#D4AF37]"
                          : "bg-[#272727] border-white/5"
                      }`}
                    >
                      <View className="flex-row items-center flex-1 mr-2 space-x-3">
                        <View className={`w-8 h-8 rounded-xl items-center justify-center ${isActive ? "bg-[#D4AF37]" : "bg-white/10"}`}>
                          {isActive ? (
                            <Ionicons name="play" size={14} color="#141210" style={{ marginLeft: 1 }} />
                          ) : (
                            <Text className="text-xs font-black text-white">
                              {ep.episodeNumber || idx + 1}
                            </Text>
                          )}
                        </View>

                        <View className="flex-1 ml-2">
                          <Text className={`font-bold text-xs ${isActive ? "text-[#D4AF37]" : "text-white"}`} numberOfLines={1}>
                            Tập {ep.episodeNumber || idx + 1}: {ep.title}
                          </Text>
                          <Text className="text-zinc-400 text-[11px] mt-0.5">
                            45 phút
                          </Text>
                        </View>
                      </View>

                      {isPaid ? (
                        <View className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                          <Text className="text-[9px] font-black text-amber-400">Trả phí</Text>
                        </View>
                      ) : (
                        <View className="px-2 py-0.5 rounded bg-green-500/20 border border-green-500/30">
                          <Text className="text-[9px] font-black text-green-400">Miễn phí</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= 8. COMMENTS DRAWER MODAL ================= */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <View className="flex-1 bg-black/70 justify-end">
          <View className="bg-[#1F1F1F] rounded-t-3xl h-[75%] p-4 border-t border-white/10">
            <View className="flex-row items-center justify-between border-b border-white/10 pb-3 mb-2">
              <Text className="text-white font-bold text-sm">Bình luận</Text>
              <TouchableOpacity
                onPress={() => setShowCommentsModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {activeEpisodeId && (
              <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                <EpisodeCommentsSection episodeId={activeEpisodeId} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* FOLLOWERS MODAL */}
      {creatorInfo.accountId && (
        <FollowersModal
          visible={showFollowersModal}
          creatorAccountId={creatorInfo.accountId}
          onClose={() => setShowFollowersModal(false)}
        />
      )}
    </SafeAreaView>
  );
}


