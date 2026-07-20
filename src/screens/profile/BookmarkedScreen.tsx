import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useAuth } from "@/context/AuthContext";
import {
  getMyBookmarkedEpisodes,
  unbookmarkEpisode,
  AccountBookmarkResponse,
} from "@/services/bookmark";
import { getPublicEpisodeDetail } from "@/services/series";

type TabType = "ALL" | "VIDEO" | "COMIC";

export default function BookmarkedScreen({ navigation }: any) {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [bookmarkedList, setBookmarkedList] = useState<AccountBookmarkResponse[]>([]);
  const [contentTypes, setContentTypes] = useState<Record<string, "VIDEO" | "COMIC">>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookmarkedData = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      const res = await getMyBookmarkedEpisodes(0, 100);
      const items = res.content || [];
      setBookmarkedList(items);

      // Fetch contentType for items in parallel if not present
      const typeMap: Record<string, "VIDEO" | "COMIC"> = {};
      await Promise.all(
        items.map(async (item) => {
          const rawType = (item as any).contentType || (item as any).seriesContentType || (item as any).type;
          if (rawType) {
            typeMap[item.episodeId] = String(rawType).toUpperCase() === "COMIC" ? "COMIC" : "VIDEO";
            return;
          }
          try {
            const detailRes = await getPublicEpisodeDetail(item.episodeId);
            const data = detailRes?.data || detailRes;
            const typeStr = String(data?.contentType || data?.type || "").toUpperCase();
            typeMap[item.episodeId] = typeStr === "COMIC" ? "COMIC" : "VIDEO";
          } catch (e) {
            typeMap[item.episodeId] = "VIDEO";
          }
        })
      );
      setContentTypes(typeMap);
    } catch (err: any) {
      console.error("Lỗi lấy danh sách tập đã lưu:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchBookmarkedData();
  }, [fetchBookmarkedData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookmarkedData();
  };

  const handleUnbookmark = (item: AccountBookmarkResponse) => {
    const isComic = contentTypes[item.episodeId] === "COMIC";
    const typeName = isComic ? "chương truyện" : "tập phim";
    const titleText = item.episodeTitle || (item.episodeNumber != null ? `Tập ${item.episodeNumber}` : "");
    const displayTitle = titleText ? `"${titleText}"` : "";

    Alert.alert(
      `Xác nhận bỏ lưu ${typeName}`,
      `Bạn có muốn bỏ ${typeName} ${displayTitle} khỏi danh sách đã lưu không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Bỏ lưu",
          style: "destructive",
          onPress: async () => {
            setBookmarkedList((prev) => prev.filter((i) => i.episodeId !== item.episodeId));
            try {
              await unbookmarkEpisode(item.episodeId);
              Toast.show({
                type: "success",
                text1: `Đã bỏ ${typeName} khỏi danh sách đã lưu.`,
              });
            } catch (err: any) {
              Alert.alert("Lỗi", err.message || `Không thể bỏ lưu ${typeName}.`);
              fetchBookmarkedData();
            }
          },
        },
      ]
    );
  };

  const handleOpenItem = (item: AccountBookmarkResponse) => {
    const type = contentTypes[item.episodeId];
    if (type === "COMIC") {
      navigation.navigate("ComicReader", {
        episodeId: item.episodeId,
        episodeTitle: item.episodeTitle,
      });
    } else {
      navigation.navigate("MovieDetailScreen", { movieId: item.episodeId });
    }
  };

  const videoCount = bookmarkedList.filter(
    (item) => contentTypes[item.episodeId] === "VIDEO"
  ).length;
  const comicCount = bookmarkedList.filter(
    (item) => contentTypes[item.episodeId] === "COMIC"
  ).length;

  const filteredList = bookmarkedList.filter((item) => {
    if (activeTab === "ALL") return true;
    const type = contentTypes[item.episodeId];
    return type === activeTab;
  });

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-[#09090A]">
      <StatusBar barStyle="light-content" backgroundColor="#09090A" />

      {/* HEADER */}
      <View className="h-14 flex-row items-center justify-between px-4 border-b border-white/10">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-1 active:opacity-70"
        >
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-white text-base font-bold flex-1 text-center mr-6">
          Danh Sách Đã Lưu
        </Text>
      </View>

      {/* FILTER TABS */}
      <View className="flex-row px-4 py-3 gap-2 border-b border-white/5 bg-[#141416]">
        <TouchableOpacity
          onPress={() => setActiveTab("ALL")}
          className={`px-4 py-1.5 rounded-full border ${
            activeTab === "ALL"
              ? "bg-[#D4AF37] border-[#D4AF37]"
              : "bg-white/5 border-white/10"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === "ALL" ? "text-black" : "text-stone-300"
            }`}
          >
            Tất cả ({bookmarkedList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("VIDEO")}
          className={`px-4 py-1.5 rounded-full border ${
            activeTab === "VIDEO"
              ? "bg-[#D4AF37] border-[#D4AF37]"
              : "bg-white/5 border-white/10"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === "VIDEO" ? "text-black" : "text-stone-300"
            }`}
          >
            Video ({videoCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("COMIC")}
          className={`px-4 py-1.5 rounded-full border ${
            activeTab === "COMIC"
              ? "bg-[#D4AF37] border-[#D4AF37]"
              : "bg-white/5 border-white/10"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === "COMIC" ? "text-black" : "text-stone-300"
            }`}
          >
            Truyện tranh ({comicCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* LIST CONTENT */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text className="text-zinc-500 text-xs mt-3">Đang tải danh sách đã lưu...</Text>
        </View>
      ) : filteredList.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="bookmark-outline" size={56} color="#444446" />
          <Text className="text-stone-400 font-bold text-base mt-4 text-center">
            Chưa có nội dung nào được lưu
          </Text>
          <Text className="text-zinc-500 text-xs text-center mt-1">
            Bấm nút Lưu trên các tập phim hoặc chương truyện để xem lại tại đây.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item, index) => `${item.episodeId}-${index}`}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isComic = contentTypes[item.episodeId] === "COMIC";
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleOpenItem(item)}
                className="flex-row items-center bg-[#161618] p-3 rounded-xl mb-3 border border-white/5"
              >
                {/* Thumbnail */}
                <View className="w-24 h-16 rounded-lg overflow-hidden bg-zinc-800 relative mr-3">
                  <Image
                    source={
                      item.seriesCoverUrl
                        ? { uri: item.seriesCoverUrl }
                        : require("@assets/icon.png")
                    }
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 bg-black/30 items-center justify-center">
                    {isComic ? (
                      <Feather name="book-open" size={16} color="#D4AF37" />
                    ) : (
                      <Ionicons name="play" size={18} color="#D4AF37" />
                    )}
                  </View>
                </View>

                {/* Details */}
                <View className="flex-1 pr-2">
                  <Text
                    className="text-white font-bold text-sm"
                    numberOfLines={1}
                  >
                    {item.episodeTitle || `Tập ${item.episodeNumber || 1}`}
                  </Text>
                  <Text className="text-[#D4AF37] text-xs font-semibold mt-0.5" numberOfLines={1}>
                    {item.seriesTitle || "Tác phẩm TaleX"}
                  </Text>
                  <Text className="text-zinc-500 text-[11px] mt-1">
                    Đã lưu: {new Date(item.bookmarkedAt).toLocaleDateString("vi-VN")}
                  </Text>
                </View>

                {/* Unbookmark action button */}
                <TouchableOpacity
                  onPress={() => handleUnbookmark(item)}
                  className="p-2 bg-red-500/10 rounded-full active:opacity-70"
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
