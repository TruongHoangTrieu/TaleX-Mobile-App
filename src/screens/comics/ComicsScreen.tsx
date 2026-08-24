import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Animated,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { navigate as safeNavigateRef } from "@/navigation/navigationRef";

import ComicCarousel from "@components/ComicCarousel";
import Header from "@components/Header";
import RecentWatchSection from "@/components/RecentWatchSection";
import CinematicBackground from "@/components/CinematicBackground";
import { searchPublicSeries, SearchSeriesItem, formatAnalyticNumber } from "@/services/series";
import {
  getRecommendationFeed,
  generateSessionId,
  HomeFeedSeries,
} from "@/services/recommendations";
import { Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

function SkeletonPulse({
  style,
  className,
}: {
  style?: any;
  className?: string;
}) {
  const opacity = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.25,
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
      className={`bg-zinc-800/80 rounded-2xl ${className || ""}`}
      style={[{ opacity }, style]}
    />
  );
}

export default function ComicsScreen() {
  let navigation: any = null;
  try {
    navigation = useNavigation<any>();
  } catch (_e) {
    navigation = null;
  }

  const navigateTo = (screenName: string, params?: any) => {
    if (navigation && typeof navigation.navigate === "function") {
      navigation.navigate(screenName, params);
    } else {
      safeNavigateRef(screenName, params);
    }
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 100% Real API Sections
  const [latestComics, setLatestComics] = useState<SearchSeriesItem[]>([]);
  const [topViewsComics, setTopViewsComics] = useState<SearchSeriesItem[]>([]);
  const [topRatedComics, setTopRatedComics] = useState<SearchSeriesItem[]>([]);
  const [topLikedComics, setTopLikedComics] = useState<SearchSeriesItem[]>([]);

  // 5. Tất Cả Truyện Tranh Đề Xuất (Recommendation Feed Infinite API)
  const [recommendedComics, setRecommendedComics] = useState<HomeFeedSeries[]>([]);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(true);
  const [loadingMoreRecs, setLoadingMoreRecs] = useState<boolean>(false);
  const [hasMoreRecs, setHasMoreRecs] = useState<boolean>(true);
  const sessionIdRef = useRef<string>(generateSessionId("sess_comics"));

  const loadRecommendedComics = useCallback(async (reset = false) => {
    if (reset) {
      sessionIdRef.current = generateSessionId("sess_comics");
      setLoadingRecs(true);
      setHasMoreRecs(true);
    } else {
      setLoadingMoreRecs(true);
    }

    try {
      const currentOffset = reset ? 0 : recommendedComics.length;
      const recs = await getRecommendationFeed({
        sessionId: sessionIdRef.current,
        pageType: "COMICS",
        limit: 10,
        offset: currentOffset,
      });

      if (Array.isArray(recs)) {
        if (reset) {
          setRecommendedComics(recs);
        } else {
          setRecommendedComics((prev) => {
            const seen = new Set(prev.map((p) => p.seriesId));
            const newItems = recs.filter((r) => !seen.has(r.seriesId));
            return [...prev, ...newItems];
          });
        }
        if (recs.length < 10) {
          setHasMoreRecs(false);
        }
      }
    } catch (err) {
      console.warn("[ComicsScreen] Error fetching recommended comics feed:", err);
    } finally {
      setLoadingRecs(false);
      setLoadingMoreRecs(false);
    }
  }, [recommendedComics.length]);

  const loadComicsData = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      await Promise.all([
        searchPublicSeries({
          contentType: "COMIC",
          status: "PUBLISHED",
          sortBy: "releasedupdatetime",
          sortDirection: "DESC",
          page: 0,
          size: 10,
        }).then((res) => {
          if (res?.data?.content) setLatestComics(res.data.content);
        }),
        searchPublicSeries({
          contentType: "COMIC",
          status: "PUBLISHED",
          sortBy: "views",
          sortDirection: "DESC",
          page: 0,
          size: 10,
        }).then((res) => {
          if (res?.data?.content) setTopViewsComics(res.data.content);
        }),
        searchPublicSeries({
          contentType: "COMIC",
          status: "PUBLISHED",
          sortBy: "averagerating",
          sortDirection: "DESC",
          page: 0,
          size: 10,
        }).then((res) => {
          if (res?.data?.content) setTopRatedComics(res.data.content);
        }),
        searchPublicSeries({
          contentType: "COMIC",
          status: "PUBLISHED",
          sortBy: "likes",
          sortDirection: "DESC",
          page: 0,
          size: 10,
        }).then((res) => {
          if (res?.data?.content) setTopLikedComics(res.data.content);
        }),
        loadRecommendedComics(true),
      ]);
    } catch (err) {
      console.error("[ComicsScreen] Error fetching real API comics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadComicsData(false);
    }, []),
  );

  const openComicDetail = (comicId: string) => {
    navigateTo("ComicDetailScreen", { comicId });
  };

  // Render Age Rating Badge Top Right
  const renderAgeRatingBadge = (ageRating?: string) => {
    if (!ageRating) return null;
    const ratingStr = ageRating.toUpperCase().trim();
    let label = ratingStr;
    let bgStyle = "bg-emerald-600 border-emerald-400";

    if (ratingStr === "MATURE" || ratingStr.includes("18") || ratingStr.includes("ADULT")) {
      label = "18+";
      bgStyle = "bg-red-600 border-red-400";
    } else if (ratingStr === "TEEN" || ratingStr.includes("13") || ratingStr.includes("PG")) {
      label = "13+";
      bgStyle = "bg-amber-600 border-amber-400";
    } else if (ratingStr === "EVERYONE" || ratingStr === "P") {
      label = "P";
      bgStyle = "bg-emerald-600 border-emerald-400";
    }

    return (
      <View className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg border z-20 shadow-md ${bgStyle}`}>
        <Text className="text-white text-[10px] font-black tracking-wider uppercase">{label}</Text>
      </View>
    );
  };

  // Modern Card Component
  const renderComicCard = ({ item }: { item: SearchSeriesItem }) => {
    const isComic = item.contentType === "COMIC";
    const coverUri = item.coverUrl || item.bannerUrl;
    const imageSource = coverUri
      ? { uri: coverUri }
      : require("@assets/comic4.webp");

    return (
      <TouchableOpacity
        className="mr-3.5 w-[135px]"
        activeOpacity={0.85}
        onPress={() => openComicDetail(item.seriesId)}
      >
        <View className="relative w-full h-[185px] rounded-2xl overflow-hidden border border-white/10 bg-zinc-800 shadow-md">
          {/* Top Left: TRUYỆN (Solid Blue #2563EB) */}
          <View
            style={{ backgroundColor: "#2563EB", borderColor: "#60A5FA" }}
            className="absolute top-2 left-2 px-2 py-0.5 rounded-lg border z-20 shadow-lg"
          >
            <Text className="text-white text-[9px] font-black uppercase tracking-wider">
              TRUYỆN
            </Text>
          </View>

          {/* Top Right: Age Rating Badge */}
          {renderAgeRatingBadge(item.ageRating)}

          <Image
            source={imageSource}
            className="w-full h-full"
            resizeMode="cover"
          />

          <LinearGradient
            colors={["transparent", "rgba(10, 8, 6, 0.98)"]}
            className="absolute bottom-0 left-0 right-0 h-16 justify-end p-2.5"
          >
            <View className="flex-row items-center justify-between">
              <Text
                className="flex-1 text-white text-xs font-black mr-1.5"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.title}
              </Text>
              <View className="flex-row items-center bg-black/90 px-1.5 py-0.5 rounded-full border border-white/20">
                <Ionicons name="star" size={10} color="#D4AF37" style={{ marginRight: 2 }} />
                <Text className="text-[#E5E0D8] text-[9px] font-black">
                  {(item.averageRating ?? 0).toFixed(1)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <Text
          className="text-[#A1A1AA] text-[11px] mt-1.5 px-0.5"
          numberOfLines={1}
        >
          {item.description || item.creatorName || "Truyện tranh TaleX"}
        </Text>
      </TouchableOpacity>
    );
  };

  // Top Ranked Card Component
  const renderRankedCard = ({
    item,
    index,
  }: {
    item: SearchSeriesItem;
    index: number;
  }) => {
    const rankColors = ["#D4AF37", "#C0C0C0", "#CD7F32"];
    const rankColor = index < 3 ? rankColors[index] : "#A1A1AA";
    const coverUri = item.coverUrl || item.bannerUrl;
    const imageSource = coverUri
      ? { uri: coverUri }
      : require("@assets/comic4.webp");

    return (
      <TouchableOpacity
        className="mr-3.5 flex-row items-center w-[230px] bg-[#1A1C20] p-2.5 rounded-2xl border border-white/10"
        activeOpacity={0.85}
        onPress={() => openComicDetail(item.seriesId)}
      >
        <Text
          className="text-3xl font-black italic mr-2.5 w-8 text-center"
          style={{ color: rankColor }}
        >
          #{index + 1}
        </Text>

        <Image
          source={imageSource}
          className="w-[70px] h-[95px] rounded-xl bg-zinc-800"
          resizeMode="cover"
        />

        <View className="flex-1 ml-2.5 justify-between h-[90px] py-1">
          <View>
            <Text
              className="text-white font-bold text-xs leading-tight"
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text className="text-[#A1A1AA] text-[10px] mt-1" numberOfLines={1}>
              {item.creatorName || "TaleX"}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-row items-center bg-black/40 px-1.5 py-0.5 rounded">
              <Ionicons name="eye-outline" size={10} color="#D4AF37" />
              <Text className="text-[#D4AF37] text-[10px] font-semibold ml-1">
                {item.totalViews ?? 0}
              </Text>
            </View>

            <View className="flex-row items-center bg-black/40 px-1.5 py-0.5 rounded">
              <Ionicons name="star" size={10} color="#D4AF37" />
              <Text className="text-white text-[10px] font-bold ml-1">
                {(item.averageRating ?? 0).toFixed(1)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const spotlightComic = topViewsComics[0] || latestComics[0];

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-black" style={{ backgroundColor: "#000000" }}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <CinematicBackground>
        <Header titleType="text" titleText="Truyện Tranh" showCategories={false} />

        <ScrollView
          className="flex-1"
          alwaysBounceVertical={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 130 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadComicsData(true)}
              tintColor="#D4AF37"
            />
          }
        >
          {/* 1. Carousel Banner */}
          <View className="mt-1">
            <ComicCarousel />
          </View>

          {/* 2. Continue Reading Bar */}
          <RecentWatchSection filterType="COMIC" title="Tiếp Tục Đọc Truyện" />

          {/* 3. Bảng Xếp Hạng Tuần Này (Top Views API) */}
          {topViewsComics.length > 0 && (
            <View className="mt-7">
              <View className="flex-row justify-between items-center px-4 mb-3">
                <View className="flex-row items-center">
                  <FontAwesome5 name="trophy" size={15} color="#D4AF37" />
                  <Text className="text-white text-base font-bold tracking-wide ml-2">
                    Bảng Xếp Hạng Tuần Này
                  </Text>
                </View>
              </View>

              <FlatList
                horizontal
                data={topViewsComics.slice(0, 5)}
                renderItem={renderRankedCard}
                keyExtractor={(item) => `rank-${item.seriesId}`}
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                windowSize={3}
                removeClippedSubviews={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              />
            </View>
          )}

          {/* 4. Spotlight Banner (Phim / Truyện Hot nhất từ API) */}
          {spotlightComic && (
            <View className="px-4 mt-7">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => openComicDetail(spotlightComic.seriesId)}
                className="relative rounded-3xl overflow-hidden border border-white/15 bg-zinc-900"
              >
                <Image
                  source={
                    spotlightComic.bannerUrl || spotlightComic.coverUrl
                      ? { uri: spotlightComic.bannerUrl || spotlightComic.coverUrl }
                      : require("@assets/comic4.webp")
                  }
                  className="w-full h-[170px]"
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={["rgba(20,22,25,0.2)", "rgba(20,22,25,0.95)"]}
                  className="absolute inset-0 p-4 justify-end"
                >
                  <View className="bg-[#D4AF37] self-start px-2 py-0.5 rounded-md mb-1.5 flex-row items-center">
                    <Ionicons name="flame" size={12} color="#141619" />
                    <Text className="text-[#141619] text-[10px] font-black uppercase tracking-wider ml-1">
                      SIÊU PHẨM TUẦN NÀY
                    </Text>
                  </View>
                  <Text className="text-white font-extrabold text-lg leading-tight">
                    {spotlightComic.title}
                  </Text>
                  <Text
                    className="text-[#D1D5DB] text-xs mt-1 leading-snug"
                    numberOfLines={2}
                  >
                    {spotlightComic.description || "Truyện tranh hấp dẫn trên TaleX."}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* 5. Truyện Tranh Mới Cập Nhật */}
          <ComicSection
            title="Truyện Tranh Mới Cập Nhật"
            icon={<Ionicons name="flash" size={16} color="#D4AF37" />}
            loading={loading}
            data={latestComics}
            renderItem={renderComicCard}
            emptyText="Chưa có truyện tranh nào"
          />

          {/* 6. Truyện Được Đánh Giá Cao */}
          <ComicSection
            title="Truyện Được Đánh Giá Cao"
            icon={<Ionicons name="star" size={16} color="#D4AF37" />}
            loading={loading}
            data={topRatedComics}
            renderItem={renderComicCard}
            emptyText="Chưa có dữ liệu đánh giá"
          />

          {/* 7. Truyện Được Yêu Thích */}
          <ComicSection
            title="Truyện Được Yêu Thích Nhất"
            icon={<MaterialCommunityIcons name="heart" size={16} color="#D4AF37" />}
            loading={loading}
            data={topLikedComics}
            renderItem={renderComicCard}
            emptyText="Chưa có truyện yêu thích"
            highlighted
          />

          {/* 8. Tất Cả Truyện Tranh Đề Xuất (Cuộn vô tận - Giống Web Comics Feed) */}
          <View className="mt-8 px-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Ionicons name="sparkles" size={18} color="#D4AF37" />
                <Text className="text-white text-base font-black tracking-wide ml-2">
                  Tất Cả Truyện Tranh Đề Xuất
                </Text>
              </View>
            </View>

            {loadingRecs && recommendedComics.length === 0 ? (
              <View className="flex-row flex-wrap justify-between">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <View
                    key={idx}
                    style={{ width: (screenWidth - 44) / 2 }}
                    className="aspect-[2/3] rounded-2xl bg-zinc-800/80 mb-4 p-2"
                  >
                    <SkeletonPulse className="w-full h-full rounded-xl" />
                  </View>
                ))}
              </View>
            ) : recommendedComics.length === 0 ? (
              <View className="py-8 items-center justify-center bg-zinc-900/40 rounded-2xl border border-white/5">
                <Ionicons name="book-outline" size={36} color="#52525B" />
                <Text className="text-zinc-500 text-xs mt-2 font-medium">
                  Chưa có dữ liệu truyện tranh đề xuất
                </Text>
              </View>
            ) : (
              <View>
                <View className="flex-row flex-wrap justify-between">
                  {recommendedComics.map((item, index) => {
                    const sId = item.seriesId;
                    const coverUri = item.coverUrl || item.bannerUrl;
                    const views = item.totalViews ?? item.views ?? item.analyticData?.views ?? 0;

                    return (
                      <TouchableOpacity
                        key={`rec-comic-${sId || index}-${index}`}
                        activeOpacity={0.85}
                        onPress={() => openComicDetail(sId)}
                        style={{ width: (screenWidth - 44) / 2 }}
                        className="mb-4 aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 relative shadow-xl"
                      >
                        {coverUri ? (
                          <Image
                            source={{ uri: coverUri }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-full h-full items-center justify-center bg-zinc-800">
                            <Ionicons name="book-outline" size={32} color="#71717A" />
                          </View>
                        )}

                        {/* Badge TRUYỆN */}
                        <View
                          style={{ backgroundColor: "#2563EB", borderColor: "#60A5FA" }}
                          className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md border z-20 shadow-md"
                        >
                          <Text className="text-white text-[8px] font-black uppercase tracking-wider">
                            TRUYỆN
                          </Text>
                        </View>

                        {/* Age Rating Overlay Badge */}
                        {renderAgeRatingBadge(item.ageRating)}

                        {/* Gradient Overlay */}
                        <LinearGradient
                          colors={["transparent", "rgba(10, 8, 6, 0.95)"]}
                          className="absolute bottom-0 left-0 right-0 h-20 justify-end p-2.5"
                        >
                          <Text
                            className="text-white font-black text-xs leading-tight"
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>

                          <View className="flex-row items-center justify-between mt-1">
                            <View className="flex-row items-center">
                              <Ionicons name="star" size={10} color="#D4AF37" />
                              <Text className="text-white text-[10px] font-black ml-1">
                                {(item.averageRating ?? 0).toFixed(1)}
                              </Text>
                            </View>

                            <View className="flex-row items-center bg-black/60 px-1.5 py-0.5 rounded">
                              <Ionicons name="eye" size={9} color="#38bdf8" />
                              <Text className="text-zinc-300 text-[9px] font-bold ml-1">
                                {formatAnalyticNumber(views)}
                              </Text>
                            </View>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Nút tải thêm đề xuất nếu còn */}
                {hasMoreRecs && (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => loadRecommendedComics(false)}
                    disabled={loadingMoreRecs}
                    className="w-full py-3 mt-2 rounded-2xl bg-zinc-900/80 border border-white/10 items-center justify-center flex-row"
                  >
                    {loadingMoreRecs ? (
                      <SkeletonPulse className="w-24 h-4 rounded" />
                    ) : (
                      <>
                        <Ionicons name="refresh-outline" size={15} color="#D4AF37" style={{ marginRight: 6 }} />
                        <Text className="text-[#D4AF37] font-black text-xs">
                          Khám phá thêm truyện tranh
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </CinematicBackground>
    </SafeAreaView>
  );
}

function ComicSection({
  title,
  icon,
  data,
  renderItem,
  emptyText,
  highlighted,
  loading,
}: {
  title: string;
  icon?: React.ReactNode;
  data: SearchSeriesItem[];
  renderItem: ({ item }: { item: SearchSeriesItem }) => React.ReactElement;
  emptyText: string;
  highlighted?: boolean;
  loading?: boolean;
}) {
  return (
    <View
      className={`mt-7 ${
        highlighted
          ? "bg-[#1E2024]/60 py-5 border-t border-b border-white/5"
          : ""
      }`}
    >
      <View className="flex-row justify-between items-center px-4 mb-3">
        <View className="flex-row items-center">
          {icon && <View className="mr-2">{icon}</View>}
          <Text
            className={`font-bold text-base tracking-wide ${
              highlighted ? "text-[#D4AF37]" : "text-white"
            }`}
          >
            {title}
          </Text>
        </View>
      </View>

      {loading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {Array.from({ length: 5 }).map((_, idx) => (
            <View
              key={idx}
              className="mr-3.5 w-[135px] h-[185px] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 p-2"
            >
              <SkeletonPulse className="w-full h-full rounded-xl" />
            </View>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          horizontal
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.seriesId}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={3}
          removeClippedSubviews={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ListEmptyComponent={
            <Text className="text-[#A1A1AA] text-xs px-4 py-2 italic">
              {emptyText}
            </Text>
          }
        />
      )}
    </View>
  );
}
