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
  HomeFeedData,
  HomeFeedSeries,
} from "@/services/recommendations";
import { formatAnalyticNumber } from "@/services/series";

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

  const fetchFeed = useCallback(async () => {
    try {
      const res = await getHomeFeed({
        promotedLimit: 3,
        trendingLimit: 10,
        newReleasesLimit: 8,
        recentlyUpdatedLimit: 6,
        latestCommunityChoiceLimit: 4,
        communityChoiceLimit: 10,
        randomCategoryLimit: 6,
        subscriptionLimit: 6,
      });
      if (res && res.data) {
        setFeedData(res.data);
      }
    } catch (e) {
      console.warn("Error fetching home feed recommendations:", e);
    } finally {
      setIsLoadingFeed(false);
      setRefreshing(false);
    }
  }, []);

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
    const items = feedData?.trending || [];

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
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSeriesPress(item)}
              className="mr-3.5 w-[140px]"
            >
              <View className="w-full h-[195px] rounded-2xl overflow-hidden bg-zinc-900 border border-orange-500/30 relative shadow-xl">
                <Image
                  source={{ uri: getImageUri(item, true) }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <View className="absolute top-2 left-2 bg-[#FF6B00] border border-amber-300 w-7 h-7 rounded-full items-center justify-center shadow-lg">
                  <Text className="text-white font-black text-xs">
                    #{index + 1}
                  </Text>
                </View>

                {/* Views Counter Badge Bottom Right */}
                <View className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 flex-row items-center border border-white/10 z-10">
                  <Ionicons name="eye" size={9} color="#38bdf8" />
                  <Text className="text-white text-[9px] font-bold ml-1">
                    {formatAnalyticNumber(
                      item.analyticData?.views ?? item.totalViews,
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
                {item.description || "Series thịnh hành"}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  // -------------------------------------------------------------------------
  // 2. New Releases Channel (Kênh 2: Mới Ra Mắt - Limit 8)
  // -------------------------------------------------------------------------
  const renderNewReleasesChannel = () => {
    const items = feedData?.newReleases || [];

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

                <View className="absolute top-2 right-2 bg-sky-500/30 border border-sky-400 px-2 py-0.5 rounded-md backdrop-blur-md">
                  <Text className="text-sky-300 text-[9px] font-black uppercase">
                    🚀 MỚI
                  </Text>
                </View>

                {/* Views Counter Badge Bottom Right */}
                {item.analyticData?.views || item.totalViews ? (
                  <View className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 flex-row items-center border border-white/10 z-10">
                    <Ionicons name="eye" size={9} color="#38bdf8" />
                    <Text className="text-white text-[9px] font-bold ml-1">
                      {formatAnalyticNumber(
                        item.analyticData?.views ?? item.totalViews,
                      )}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text
                className="text-stone-100 font-bold text-xs mt-2 px-0.5"
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                className="text-sky-400 text-[10px] font-semibold mt-0.5 px-0.5"
                numberOfLines={1}
              >
                {item.contentType?.toUpperCase() === "COMIC"
                  ? "Truyện Tranh"
                  : "Phim Bộ"}
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
    const items = feedData?.recentlyUpdated || [];

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
                <View className="absolute top-2 left-2 bg-amber-500 px-2 py-0.5 rounded flex-row items-center">
                  <Ionicons name="flash" size={9} color="#141210" />
                  <Text className="text-[#141210] font-black text-[9px] uppercase ml-1">
                    CẬP NHẬT
                  </Text>
                </View>

                {/* Views Counter Badge Bottom Right */}
                {item.analyticData?.views || item.totalViews ? (
                  <View className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 flex-row items-center border border-white/10 z-10">
                    <Ionicons name="eye" size={9} color="#38bdf8" />
                    <Text className="text-white text-[9px] font-bold ml-1">
                      {formatAnalyticNumber(
                        item.analyticData?.views ?? item.totalViews,
                      )}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text
                className="text-stone-100 font-bold text-xs mt-2 px-0.5"
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                className="text-amber-400 text-[10px] font-semibold mt-0.5 px-0.5"
                numberOfLines={1}
              >
                {formatViews(item.totalViews)}
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
    const items = feedData?.latestCommunityChoice || [];

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
          {renderHorizontalSkeletonRow(3, 270, 145)}
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
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            const isComic = item.contentType?.toUpperCase() === "COMIC";
            const dateStr =
              item.releasedUpdateTime || item.createdAt || item.updatedAt;
            const yearStr = dateStr ? new Date(dateStr).getFullYear() : null;

            return (
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => handleSeriesPress(item)}
                className="mr-3.5 w-[270px] h-[145px] rounded-2xl overflow-hidden border border-purple-500/40 bg-[#1B1425] p-3 flex-row shadow-xl relative"
              >
                {/* Left Column: Vertical Poster Image */}
                <View className="w-[85px] h-[120px] rounded-xl overflow-hidden bg-zinc-900 relative shadow-md">
                  <Image
                    source={{ uri: getImageUri(item, true) }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>

                {/* Right Column: Info & Badges */}
                <View className="flex-1 ml-3 justify-between py-0.5">
                  <View>
                    <View className="flex-row items-center justify-end mb-1.5">
                      {/* Release Year Badge (e.g. 2026) */}
                      {yearStr && !isNaN(yearStr) ? (
                        <View className="bg-black/50 px-2 py-0.5 rounded-md border border-purple-400/40">
                          <Text className="text-purple-200 font-extrabold text-[10px]">
                            {yearStr}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Title */}
                    <Text
                      className="text-white font-black text-xs leading-snug mb-1"
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    {/* Short 2-line Description */}
                    <Text
                      className="text-purple-200/80 text-[11px] font-medium"
                      numberOfLines={2}
                    >
                      {item.description ||
                        "Tác phẩm đề xuất xuất sắc nhất do thành viên cộng đồng bình chọn."}
                    </Text>
                  </View>

                  {/* Bottom Row: View Count + Dynamic Button */}
                  <View className="flex-row items-center justify-between mt-1">
                    <Text className="text-stone-400 text-[10px] font-semibold">
                      {formatViews(item.totalViews)}
                    </Text>
                    <View className="bg-purple-600 px-2.5 py-1 rounded-lg flex-row items-center shadow-md">
                      <Text className="text-white font-black text-[10px]">
                        {isComic ? "Đọc ngay" : "Xem ngay"}
                      </Text>
                    </View>
                  </View>
                </View>
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
    const items = (feedData?.communityChoice || []).slice(0, 5);

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
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleSeriesPress(item)}
              className="mr-4 w-[155px]"
            >
              <View className="w-full h-[215px] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-2xl mb-2.5">
                <Image
                  source={{ uri: getImageUri(item, true) }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>

              {/* Large Gold Italic Rank Number + Title Info Row matching screenshot */}
              <View className="flex-row items-center">
                <Text
                  style={{
                    fontStyle: "italic",
                    fontSize: 32,
                    fontWeight: "900",
                    color: "#D4AF37",
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
    const items = feedData?.randomCategory || [];

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
                <View className="absolute top-2 left-2 bg-pink-500/40 border border-pink-400 px-2 py-0.5 rounded-full flex-row items-center backdrop-blur-md">
                  <FontAwesome5 name="dice" size={8} color="#FBCFE8" />
                  <Text className="text-pink-100 font-extrabold text-[9px] uppercase ml-1">
                    Khám phá
                  </Text>
                </View>

                {/* Views Counter Badge Bottom Right */}
                <View className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 flex-row items-center border border-white/10 z-10">
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
                className="text-pink-400 text-[10px] font-semibold mt-0.5 px-0.5"
                numberOfLines={1}
              >
                {item.contentType?.toUpperCase() === "COMIC"
                  ? "Truyện Tranh"
                  : "Phim Bộ"}
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
    const items = feedData?.accountSubscription || [];

    if (isLoadingFeed || items.length === 0) {
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
                <View className="absolute top-2 left-2 bg-emerald-500/40 border border-emerald-400 px-2 py-0.5 rounded-full flex-row items-center backdrop-blur-md">
                  <Ionicons name="checkmark-circle" size={9} color="#A7F3D0" />
                  <Text className="text-emerald-100 font-extrabold text-[9px] uppercase ml-1">
                    Đã đăng ký
                  </Text>
                </View>

                {/* Views Counter Badge Bottom Right */}
                <View className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 flex-row items-center border border-white/10 z-10">
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
