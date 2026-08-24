import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";
import {
  getRecentWatchSessions,
  WatchSessionItem,
} from "@/services/watchSession";
import { getPublicSeriesDetail, SeriesItem } from "@/services/series";

interface RecentWatchSectionProps {
  filterType?: "ALL" | "VIDEO" | "COMIC";
  title?: string;
}

function formatWatchTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "00:00";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function RecentWatchSection({
  filterType = "ALL",
  title,
}: RecentWatchSectionProps) {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuth();

  const [sessions, setSessions] = useState<WatchSessionItem[]>([]);
  const [seriesMap, setSeriesMap] = useState<Record<string, SeriesItem>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRecentSessions = useCallback(async () => {
    if (!isAuthenticated) {
      setSessions([]);
      setSeriesMap({});
      setLoading(false);
      return;
    }

    try {
      const res = await getRecentWatchSessions(0, 15, ["updatedAt,DESC"]);
      const contentList = res.content || [];

      // Filter by type if needed
      const filtered = contentList.filter((item) => {
        const isComic = String(item.episode?.contentType).toUpperCase() === "COMIC";
        if (filterType === "VIDEO") return !isComic;
        if (filterType === "COMIC") return isComic;
        return true;
      });

      setSessions(filtered);

      // Collect seriesIds to fetch fallback posters/covers if thumbnail is null
      const seriesIds = Array.from(
        new Set(
          filtered
            .map((item) => item.episode?.seriesId)
            .filter((id): id is string => Boolean(id))
        )
      );

      const map: Record<string, SeriesItem> = {};
      await Promise.all(
        seriesIds.map(async (seriesId) => {
          try {
            const detailRes = await getPublicSeriesDetail(seriesId);
            const seriesData = detailRes?.data || detailRes;
            if (seriesData && (seriesData.id || seriesData.seriesId || seriesData.title)) {
              map[seriesId] = seriesData;
            }
          } catch {
            // ignore fetch error
          }
        })
      );
      setSeriesMap(map);
    } catch (err) {
      console.error("Lỗi tải tiếp tục xem/đọc:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filterType]);

  useFocusEffect(
    useCallback(() => {
      fetchRecentSessions();
    }, [fetchRecentSessions])
  );

  if (!isAuthenticated || (!loading && sessions.length === 0)) {
    return null;
  }

  const sectionTitle =
    title ||
    (filterType === "VIDEO"
      ? "Tiếp Tục Xem Phim"
      : filterType === "COMIC"
      ? "Tiếp Tục Đọc Truyện"
      : "Tiếp Tục Xem & Đọc");

  const handleOpenItem = (item: WatchSessionItem) => {
    const ep = item.episode;
    if (!ep) return;
    const isComic = String(ep.contentType).toUpperCase() === "COMIC";
    const seriesId = ep.seriesId || ep.episodeId;
    const epTitle = ep.title || (ep.episodeNumber ? (isComic ? `Chương ${ep.episodeNumber}` : `Tập ${ep.episodeNumber}`) : "");

    if (isComic) {
      navigation.navigate("ComicReader", {
        comicId: seriesId,
        episodeId: ep.episodeId,
        episodeTitle: epTitle,
        initialPosition: item.currentPosition,
      });
    } else {
      navigation.navigate("MoviePlayer", {
        movieId: seriesId,
        seasonId: ep.seasonId || undefined,
        episodeId: ep.episodeId,
        episodeTitle: epTitle,
        initialPosition: item.currentPosition,
      });
    }
  };

  return (
    <View className="mt-5 mb-2">
      {/* SECTION HEADER */}
      <View className="flex-row items-center justify-between px-4 mb-3">
        <View className="flex-row items-center">
          <View className="w-7 h-7 rounded-full bg-[#D4AF37]/15 items-center justify-center mr-2 border border-[#D4AF37]/30">
            <Ionicons
              name={filterType === "COMIC" ? "book" : "play"}
              size={14}
              color="#D4AF37"
            />
          </View>
          <Text className="text-white text-base font-bold tracking-wide">
            {sectionTitle}
          </Text>
        </View>
      </View>

      {/* HORIZONTAL LIST */}
      {loading ? (
        <View className="h-[140px] items-center justify-center">
          <ActivityIndicator size="small" color="#D4AF37" />
        </View>
      ) : (
        <FlatList
          horizontal
          data={sessions}
          keyExtractor={(item, idx) => item.id || item.episode?.episodeId || String(idx)}
          showsHorizontalScrollIndicator={false}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={3}
          removeClippedSubviews={true}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            const ep = item.episode;
            if (!ep) return null;
            const isComic = String(ep.contentType).toUpperCase() === "COMIC";
            const seriesInfo = seriesMap[ep.seriesId];

            // Image fallback: series coverUrl is preferred for 2:3 vertical poster cards!
            const imageUri =
              seriesInfo?.coverUrl ||
              ep.thumbnail ||
              seriesInfo?.bannerUrl ||
              seriesInfo?.thumbnailUrl ||
              undefined;

            const epNumberPrefix = ep.episodeNumber != null
              ? (isComic ? `Chương ${ep.episodeNumber}` : `Tập ${ep.episodeNumber}`)
              : "";
            const displayTitle = ep.title
              ? (epNumberPrefix ? `${epNumberPrefix}: ${ep.title}` : ep.title)
              : (epNumberPrefix || "Không có tiêu đề");

            let progressText = "";
            if (isComic) {
              if (item.currentPosition && item.currentPosition > 0) {
                progressText = `Trang ${Math.round(item.currentPosition)}`;
              } else if (item.watchDuration && item.watchDuration > 0) {
                progressText = `Đã đọc ${formatWatchTime(item.watchDuration)}`;
              } else {
                progressText = `Đã đọc`;
              }
            } else {
              const watchPos = item.currentPosition && item.currentPosition > 0 ? item.currentPosition : item.watchDuration;
              if (watchPos && watchPos > 0) {
                progressText = `Đã xem ${formatWatchTime(watchPos)}`;
              } else {
                progressText = `Đã xem`;
              }
            }

            const cardWidthClass = filterType === "VIDEO" ? "w-[135px]" : "w-[140px]";
            const cardHeightClass = filterType === "VIDEO" ? "h-[180px]" : filterType === "COMIC" ? "h-[185px]" : "h-[195px]";
            const marginClass = filterType === "VIDEO" ? "mr-4" : "mr-3.5";

            return (
              <TouchableOpacity
                onPress={() => handleOpenItem(item)}
                activeOpacity={0.85}
                className={`${marginClass} ${cardWidthClass}`}
              >
                {/* Poster / Thumbnail Box - Synchronized with page cards */}
                <View className={`w-full ${cardHeightClass} rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 relative mb-2 shadow-xl`}>
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full bg-zinc-800 items-center justify-center">
                      <Feather
                        name={isComic ? "book-open" : "film"}
                        size={26}
                        color="#71717A"
                      />
                    </View>
                  )}

                  {/* Bottom Progress Bar Indicator */}
                  <View className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/70">
                    <View
                      className="h-full bg-[#D4AF37] rounded-r-full"
                      style={{ width: "65%" }}
                    />
                  </View>
                </View>

                {/* Series Title / Episode Title */}
                <Text className="text-stone-100 font-bold text-xs mt-0.5 px-0.5" numberOfLines={1}>
                  {seriesInfo?.title || displayTitle}
                </Text>

                {/* Progress Text Subtitle */}
                <Text className="text-[#7C766B] text-[10px] font-semibold mt-0.5 px-0.5" numberOfLines={1}>
                  {displayTitle !== seriesInfo?.title ? displayTitle + " • " : ""}{progressText}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}
