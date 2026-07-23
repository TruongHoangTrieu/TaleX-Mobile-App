import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { Feather, FontAwesome } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getEpisodePlayback,
  getSeasonEpisodes,
  EpisodeItem,
} from "@/services/series";
import { useEpisodeLikes } from "@/hooks/useEpisodeLikes";
import { LikeButton } from "@/components/LikeButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ShareButton } from "@/components/ShareButton";
import { LikedUsersModal } from "@/components/LikedUsersModal";

type MoviePlayerRouteParams = {
  movieId?: string;
  movieTitle?: string;
  seasonId?: string;
  episodeId?: string;
  episodeTitle?: string;
  episodeIndex?: number;
  episodesList?: EpisodeItem[];
};

function VideoPlayerCore({
  videoUrl,
  replayCounter,
  onFinishedChange,
}: {
  videoUrl: string;
  replayCounter: number;
  onFinishedChange: (finished: boolean) => void;
}) {
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
    playerInstance.play();
  });

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

export default function MoviePlayerScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = (route.params || {}) as MoviePlayerRouteParams;

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
  const [loadingPlayback, setLoadingPlayback] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [replayCounter, setReplayCounter] = useState(0);
  const [showLikedUsersModal, setShowLikedUsersModal] = useState(false);

  const currentEp = episodes[currentIndex];
  const activeEpisodeId = currentEp?.episodeId || initialEpisodeId;

  const {
    isLiked,
    likeCount,
    toggleLike,
    isMutating: isLikeMutating,
  } = useEpisodeLikes(activeEpisodeId);

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

  const fetchPlayback = useCallback((epId: string) => {
    if (!epId) return;
    setLoadingPlayback(true);
    setIsFinished(false);

    getEpisodePlayback(epId)
      .then((res) => {
        if (res && res.code === 200 && res.data && res.data.playbackUrl) {
          setPlaybackUrl(res.data.playbackUrl);
        } else {
          setPlaybackUrl("https://www.w3schools.com/html/mov_bbb.mp4");
        }
      })
      .catch(() => {
        setPlaybackUrl("https://www.w3schools.com/html/mov_bbb.mp4");
      })
      .finally(() => {
        setLoadingPlayback(false);
      });
  }, []);

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

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#0B0B0C]">
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0C" />

      {/* HEADER */}
      <View className="h-[56px] px-4 flex-row items-center justify-between border-b border-white/5 bg-[#0B0B0C]">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center rounded-full bg-white/5"
          activeOpacity={0.75}
        >
          <Feather name="arrow-left" size={22} color="#E5E0D8" />
        </TouchableOpacity>
        <View className="items-center flex-1 mx-3">
          <Text className="text-[#E5E0D8] text-[15px] font-bold" numberOfLines={1}>
            {movieTitle || "Phim TaleX"}
          </Text>
          {currentEp && (
            <Text className="text-gray-500 text-[11px]" numberOfLines={1}>
              Tập {currentEp.episodeNumber}: {currentEp.title}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("MainTabs")}
          className="w-10 h-10 items-center justify-center rounded-full bg-white/5"
          activeOpacity={0.75}
        >
          <Feather name="home" size={20} color="#E5E0D8" />
        </TouchableOpacity>
      </View>

      {/* VIDEO PLAYER AREA */}
      <View className="w-full h-[220px] bg-black relative justify-center items-center">
        {playbackUrl ? (
          <VideoPlayerCore
            key={playbackUrl}
            videoUrl={playbackUrl}
            replayCounter={replayCounter}
            onFinishedChange={setIsFinished}
          />
        ) : (
          <Text className="text-gray-400 text-xs">Không có nguồn video</Text>
        )}

        {loadingPlayback && (
          <View className="absolute inset-0 bg-black/60 items-center justify-center">
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text className="text-white text-xs mt-2">Đang tải luồng phát...</Text>
          </View>
        )}

        {isFinished && (
          <View className="absolute inset-0 bg-black/80 items-center justify-center gap-3">
            <TouchableOpacity
              onPress={handleReplay}
              className="bg-[#D4AF37] px-5 py-2.5 rounded-full flex-row items-center"
              activeOpacity={0.8}
            >
              <Feather name="rotate-ccw" size={16} color="#141210" />
              <Text className="text-[#141210] font-bold text-sm ml-2">Phát lại</Text>
            </TouchableOpacity>

            {currentIndex < episodes.length - 1 && (
              <TouchableOpacity
                onPress={handleNextEpisode}
                className="bg-white/10 border border-white/20 px-5 py-2 rounded-full flex-row items-center"
                activeOpacity={0.8}
              >
                <Text className="text-white font-bold text-xs mr-1">Tập tiếp theo</Text>
                <Feather name="skip-forward" size={14} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* MAIN BODY */}
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* EPISODE TITLE & CONTROLS */}
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-white text-[18px] font-black leading-tight">
              {currentEp?.title || `Tập ${currentIndex + 1}`}
            </Text>
            <Text className="text-gray-500 text-[12px] mt-1">
              {movieTitle} {currentEp?.episodeNumber ? `• Tập ${currentEp.episodeNumber}` : ""}
            </Text>
          </View>

          {/* PREV / NEXT BUTTONS */}
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={handlePrevEpisode}
              disabled={currentIndex === 0}
              className={`w-9 h-9 rounded-full items-center justify-center border ${
                currentIndex === 0
                  ? "bg-white/[0.02] border-white/5 opacity-40"
                  : "bg-white/5 border-white/10"
              }`}
              activeOpacity={0.75}
            >
              <Feather name="skip-back" size={16} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNextEpisode}
              disabled={currentIndex >= episodes.length - 1}
              className={`w-9 h-9 rounded-full items-center justify-center border ${
                currentIndex >= episodes.length - 1
                  ? "bg-white/[0.02] border-white/5 opacity-40"
                  : "bg-[#D4AF37] border-[#D4AF37]"
              }`}
              activeOpacity={0.75}
            >
              <Feather name="skip-forward" size={16} color={currentIndex >= episodes.length - 1 ? "#fff" : "#000"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* SOCIAL ACTION BUTTONS */}
        <View className="flex-row items-center flex-wrap gap-2 mt-4 pb-4 border-b border-white/5">
          <LikeButton
            isLiked={isLiked}
            likeCount={likeCount}
            onLikeToggle={toggleLike}
            isMutating={isLikeMutating}
            size="medium"
          />

          <BookmarkButton
            episodeId={activeEpisodeId}
            contentType="VIDEO"
            size="md"
            showLabel
          />
          <ShareButton
            episodeId={activeEpisodeId}
            title={`${movieTitle || "Phim"} - ${currentEp?.title || "Tập phim"}`}
            size="md"
            showLabel
          />
          {activeEpisodeId && (
            <TouchableOpacity
              onPress={() => setShowLikedUsersModal(true)}
              className="flex-row items-center px-3.5 py-2.5 rounded-full bg-white/[0.04] border border-white/10"
            >
              <Feather name="users" size={14} color="#E5E0D8" />
              <Text className="text-[#E5E0D8] text-xs font-bold ml-1.5">Lượt thích</Text>
            </TouchableOpacity>
          )}
        </View>

        {activeEpisodeId && (
          <LikedUsersModal
            visible={showLikedUsersModal}
            episodeId={activeEpisodeId}
            onClose={() => setShowLikedUsersModal(false)}
          />
        )}

        {/* EPISODE DESCRIPTION */}
        {currentEp?.description ? (
          <View className="py-4 border-b border-white/5">
            <Text className="text-[#E5E0D8] text-[14px] font-bold mb-1">Mô tả tập phim</Text>
            <Text className="text-gray-400 text-[13px] leading-5">{currentEp.description}</Text>
          </View>
        ) : null}

        {/* EPISODES SELECTOR SECTION */}
        <View className="mt-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-[#E5E0D8] text-[16px] font-bold">
              Danh sách tập ({episodes.length})
            </Text>
            <Text className="text-gray-500 text-[11px]">Bấm vào để chọn tập</Text>
          </View>

          <View className="gap-2.5">
            {episodes.map((ep, idx) => {
              const isActive = idx === currentIndex;
              const isPaid = ep.unlockType === "PAID";
              return (
                <TouchableOpacity
                  key={ep.episodeId || idx}
                  onPress={() => handleSelectEpisode(idx)}
                  activeOpacity={0.75}
                  className={`flex-row p-3 rounded-2xl border items-center justify-between ${
                    isActive
                      ? "bg-[#D4AF37]/15 border-[#D4AF37]"
                      : "bg-white/[0.02] border-white/5"
                  }`}
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isActive ? "bg-[#D4AF37]" : "bg-white/5"}`}>
                      <Text className={`text-xs font-black ${isActive ? "text-black" : "text-gray-400"}`}>
                        {ep.episodeNumber || idx + 1}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className={`font-bold text-[13px] ${isActive ? "text-[#D4AF37]" : "text-white"}`} numberOfLines={1}>
                        {ep.title || `Tập ${ep.episodeNumber || idx + 1}`}
                      </Text>
                      {ep.description ? (
                        <Text className="text-gray-500 text-[11px] mt-0.5" numberOfLines={1}>
                          {ep.description}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2">
                    {isPaid ? (
                      <View className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                        <Text className="text-[9px] font-black text-amber-400">Trả phí</Text>
                      </View>
                    ) : null}
                    <Feather
                      name={isActive ? (isFinished ? "rotate-ccw" : "pause") : "play"}
                      size={16}
                      color={isActive ? "#D4AF37" : "#71717a"}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
