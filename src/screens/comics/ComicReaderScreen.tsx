import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getComicById } from "./comicMockData";
import { getPublicEpisodeMedia, getSeriesSeasons, getSeasonEpisodes, getPublicSeriesDetail } from "@/services/series";
import { useEpisodeLikes } from "@/hooks/useEpisodeLikes";
import { LikeButton } from "@/components/LikeButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ShareButton } from "@/components/ShareButton";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Mock trang truyện tranh lấy từ assets
const comicPagesMock = [
  require("@assets/comic1.webp"),
  require("@assets/comic2.webp"),
  require("@assets/comic3.webp"),
  require("@assets/comic4.webp"),
  require("@assets/comic5.webp"),
  require("@assets/comic6.webp"),
  require("@assets/comic7.webp"),
  require("@assets/comic2.webp"),
  require("@assets/comic3.webp"),
  require("@assets/comic5.webp"),
  require("@assets/comic1.webp"),
  require("@assets/comic6.webp"),
  require("@assets/comic4.webp"),
  require("@assets/comic7.webp"),
  require("@assets/comic3.webp"),
  require("@assets/comic2.webp"),
  require("@assets/comic5.webp"),
  require("@assets/comic1.webp"),
];

import { useAuth } from "@/context/AuthContext";

export default function ComicReaderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const {
    comicId,
    chapterTitle,
    episodeTitle,
    episodeIndex = 0,
    episodeId,
  } = route.params || {};

  const isMock = !comicId || comicId.length < 10;
  const [comicTitleState, setComicTitleState] = useState(route.params?.comicTitle || "Truyện Tranh");

  const comic = (isMock && getComicById(comicId)) ? getComicById(comicId) : {
    id: comicId,
    title: comicTitleState,
    chapters: [],
  };

  // States
  const [showControls, setShowControls] = useState(true);
  const [readingMode, setReadingMode] = useState<"vertical" | "horizontal">(
    "vertical",
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [pages, setPages] = useState<any[]>(comicPagesMock);
  const [loading, setLoading] = useState(false);
  const [dbEpisodes, setDbEpisodes] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Fetch real media pages if episodeId is passed
  useEffect(() => {
    if (episodeId) {
      setLoading(true);
      setErrorMsg(null);
      getPublicEpisodeMedia(episodeId, user?.accountId)
        .then((res) => {
          const data = res.data || res;
          if (data && data.length > 0) {
            const sorted = [...data].sort(
              (a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
            );
            setPages(sorted.map((m) => m.fileUrl || ""));
          }
        })
        .catch((err: any) => {
          console.error("Lỗi tải trang truyện từ API:", err);
          if (err.status === 403 || (err.message && err.message.includes("403"))) {
            setErrorMsg("Tập truyện này là nội dung trả phí hoặc yêu cầu quyền truy cập. Vui lòng mở khóa hoặc sở hữu gói trước khi đọc.");
          } else {
            setErrorMsg(err.message || "Lỗi tải trang truyện. Vui lòng thử lại sau.");
          }
        })
        .finally(() => setLoading(false));
    }
  }, [episodeId, user?.accountId]);

  // Load real episodes structure if it is a database comic (id length >= 10)
  useEffect(() => {
    if (isMock) {
      return;
    }

    const loadRealEpisodes = async () => {
      try {
        getPublicSeriesDetail(comicId)
          .then((res) => {
            if (res && res.code === 200 && res.data?.title) {
              setComicTitleState(res.data.title);
            }
          })
          .catch((err) => console.error("Lỗi lấy chi tiết series trong Reader:", err));

        const seasonsRes = await getSeriesSeasons(comicId);
        if (seasonsRes && seasonsRes.code === 200 && seasonsRes.data) {
          const fetchedEps: any[] = [];
          // Fetch episodes for all seasons in parallel
          await Promise.all(
            seasonsRes.data.map(async (se) => {
              try {
                const epRes = await getSeasonEpisodes(se.seasonId);
                if (epRes && epRes.code === 200 && epRes.data) {
                  epRes.data.forEach((ep, idx) => {
                    fetchedEps.push({
                      chapterTitle: `Season ${se.seasonNumber}`,
                      title: ep.title || `Chương ${ep.episodeNumber}`,
                      index: idx,
                      episodeId: ep.episodeId,
                      episodeNumber: ep.episodeNumber,
                      seasonNumber: se.seasonNumber,
                    });
                  });
                }
              } catch (err) {
                console.error("Lỗi lấy tập của season trong Reader:", err);
              }
            })
          );
          // Sort episodes by season number and episode number
          fetchedEps.sort((a, b) => {
            if (a.seasonNumber !== b.seasonNumber) {
              return a.seasonNumber - b.seasonNumber;
            }
            return a.episodeNumber - b.episodeNumber;
          });
          setDbEpisodes(fetchedEps);
        }
      } catch (err) {
        console.error("Lỗi tải seasons/episodes trong Reader:", err);
      }
    };

    loadRealEpisodes();
  }, [comicId]);

  const getPageSource = (page: any) => {
    if (typeof page === "string") {
      return { uri: page };
    }
    if (page && page.uri) {
      return { uri: page.uri };
    }
    return page;
  };

  // Lấy tất cả tập con (episodes) phẳng của toàn bộ truyện để chuyển tập nhanh
  const allEpisodes: { chapterTitle: string; title: string; index: number; episodeId?: string }[] = isMock
    ? (() => {
        const list: any[] = [];
        if (comic && comic.chapters) {
          comic.chapters.forEach((chap) => {
            if (chap.episodes) {
              chap.episodes.forEach((ep, idx) => {
                list.push({
                  chapterTitle: chap.title,
                  title: ep,
                  index: idx,
                });
              });
            }
          });
        }
        return list;
      })()
    : dbEpisodes;

  const currentEpisodeIdx =
    allEpisodes.findIndex((e) => e.title === episodeTitle || e.episodeId === episodeId) !== -1
      ? allEpisodes.findIndex((e) => e.title === episodeTitle || e.episodeId === episodeId)
      : 0;

  const currentEp = allEpisodes[currentEpisodeIdx] || allEpisodes[0] || {};
  const activeEpId = currentEp?.episodeId || episodeId;
  const { isLiked, likeCount, toggleLike, isMutating: isLikeMutating } = useEpisodeLikes(activeEpId);

  // Chuyển tập tiếp theo hoặc tập trước
  const navigateEpisode = (direction: "prev" | "next") => {
    let nextIdx = currentEpisodeIdx;
    if (direction === "prev" && currentEpisodeIdx > 0) {
      nextIdx = currentEpisodeIdx - 1;
    } else if (
      direction === "next" &&
      currentEpisodeIdx < allEpisodes.length - 1
    ) {
      nextIdx = currentEpisodeIdx + 1;
    }

    if (nextIdx !== currentEpisodeIdx) {
      const targetEp = allEpisodes[nextIdx];
      // Reset trang đọc
      setCurrentPage(0);
      flatListRef.current?.scrollToIndex({ index: 0, animated: false });
      scrollRef.current?.scrollTo({ y: 0, animated: false });

      navigation.replace("ComicReader", {
        comicId,
        comicTitle: comicTitleState,
        chapterTitle: targetEp.chapterTitle,
        episodeTitle: targetEp.title,
        episodeIndex: targetEp.index,
        episodeId: targetEp.episodeId,
      });
    }
  };

  // Xử lý sự kiện vuốt ngang thay đổi trang
  const handleHorizontalScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (roundIndex !== currentPage) {
      setCurrentPage(roundIndex);
    }
  };

  // Nhấn vào giữa màn hình để hiển thị/ẩn thanh công cụ
  const toggleControls = () => {
    setShowControls(!showControls);
  };

  return (
    <View className="flex-1 bg-[#09090A]">
      <StatusBar
        hidden={!showControls}
        barStyle="light-content"
        backgroundColor="#09090A"
      />

      {/* HEADER OVERLAY */}
      {showControls && (
        <View
          className="absolute top-0 left-0 right-0 bg-[#141416]/95 flex-row items-center justify-between px-4 z-50 border-b border-white/5 shadow-md"
          style={{ paddingTop: insets.top, height: 56 + insets.top }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-1 active:opacity-70"
          >
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View className="items-center flex-1 mx-4">
            <Text
              className="text-white text-[14px] font-extrabold"
              numberOfLines={1}
            >
              {comic.title}
            </Text>
            <Text
              className="text-zinc-400 text-[11px] mt-0.5"
              numberOfLines={1}
            >
              {currentEp?.chapterTitle || chapterTitle} • {currentEp?.title || episodeTitle}
            </Text>
          </View>

          <View className="flex-row items-center gap-1">
            <BookmarkButton
              episodeId={activeEpId}
              contentType="COMIC"
              size="sm"
            />
            <ShareButton
              episodeId={activeEpId}
              title={`${comicTitleState} - ${currentEp?.title || episodeTitle || "Truyện tranh"}`}
              size="sm"
            />
            <TouchableOpacity
              onPress={() => setShowMenuModal(true)}
              className="p-1 active:opacity-70 ml-1"
            >
              <Feather name="list" size={22} color="#D4AF37" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* VIEW TRANG ĐỌC TRUYỆN */}
      <View className="flex-1 justify-center items-center w-full bg-black">
        {loading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text className="text-zinc-500 text-xs mt-3">Đang tải các trang truyện...</Text>
          </View>
        ) : errorMsg ? (
          <View className="items-center justify-center px-6 py-20 max-w-sm text-center">
            <MaterialCommunityIcons name="lock-alert-outline" size={56} color="#D4AF37" />
            <Text className="text-white font-bold text-base mt-4 text-center">
              Nội dung bị hạn chế truy cập
            </Text>
            <Text className="text-zinc-400 text-xs text-center mt-2 leading-5">
              {errorMsg}
            </Text>
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="bg-zinc-800 px-5 py-2.5 rounded-full border border-white/10"
              >
                <Text className="text-stone-300 font-bold text-xs">Quay lại</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : readingMode === "vertical" ? (
          // Chế độ Webtoon cuộn dọc mượt mà
          <ScrollView
            ref={scrollRef}
            className="w-full"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingTop: showControls ? 56 + insets.top : 0,
              paddingBottom: showControls ? 80 + insets.bottom : 0,
            }}
          >
            {pages.map((page, idx) => (
              <TouchableOpacity
                key={`vertical-${idx}`}
                activeOpacity={1}
                onPress={toggleControls}
              >
                <Image
                  source={getPageSource(page)}
                  style={{ width: screenWidth, height: screenWidth * 1.5 }}
                  resizeMode="contain"
                  className="bg-black"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          // Chế độ vuốt ngang (FlatList paging)
          <FlatList
            ref={flatListRef}
            horizontal
            pagingEnabled
            data={pages}
            keyExtractor={(_, index) => `horizontal-${index}`}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleHorizontalScroll}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={1}
                onPress={toggleControls}
                style={{ width: screenWidth, height: screenHeight }}
                className="justify-center bg-black"
              >
                <Image
                  source={getPageSource(item)}
                  style={{ width: screenWidth, height: screenHeight - 120 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* BOTTOM CONTROL OVERLAY */}
      {showControls && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-[#141416]/95 z-50 border-t border-white/5 px-4 shadow-lg"
          style={{ paddingBottom: insets.bottom + 12, paddingTop: 14 }}
        >
          {/* Progress Slider (Giả lập chỉ số trang) */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-zinc-500 text-[11px] font-bold">
              Trang {currentPage + 1}/{pages.length || 1}
            </Text>
            <View className="flex-1 mx-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <View
                className="h-full bg-[#D4AF37]"
                style={{
                  width: `${((currentPage + 1) / (pages.length || 1)) * 100}%`,
                }}
              />
            </View>
            <View className="flex-row items-center gap-2">
              <LikeButton
                isLiked={isLiked}
                likeCount={likeCount}
                onLikeToggle={toggleLike}
                isMutating={isLikeMutating}
                size="small"
              />
              <TouchableOpacity
                onPress={() =>
                  setReadingMode(
                    readingMode === "vertical" ? "horizontal" : "vertical",
                  )
                }
                className="px-2.5 py-1.5 rounded-full bg-zinc-800 flex-row items-center active:bg-zinc-700"
              >
                <MaterialCommunityIcons
                  name={
                    readingMode === "vertical"
                      ? "page-layout-body"
                      : "pan-horizontal"
                  }
                  size={12}
                  color="#D4AF37"
                />
                <Text className="text-[#D4AF37] text-[10px] font-extrabold ml-1 uppercase">
                  {readingMode === "vertical" ? "Cuộn dọc" : "Vuốt ngang"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Điều hướng chương cũ/mới */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              disabled={currentEpisodeIdx === 0}
              onPress={() => navigateEpisode("prev")}
              className={`flex-row items-center px-4 py-2 rounded-full border ${
                currentEpisodeIdx === 0
                  ? "border-zinc-800 opacity-30"
                  : "border-white/10 bg-zinc-900 active:bg-zinc-800"
              }`}
            >
              <Feather name="arrow-left" size={14} color="#E5E0D8" />
              <Text className="text-stone-300 text-[12px] font-bold ml-1.5">
                Tập trước
              </Text>
            </TouchableOpacity>

            <View className="bg-zinc-900 border border-white/5 px-4 py-1.5 rounded-full">
              <Text className="text-[#D4AF37] text-[12px] font-bold">
                {currentEp.title}
              </Text>
            </View>

            <TouchableOpacity
              disabled={currentEpisodeIdx === allEpisodes.length - 1}
              onPress={() => navigateEpisode("next")}
              className={`flex-row items-center px-4 py-2 rounded-full border ${
                currentEpisodeIdx === allEpisodes.length - 1
                  ? "border-zinc-800 opacity-30"
                  : "border-white/10 bg-zinc-900 active:bg-zinc-800"
              }`}
            >
              <Text className="text-stone-300 text-[12px] font-bold mr-1.5">
                Tập sau
              </Text>
              <Feather name="arrow-right" size={14} color="#E5E0D8" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MODAL DANH SÁCH CHƯƠNG/TẬP (MỤC LỤC) */}
      <Modal
        visible={showMenuModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMenuModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header Sheet */}
            <View className="flex-row items-center justify-between pb-4 border-b border-white/5 mb-4">
              <Text className="text-white text-base font-extrabold">
                Mục lục tác phẩm
              </Text>
              <TouchableOpacity
                onPress={() => setShowMenuModal(false)}
                className="p-1"
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={allEpisodes}
              keyExtractor={(item) =>
                `modal-ep-${item.chapterTitle}-${item.title}`
              }
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => {
                const isActive = item.title === episodeTitle;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setShowMenuModal(false);
                      setCurrentPage(0);
                      navigation.replace("ComicReader", {
                        comicId,
                        comicTitle: comicTitleState,
                        chapterTitle: item.chapterTitle,
                        episodeTitle: item.title,
                        episodeIndex: item.index,
                        episodeId: item.episodeId,
                      });
                    }}
                    className={`py-3.5 px-4 rounded-xl mb-2 flex-row items-center justify-between border ${
                      isActive
                        ? "bg-[#D4AF37]/10 border-[#D4AF37]/30"
                        : "bg-zinc-900/50 border-white/5 active:bg-zinc-900"
                    }`}
                  >
                    <View>
                      <Text
                        className={`font-semibold text-sm ${isActive ? "text-[#D4AF37]" : "text-stone-300"}`}
                      >
                        {item.title}
                      </Text>
                      <Text className="text-zinc-500 text-[10px] mt-0.5">
                        {item.chapterTitle}
                      </Text>
                    </View>
                    <Feather
                      name={isActive ? "book-open" : "play"}
                      size={14}
                      color={isActive ? "#D4AF37" : "#71717A"}
                    />
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: screenHeight * 0.6,
    backgroundColor: "#141416",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
});
