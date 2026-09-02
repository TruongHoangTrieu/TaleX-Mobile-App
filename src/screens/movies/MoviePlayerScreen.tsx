import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
  getEpisodePlayback,
  getSeasonEpisodes,
  getSeriesSeasons,
  getPublicSeriesDetail,
  getPublicSeries,
  formatWatchTime,
  formatAnalyticNumber,
  EpisodeItem,
} from "@/services/series";
import {
  getRecommendationFeed,
  HomeFeedSeries,
} from "@/services/recommendations";
import { useAuth } from "@/context/AuthContext";
import { useEpisodeLikes } from "@/hooks/useEpisodeLikes";
import { useEpisodeBookmarks } from "@/hooks/useEpisodeBookmarks";
import { useCreatorFollow } from "@/hooks/useCreatorFollow";
import { FollowButton } from "@/components/FollowButton";
import { FollowersModal } from "@/components/FollowersModal";
import { EpisodeCommentsSection } from "@/components/comments/EpisodeCommentsSection";
import ContentPaywall from "@/components/purchase/ContentPaywall";
import { useContentPurchase } from "@/hooks/useContentPurchase";
import QuickUnlockModal from "@/components/checkout/QuickUnlockModal";
import { useVideoPlaybackTracking } from "@/hooks/useVideoPlaybackTracking";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

type MoviePlayerRouteParams = {
  movieId?: string;
  movieTitle?: string;
  seasonId?: string;
  episodeId?: string;
  episodeTitle?: string;
  episodeIndex?: number;
  episodesList?: EpisodeItem[];
  initialPosition?: number;
  refreshKey?: string;
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
  initialPosition = 0,
  episodeId,
  onNavigateToPlans,
  onFinishedChange,
  onCycleSpeed,
  onNextEpisode,
  hasNextEpisode,
  onGoBack,
}: {
  videoUrl: string;
  apiDuration: number;
  isLocked: boolean;
  replayCounter: number;
  playbackSpeed: number;
  initialPosition?: number;
  episodeId?: string;
  onNavigateToPlans: () => void;
  onFinishedChange: (finished: boolean) => void;
  onCycleSpeed?: () => void;
  onNextEpisode?: () => void;
  hasNextEpisode?: boolean;
  onGoBack?: () => void;
}) {
  const [displayTime, setDisplayTime] = useState<number>(initialPosition || 0);
  const [isUnlockFormVisible, setIsUnlockFormVisible] =
    useState<boolean>(false);
  const [showOverlayControls, setShowOverlayControls] = useState<boolean>(true);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [barWidth, setBarWidth] = useState<number>(1);

  const [isBuffering, setIsBuffering] = useState<boolean>(true);

  const { onTimeUpdate: trackTimeUpdate } = useVideoPlaybackTracking(
    episodeId,
    isPlaying && !isBuffering,
    displayTime,
    !isLocked,
  );

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
    if (initialPosition && initialPosition > 0) {
      try {
        playerInstance.currentTime = initialPosition;
      } catch (e) {}
    }
    playerInstance.play();
  });

  useEffect(() => {
    if (player) {
      player.playbackRate = playbackSpeed;
    }
  }, [player, playbackSpeed]);

  useEffect(() => {
    setDisplayTime(initialPosition || 0);
    setIsUnlockFormVisible(false);
    setIsPlaying(true);
    setIsBuffering(true);
  }, [videoUrl, initialPosition]);

  useEffect(() => {
    if (!player) return;

    const statusSub = player.addListener("statusChange", ({ status }: any) => {
      if (status === "loading" || status === "idle") {
        setIsBuffering(true);
      } else if (status === "readyToPlay") {
        setIsBuffering(false);
      }
    });

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
        setIsBuffering(false);
        onFinishedChange(false);
      }
    });

    const timeSub = player.addListener("timeUpdate", ({ currentTime }) => {
      setIsBuffering(false);
      trackTimeUpdate(currentTime);
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
      statusSub.remove();
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
      } else if (apiDuration > 0 && displayTime >= apiDuration - 0.5) {
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
        key={videoUrl || "movie-player-core"}
        player={player}
        style={{ width: "100%", height: "100%" }}
        nativeControls={false}
        allowsPictureInPicture
      />

      {/* BUFFERING / LOADING OVERLAY */}
      {isBuffering && !isUnlockFormVisible && (
        <View
          pointerEvents="none"
          className="absolute inset-0 bg-black/40 items-center justify-center z-15"
        >
          <View className="w-14 h-14 rounded-2xl bg-black/75 border border-[#D4AF37]/50 items-center justify-center shadow-2xl">
            <ActivityIndicator size="large" color="#D4AF37" />
          </View>
        </View>
      )}

      {/* B. BLUR FRAME & UNLOCK FORM OVERLAY (Hiển thị khi video 10s kết thúc hoặc tua > 10s) */}
      {isUnlockFormVisible && (
        <View className="absolute inset-0 bg-black/90 items-center justify-center p-4 z-30">
          <View className="w-12 h-12 rounded-full bg-[#D4AF37]/15 items-center justify-center border border-[#D4AF37]/40 mb-2">
            <Ionicons name="lock-closed" size={24} color="#D4AF37" />
          </View>

          <Text className="text-[#F3C649] text-base font-extrabold text-center tracking-wide">
            Nội dung trả phí - Mở khóa nội dung
          </Text>

          <Text className="text-zinc-400 text-xs text-center mt-1 mb-4 leading-relaxed max-w-xs font-medium">
            Bạn đã xem hết 10 giây xem thử. Vui lòng mua tập này để tiếp tục xem
            đầy đủ {formatTime(apiDuration)}.
          </Text>

          <View className="w-full flex-col gap-2 max-w-xs">
            <TouchableOpacity
              onPress={onNavigateToPlans}
              className="bg-[#D4AF37] py-2.5 rounded-full items-center justify-center active:opacity-85 shadow-lg flex-row"
            >
              <Ionicons
                name="sparkles"
                size={15}
                color="#141210"
                style={{ marginRight: 6 }}
              />
              <Text className="text-[#141210] font-black text-xs uppercase tracking-wider">
                MUA TẬP NÀY
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSeek(0)}
              className="bg-white/10 border border-white/15 py-2.5 rounded-full items-center justify-center active:opacity-80 flex-row"
            >
              <Ionicons
                name="reload-outline"
                size={14}
                color="#D4AF37"
                style={{ marginRight: 6 }}
              />
              <Text className="text-white font-bold text-xs">
                Xem lại đoạn xem thử (10s)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* OVERLAY PLAYBACK CONTROLS (EXACT YOUTUBE MOBILE OVERLAY) */}
      {!isUnlockFormVisible && showOverlayControls && (
        <View className="absolute inset-0 bg-black/50 justify-between p-3 z-20">
          {/* 1. TOP BAR: Back/Down Chevron & Speed / Lock Status */}
          <View className="flex-row justify-between items-center w-full">
            <TouchableOpacity
              onPress={onGoBack}
              className="w-9 h-9 rounded-full bg-black/60 items-center justify-center border border-white/10"
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View className="flex-row items-center space-x-2">
              {/* Playback Speed Cycler Pill */}
              {onCycleSpeed && (
                <TouchableOpacity
                  onPress={onCycleSpeed}
                  activeOpacity={0.75}
                  className="px-2.5 py-1 rounded-full bg-black/60 border border-white/20 flex-row items-center"
                >
                  <Ionicons
                    name="speedometer-outline"
                    size={12}
                    color="#D4AF37"
                    style={{ marginRight: 4 }}
                  />
                  <Text className="text-white font-bold text-[11px]">
                    {playbackSpeed === 1 ? "1.0x" : `${playbackSpeed}x`}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Locked 10s preview badge */}
              {isLocked && (
                <View className="bg-[#D4AF37] px-2.5 py-1 rounded-full flex-row items-center ml-1.5">
                  <Ionicons name="lock-closed" size={11} color="#141210" />
                  <Text className="text-[#141210] font-black text-[10px] ml-1">
                    Xem thử 10s
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 2. CENTER PLAYBACK CONTROLS: PREV - PLAY/PAUSE - NEXT */}
          <View className="flex-row items-center justify-center space-x-10">
            {/* Previous Episode / Rewind Button */}
            <TouchableOpacity
              onPress={() => handleSeek(displayTime - 10)}
              className="w-12 h-12 rounded-full bg-black/40 items-center justify-center active:scale-90"
              style={{ marginRight: 24 }}
              activeOpacity={0.75}
            >
              <Ionicons
                name="play-skip-back"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {/* YouTube Solid White Play/Pause Button in Translucent Circle */}
            <TouchableOpacity
              onPress={togglePlayPause}
              className="w-16 h-16 rounded-full bg-black/60 items-center justify-center active:scale-95 shadow-2xl"
              activeOpacity={0.85}
            >
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={38}
                color="#FFFFFF"
                style={{ marginLeft: isPlaying ? 0 : 3 }}
              />
            </TouchableOpacity>

            {/* Next Episode / Fast Forward Button */}
            <TouchableOpacity
              onPress={() => (hasNextEpisode && onNextEpisode ? onNextEpisode() : handleSeek(displayTime + 10))}
              className="w-12 h-12 rounded-full bg-black/40 items-center justify-center active:scale-90"
              style={{ marginLeft: 24 }}
              activeOpacity={0.75}
            >
              <Ionicons
                name="play-skip-forward"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {/* 3. BOTTOM TIMELINE SCRUBBER & CURRENT TIME */}
          <View className="w-full space-y-1.5">
            <View className="flex-row justify-between items-center px-1">
              {/* Time Pill Badge */}
              <View className="bg-black/60 px-2.5 py-1 rounded-md flex-row items-center">
                <Text className="text-white font-bold text-xs">
                  {formatTime(displayTime)}
                </Text>
                <Text className="text-zinc-400 font-medium text-xs ml-1">
                  / {formatTime(apiDuration)}
                </Text>
              </View>
            </View>

            {/* Red Scrubber Timeline at the exact bottom */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleProgressBarPress}
              onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
              className="w-full h-3 justify-center"
            >
              <View className="w-full h-[3px] bg-white/30 rounded-full relative">
                <View
                  style={{ width: `${currentProgressPercent}%` }}
                  className="h-full bg-[#FF0000] rounded-full"
                />
                <View
                  style={{
                    position: "absolute",
                    left: `${currentProgressPercent}%`,
                    marginLeft: -5,
                    top: -3.5,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#FF0000",
                    borderWidth: 1.5,
                    borderColor: "#FFFFFF",
                  }}
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
  const insets = useSafeAreaInsets();
  const params = (route.params || {}) as MoviePlayerRouteParams;

  const { user } = useAuth();

  const {
    movieId,
    movieTitle,
    seasonId,
    episodeId: initialEpisodeId,
    episodeIndex: initialIndex = 0,
    episodesList: passedEpisodes = [],
    refreshKey,
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
  const [activeTab, setActiveTab] = useState<
    "recommend" | "comments" | "episodes"
  >("recommend");

  // Video Speed state
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Author / Channel state
  const [creatorInfo, setCreatorInfo] = useState<{
    accountId?: string;
    name?: string;
    avatar?: string;
    followers?: number;
    category?: string;
    averageRating?: number;
    description?: string;
    regionAndGenre?: string;
  }>({});

  const currentEp = episodes[currentIndex];
  const activeEpisodeId = currentEp?.episodeId || initialEpisodeId;
  const { buy } = useContentPurchase();

  // Quick Unlock Modal State
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockModalEpId, setUnlockModalEpId] = useState<string | null>(null);
  const [unlockModalEpTitle, setUnlockModalEpTitle] = useState<
    string | undefined
  >(undefined);
  const [refreshCount, setRefreshCount] = useState(0);

  const handleOpenUnlockModal = useCallback(
    (epId?: string, epTitle?: string) => {
      setUnlockModalEpId(epId || activeEpisodeId || null);
      setUnlockModalEpTitle(epTitle || currentEp?.title || movieTitle);
      setShowUnlockModal(true);
    },
    [activeEpisodeId, currentEp?.title, movieTitle],
  );

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
              d.creator?.name ||
              d.author ||
              "TaleX Official",
            avatar: d.creatorAvatar || d.creator?.avatarUrl,
            followers: d.totalCreatorFollowers ?? 0,
            category: d.category || "PhimBo",
            averageRating: Number(d.averageRating ?? d.rating ?? 5.0),
            description: d.description,
            regionAndGenre: d.regionAndGenre,
          });
        }
      })
      .catch(() => {});
  }, [movieId]);

  const handleCreatorPress = useCallback(() => {
    const targetId = creatorInfo.accountId;
    if (!targetId) {
      Toast.show({
        type: "info",
        text1: "Thông báo",
        text2: "Tác phẩm này chưa liên kết kênh tác giả.",
      });
      return;
    }

    const isMyChannel =
      user?.accountId &&
      String(user.accountId).toLowerCase() === String(targetId).toLowerCase();

    if (isMyChannel) {
      navigation.navigate("CreatorChannel");
    } else {
      navigation.navigate("PublicChannel", { creatorId: targetId });
    }
  }, [creatorInfo, user, navigation]);

  useEffect(() => {
    if (passedEpisodes.length > 0) return;

    const loadEpisodes = async () => {
      let activeSeasonId = seasonId;
      if (!activeSeasonId && movieId) {
        try {
          const seasonRes = await getSeriesSeasons(movieId);
          const seasons = seasonRes?.data || [];
          if (Array.isArray(seasons) && seasons.length > 0) {
            activeSeasonId = seasons[0].seasonId;
          }
        } catch (e) {}
      }

      if (!activeSeasonId) return;

      try {
        const res = await getSeasonEpisodes(activeSeasonId);
        if (res && res.code === 200 && Array.isArray(res.data)) {
          setEpisodes(res.data);
          if (initialEpisodeId) {
            const idx = res.data.findIndex(
              (e: EpisodeItem) => e.episodeId === initialEpisodeId,
            );
            if (idx !== -1) {
              setCurrentIndex(idx);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching season episodes:", err);
      }
    };

    loadEpisodes();
  }, [seasonId, movieId, passedEpisodes, initialEpisodeId]);

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

            const dur =
              data.duration && data.duration > 0 ? data.duration : 900;
            setApiDuration(dur);

            const pType = data.playbackType || "HLS";
            setPlaybackType(pType);

            const locked = Boolean(
              data.isLocked === true ||
              data.isEntitled === false ||
              pType === "MP4",
            );
            setIsLocked(locked);
          } else {
            setPlaybackUrl("https://www.w3schools.com/html/mov_bbb.mp4");
            setApiDuration(900);
            setIsLocked(false);
          }
        })
        .catch((err: any) => {
          if (
            err?.status === 403 ||
            (err?.message && err.message.includes("403"))
          ) {
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
    },
    [user?.accountId],
  );

  useEffect(() => {
    if (activeEpisodeId) {
      fetchPlayback(activeEpisodeId);
    }
  }, [activeEpisodeId, fetchPlayback, refreshKey, refreshCount]);

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

  const [feedRecommendations, setFeedRecommendations] = useState<
    HomeFeedSeries[]
  >([]);
  const [loadingFeedRecs, setLoadingFeedRecs] = useState<boolean>(false);

  const loadFeedRecommendations = useCallback(async () => {
    setLoadingFeedRecs(true);
    try {
      const feed = await getRecommendationFeed({
        pageType: "WATCH",
        limit: 12,
      });
      if (feed && feed.length > 0) {
        const filtered = feed.filter((item: any) => {
          const id = String(item.seriesId || item.id);
          const isDifferent = id !== String(movieId);
          const typeStr = item.contentType ? String(item.contentType).toUpperCase() : "";
          const isNotComic = typeStr !== "COMIC";
          return isDifferent && isNotComic;
        });
        if (filtered.length > 0) {
          setFeedRecommendations(filtered);
          return;
        }
      }
      // Fallback to public series list if feed is empty
      const fallbackRes = await getPublicSeries(1, 15, "VIDEO");
      if (fallbackRes?.data?.content) {
        const filtered = fallbackRes.data.content.filter((item: any) => {
          const id = String(item.seriesId || item.id);
          const isDifferent = id !== String(movieId);
          const typeStr = item.contentType ? String(item.contentType).toUpperCase() : "";
          const isNotComic = typeStr !== "COMIC";
          return isDifferent && isNotComic;
        });
        setFeedRecommendations(filtered as any);
      }
    } catch (err) {
      console.warn("loadFeedRecommendations error:", err);
    } finally {
      setLoadingFeedRecs(false);
    }
  }, [movieId]);

  useEffect(() => {
    loadFeedRecommendations();
  }, [loadFeedRecommendations]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#0F0F0F]">
      <StatusBar barStyle="light-content" translucent />

      {/* ================= 1. EXACT YOUTUBE VIDEO PLAYER FRAME ================= */}
      <View className="w-full h-[225px] bg-black relative justify-center items-center">
        {playbackUrl ? (
          <VideoPlayerCore
            key={playbackUrl}
            videoUrl={playbackUrl}
            apiDuration={apiDuration}
            isLocked={isLocked}
            replayCounter={replayCounter}
            playbackSpeed={playbackSpeed}
            initialPosition={params.initialPosition}
            episodeId={activeEpisodeId}
            onNavigateToPlans={() => handleOpenUnlockModal(activeEpisodeId)}
            onFinishedChange={setIsFinished}
            onCycleSpeed={handleCycleSpeed}
            onNextEpisode={handleNextEpisode}
            hasNextEpisode={currentIndex < episodes.length - 1}
            onGoBack={() => navigation.goBack()}
          />
        ) : paywallEpisodeId && paywallEpisodeId === activeEpisodeId ? (
          <View className="w-full px-6">
            <ContentPaywall
              episodeId={activeEpisodeId}
              itemType="EPISODE"
              title={currentEp?.title || movieTitle}
              priceVnd={currentEp?.priceVnd}
              returnScreen="MoviePlayer"
              contentKind="VIDEO"
              seriesId={movieId}
              onUnlockPress={handleOpenUnlockModal}
            />
          </View>
        ) : !loadingPlayback ? (
          <Text className="text-zinc-400 text-xs">Không có nguồn video</Text>
        ) : null}

        {loadingPlayback && (
          <View className="absolute inset-0 bg-black/75 items-center justify-center space-y-2">
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text className="text-zinc-300 text-xs font-semibold">
              Đang tải luồng video HD...
            </Text>
          </View>
        )}
      </View>

      {/* ================= 2. EXACT YOUTUBE MOBILE BODY CONTENT ================= */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* A. TITLE & STATS ROW (WITH REAL EPISODE NUMBER & TOTAL EPISODES) */}
        <View className="px-4 pt-3 pb-1">
          <Text className="text-white text-base font-bold leading-snug">
            {movieTitle || currentEp?.title}
          </Text>

          <TouchableOpacity onPress={handleCreatorPress} activeOpacity={0.75}>
            <Text className="text-zinc-400 text-xs mt-1">
              @{creatorInfo.name || "TaleX"}{"    "}
              {formatAnalyticNumber(
                currentEp?.analyticData?.likes ?? likeCount ?? 0,
              )}{" "}
              lượt thích{"    "}
              {formatAnalyticNumber(
                currentEp?.analyticData?.views ?? currentEp?.views ?? 0,
              )}{" "}
              lượt xem
            </Text>
          </TouchableOpacity>
        </View>

        {/* B. CHANNEL ROW & 4 ACTION ICONS (EXACT YOUTUBE LAYOUT) */}
        <View className="flex-row items-center justify-between px-4 py-3">
          {/* BÊN TRÁI: AVATAR KÊNH + NÚT ĐĂNG KÝ (FULL CHỮ, KHÔNG BỊ CẮT) */}
          <View className="flex-row items-center flex-1 mr-2">
            <TouchableOpacity
              onPress={handleCreatorPress}
              activeOpacity={0.8}
              className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 mr-2.5"
            >
              {creatorInfo.avatar ? (
                <Image
                  source={{ uri: creatorInfo.avatar }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full items-center justify-center bg-zinc-800">
                  <FontAwesome5 name="user-ninja" size={15} color="#D4AF37" />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCreatorPress}
              activeOpacity={0.8}
              className="mr-2.5 max-w-[120px]"
            >
              <Text className="text-white text-xs font-bold" numberOfLines={1}>
                {creatorInfo.name || "TaleX"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={toggleFollow}
              disabled={isFollowMutating}
              activeOpacity={0.75}
              style={{ minWidth: 84, alignItems: "center", justifyContent: "center" }}
              className={`px-3 py-1.5 rounded-full ${
                isFollowing ? "bg-white/20" : "bg-white"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  isFollowing ? "text-white" : "text-black"
                }`}
                numberOfLines={1}
              >
                {isFollowing ? "Đã đăng ký" : "Đăng ký"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* BÊN PHẢI: 4 ICONS (LIKE, DISLIKE/SAVE, SHARE, DANH SÁCH TẬP) */}
          <View className="flex-row items-center space-x-3">
            {/* Like */}
            <TouchableOpacity
              onPress={toggleLike}
              disabled={isLikeMutating}
              activeOpacity={0.7}
              className="p-1 mr-1"
            >
              <Ionicons
                name={isLiked ? "thumbs-up" : "thumbs-up-outline"}
                size={22}
                color={isLiked ? "#D4AF37" : "#FFFFFF"}
              />
            </TouchableOpacity>

            {/* Save / Bookmark */}
            <TouchableOpacity
              onPress={() => toggleBookmark("VIDEO")}
              disabled={isBookmarkMutating}
              activeOpacity={0.7}
              className="p-1 mr-1"
            >
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={21}
                color={isBookmarked ? "#D4AF37" : "#FFFFFF"}
              />
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity
              onPress={() => {
                Share.share({
                  title: movieTitle || "Phim TaleX",
                  message: `Xem ngay phim ${movieTitle || "TaleX"}!`,
                });
              }}
              activeOpacity={0.7}
              className="p-1 mr-1"
            >
              <Ionicons name="arrow-redo-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Episodes List Button with Count */}
            {episodes.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowEpisodesModal(true)}
                activeOpacity={0.75}
                className="flex-row items-center bg-white/10 px-2.5 py-1 rounded-full border border-white/10"
              >
                <Ionicons name="list" size={16} color="#FFFFFF" />
                <Text className="text-white font-bold text-[11px] ml-1">
                  {episodes.length} tập
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* C. YOUTUBE COMMENTS TEASER BOX (COMPACT & PROPER TERMINOLOGY) */}
        <TouchableOpacity
          onPress={() => setShowCommentsModal(true)}
          activeOpacity={0.8}
          className="mx-4 my-1.5 px-3.5 py-2.5 rounded-xl bg-[#212121] border border-white/5 flex-row items-center justify-between"
        >
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-6 h-6 rounded-full bg-emerald-700 items-center justify-center mr-2">
              <Text className="text-white font-black text-[11px]">
                {(user?.fullName || user?.username || "T")[0].toUpperCase()}
              </Text>
            </View>

            <Text className="text-zinc-400 text-xs flex-1" numberOfLines={1}>
              Bình luận: Viết cảm nghĩ của bạn...
            </Text>
          </View>

          <View className="flex-row items-center">
            <Text className="text-zinc-500 text-[11px] font-bold mr-1">Bình luận</Text>
            <Ionicons name="chevron-forward" size={14} color="#71717A" />
          </View>
        </TouchableOpacity>

        {/* D. COMPACT HORIZONTAL RECOMMENDED VIDEOS (OPTION 1) */}
        <View className="mt-3">
          <View className="flex-row items-center justify-between px-4 pt-2 pb-2.5">
            <Text className="text-white text-sm font-bold tracking-wide">
              Đề xuất cho bạn
            </Text>
            {feedRecommendations.length > 0 && (
              <Text className="text-zinc-500 text-[11px] font-medium">
                {feedRecommendations.length} video
              </Text>
            )}
          </View>

          {loadingFeedRecs && feedRecommendations.length === 0 ? (
            <View className="py-8 items-center justify-center">
              <ActivityIndicator size="small" color="#D4AF37" />
              <Text className="text-zinc-400 text-xs mt-2 font-medium">
                Đang tải danh sách video...
              </Text>
            </View>
          ) : feedRecommendations.length > 0 ? (
            <View className="space-y-1">
              {feedRecommendations.map((rec) => {
                const recId = rec.seriesId || (rec as any).id;
                const recImg =
                  rec.coverUrl || rec.bannerUrl || (rec as any).thumbnailUrl;
                const recRating =
                  rec.averageRating ?? (rec as any).rating ?? 5.0;
                const recViews = rec.views ?? rec.totalViews ?? 0;
                const recCreator =
                  rec.creatorName || creatorInfo.name || "TaleX Official";

                return (
                  <TouchableOpacity
                    key={recId}
                    onPress={() => {
                      navigation.replace("MovieDetailScreen", {
                        movieId: recId,
                        seriesItem: rec,
                      });
                    }}
                    className="flex-row items-center px-4 py-2 active:bg-white/5"
                    activeOpacity={0.75}
                  >
                    {/* Left: Compact 16:9 Thumbnail (130px x 74px) */}
                    <View className="w-[124px] h-[70px] rounded-xl overflow-hidden bg-zinc-800 border border-white/10 relative shadow-sm mr-3">
                      {recImg ? (
                        <Image
                          source={{ uri: recImg }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <Image
                          source={require("@assets/movie2.jpg")}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      )}
                      {/* Rating / HD Badge */}
                      <View className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded-md flex-row items-center border border-white/10">
                        <Ionicons name="star" size={9} color="#D4AF37" />
                        <Text className="text-white text-[9px] font-bold ml-0.5">
                          {Number(recRating).toFixed(1)}
                        </Text>
                      </View>
                    </View>

                    {/* Right: Meta Information */}
                    <View className="flex-1 justify-between py-0.5">
                      <Text
                        className="text-white font-bold text-xs leading-4"
                        numberOfLines={2}
                      >
                        {rec.title}
                      </Text>

                      <View className="mt-1">
                        <Text
                          className="text-zinc-400 text-[11px]"
                          numberOfLines={1}
                        >
                          {recCreator}
                        </Text>
                        <Text
                          className="text-zinc-500 text-[10px] mt-0.5 font-medium"
                          numberOfLines={1}
                        >
                          {formatAnalyticNumber(recViews)} lượt xem · HD
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View className="py-8 items-center justify-center">
              <Text className="text-zinc-500 text-xs">
                Chưa có video đề xuất
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ================= YOUTUBE LIVE CHAT / COMMENTS BOTTOM SHEET MODAL ================= */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)", justifyContent: "flex-end", margin: 0 }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowCommentsModal(false)}
            style={{ flex: 1 }}
          />
          <View
            style={{
              height: screenHeight * 0.82,
              backgroundColor: "#181818",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 16,
              paddingHorizontal: 16,
              paddingBottom: Math.max(insets.bottom, 24),
              borderTopWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between border-b border-white/10 pb-3 mb-3">
              <Text className="text-white font-bold text-base">
                Bình luận tập phim
              </Text>
              <TouchableOpacity
                onPress={() => setShowCommentsModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:scale-95"
              >
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              {activeEpisodeId && (
                <EpisodeCommentsSection episodeId={activeEpisodeId} />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================= 7. EPISODES SELECTION MODAL (Danh Sách Tập Phim Modal) ================= */}
      <Modal
        visible={showEpisodesModal}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setShowEpisodesModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.75)", justifyContent: "flex-end", margin: 0 }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowEpisodesModal(false)}
            style={{ flex: 1 }}
          />
          <View
            style={{
              height: screenHeight * 0.82,
              backgroundColor: "#181818",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 16,
              paddingHorizontal: 16,
              paddingBottom: Math.max(insets.bottom, 24),
              borderTopWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.1)",
            }}
          >
            <View className="flex-row items-center justify-between border-b border-white/10 pb-3 mb-3">
              <Text className="text-white font-bold text-base">
                Danh sách tập phim ({episodes.length})
              </Text>
              <TouchableOpacity
                onPress={() => setShowEpisodesModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center active:scale-95"
              >
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              className="flex-1"
              contentContainerStyle={{ paddingBottom: 30 }}
            >
              <View className="space-y-2.5">
                {episodes.map((ep, idx) => {
                  const isActive = idx === currentIndex;
                  const isPaid = ep.unlockType === "PAID";
                  return (
                    <TouchableOpacity
                      key={ep.episodeId || idx}
                      onPress={() => handleSelectEpisode(idx)}
                      activeOpacity={0.85}
                      className={`flex-row p-3 rounded-2xl border items-center justify-between mb-2.5 ${
                        isActive
                          ? "bg-[#D4AF37]/20 border-[#D4AF37]"
                          : "bg-[#242424] border-white/5"
                      }`}
                    >
                      <View className="flex-row items-center flex-1 mr-2 space-x-3">
                        <View
                          className={`w-8 h-8 rounded-xl items-center justify-center ${isActive ? "bg-[#D4AF37]" : "bg-white/10"}`}
                        >
                          {isActive ? (
                            <Ionicons
                              name="play"
                              size={14}
                              color="#141210"
                              style={{ marginLeft: 1 }}
                            />
                          ) : (
                            <Text className="text-xs font-black text-white">
                              {ep.episodeNumber || idx + 1}
                            </Text>
                          )}
                        </View>

                        <View className="flex-1 ml-2">
                          <Text
                            className={`font-bold text-xs ${isActive ? "text-[#D4AF37]" : "text-white"}`}
                            numberOfLines={1}
                          >
                            Tập {ep.episodeNumber || idx + 1}: {ep.title}
                          </Text>
                        </View>
                      </View>

                      {isPaid ? (
                        <View className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                          <Text className="text-[9px] font-black text-amber-400">
                            Trả phí
                          </Text>
                        </View>
                      ) : (
                        <View className="px-2 py-0.5 rounded bg-green-500/20 border border-green-500/30">
                          <Text className="text-[9px] font-black text-green-400">
                            Miễn phí
                          </Text>
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

      {/* FOLLOWERS MODAL */}
      {creatorInfo.accountId && (
        <FollowersModal
          visible={showFollowersModal}
          creatorAccountId={creatorInfo.accountId}
          onClose={() => setShowFollowersModal(false)}
        />
      )}

      {/* QUICK UNLOCK MODAL */}
      <QuickUnlockModal
        visible={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        episodeId={unlockModalEpId || activeEpisodeId || null}
        episodeTitle={unlockModalEpTitle || currentEp?.title || movieTitle}
        comicTitle={movieTitle}
        contentKind="VIDEO"
        onSuccess={() => {
          setRefreshCount((prev) => prev + 1);
        }}
      />
    </SafeAreaView>
  );
}
