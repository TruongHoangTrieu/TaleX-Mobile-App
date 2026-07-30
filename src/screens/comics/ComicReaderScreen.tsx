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
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getComicById } from "./comicMockData";
import { getPublicEpisodeMedia, getSeriesSeasons, getSeasonEpisodes, getPublicSeriesDetail } from "@/services/series";
import { BASE_URL } from "@/config";
import { useEpisodeLikes } from "@/hooks/useEpisodeLikes";
import { LikeButton } from "@/components/LikeButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ShareButton } from "@/components/ShareButton";
import { EpisodeCommentsSection } from "@/components/comments/EpisodeCommentsSection";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");



function SkeletonPage({ height = screenWidth * 1.3, style }: { height?: number; style?: any }) {
  const opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.55,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.2,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: screenWidth - 24,
          height: height,
          backgroundColor: "#18181B",
          borderRadius: 16,
          marginVertical: 8,
          opacity: opacity,
          alignSelf: "center",
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.05)",
        },
        style,
      ]}
    >
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#27272A", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <MaterialCommunityIcons name="file-image-outline" size={26} color="#71717A" />
      </View>
      <View style={{ width: "35%", height: 8, borderRadius: 4, backgroundColor: "#27272A" }} />
    </Animated.View>
  );
}

function ComicReaderSkeleton({ insetsTop }: { insetsTop: number }) {
  return (
    <ScrollView
      className="w-full flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 60 + insetsTop, paddingBottom: 40 }}
    >
      <SkeletonPage />
      <SkeletonPage />
      <SkeletonPage />
    </ScrollView>
  );
}

function ComicImagePage({ page, getPageSource, width, height, readingMode = "vertical", onPress }: any) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  const source = getPageSource(page);

  useEffect(() => {
    if (source && source.uri && typeof source.uri === "string") {
      Image.getSize(
        source.uri,
        (w, h) => {
          if (w > 0 && h > 0) {
            setAspectRatio(h / w);
          }
        },
        () => {}
      );
    } else if (typeof source === "number") {
      const resolved = Image.resolveAssetSource(source);
      if (resolved && resolved.width && resolved.height) {
        setAspectRatio(resolved.height / resolved.width);
      }
    }
  }, [source?.uri]);

  const computedHeight = readingMode === "vertical"
    ? (aspectRatio ? width * aspectRatio : height || width * 1.4)
    : (height || screenHeight);

  return (
    <View style={{ width, height: computedHeight, backgroundColor: "#000", padding: 0, margin: 0 }}>
      {imageLoading && !imageError && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 2, justifyContent: "center", alignItems: "center" }}>
          <SkeletonPage height={computedHeight} style={{ width: width, borderRadius: 0, marginVertical: 0 }} />
        </View>
      )}
      {imageError ? (
        <View style={{ width: width - 32, height: 200, backgroundColor: "#18181B", borderRadius: 16, alignItems: "center", justifyContent: "center", alignSelf: "center", marginVertical: 20, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" }}>
          <MaterialCommunityIcons name="image-off-outline" size={40} color="#71717A" />
          <Text className="text-zinc-400 text-xs mt-2 text-center">Không thể tải trang hình ảnh này</Text>
        </View>
      ) : (
        <TouchableOpacity activeOpacity={1} onPress={onPress} style={{ width, height: computedHeight }}>
          <Image
            source={source}
            style={{ width, height: computedHeight }}
            resizeMode={readingMode === "vertical" ? "cover" : "contain"}
            onLoadStart={() => setImageLoading(true)}
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

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
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbEpisodes, setDbEpisodes] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const scrollRef = useRef<ScrollView>(null);

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
    allEpisodes.findIndex((e) => e.episodeId === episodeId || (episodeTitle && e.title === episodeTitle)) !== -1
      ? allEpisodes.findIndex((e) => e.episodeId === episodeId || (episodeTitle && e.title === episodeTitle))
      : 0;

  const currentEp = allEpisodes[currentEpisodeIdx] || allEpisodes[0] || {};
  const activeEpId = episodeId || currentEp?.episodeId;

  // Fetch real media pages whenever activeEpId is set/changed
  useEffect(() => {
    if (activeEpId) {
      setLoading(true);
      setErrorMsg(null);
      getPublicEpisodeMedia(activeEpId, user?.accountId)
        .then((res) => {
          const data = Array.isArray(res) ? res : (res?.data || res?.result || []);
          if (data && data.length > 0) {
            const sorted = [...data].sort(
              (a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
            );
            const urls = sorted
              .map((m: any) => m.fileUrl || m.mediaUrl || m.url || "")
              .filter((u: string) => Boolean(u));
            setPages(urls);
          } else {
            setPages([]);
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
    } else {
      setPages([]);
    }
  }, [activeEpId, user?.accountId]);

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
  }, [comicId, isMock]);

  const getPageSource = (page: any) => {
    if (!page) return null;
    if (typeof page === "string") {
      if (
        page.startsWith("http://") ||
        page.startsWith("https://") ||
        page.startsWith("file://") ||
        page.startsWith("data:")
      ) {
        return { uri: page };
      }
      const cleanBase = BASE_URL.replace(/\/$/, "");
      const cleanPath = page.startsWith("/") ? page : `/${page}`;
      return { uri: `${cleanBase}${cleanPath}` };
    }
    if (page && page.uri) {
      if (
        typeof page.uri === "string" &&
        !page.uri.startsWith("http://") &&
        !page.uri.startsWith("https://") &&
        !page.uri.startsWith("file://") &&
        !page.uri.startsWith("data:")
      ) {
        const cleanBase = BASE_URL.replace(/\/$/, "");
        const cleanPath = page.uri.startsWith("/") ? page.uri : `/${page.uri}`;
        return { uri: `${cleanBase}${cleanPath}` };
      }
      return page;
    }
    return page;
  };

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
          <ComicReaderSkeleton insetsTop={insets.top} />
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
        ) : pages.length === 0 ? (
          <View className="items-center justify-center px-6 py-20 max-w-sm text-center">
            <MaterialCommunityIcons name="book-remove-outline" size={56} color="#D4AF37" />
            <Text className="text-white font-bold text-base mt-4 text-center">
              Chưa có trang nội dung
            </Text>
            <Text className="text-zinc-400 text-xs text-center mt-2 leading-5">
              Tập truyện này hiện chưa được tải lên hình ảnh nội dung. Vui lòng quay lại sau.
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
              <ComicImagePage
                key={`vertical-${idx}`}
                page={page}
                getPageSource={getPageSource}
                width={screenWidth}
                readingMode="vertical"
                onPress={toggleControls}
              />
            ))}

            {activeEpId ? (
              <View className="px-3 pt-6 pb-12">
                <EpisodeCommentsSection episodeId={activeEpId} />
              </View>
            ) : null}
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
              <ComicImagePage
                page={item}
                getPageSource={getPageSource}
                width={screenWidth}
                height={screenHeight}
                readingMode="horizontal"
                onPress={toggleControls}
              />
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
