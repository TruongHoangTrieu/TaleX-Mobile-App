import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ScrollView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Animated,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  FontAwesome5,
  Feather,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootNavigator";
import { useAuth } from "@/context/AuthContext";
import { useUserFeature } from "@/hooks/useUserFeature";

import Header from "@components/Header";
import BannerCarousel from "@components/BannerCarousel";
import RecentWatchSection from "@/components/RecentWatchSection";
import CinematicBackground from "@/components/CinematicBackground";
import {
  getHomeFeed,
  getRecommendationFeed,
  generateSessionId,
  HomeFeedData,
  HomeFeedSeries,
} from "@/services/recommendations";
import { formatAnalyticNumber } from "@/services/series";
import { Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=1400&auto=format&fit=crop";

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

function formatViews(value?: number) {
  if (typeof value !== "number" || value <= 0) return "0 lượt xem";
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M lượt xem`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k lượt xem`;
  }
  return `${value} lượt xem`;
}

function getImageUri(series?: HomeFeedSeries, isCover = false) {
  if (!series) return FALLBACK_IMAGE;
  if (isCover) {
    return series.coverUrl || series.bannerUrl || FALLBACK_IMAGE;
  }
  return series.bannerUrl || series.coverUrl || FALLBACK_IMAGE;
}

function uniqueSeries(items: HomeFeedSeries[] = []) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.seriesId || item.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState("all");

  const { isAuthenticated } = useAuth();
  const { isMissingProfile, refetch: refetchUserFeature } = useUserFeature();
  const [dismissedModal, setDismissedModal] = useState<boolean>(false);

  const [feedData, setFeedData] = useState<HomeFeedData | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [recommendedFeed, setRecommendedFeed] = useState<HomeFeedSeries[]>([]);
  const [loadingRecs, setLoadingRecs] = useState<boolean>(true);
  const [loadingMoreRecs, setLoadingMoreRecs] = useState<boolean>(false);
  const [hasMoreRecs, setHasMoreRecs] = useState<boolean>(true);
  const sessionIdRef = useRef<string>(generateSessionId("sess_home"));

  const loadRecommendedFeed = useCallback(async (reset = false) => {
    if (reset) {
      sessionIdRef.current = generateSessionId("sess_home");
      setLoadingRecs(true);
      setHasMoreRecs(true);
    } else {
      setLoadingMoreRecs(true);
    }

    try {
      const currentOffset = reset ? 0 : recommendedFeed.length;
      const recs = await getRecommendationFeed({
        sessionId: sessionIdRef.current,
        pageType: "HOME",
        limit: 10,
        offset: currentOffset,
      });

      if (Array.isArray(recs)) {
        if (reset) {
          setRecommendedFeed(recs);
        } else {
          setRecommendedFeed((prev) => {
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
      console.warn("Error fetching recommended feed:", err);
    } finally {
      setLoadingRecs(false);
      setLoadingMoreRecs(false);
    }
  }, [recommendedFeed.length]);

  const fetchFeed = useCallback(async () => {
    try {
      const [res] = await Promise.all([
        getHomeFeed({
          promotedLimit: 3,
          trendingLimit: 10,
          newReleasesLimit: 8,
          recentlyUpdatedLimit: 6,
          latestCommunityChoiceLimit: 4,
          communityChoiceLimit: 10,
          randomCategoryLimit: 6,
          subscriptionLimit: 6,
        }),
        loadRecommendedFeed(true),
      ]);
      if (res && res.data) {
        setFeedData(res.data);
      }
    } catch (e) {
      console.warn("Error fetching home feed recommendations:", e);
    } finally {
      setIsLoadingFeed(false);
      setRefreshing(false);
    }
  }, [loadRecommendedFeed]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFeed();
  };

  useEffect(() => {
    if (isAuthenticated) {
      setDismissedModal(false);
      refetchUserFeature();
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        refetchUserFeature();
      }
    }, [isAuthenticated, refetchUserFeature]),
  );

  const showOnboardingModal =
    isAuthenticated && isMissingProfile && !dismissedModal;

  const handleSeriesPress = (series: HomeFeedSeries) => {
    const isComic = series.contentType?.toUpperCase() === "COMIC";
    if (isComic) {
      (navigation.navigate as any)("ComicDetailScreen", {
        comicId: series.seriesId,
        comicTitle: series.title,
        comicImage: getImageUri(series, true),
      });
    } else {
      (navigation.navigate as any)("MovieDetailScreen", {
        movieId: series.seriesId,
        movieTitle: series.title,
        movieImage: getImageUri(series, false),
      });
    }
  };

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
        <Text className="text-white text-[9px] font-black tracking-wider uppercase">{label}</Text>
      </View>
    );
  };

  const renderContentTypeBadge = (contentType?: string) => {
    const isComic = contentType?.toUpperCase() === "COMIC";
    return (
      <View
        style={{
          backgroundColor: isComic ? "#2563EB" : "#DC2626",
          borderColor: isComic ? "#60A5FA" : "#F87171",
        }}
        className="absolute top-2 left-2 px-2 py-0.5 rounded-lg border z-20 shadow-lg"
      >
        <Text className="text-white text-[9px] font-black uppercase tracking-wider">
          {isComic ? "TRUYỆN" : "PHIM"}
        </Text>
      </View>
    );
  };

  const renderSectionHeader = (title: string, iconNode: React.ReactNode) => (
    <View className="flex-row items-center px-4 mb-3">
      {iconNode}
      <Text className="text-white text-base font-bold tracking-wide ml-2">
        {title}
      </Text>
    </View>
  );

  const renderHorizontalSkeletonRow = (
    count = 5,
    cardWidth = 140,
    cardHeight = 195,
  ) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
    >
      {Array.from({ length: count }).map((_, idx) => (
        <View
          key={idx}
          style={{ width: cardWidth, height: cardHeight }}
          className="mr-3.5 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 p-2"
        >
          <SkeletonPulse className="w-full h-full rounded-xl" />
        </View>
      ))}
    </ScrollView>
  );

  // -------------------------------------------------------------------------
  // 1. Trending Channel (Kênh 1: Xu Hướng Thịnh Hành - Limit 10)
  // -------------------------------------------------------------------------
  const renderTrendingChannel = () => {
    const items = uniqueSeries(feedData?.trending);

    if (isLoadingFeed || items.length === 0) {
      return (
        <View className="mt-6">
          {renderSectionHeader(
            "Series Thịnh Hành",
            <FontAwesome5 name="fire" size={16} color="#FF6B00" />,
          )}
          {renderHorizontalSkeletonRow(5, 140, 195)}
        </View>
      );
    }

    return (
      <View className="mt-6">
        {renderSectionHeader(
          "Series Thịnh Hành",
          <FontAwesome5 name="fire" size={16} color="#FF6B00" />,
        )}
        <FlatList
          horizontal
          data={items}
          keyExtractor={(item, index) =>
            `trend-${item.seriesId || "item"}-${index}`
          }
          showsHorizontalScrollIndicator={false}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={3}
          removeClippedSubviews={true}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item, index }) => {
            const rank = index + 1;
            const rankColors = ["#D4AF37", "#E2E8F0", "#CD7F32"];
            const rankColor = rank <= 3 ? rankColors[index] : "#52525B";

            return (
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => handleSeriesPress(item)}
                className="mr-3 w-[155px]"
              >
                {/* Poster & Giant Rank Number Container */}
                <View className="relative w-full h-[185px]">
                  {/* Poster Thumbnail shifted right */}
                  <View className="w-[125px] h-[185px] ml-[28px] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 relative shadow-2xl">
                    <Image
                      source={{ uri: getImageUri(item, true) }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />

                    {/* Top Left: TRUYỆN / PHIM */}
                    {renderContentTypeBadge(item.contentType)}

                    {/* Top Right: Độ tuổi */}
                    {renderAgeRatingBadge(item.ageRating)}

                    {/* Views Counter Badge Bottom Right */}
                    <View
                      style={{ zIndex: 20 }}
                      className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 flex-row items-center border border-white/10 z-20 shadow-md"
                    >
                      <Ionicons name="eye" size={9} color="#38bdf8" />
                      <Text className="text-white text-[9px] font-bold ml-1">
                        {formatAnalyticNumber(
                          item.analyticData?.views ?? item.totalViews,
                        )}
                      </Text>
                    </View>
                  </View>

                  {/* Giant 3D Rank Number overlapping bottom-left (Netflix Style) */}
                  <View
                    pointerEvents="none"
                    className="absolute -bottom-3 left-0 z-20 justify-end"
                  >
                    {/* Shadow Layer for 3D depth */}
                    <Text
                      style={{
                        fontSize: 78,
                        fontWeight: "900",
                        fontStyle: "italic",
                        color: "#000000",
                        position: "absolute",
                        left: 2,
                        top: 2,
                        textShadowColor: "rgba(0,0,0,0.95)",
                        textShadowOffset: { width: 3, height: 3 },
                        textShadowRadius: 6,
                        lineHeight: 84,
                      }}
                    >
                      {rank}
                    </Text>

                    {/* Foreground Colored Layer */}
                    <Text
                      style={{
                        fontSize: 78,
                        fontWeight: "900",
                        fontStyle: "italic",
                        color: rankColor,
                        lineHeight: 84,
                        textShadowColor: "rgba(0,0,0,0.9)",
                        textShadowOffset: { width: 1, height: 2 },
                        textShadowRadius: 4,
                      }}
                    >
                      {rank}
                    </Text>
                  </View>
                </View>

                {/* Title and Description shifted to align with poster */}
                <View className="ml-[28px] w-[125px] mt-2">
                  <Text
                    className="text-stone-100 font-bold text-xs leading-tight"
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text
                    className="text-[#7C766B] text-[10px] font-semibold mt-0.5"
                    numberOfLines={1}
                  >
                    {item.description || "Series thịnh hành"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  // -------------------------------------------------------------------------
  // 2. New Releases Channel (Kênh 2: Mới Ra Mắt - Limit 8)
  // -------------------------------------------------------------------------
  const renderNewReleasesChannel = () => {
    const items = uniqueSeries(feedData?.newReleases);

    if (isLoadingFeed || items.length === 0) {
      return (
        <View className="mt-6">
          {renderSectionHeader(
            "Tác Phẩm Mới Ra Mắt",
            <Ionicons name="rocket" size={18} color="#38BDF8" />,
          )}
          {renderHorizontalSkeletonRow(5, 140, 190)}
        </View>
      );
    }

    return (
      <View className="mt-6">
        {renderSectionHeader(
          "Tác Phẩm Mới Ra Mắt",
          <Ionicons name="rocket" size={18} color="#38BDF8" />,
        )}
        <FlatList
          horizontal
          data={items}
          keyExtractor={(item, index) =>
            `new-${item.seriesId || "item"}-${index}`
          }
          showsHorizontalScrollIndicator={false}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={3}
          removeClippedSubviews={true}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSeriesPress(item)}
              className="mr-3.5 w-[140px]"
            >
              <View className="w-full h-[190px] rounded-2xl overflow-hidden bg-zinc-900 border border-sky-500/30 relative shadow-xl">
                <Image
                  source={{ uri: getImageUri(item, true) }}
                  className="w-full h-full"
                  resizeMode="cover"
                />

                {/* Top Left: TRUYỆN / PHIM */}
                {renderContentTypeBadge(item.contentType)}

                {/* Top Right: Độ tuổi */}
                {renderAgeRatingBadge(item.ageRating)}

                {/* Views Counter Badge Bottom Right */}
                <View
                  style={{ zIndex: 20 }}
                  className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 flex-row items-center border border-white/10 z-20 shadow-md"
                >
                  <Ionicons name="eye" size={9} color="#38bdf8" />
                  <Text className="text-white text-[9px] font-bold ml-1">
                    {formatAnalyticNumber(
                      item.analyticData?.views ?? item.totalViews ?? 0,
                    )}
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
                {item.description || "Tác phẩm mới ra mắt"}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  // -------------------------------------------------------------------------
  // 3. Recently Updated Channel (Kênh 3: Vừa Cập Nhật - Limit 6)
  // -------------------------------------------------------------------------
  const renderRecentlyUpdatedChannel = () => {
    const items = uniqueSeries(feedData?.recentlyUpdated);

    if (isLoadingFeed || items.length === 0) {
      return (
        <View className="mt-6">
          {renderSectionHeader(
            "Siêu Phẩm Cập Nhật",
            <Ionicons name="flash" size={18} color="#F59E0B" />,
          )}
          {renderHorizontalSkeletonRow(5, 140, 190)}
        </View>
      );
    }

    return (
      <View className="mt-6">
        {renderSectionHeader(
          "Siêu Phẩm Cập Nhật",
          <Ionicons name="flash" size={18} color="#F59E0B" />,
        )}
        <FlatList
          horizontal
          data={items}
          keyExtractor={(item, index) =>
            `upd-${item.seriesId || "item"}-${index}`
          }
          showsHorizontalScrollIndicator={false}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={3}
          removeClippedSubviews={true}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSeriesPress(item)}
              className="mr-3.5 w-[140px]"
            >
              <View className="w-full h-[190px] rounded-2xl overflow-hidden bg-zinc-900 border border-amber-500/30 relative shadow-xl">
                <Image
                  source={{ uri: getImageUri(item, true) }}
                  className="w-full h-full"
                  resizeMode="cover"
                />

                {/* Top Left: TRUYỆN / PHIM */}
                {renderContentTypeBadge(item.contentType)}

                {/* Top Right: Độ tuổi */}
                {renderAgeRatingBadge(item.ageRating)}

                {/* Views Counter Badge Bottom Right */}
                <View
                  style={{ zIndex: 20 }}
                  className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 flex-row items-center border border-white/10 z-20 shadow-md"
                >
                  <Ionicons name="eye" size={9} color="#38bdf8" />
                  <Text className="text-white text-[9px] font-bold ml-1">
                    {formatAnalyticNumber(
                      item.analyticData?.views ?? item.totalViews ?? 0,
                    )}
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
                {item.description || "Siêu phẩm cập nhật mới"}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  // -------------------------------------------------------------------------
  // 4. Latest Community Choice Channel (Đề Xuất Hot Từ Cộng Đồng)
  // -------------------------------------------------------------------------
  const renderLatestCommunityChoiceChannel = () => {
    const items = uniqueSeries(feedData?.latestCommunityChoice);

    if (isLoadingFeed || items.length === 0) {
      return (
        <View className="mt-6">
          {renderSectionHeader(
            "Đề Xuất Hot Từ Cộng Đồng",
            <MaterialCommunityIcons
              name="diamond-stone"
              size={18}
              color="#A855F7"
            />,
          )}
          {renderHorizontalSkeletonRow(3, 295, 175)}
        </View>
      );
    }

    return (
      <View className="mt-6">
        {renderSectionHeader(
          "Đề Xuất Từ Cộng Đồng",
          <MaterialCommunityIcons
            name="diamond-stone"
            size={18}
            color="#A855F7"
          />,
        )}
        <FlatList
          horizontal
          data={items}
          keyExtractor={(item, index) =>
            `latestcomm-${item.seriesId || "item"}-${index}`
          }
          showsHorizontalScrollIndicator={false}
          initialNumToRender={3}
          maxToRenderPerBatch={3}
          windowSize={3}
          removeClippedSubviews={true}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            const isComic = item.contentType?.toUpperCase() === "COMIC";
            const coverUri = getImageUri(item, false) || getImageUri(item, true);

            return (
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => handleSeriesPress(item)}
                className="mr-3.5 w-[295px] h-[175px] rounded-3xl overflow-hidden border border-purple-500/40 bg-zinc-900 shadow-2xl relative"
              >
                {/* Background Image (Cover/Banner) */}
                <Image
                  source={{ uri: coverUri }}
                  style={StyleSheet.absoluteFillObject}
                  className="w-full h-full"
                  resizeMode="cover"
                />

                {/* Top Left: TRUYỆN / PHIM */}
                {renderContentTypeBadge(item.contentType)}

                {/* Top Right: Độ tuổi */}
                {renderAgeRatingBadge(item.ageRating)}

                {/* Bottom Overlay Gradient */}
                <LinearGradient
                  colors={[
                    "transparent",
                    "rgba(15, 10, 25, 0.5)",
                    "rgba(15, 10, 25, 0.95)",
                  ]}
                  locations={[0, 0.4, 1]}
                  style={[
                    StyleSheet.absoluteFillObject,
                    {
                      justifyContent: "flex-end",
                      padding: 14,
                      paddingBottom: 12,
                    },
                  ]}
                >
                  <View style={{ marginTop: "auto" }}>
                    <Text
                      className="text-white font-extrabold text-sm leading-snug mb-1 shadow-md"
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text
                      className="text-purple-200/80 text-[11px] font-medium mb-2.5"
                      numberOfLines={2}
                    >
                      {item.description ||
                        "Tác phẩm đề xuất xuất sắc nhất do cộng đồng bình chọn."}
                    </Text>

                    {/* Bottom Row: Views + Read/Watch Now Button */}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center bg-black/60 px-2 py-0.5 rounded-full border border-white/10">
                        <Ionicons name="eye" size={9} color="#38bdf8" />
                        <Text className="text-stone-300 text-[9px] font-bold ml-1">
                          {formatViews(item.totalViews)}
                        </Text>
                      </View>
                      <View className="bg-purple-600 px-3 py-1 rounded-xl flex-row items-center shadow-lg">
                        <Ionicons
                          name={isComic ? "book-outline" : "play"}
                          size={10}
                          color="#FFFFFF"
                          style={{ marginRight: 4 }}
                        />
                        <Text className="text-white font-black text-[10px]">
                          {isComic ? "Đọc ngay" : "Xem ngay"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  };

  // -------------------------------------------------------------------------
  // 5. Community Choice Channel (Top 5 series được cộng đồng yêu thích)
  // -------------------------------------------------------------------------
  const renderCommunityChoiceChannel = () => {
    const items = uniqueSeries(feedData?.communityChoice).slice(0, 5);

    if (isLoadingFeed || items.length === 0) {
      return (
        <View className="mt-6">
          {renderSectionHeader(
            "Top 5 Series Được Cộng Đồng Yêu Thích",
            <FontAwesome5 name="star" size={15} color="#D4AF37" />,
          )}
          {renderHorizontalSkeletonRow(5, 155, 215)}
        </View>
      );
    }

    return (
      <View className="mt-6">
        {renderSectionHeader(
          "Top 5 Series Được Cộng Đồng Yêu Thích",
          <FontAwesome5 name="star" size={15} color="#D4AF37" />,
        )}
        <FlatList
          horizontal
          data={items}
          keyExtractor={(item, index) =>
            `top5comm-${item.seriesId || "item"}-${index}`
          }
          showsHorizontalScrollIndicator={false}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={3}
          removeClippedSubviews={true}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSeriesPress(item)}
              className="mr-4 w-[155px]"
            >
              <View className="w-full h-[215px] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl mb-2.5 relative">
                <Image
                  source={{ uri: getImageUri(item, true) }}
                  className="w-full h-full"
                  resizeMode="cover"
                />

                {/* Top Left: TRUYỆN / PHIM */}
                {renderContentTypeBadge(item.contentType)}

                {/* Top Right: Độ tuổi */}
                {renderAgeRatingBadge(item.ageRating)}

                {/* Views Counter Badge Bottom Right */}
                <View
                  style={{ zIndex: 20 }}
                  className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 flex-row items-center border border-white/10 z-20 shadow-md"
                >
                  <Ionicons name="eye" size={9} color="#38bdf8" />
                  <Text className="text-white text-[9px] font-bold ml-1">
                    {formatAnalyticNumber(
                      item.analyticData?.views ?? item.totalViews,
                    )}
                  </Text>
                </View>
              </View>

              {/* Large Gold Italic Rank Number + Title Info Row */}
              <View className="flex-row items-center">
                <Text
                  style={{
                    fontStyle: "italic",
                    fontSize: 32,
                    fontWeight: "900",
                    color: index === 0 ? "#D4AF37" : index === 1 ? "#E2E8F0" : index === 2 ? "#CD7F32" : "#71717A",
                    marginRight: 8,
                    lineHeight: 36,
                  }}
                >
                  {index + 1}
                </Text>

                <View className="flex-1 justify-center">
                  <Text
                    className="text-white font-black text-xs leading-tight"
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text
                    className="text-stone-400 text-[11px] font-medium mt-0.5"
                    numberOfLines={1}
                  >
                    {item.description ||
                      (item.contentType?.toUpperCase() === "COMIC"
                        ? "Truyện Tranh"
                        : "Phim Bộ")}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  // -------------------------------------------------------------------------
  // 6. Random Category Channel (Kênh 6: Đổi Vị Khám Phá - Limit 6)
  // -------------------------------------------------------------------------
  const renderRandomCategoryChannel = () => {
    const items = uniqueSeries(feedData?.randomCategory);

    if (isLoadingFeed || items.length === 0) {
      return (
        <View className="mt-6">
          {renderSectionHeader(
            "Khám Phá Bất Ngờ",
            <FontAwesome5 name="dice" size={16} color="#EC4899" />,
          )}
          {renderHorizontalSkeletonRow(5, 140, 190)}
        </View>
      );
    }

    return (
      <View className="mt-6">
        {renderSectionHeader(
          "Khám Phá Bất Ngờ",
          <FontAwesome5 name="dice" size={16} color="#EC4899" />,
        )}
        <FlatList
          horizontal
          data={items}
          keyExtractor={(item, index) =>
            `rand-${item.seriesId || "item"}-${index}`
          }
          showsHorizontalScrollIndicator={false}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={3}
          removeClippedSubviews={true}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSeriesPress(item)}
              className="mr-3.5 w-[140px]"
            >
              <View className="w-full h-[190px] rounded-2xl overflow-hidden bg-zinc-900 border border-pink-500/30 relative shadow-xl">
                <Image
                  source={{ uri: getImageUri(item, true) }}
                  className="w-full h-full"
                  resizeMode="cover"
                />

                {/* Top Left: TRUYỆN / PHIM */}
                {renderContentTypeBadge(item.contentType)}

                {/* Top Right: Độ tuổi */}
                {renderAgeRatingBadge(item.ageRating)}

                {/* Views Counter Badge Bottom Right */}
                <View
                  style={{ zIndex: 20 }}
                  className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 flex-row items-center border border-white/10 z-20 shadow-md"
                >
                  <Ionicons name="eye" size={9} color="#38bdf8" />
                  <Text className="text-white text-[9px] font-bold ml-1">
                    {formatAnalyticNumber(
                      item.analyticData?.views ?? item.totalViews ?? 0,
                    )}
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
                {item.description || "Khám phá bất ngờ"}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  // -------------------------------------------------------------------------
  // 7. Account Subscription Channel (Kênh 7: Kênh Theo Dõi - Limit 6)
  // -------------------------------------------------------------------------
  const renderAccountSubscriptionChannel = () => {
    if (!isAuthenticated) return null;

    const items = uniqueSeries(feedData?.accountSubscription);

    if (isLoadingFeed) {
      return (
        <View className="mt-6">
          {renderSectionHeader(
            "Kênh Bạn Theo Dõi",
            <Ionicons name="notifications-outline" size={18} color="#10B981" />,
          )}
          {renderHorizontalSkeletonRow(5, 140, 190)}
        </View>
      );
    }

    if (items.length === 0) {
      return null;
    }

    return (
      <View className="mt-6">
        {renderSectionHeader(
          "Kênh Bạn Theo Dõi",
          <Ionicons name="notifications-outline" size={18} color="#10B981" />,
        )}
        <FlatList
          horizontal
          data={items}
          keyExtractor={(item, index) =>
            `sub-${item.seriesId || "item"}-${index}`
          }
          showsHorizontalScrollIndicator={false}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={3}
          removeClippedSubviews={true}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSeriesPress(item)}
              className="mr-3.5 w-[140px]"
            >
              <View className="w-full h-[190px] rounded-2xl overflow-hidden bg-zinc-900 border border-emerald-500/30 relative shadow-xl">
                <Image
                  source={{ uri: getImageUri(item, true) }}
                  className="w-full h-full"
                  resizeMode="cover"
                />

                {/* Top Left: TRUYỆN / PHIM */}
                {renderContentTypeBadge(item.contentType)}

                {/* Top Right: Độ tuổi */}
                {renderAgeRatingBadge(item.ageRating)}

                {/* Views Counter Badge Bottom Right */}
                <View
                  style={{ zIndex: 20 }}
                  className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 flex-row items-center border border-white/10 z-20 shadow-md"
                >
                  <Ionicons name="eye" size={9} color="#38bdf8" />
                  <Text className="text-white text-[9px] font-bold ml-1">
                    {formatAnalyticNumber(
                      item.analyticData?.views ?? item.totalViews ?? 0,
                    )}
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
                className="text-emerald-400 text-[10px] font-semibold mt-0.5 px-0.5"
                numberOfLines={1}
              >
                {item.creatorName || "Channel theo dõi"}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  // -------------------------------------------------------------------------
  // 8. Tất Cả Nội Dung Đề Xuất (Infinite Recommendation Feed - Giống Web Home)
  // -------------------------------------------------------------------------
  const renderAllRecommendationsChannel = () => {
    return (
      <View className="mt-8 px-4">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Ionicons name="sparkles" size={18} color="#D4AF37" />
            <Text className="text-white text-base font-black tracking-wide ml-2">
              Tất Cả Nội Dung Đề Xuất
            </Text>
          </View>
        </View>

        {loadingRecs && recommendedFeed.length === 0 ? (
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
        ) : recommendedFeed.length === 0 ? null : (
          <View>
            <View className="flex-row flex-wrap justify-between">
              {recommendedFeed.map((item, index) => {
                const sId = item.seriesId;
                const coverUri = getImageUri(item, true);
                const views = item.totalViews ?? item.views ?? item.analyticData?.views ?? 0;
                const recCardWidth = (screenWidth - 44) / 2;
                const recCardHeight = recCardWidth * 1.45;

                return (
                  <TouchableOpacity
                    key={`rec-home-${sId || index}-${index}`}
                    activeOpacity={0.85}
                    onPress={() => handleSeriesPress(item)}
                    style={{ width: recCardWidth, height: recCardHeight }}
                    className="mb-4 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 relative shadow-xl"
                  >
                    <Image
                      source={{ uri: coverUri }}
                      style={StyleSheet.absoluteFillObject}
                      className="w-full h-full"
                      resizeMode="cover"
                    />

                    {/* Top Left: TRUYỆN / PHIM */}
                    {renderContentTypeBadge(item.contentType)}

                    {/* Top Right: Độ tuổi */}
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
                onPress={() => loadRecommendedFeed(false)}
                disabled={loadingMoreRecs}
                className="w-full py-3.5 mt-3 mb-10 rounded-2xl bg-zinc-900/90 border border-[#D4AF37]/30 items-center justify-center flex-row shadow-lg"
              >
                {loadingMoreRecs ? (
                  <SkeletonPulse className="w-24 h-4 rounded" />
                ) : (
                  <>
                    <Ionicons name="refresh-outline" size={15} color="#D4AF37" style={{ marginRight: 6 }} />
                    <Text className="text-[#D4AF37] font-black text-xs">
                      Khám phá thêm nội dung
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      edges={[]}
      className="flex-1 bg-black"
      style={{ backgroundColor: "#000000" }}
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <CinematicBackground>
        {/* Header */}
        <Header />

        <ScrollView
          className="flex-1"
          alwaysBounceVertical={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#D4AF37"
              colors={["#D4AF37"]}
            />
          }
        >
          {/* Banner Hero Carousel using Promoted Items (Max 3) */}
          <BannerCarousel
            promotedItems={feedData?.promoted?.slice(0, 3)}
            navigation={navigation}
          />

          {/* RECENTLY WATCHED / CONTINUE WATCHING SECTION */}
          <RecentWatchSection filterType="ALL" />

          {/* 7 REMAINING RECOMMENDATION CHANNELS FROM API */}
          {renderTrendingChannel()}
          {renderNewReleasesChannel()}
          {renderRecentlyUpdatedChannel()}
          {renderLatestCommunityChoiceChannel()}
          {renderCommunityChoiceChannel()}
          {renderRandomCategoryChannel()}
          {renderAccountSubscriptionChannel()}

          {/* 8. TẤT CẢ NỘI DUNG ĐỀ XUẤT (INFINITE SCROLL FEED) */}
          {renderAllRecommendationsChannel()}
        </ScrollView>
      </CinematicBackground>

      {/* Onboarding Dialog Overlay */}
      {showOnboardingModal && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { zIndex: 99999, elevation: 99999 },
          ]}
          className="bg-black/80 items-center justify-center p-5"
        >
          <View className="w-full max-w-sm bg-[#161618] rounded-3xl p-6 border border-[#D4AF37]/30 shadow-2xl items-center">
            <View className="w-14 h-14 rounded-2xl bg-[#D4AF37]/15 items-center justify-center mb-4 border border-[#D4AF37]/30">
              <Ionicons name="sparkles" size={28} color="#D4AF37" />
            </View>

            <Text className="text-white text-xl font-black text-center mb-2">
              Cá nhân hóa gu của bạn!
            </Text>

            <Text className="text-zinc-400 text-sm text-center leading-5 mb-6">
              Hãy cho TaleX biết sở thích của bạn để chúng tôi tự động đề xuất
              những bộ phim và câu chuyện phù hợp nhất.
            </Text>

            <TouchableOpacity
              onPress={() => {
                setDismissedModal(true);
                navigation.navigate("OnboardingScreen");
              }}
              activeOpacity={0.85}
              className="w-full"
            >
              <LinearGradient
                colors={["#E5A93C", "#D4AF37"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 14,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text className="text-black font-black text-base">
                  Cài đặt ngay
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
