import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";
import {
  getRecentWatchSessions,
  WatchSessionItem,
} from "@/services/watchSession";
import { getPublicSeriesDetail, SeriesItem } from "@/services/series";

type TabType = "ALL" | "VIDEO" | "COMIC";

/**
 * Định dạng số giây sang định dạng mm:ss hoặc hh:mm:ss
 */
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

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${mins} ${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [sessions, setSessions] = useState<WatchSessionItem[]>([]);
  const [seriesMap, setSeriesMap] = useState<Record<string, SeriesItem>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistoryData = useCallback(async () => {
    if (!isAuthenticated) {
      setSessions([]);
      setSeriesMap({});
      setLoading(false);
      return;
    }

    try {
      const res = await getRecentWatchSessions(0, 50, ["updatedAt,DESC"]);
      const contentList = res.content || [];
      setSessions(contentList);

      // Collect unique seriesIds to fetch fallback thumbnails & series titles
      const seriesIds = Array.from(
        new Set(
          contentList
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
            // ignore error for single series fetch
          }
        })
      );
      setSeriesMap(map);
    } catch (err: any) {
      console.error("Lỗi lấy lịch sử xem:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchHistoryData();
  }, [fetchHistoryData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchHistoryData();
  };

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

  const videoCount = useMemo(
    () => sessions.filter((item) => String(item.episode?.contentType).toUpperCase() !== "COMIC").length,
    [sessions]
  );

  const comicCount = useMemo(
    () => sessions.filter((item) => String(item.episode?.contentType).toUpperCase() === "COMIC").length,
    [sessions]
  );

  const filteredSessions = useMemo(() => {
    return sessions.filter((item) => {
      if (activeTab === "ALL") return true;
      const isComic = String(item.episode?.contentType).toUpperCase() === "COMIC";
      return activeTab === "COMIC" ? isComic : !isComic;
    });
  }, [sessions, activeTab]);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#141210]">
      <StatusBar barStyle="light-content" backgroundColor="#141210" />

      {/* HEADER */}
      <View className="h-[56px] px-4 flex-row items-center justify-between border-b border-white/5">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center rounded-full bg-[#252830]"
          activeOpacity={0.75}
        >
          <Feather name="arrow-left" size={22} color="#E5E0D8" />
        </TouchableOpacity>
        <Text className="text-[#E5E0D8] text-[18px] font-bold">
          Lịch Sử Xem
        </Text>
        <View className="w-10" />
      </View>

      {/* TABS WITH COUNTS */}
      <View className="flex-row items-center px-4 py-3 border-b border-white/5">
        {(["ALL", "VIDEO", "COMIC"] as TabType[]).map((tab) => {
          const isSelected = activeTab === tab;
          const label =
            tab === "ALL"
              ? `Tất cả (${sessions.length})`
              : tab === "VIDEO"
              ? `Video (${videoCount})`
              : `Truyện tranh (${comicCount})`;

          return (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full mr-2.5 border ${
                isSelected
                  ? "bg-[#D4AF37] border-[#D4AF37]"
                  : "bg-[#252830] border-white/5"
              }`}
              activeOpacity={0.8}
            >
              <Text
                className={`text-xs font-bold ${
                  isSelected ? "text-[#141210]" : "text-[#E5E0D8]"
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* CONTENT LIST */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text className="text-zinc-500 text-xs mt-3">Đang tải lịch sử xem...</Text>
        </View>
      ) : !isAuthenticated ? (
        <View className="flex-1 items-center justify-center px-6">
          <MaterialCommunityIcons name="history" size={48} color="#7C766B" />
          <Text className="text-white font-bold text-base mt-4 text-center">
            Bạn chưa đăng nhập
          </Text>
          <Text className="text-zinc-500 text-xs text-center mt-2">
            Đăng nhập để theo dõi tiến độ xem phim và đọc truyện của bạn trên mọi thiết bị!
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("LoginScreen")}
            className="mt-6 bg-[#D4AF37] px-6 py-3 rounded-full"
          >
            <Text className="text-[#141210] font-bold text-sm">Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      ) : filteredSessions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <MaterialCommunityIcons name="history" size={48} color="#3F3F46" />
          <Text className="text-zinc-400 font-bold text-base mt-4 text-center">
            Chưa có lịch sử xem
          </Text>
          <Text className="text-zinc-600 text-xs text-center mt-1">
            Các tập phim và chương truyện bạn đã xem gần đây sẽ xuất hiện tại đây.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          keyExtractor={(item) => item.id || item.episode?.episodeId || String(Math.random())}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#D4AF37"
            />
          }
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const ep = item.episode;
            if (!ep) return null;
            const isComic = String(ep.contentType).toUpperCase() === "COMIC";
            const seriesInfo = seriesMap[ep.seriesId];

            // Image fallback: ep.thumbnail -> series coverUrl -> series bannerUrl -> series thumbnailUrl
            const imageUri =
              ep.thumbnail ||
              seriesInfo?.coverUrl ||
              seriesInfo?.bannerUrl ||
              seriesInfo?.thumbnailUrl ||
              undefined;

            // Episode title label
            const epNumberPrefix = ep.episodeNumber != null
              ? (isComic ? `Chương ${ep.episodeNumber}` : `Tập ${ep.episodeNumber}`)
              : "";
            const displayTitle = ep.title
              ? (epNumberPrefix ? `${epNumberPrefix}: ${ep.title}` : ep.title)
              : (epNumberPrefix || "Không có tiêu đề");

            // Series title label
            const displaySeriesTitle = seriesInfo?.title || (isComic ? "Truyện tranh" : "Phim bộ");

            // Progress text:
            // For COMIC: if currentPosition > 0 => Trang X, else => Đã đọc mm:ss
            // For VIDEO: if currentPosition > 0 => Đã xem mm:ss (vị trí hiện tại), else => watchDuration
            let progressText = "";
            if (isComic) {
              if (item.currentPosition && item.currentPosition > 0) {
                progressText = `Trang ${Math.round(item.currentPosition)}`;
              } else if (item.watchDuration && item.watchDuration > 0) {
                progressText = `Đã đọc ${formatWatchTime(item.watchDuration)}`;
              } else {
                progressText = `Chưa đọc`;
              }
            } else {
              const watchPos = (item.currentPosition && item.currentPosition > 0)
                ? item.currentPosition
                : item.watchDuration;
              if (watchPos && watchPos > 0) {
                progressText = `Đã xem ${formatWatchTime(watchPos)}`;
              } else {
                progressText = `Chưa xem`;
              }
            }

            return (
              <TouchableOpacity
                onPress={() => handleOpenItem(item)}
                activeOpacity={0.85}
                className="bg-[#1C1A17] p-3 rounded-2xl mb-3 flex-row items-center border border-white/5"
              >
                {/* Cover / Thumbnail */}
                <View className="w-[100px] h-[64px] rounded-xl bg-zinc-800 overflow-hidden mr-3 justify-center items-center relative">
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
                        size={22}
                        color="#71717A"
                      />
                    </View>
                  )}
                </View>

                {/* Info */}
                <View className="flex-1 mr-2 justify-center">
                  <Text className="text-[#D4AF37] text-[11px] font-semibold mb-0.5" numberOfLines={1}>
                    {displaySeriesTitle}
                  </Text>
                  <Text className="text-white font-bold text-sm" numberOfLines={1}>
                    {displayTitle}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-zinc-400 text-[11px]">
                      {progressText}
                    </Text>
                    {item.updatedAt ? (
                      <Text className="text-zinc-500 text-[10px] ml-2">
                        • {formatDate(item.updatedAt)}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Play/Read Action Icon */}
                <View className="w-8 h-8 rounded-full bg-[#D4AF37]/10 items-center justify-center">
                  <Ionicons
                    name={isComic ? "book-outline" : "play-sharp"}
                    size={14}
                    color="#D4AF37"
                  />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
