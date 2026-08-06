import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { useAuth } from "@/context/AuthContext";
import {
  getMyLikedEpisodes,
  unlikeEpisode,
  AccountLikeResponse,
} from "@/services/like";
import { getPublicEpisodeDetail } from "@/services/series";

type TabType = "ALL" | "VIDEO" | "COMIC";

export default function LikedScreen() {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [likedList, setLikedList] = useState<AccountLikeResponse[]>([]);
  const [contentTypes, setContentTypes] = useState<Record<string, "VIDEO" | "COMIC">>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLikedData = useCallback(async () => {
    if (!isAuthenticated) {
      setLikedList([]);
      setLoading(false);
      return;
    }

    try {
      const res = await getMyLikedEpisodes(0, 100);
      const items = res.content || [];
      setLikedList(items);

      // Fetch contentType for items in parallel
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
      console.error("Lỗi lấy danh sách tập đã thích:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchLikedData();
  }, [fetchLikedData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLikedData();
  };

  const handleUnlike = (item: AccountLikeResponse) => {
    const isComic = contentTypes[item.episodeId] === "COMIC";
    const typeName = isComic ? "chương truyện" : "tập phim";
    const titleText = item.episodeTitle || (item.episodeNumber != null ? `Tập ${item.episodeNumber}` : "");
    const displayTitle = titleText ? `"${titleText}"` : "";

    Alert.alert(
      `Xác nhận bỏ thích ${typeName}`,
      `Bạn có muốn bỏ ${typeName} ${displayTitle} khỏi danh sách yêu thích không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Bỏ thích",
          style: "destructive",
          onPress: async () => {
            setLikedList((prev) => prev.filter((i) => i.episodeId !== item.episodeId));
            try {
              await unlikeEpisode(item.episodeId);
              Toast.show({
                type: "success",
                text1: `Đã bỏ ${typeName} khỏi danh sách yêu thích.`,
              });
            } catch (err: any) {
              Alert.alert("Lỗi", err.message || `Không thể bỏ thích ${typeName}.`);
              fetchLikedData();
            }
          },
        },
      ]
    );
  };

  const handleOpenItem = async (item: AccountLikeResponse) => {
    const type = contentTypes[item.episodeId];
    if (type === "COMIC") {
      navigation.navigate("ComicReader", { episodeId: item.episodeId, episodeTitle: item.episodeTitle });
    } else {
      navigation.navigate("MovieDetailScreen", { movieId: item.episodeId });
    }
  };

  const videoCount = likedList.filter((item) => contentTypes[item.episodeId] === "VIDEO").length;
  const comicCount = likedList.filter((item) => contentTypes[item.episodeId] === "COMIC").length;

  const filteredList = likedList.filter((item) => {
    if (activeTab === "ALL") return true;
    const type = contentTypes[item.episodeId] || "VIDEO";
    return type === activeTab;
  });

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
          Đã Yêu Thích
        </Text>
        <View className="w-10" />
      </View>

      {/* TABS WITH COUNTS */}
      <View className="flex-row items-center px-4 py-3 border-b border-white/5">
        {(["ALL", "VIDEO", "COMIC"] as TabType[]).map((tab) => {
          const isSelected = activeTab === tab;
          const label =
            tab === "ALL"
              ? `Tất cả (${likedList.length})`
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
          <Text className="text-zinc-500 text-xs mt-3">Đang tải nội dung đã thích...</Text>
        </View>
      ) : !isAuthenticated ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="heart-dislike-outline" size={48} color="#7C766B" />
          <Text className="text-white font-bold text-base mt-4 text-center">
            Bạn chưa đăng nhập
          </Text>
          <Text className="text-zinc-500 text-xs text-center mt-2">
            Đăng nhập để xem danh sách các video và truyện tranh bạn đã thả tim!
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("LoginScreen")}
            className="mt-6 bg-[#D4AF37] px-6 py-3 rounded-full"
          >
            <Text className="text-[#141210] font-bold text-sm">Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      ) : filteredList.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <FontAwesome name="heart-o" size={48} color="#3F3F46" />
          <Text className="text-zinc-400 font-bold text-base mt-4 text-center">
            Chưa có nội dung yêu thích
          </Text>
          <Text className="text-zinc-600 text-xs text-center mt-1">
            Hãy khám phá các tác phẩm hay và thả tim tập bạn yêu thích nhé.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item, index) => item.episodeId || index.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#D4AF37"
            />
          }
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const itemType = contentTypes[item.episodeId];
            return (
              <TouchableOpacity
                onPress={() => handleOpenItem(item)}
                activeOpacity={0.85}
                className="bg-[#1C1A17] p-3 rounded-2xl mb-3 flex-row items-center border border-white/5"
              >
                {/* Cover / Thumbnail */}
                <View className="w-[100px] h-[64px] rounded-xl bg-zinc-800 overflow-hidden mr-3 justify-center items-center relative">
                  <Image
                    source={
                      item.seriesCoverUrl
                        ? { uri: item.seriesCoverUrl }
                        : require("@assets/movie2.jpg")
                    }
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>

                {/* Info */}
                <View className="flex-1 mr-2">
                  <Text className="text-white font-bold text-sm" numberOfLines={1}>
                    {item.episodeTitle || `Tập ${item.episodeNumber || ""}`}
                  </Text>
                  {item.seriesTitle && (
                    <Text className="text-[#D4AF37] text-xs font-semibold mt-0.5" numberOfLines={1}>
                      {item.seriesTitle}
                    </Text>
                  )}
                  {item.likedAt && (
                    <Text className="text-zinc-500 text-[10px] mt-1">
                      Đã thích: {new Date(item.likedAt).toLocaleDateString("vi-VN")}
                    </Text>
                  )}
                </View>

                {/* Action button: Trash/Unlike */}
                <TouchableOpacity
                  onPress={() => handleUnlike(item)}
                  className="p-2 rounded-full bg-red-500/10 active:bg-red-500/20"
                >
                  <FontAwesome name="heart" size={16} color="#EF4444" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
