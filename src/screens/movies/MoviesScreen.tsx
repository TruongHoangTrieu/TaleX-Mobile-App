import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  ScrollView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Animated,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { navigate as safeNavigateRef } from "@/navigation/navigationRef";

import Header from "@components/Header";
import MovieCarousel from "@components/MovieCarousel";
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

export default function MoviesScreen() {
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
  const [latestMovies, setLatestMovies] = useState<SearchSeriesItem[]>([]);
  const [topViewsMovies, setTopViewsMovies] = useState<SearchSeriesItem[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<SearchSeriesItem[]>([]);
  const [topLikedMovies, setTopLikedMovies] = useState<SearchSeriesItem[]>([]);

  // 5. Tất Cả Phim Đề Xuất (Recommendation Feed Infinite API)
  const [recommendedMovies, setRecommendedMovies] = useState<HomeFeedSeries[]>([]);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(true);
  const [loadingMoreRecs, setLoadingMoreRecs] = useState<boolean>(false);
  const [hasMoreRecs, setHasMoreRecs] = useState<boolean>(true);
  const sessionIdRef = useRef<string>(generateSessionId("sess_movies"));

  const loadRecommendedMovies = useCallback(async (reset = false) => {
    if (reset) {
      sessionIdRef.current = generateSessionId("sess_movies");
      setLoadingRecs(true);
      setHasMoreRecs(true);
    } else {
      setLoadingMoreRecs(true);
    }

    try {
      const currentOffset = reset ? 0 : recommendedMovies.length;
      const recs = await getRecommendationFeed({
        sessionId: sessionIdRef.current,
        pageType: "MOVIES",
        limit: 15,
        offset: currentOffset,
      });

      // Lọc nghiêm ngặt chỉ lấy Phim (VIDEO)
      let movieRecs = Array.isArray(recs)
        ? recs.filter(
            (r) =>
              !r.contentType ||
              r.contentType.toUpperCase() === "VIDEO" ||
              r.contentType.toUpperCase() === "MOVIE",
          )
        : [];

      // Fallback nếu kết quả ít
      if (movieRecs.length < 5) {
        const fallbackRes = await searchPublicSeries({
          contentType: "VIDEO",
          status: "PUBLISHED",
          sortBy: "views",
          sortDirection: "DESC",
          page: Math.floor(currentOffset / 10),
          size: 10,
        });
        if (fallbackRes?.data?.content) {
          movieRecs = [...movieRecs, ...(fallbackRes.data.content as any[])];
        }
      }

      if (reset) {
        setRecommendedMovies(movieRecs);
      } else {
        setRecommendedMovies((prev) => {
          const seen = new Set(prev.map((p) => p.seriesId));
          const newItems = movieRecs.filter((r) => !seen.has(r.seriesId));
          return [...prev, ...newItems];
        });
      }
      if (movieRecs.length < 5) {
        setHasMoreRecs(false);
      }
    } catch (err) {
      console.warn("[MoviesScreen] Error fetching recommended movies feed:", err);
    } finally {
      setLoadingRecs(false);
      setLoadingMoreRecs(false);
    }
  }, [recommendedMovies.length]);

  const loadMoviesData = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      await Promise.all([
        searchPublicSeries({
          contentType: "VIDEO",
          status: "PUBLISHED",
          sortBy: "releasedupdatetime",
          sortDirection: "DESC",
          page: 0,
          size: 10,
        }).then((res) => {
          if (res?.data?.content) setLatestMovies(res.data.content);
        }),
        searchPublicSeries({
          contentType: "VIDEO",
          status: "PUBLISHED",
          sortBy: "views",
          sortDirection: "DESC",
          page: 0,
          size: 10,
        }).then((res) => {
          if (res?.data?.content) setTopViewsMovies(res.data.content);
        }),
        searchPublicSeries({
          contentType: "VIDEO",
          status: "PUBLISHED",
          sortBy: "averagerating",
          sortDirection: "DESC",
          page: 0,
          size: 10,
        }).then((res) => {
          if (res?.data?.content) setTopRatedMovies(res.data.content);
        }),
        searchPublicSeries({
          contentType: "VIDEO",
          status: "PUBLISHED",
          sortBy: "likes",
          sortDirection: "DESC",
          page: 0,
          size: 10,
        }).then((res) => {
          if (res?.data?.content) setTopLikedMovies(res.data.content);
        }),
        loadRecommendedMovies(true),
      ]);
    } catch (err) {
      console.error("[MoviesScreen] Error fetching real API movies:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMoviesData(false);
    }, []),
  );

  const openMovieDetail = (movieId: string, extra?: any) => {
    navigateTo("MovieDetailScreen", { movieId, ...extra });
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

  // Render Movie Card theo mẫu chuẩn TaleX
  const renderMovieCard = ({ item }: { item: SearchSeriesItem }) => {
    const coverUri = item.coverUrl || item.bannerUrl;
    const imageSource = coverUri
      ? { uri: coverUri }
      : require("@assets/movie2.jpg");

    return (
      <TouchableOpacity
        className="mr-4 w-[135px]"
        activeOpacity={0.85}
        onPress={() => openMovieDetail(item.seriesId, { seriesItem: item })}
      >
        <View className="w-full h-[180px] rounded-2xl overflow-hidden bg-zinc-800 border border-white/10 shadow-md relative">
          {/* Top Left: PHIM (Solid Crimson Red #DC2626) */}
          <View
            style={{ backgroundColor: "#DC2626", borderColor: "#F87171" }}
            className="absolute top-2 left-2 px-2.5 py-0.5 rounded-lg border z-20 shadow-lg"
          >
            <Text className="text-white text-[9px] font-black uppercase tracking-wider">
              PHIM
            </Text>
          </View>

          {/* Top Right: Age Rating Badge */}
          {renderAgeRatingBadge(item.ageRating)}

          <Image
            source={imageSource}
            className="w-full h-full"
            resizeMode="cover"
          />

          {/* Views Counter Badge Bottom Right */}
          <View
            style={{ zIndex: 20 }}
            className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 flex-row items-center border border-white/10 z-20 shadow-md"
          >
            <Ionicons name="eye" size={9} color="#38bdf8" />
            <Text className="text-white text-[9px] font-bold ml-1">
              {formatAnalyticNumber(item.totalViews ?? 0)}
            </Text>
          </View>
        </View>

        <Text
          className="text-stone-100 font-bold text-xs mt-2 px-0.5"
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text
          className="text-[#7C766B] text-[10px] font-semibold mt-0.5 px-0.5"
          numberOfLines={1}
        >
          {item.description || item.creatorName || "Phim bộ TaleX"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-black" style={{ backgroundColor: "#000000" }}>
      <StatusBar barStyle="light-content" translucent />

      <CinematicBackground>
        <Header titleType="text" titleText="Phim" showCategories={false} />

        <ScrollView
          className="flex-1"
          alwaysBounceVertical={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 130 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadMoviesData(true)}
              tintColor="#D4AF37"
            />
          }
        >
          {/* 1. HERO CAROUSEL PHIM */}
          <View className="mt-3">
            <MovieCarousel />
          </View>

          {/* 2. TIẾP TỤC XEM PHIM SECTION */}
          <RecentWatchSection filterType="VIDEO" title="Tiếp Tục Xem Phim" />

          {/* 3. PHIM BỘ MỚI PHÁT HÀNH (API) */}
          <MovieSection
            title="Phim Bộ Mới Phát Hành"
            icon={<FontAwesome5 name="film" size={15} color="#D4AF37" />}
            loading={loading}
            data={latestMovies}
            renderItem={renderMovieCard}
            emptyText="Chưa có phim bộ mới nào"
          />

          {/* 4. PHIM ĐANG THỊNH HÀNH (Top Views API) */}
          <MovieSection
            title="Phim Đang Thịnh Hành"
            icon={<Ionicons name="flame" size={16} color="#D4AF37" />}
            loading={loading}
            data={topViewsMovies}
            renderItem={renderMovieCard}
            emptyText="Chưa có phim thịnh hành"
          />

          {/* 5. PHIM ĐÁNH GIÁ CAO NHẤT (Top Rating API) */}
          <MovieSection
            title="Phim Đánh Giá Cao Nhất"
            icon={<Ionicons name="star" size={16} color="#D4AF37" />}
            loading={loading}
            data={topRatedMovies}
            renderItem={renderMovieCard}
            emptyText="Chưa có phim đánh giá cao"
          />

          {/* 6. PHIM ĐƯỢC YÊU THÍCH (Top Likes API) */}
          <MovieSection
            title="Phim Được Yêu Thích Nhất"
            icon={<MaterialCommunityIcons name="heart" size={16} color="#D4AF37" />}
            loading={loading}
            data={topLikedMovies}
            renderItem={renderMovieCard}
            emptyText="Chưa có phim yêu thích"
          />

          {/* 7. TẤT CẢ PHIM ĐỀ XUẤT (Cuộn vô tận - Giống Web Series Feed) */}
          <View className="mt-8 px-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Ionicons name="sparkles" size={18} color="#D4AF37" />
                <Text className="text-white text-base font-black tracking-wide ml-2">
                  Tất Cả Phim Đề Xuất
                </Text>
              </View>
            </View>

            {loadingRecs && recommendedMovies.length === 0 ? (
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
            ) : recommendedMovies.length === 0 ? (
              <View className="py-8 items-center justify-center bg-zinc-900/40 rounded-2xl border border-white/5">
                <FontAwesome5 name="film" size={36} color="#52525B" />
                <Text className="text-zinc-500 text-xs mt-2 font-medium">
                  Chưa có dữ liệu phim đề xuất
                </Text>
              </View>
            ) : (
              <View>
                <View className="flex-row flex-wrap justify-between">
                  {recommendedMovies.map((item, index) => {
                    const sId = item.seriesId;
                    const coverUri = item.coverUrl || item.bannerUrl;
                    const views = item.totalViews ?? item.views ?? item.analyticData?.views ?? 0;
                    const recCardWidth = (screenWidth - 44) / 2;
                    const recCardHeight = recCardWidth * 1.45;

                    return (
                      <TouchableOpacity
                        key={`rec-movie-${sId || index}-${index}`}
                        activeOpacity={0.85}
                        onPress={() => openMovieDetail(sId)}
                        style={{ width: recCardWidth, height: recCardHeight }}
                        className="mb-4 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 relative shadow-xl"
                      >
                        {coverUri ? (
                          <Image
                            source={{ uri: coverUri }}
                            style={StyleSheet.absoluteFillObject}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-full h-full items-center justify-center bg-zinc-800">
                            <FontAwesome5 name="film" size={32} color="#71717A" />
                          </View>
                        )}

                        {/* Badge PHIM */}
                        <View
                          style={{ backgroundColor: "#DC2626", borderColor: "#F87171" }}
                          className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md border z-20 shadow-md"
                        >
                          <Text className="text-white text-[8px] font-black uppercase tracking-wider">
                            PHIM
                          </Text>
                        </View>

                        {/* Age Rating Overlay Badge */}
                        {renderAgeRatingBadge(item.ageRating)}

                        {/* Gradient Overlay with Title, Star Rating, and Views */}
                        <LinearGradient
                          colors={["transparent", "rgba(10, 8, 6, 0.75)", "rgba(10, 8, 6, 0.98)"]}
                          locations={[0, 0.35, 1]}
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 85,
                            justifyContent: "flex-end",
                            padding: 10,
                            zIndex: 20,
                          }}
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

                            <View className="flex-row items-center bg-black/75 px-1.5 py-0.5 rounded border border-white/10">
                              <Ionicons name="eye" size={9} color="#38bdf8" />
                              <Text className="text-zinc-200 text-[9px] font-bold ml-1">
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
                    onPress={() => loadRecommendedMovies(false)}
                    disabled={loadingMoreRecs}
                    className="w-full py-3.5 mt-3 mb-10 rounded-2xl bg-zinc-900/90 border border-[#D4AF37]/30 items-center justify-center flex-row shadow-lg"
                  >
                    {loadingMoreRecs ? (
                      <SkeletonPulse className="w-24 h-4 rounded" />
                    ) : (
                      <>
                        <Ionicons name="refresh-outline" size={15} color="#D4AF37" style={{ marginRight: 6 }} />
                        <Text className="text-[#D4AF37] font-black text-xs">
                          Khám phá thêm phim
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

function MovieSection({
  title,
  icon,
  data,
  renderItem,
  emptyText,
  loading,
}: {
  title: string;
  icon?: React.ReactNode;
  data: SearchSeriesItem[];
  renderItem: ({ item }: { item: SearchSeriesItem }) => React.ReactElement;
  emptyText?: string;
  loading?: boolean;
}) {
  return (
    <View className="mt-6">
      <View className="flex-row justify-between items-center px-4 mb-3">
        <View className="flex-row items-center">
          {icon && <View className="mr-2">{icon}</View>}
          <Text className="text-white font-bold text-base tracking-wide">
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
              className="mr-4 w-[135px] h-[180px] rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 p-2"
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
          keyExtractor={(i) => "movie-" + i.seriesId}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={3}
          removeClippedSubviews={true}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ListEmptyComponent={
            <Text className="text-[#A1A1AA] text-xs px-4 py-2 italic">
              {emptyText || "Chưa có nội dung"}
            </Text>
          }
        />
      )}
    </View>
  );
}
