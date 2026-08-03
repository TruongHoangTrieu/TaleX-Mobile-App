import React, { useState, useEffect, useRef, useCallback } from "react";
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
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getComicById } from "./comicMockData";
import {
  getPublicEpisodeMedia,
  getSeriesSeasons,
  getSeasonEpisodes,
  getPublicSeriesDetail,
} from "@/services/series";
import {
  getEpisodeComments,
  createComment,
  updateComment,
  deleteComment,
  CommentDto,
} from "@/services/comments";
import { BASE_URL } from "@/config";
import { useEpisodeLikes } from "@/hooks/useEpisodeLikes";
import { LikeButton } from "@/components/LikeButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ShareButton } from "@/components/ShareButton";
import ContentPaywall from "@/components/purchase/ContentPaywall";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

function SkeletonPage({
  height = screenWidth * 1.3,
  style,
}: {
  height?: number;
  style?: any;
}) {
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
      ]),
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
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: "#27272A",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <MaterialCommunityIcons
          name="file-image-outline"
          size={26}
          color="#71717A"
        />
      </View>
      <View
        style={{
          width: "35%",
          height: 8,
          borderRadius: 4,
          backgroundColor: "#27272A",
        }}
      />
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

function ComicImagePage({
  page,
  getPageSource,
  width,
  height,
  readingMode = "vertical",
  onPress,
}: any) {
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
        () => {},
      );
    } else if (typeof source === "number") {
      const resolved = Image.resolveAssetSource(source);
      if (resolved && resolved.width && resolved.height) {
        setAspectRatio(resolved.height / resolved.width);
      }
    }
  }, [source?.uri]);

  const computedHeight =
    readingMode === "vertical"
      ? aspectRatio
        ? width * aspectRatio
        : height || width * 1.4
      : height || screenHeight;

  return (
    <View
      style={{
        width,
        height: computedHeight,
        backgroundColor: "#000",
        padding: 0,
        margin: 0,
      }}
    >
      {imageLoading && !imageError && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <SkeletonPage
            height={computedHeight}
            style={{ width: width, borderRadius: 0, marginVertical: 0 }}
          />
        </View>
      )}
      {imageError ? (
        <View
          style={{
            width: width - 32,
            height: 200,
            backgroundColor: "#18181B",
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "center",
            marginVertical: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <MaterialCommunityIcons
            name="image-off-outline"
            size={40}
            color="#71717A"
          />
          <Text className="text-zinc-400 text-xs mt-2 text-center">
            Không thể tải trang hình ảnh này
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          activeOpacity={1}
          onPress={onPress}
          style={{ width, height: computedHeight }}
        >
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
  const [comicTitleState, setComicTitleState] = useState(
    route.params?.comicTitle || "Truyện Tranh",
  );

  const comic =
    isMock && getComicById(comicId)
      ? getComicById(comicId)
      : {
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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dbEpisodes, setDbEpisodes] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPaywallError, setIsPaywallError] = useState(false);
  // Sentinel appended to `pages` in place of the first locked page — BE
  // (MediaServiceImpl.listPublicByEpisode) allows a free preview (first 5
  // pages) for COMIC content and returns 200 with `isLocked:true` items
  // instead of an HTTP 403, so this can't be caught in the network error path.
  const PAYWALL_SENTINEL = "__PAYWALL__";

  // Comment States
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentsList, setCommentsList] = useState<CommentDto[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [sortMode, setSortMode] = useState<"NEW" | "HOT">("NEW");
  const [commentText, setCommentText] = useState("");
  const [commentCount, setCommentCount] = useState<number>(0);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [replyingParentId, setReplyingParentId] = useState<string | null>(null);

  // Refs
  const flatListRef = useRef<FlatList>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Lấy tất cả tập con (episodes) phẳng của toàn bộ truyện để chuyển tập nhanh
  const allEpisodes: {
    chapterTitle: string;
    title: string;
    index: number;
    episodeId?: string;
  }[] = isMock
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
    allEpisodes.findIndex(
      (e) =>
        e.episodeId === episodeId || (episodeTitle && e.title === episodeTitle),
    ) !== -1
      ? allEpisodes.findIndex(
          (e) =>
            e.episodeId === episodeId ||
            (episodeTitle && e.title === episodeTitle),
        )
      : 0;

  const currentEp = allEpisodes[currentEpisodeIdx] || allEpisodes[0] || {};
  const activeEpId = episodeId || currentEp?.episodeId;

  // Fetch comments modal list from real API
  const fetchCommentsModalData = useCallback(async () => {
    if (!activeEpId) return;
    setLoadingComments(true);
    try {
      const sortParam = sortMode === "HOT" ? "createdAt,ASC" : "createdAt,DESC";
      const res = await getEpisodeComments(activeEpId, 0, 50, sortParam);
      if (res && res.content) {
        setCommentsList(res.content);
        if (typeof res.totalElements === "number") {
          setCommentCount(res.totalElements);
        }
      } else {
        setCommentsList([]);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách bình luận modal:", err);
    } finally {
      setLoadingComments(false);
    }
  }, [activeEpId, sortMode]);

  useEffect(() => {
    if (showCommentsModal) {
      fetchCommentsModalData();
    }
  }, [showCommentsModal, fetchCommentsModalData]);

  // Fetch real media pages & real comment count whenever activeEpId is set/changed
  useEffect(() => {
    if (activeEpId) {
      setLoading(true);
      setErrorMsg(null);
      setIsPaywallError(false);
      getPublicEpisodeMedia(activeEpId, user?.accountId)
        .then((res) => {
          const data = Array.isArray(res)
            ? res
            : res?.data || res?.result || [];
          if (data && data.length > 0) {
            const sorted = [...data].sort(
              (a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
            );
            // BE marks pages past the free-preview limit with isLocked=true
            // and swaps fileUrl for a (watermarked) previewUrl — stop
            // rendering real pages there and show the paywall instead.
            const lockedIndex = sorted.findIndex((m: any) => m.isLocked === true);
            const visible = lockedIndex === -1 ? sorted : sorted.slice(0, lockedIndex);
            const urls = visible
              .map((m: any) => m.fileUrl || m.mediaUrl || m.url || "")
              .filter((u: string) => Boolean(u));
            setPages(lockedIndex === -1 ? urls : [...urls, PAYWALL_SENTINEL]);
          } else {
            setPages([]);
          }
        })
        .catch((err: any) => {
          console.error("Lỗi tải trang truyện từ API:", err);
          if (
            err.status === 403 ||
            (err.message && err.message.includes("403"))
          ) {
            setIsPaywallError(true);
            setErrorMsg(
              "Tập truyện này là nội dung trả phí hoặc yêu cầu quyền truy cập. Vui lòng mở khóa hoặc sở hữu gói trước khi đọc.",
            );
          } else {
            setErrorMsg(
              err.message || "Lỗi tải trang truyện. Vui lòng thử lại sau.",
            );
          }
        })
        .finally(() => setLoading(false));

      // Fetch real comment count
      getEpisodeComments(activeEpId, 0, 1)
        .then((res) => {
          if (typeof res?.totalElements === "number") {
            setCommentCount(res.totalElements);
          } else if (Array.isArray(res?.content)) {
            setCommentCount(res.content.length);
          }
        })
        .catch(() => {});
    } else {
      setPages([]);
    }
  }, [activeEpId, user?.accountId]);

  const handleSendComment = async () => {
    if (!commentText.trim() || !activeEpId) return;
    if (!user) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để gửi bình luận.");
      return;
    }
    setIsSendingComment(true);
    try {
      if (editingCommentId) {
        await updateComment(editingCommentId, commentText.trim());
        setEditingCommentId(null);
      } else {
        await createComment({
          episodeId: activeEpId,
          content: commentText.trim(),
          commentParentId: replyingParentId || undefined,
        });
        setReplyingParentId(null);
        setCommentCount((prev) => prev + 1);
      }
      setCommentText("");
      fetchCommentsModalData();
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể thực hiện bình luận.");
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleDeleteComment = (targetCommentId: string) => {
    Alert.alert("Xác nhận xóa", "Bạn có chắc chắn muốn xóa bình luận này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteComment(targetCommentId);
            setCommentCount((prev) => Math.max(0, prev - 1));
            fetchCommentsModalData();
          } catch (err: any) {
            Alert.alert("Lỗi", err.message || "Không thể xóa bình luận.");
          }
        },
      },
    ]);
  };

  const handleEditComment = (item: CommentDto) => {
    setEditingCommentId(item.commentId);
    setReplyingParentId(null);
    setCommentText(item.content);
  };

  const handleReplyComment = (item: CommentDto) => {
    setReplyingParentId(item.commentId);
    setEditingCommentId(null);
    const authorName = item.displayName || item.username || "bạn";
    setCommentText(`@${authorName} `);
  };

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
          .catch((err) =>
            console.error("Lỗi lấy chi tiết series trong Reader:", err),
          );

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
            }),
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

  const {
    isLiked,
    likeCount,
    toggleLike,
    isMutating: isLikeMutating,
  } = useEpisodeLikes(activeEpId);

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

          <View className="items-center flex-1 mx-4 justify-center">
            <Text
              className="text-white text-[14px] font-black tracking-wide"
              numberOfLines={1}
            >
              {currentEp?.chapterTitle || chapterTitle
                ? `${currentEp?.chapterTitle || chapterTitle} • `
                : ""}
              {currentEp?.title || episodeTitle || "Truyện tranh"}
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
          </View>
        </View>
      )}

      {/* VIEW TRANG ĐỌC TRUYỆN */}
      <View className="flex-1 justify-center items-center w-full bg-black">
        {loading ? (
          <ComicReaderSkeleton insetsTop={insets.top} />
        ) : errorMsg && isPaywallError ? (
          <View className="w-full px-6 py-16">
            <ContentPaywall
              episodeId={activeEpId}
              itemType="EPISODE"
              title={currentEp?.title || episodeTitle}
              priceVnd={(currentEp as any)?.priceVnd}
              returnScreen="ComicReader"
              message={errorMsg}
            />
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mt-4 self-center bg-zinc-800 px-5 py-2.5 rounded-full border border-white/10"
            >
              <Text className="text-stone-300 font-bold text-xs">Quay lại</Text>
            </TouchableOpacity>
          </View>
        ) : errorMsg ? (
          <View className="items-center justify-center px-6 py-20 max-w-sm text-center">
            <MaterialCommunityIcons
              name="lock-alert-outline"
              size={56}
              color="#D4AF37"
            />
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
                <Text className="text-stone-300 font-bold text-xs">
                  Quay lại
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : pages.length === 0 ? (
          <View className="items-center justify-center px-6 py-20 max-w-sm text-center">
            <MaterialCommunityIcons
              name="book-remove-outline"
              size={56}
              color="#D4AF37"
            />
            <Text className="text-white font-bold text-base mt-4 text-center">
              Chưa có trang nội dung
            </Text>
            <Text className="text-zinc-400 text-xs text-center mt-2 leading-5">
              Tập truyện này hiện chưa được tải lên hình ảnh nội dung. Vui lòng
              quay lại sau.
            </Text>
            <View className="flex-row gap-3 mt-6">
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                className="bg-zinc-800 px-5 py-2.5 rounded-full border border-white/10"
              >
                <Text className="text-stone-300 font-bold text-xs">
                  Quay lại
                </Text>
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
            {pages.map((page, idx) =>
              page === PAYWALL_SENTINEL ? (
                <View key="vertical-paywall" className="w-full px-6 py-10">
                  <ContentPaywall
                    episodeId={activeEpId}
                    itemType="EPISODE"
                    title={currentEp?.title || episodeTitle}
                    priceVnd={(currentEp as any)?.priceVnd}
                    returnScreen="ComicReader"
                    message="Bạn đã đọc hết số trang xem thử miễn phí. Mua tập này để đọc toàn bộ nội dung còn lại."
                  />
                </View>
              ) : (
                <ComicImagePage
                  key={`vertical-${idx}`}
                  page={page}
                  getPageSource={getPageSource}
                  width={screenWidth}
                  readingMode="vertical"
                  onPress={toggleControls}
                />
              ),
            )}
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
            renderItem={({ item }) =>
              item === PAYWALL_SENTINEL ? (
                <View
                  style={{ width: screenWidth, height: screenHeight }}
                  className="items-center justify-center px-6"
                >
                  <ContentPaywall
                    episodeId={activeEpId}
                    itemType="EPISODE"
                    title={currentEp?.title || episodeTitle}
                    priceVnd={(currentEp as any)?.priceVnd}
                    returnScreen="ComicReader"
                    message="Bạn đã đọc hết số trang xem thử miễn phí. Mua tập này để đọc toàn bộ nội dung còn lại."
                  />
                </View>
              ) : (
                <ComicImagePage
                  page={item}
                  getPageSource={getPageSource}
                  width={screenWidth}
                  height={screenHeight}
                  readingMode="horizontal"
                  onPress={toggleControls}
                />
              )
            }
          />
        )}
      </View>

      {/* BOTTOM CONTROL OVERLAY - FULL WIDTH RECTANGULAR FLUSH TO SCREEN EDGES */}
      {showControls && (
        <View
          className="absolute bottom-0 left-0 right-0 w-full bg-[#16171A] z-50 border-t border-white/10 px-4 pt-3.5"
          style={{ paddingBottom: insets.bottom > 0 ? insets.bottom + 14 : 26 }}
        >
          {/* Row 1: Comment Input Field with Send Icon */}
          <View className="flex-row items-center mb-3">
            <View className="flex-1 flex-row items-center bg-[#28282B] rounded-lg px-3.5 py-2.5 border border-white/5">
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Cùng chia sẻ cảm nghĩ của bạn..."
                placeholderTextColor="#8E8E93"
                className="flex-1 text-white text-[13.5px] py-1 px-1 font-medium"
                returnKeyType="send"
                onSubmitEditing={handleSendComment}
              />
            </View>

            {/* Send Paper Plane Icon */}
            <TouchableOpacity
              onPress={handleSendComment}
              disabled={isSendingComment || !commentText.trim()}
              className="ml-3 p-1 active:opacity-70"
            >
              <Ionicons
                name="send"
                size={22}
                color={commentText.trim() ? "#FFFFFF" : "#9CA3AF"}
              />
            </TouchableOpacity>
          </View>

          {/* Row 2: 5 Action Icons (Menu | Like | Comments with Badge | Settings | Next Chapter >) */}
          <View className="flex-row items-center justify-between px-2 pt-1 pb-1">
            {/* 1. Menu / Chapter List Icon */}
            <TouchableOpacity
              onPress={() => setShowMenuModal(true)}
              className="p-2 active:opacity-70"
            >
              <Ionicons name="list" size={26} color="#FFFFFF" />
            </TouchableOpacity>

            {/* 2. Like Icon (Real API Heart Shape) */}
            <TouchableOpacity
              onPress={toggleLike}
              disabled={isLikeMutating}
              className="p-2 active:opacity-70"
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={26}
                color={isLiked ? "#EF4444" : "#FFFFFF"}
              />
            </TouchableOpacity>

            {/* 3. Comment Icon (Real API Comment Count Badge) */}
            <TouchableOpacity
              onPress={() => setShowCommentsModal(true)}
              className="p-2 relative active:opacity-70"
            >
              <Ionicons
                name="chatbox-ellipses-outline"
                size={24}
                color="#FFFFFF"
              />
              {commentCount > 0 && (
                <View className="absolute top-0 right-0 bg-[#EF4444] px-1.5 py-0.2 rounded-full min-w-[18px] items-center justify-center">
                  <Text className="text-white text-[9px] font-black">
                    {commentCount > 999 ? "999+" : commentCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* 4. Settings / Gear Icon */}
            <TouchableOpacity
              onPress={() => setShowSettingsModal(true)}
              className="p-2 active:opacity-70"
            >
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            {/* 5. Next Chapter Arrow (>) */}
            <TouchableOpacity
              disabled={currentEpisodeIdx === allEpisodes.length - 1}
              onPress={() => navigateEpisode("next")}
              className="p-2 active:opacity-70"
            >
              <Ionicons
                name="chevron-forward"
                size={26}
                color={
                  currentEpisodeIdx === allEpisodes.length - 1
                    ? "#4B5563"
                    : "#FFFFFF"
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MODAL BÌNH LUẬN CHUẨN DESIGN THEO ẢNH */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <View className="flex-1 bg-black/75 justify-end">
          <View
            style={{ height: screenHeight * 0.82 }}
            className="bg-[#141416] rounded-t-3xl border-t border-white/10 px-4 pt-4 shadow-2xl flex-col justify-between"
          >
            {/* Header Sheet */}
            <View>
              <View className="flex-row items-center justify-between pb-3 border-b border-white/5">
                <View className="w-6" />
                <Text className="text-white text-base font-extrabold tracking-wide">
                  {currentEp?.title || episodeTitle || "Chapter 3"}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCommentsModal(false)}
                  className="p-1"
                >
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Sub-header Row */}
              <View className="py-3 border-b border-white/5 mb-1">
                <Text className="text-white text-[14px] font-extrabold">
                  Tổng {commentCount} bình luận
                </Text>
              </View>
            </View>

            {/* List / Empty State Body */}
            {loadingComments ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator size="large" color="#EC4899" />
                <Text className="text-zinc-500 text-xs mt-3 font-semibold">
                  Đang tải bình luận...
                </Text>
              </View>
            ) : commentsList.length === 0 ? (
              <View className="flex-1 items-center justify-center py-12 px-6">
                <View className="w-20 h-20 rounded-full bg-[#242428] items-center justify-center mb-4 border border-white/10 shadow-lg">
                  <MaterialCommunityIcons
                    name="comment-text-outline"
                    size={42}
                    color="#EC4899"
                  />
                </View>
                <Text className="text-white text-base font-black text-center tracking-wide">
                  Chưa có bình luận nào
                </Text>
                <Text className="text-zinc-400 text-xs text-center mt-2 leading-relaxed max-w-xs font-medium">
                  Hãy là người đầu tiên chia sẻ cảm nghĩ của bạn về tập truyện này!
                </Text>
              </View>
            ) : (
              <FlatList
                data={commentsList}
                keyExtractor={(item, index) =>
                  `modal-comment-${item.commentId || index}`
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => {
                  const displayName =
                    item.displayName || item.username || "Thành viên";
                  const initialLetter = displayName[0]?.toUpperCase() || "A";
                  const isOwner =
                    item.isOwner ||
                    (user?.accountId && item.accountId === user.accountId);

                  return (
                    <View className="py-4 border-b border-white/5 flex-row items-start">
                      {/* Avatar */}
                      {item.avatarUrl ? (
                        <Image
                          source={{ uri: item.avatarUrl }}
                          className="w-10 h-10 rounded-full bg-zinc-800 mt-0.5"
                        />
                      ) : (
                        <View className="w-10 h-10 rounded-full bg-emerald-800 items-center justify-center mt-0.5">
                          <Text className="text-white text-sm font-black">
                            {initialLetter}
                          </Text>
                        </View>
                      )}

                      {/* Content Body matching screenshot */}
                      <View className="flex-1 ml-3.5">
                        <Text className="text-white font-black text-[15px]">
                          {displayName}
                        </Text>

                        <Text className="text-stone-200 text-[13.5px] mt-1.5 leading-relaxed font-medium">
                          {item.content}
                        </Text>

                        {/* Action links: ↪ Phản hồi | 🖊 Sửa | 🗑 Xóa */}
                        <View className="flex-row items-center gap-5 mt-3">
                          <TouchableOpacity
                            onPress={() => handleReplyComment(item)}
                            className="flex-row items-center active:opacity-70"
                          >
                            <Feather
                              name="corner-down-right"
                              size={14}
                              color="#FFFFFF"
                            />
                            <Text className="text-white text-[13px] font-extrabold ml-1.5">
                              Phản hồi
                            </Text>
                          </TouchableOpacity>

                          {isOwner && (
                            <>
                              <TouchableOpacity
                                onPress={() => handleEditComment(item)}
                                className="flex-row items-center active:opacity-70"
                              >
                                <Feather
                                  name="edit-3"
                                  size={14}
                                  color="#FFFFFF"
                                />
                                <Text className="text-white text-[13px] font-extrabold ml-1.5">
                                  Sửa
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                onPress={() => handleDeleteComment(item.commentId)}
                                className="flex-row items-center active:opacity-70"
                              >
                                <Feather
                                  name="trash-2"
                                  size={14}
                                  color="#FFFFFF"
                                />
                                <Text className="text-white text-[13px] font-extrabold ml-1.5">
                                  Xóa
                                </Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                }}
              />
            )}

            {/* Bottom Fixed Comment Input in Modal */}
            <View
              className="pt-3 border-t border-white/5 bg-[#141416]"
              style={{ paddingBottom: insets.bottom > 0 ? insets.bottom + 14 : 26 }}
            >
              <View className="flex-row items-center gap-2">
                <View className="flex-1 flex-row items-center bg-[#242426] rounded-xl px-3.5 py-2.5 border border-white/5">
                  <TextInput
                    value={commentText}
                    onChangeText={setCommentText}
                    placeholder="Cùng chia sẻ cảm nghĩ của bạn..."
                    placeholderTextColor="#8E8E93"
                    className="flex-1 text-white text-[13.5px] py-1 px-1 font-medium"
                    returnKeyType="send"
                    onSubmitEditing={handleSendComment}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSendComment}
                  disabled={isSendingComment || !commentText.trim()}
                  className="p-2 active:opacity-70"
                >
                  <Ionicons
                    name="send"
                    size={22}
                    color={commentText.trim() ? "#FFFFFF" : "#52525B"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL CẤU HÌNH ĐỌC */}
      <Modal
        visible={showSettingsModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowSettingsModal(false)}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { height: "auto", paddingBottom: 30 }]}>
            <View className="flex-row items-center justify-between pb-3 border-b border-white/5 mb-4">
              <Text className="text-white text-base font-bold">Cấu hình chế độ đọc</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)} className="p-1">
                <Ionicons name="close" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text className="text-zinc-400 text-xs font-semibold mb-3">Hướng đọc trang</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setReadingMode("vertical");
                  setShowSettingsModal(false);
                }}
                className={`flex-1 py-3 px-4 rounded-xl border flex-row items-center justify-center ${
                  readingMode === "vertical"
                    ? "bg-[#D4AF37]/20 border-[#D4AF37]"
                    : "bg-zinc-900 border-white/5"
                }`}
              >
                <MaterialCommunityIcons name="page-layout-body" size={18} color={readingMode === "vertical" ? "#D4AF37" : "#A1A1AA"} />
                <Text className={`font-bold text-xs ml-2 ${readingMode === "vertical" ? "text-[#D4AF37]" : "text-zinc-300"}`}>Cuộn dọc</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setReadingMode("horizontal");
                  setShowSettingsModal(false);
                }}
                className={`flex-1 py-3 px-4 rounded-xl border flex-row items-center justify-center ${
                  readingMode === "horizontal"
                    ? "bg-[#D4AF37]/20 border-[#D4AF37]"
                    : "bg-zinc-900 border-white/5"
                }`}
              >
                <MaterialCommunityIcons name="pan-horizontal" size={18} color={readingMode === "horizontal" ? "#D4AF37" : "#A1A1AA"} />
                <Text className={`font-bold text-xs ml-2 ${readingMode === "horizontal" ? "text-[#D4AF37]" : "text-zinc-300"}`}>Vuốt ngang</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
