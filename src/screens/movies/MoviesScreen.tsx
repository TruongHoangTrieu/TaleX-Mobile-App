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
import { searchPublicSeries, SearchSeriesItem } from "@/services/series";

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

  const loadMoviesData = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [resLatest, resViews, resRating, resLikes] = await Promise.all([
        searchPublicSeries({
          contentType: "VIDEO",
          status: "PUBLISHED",
          sortBy: "releasedupdatetime",
          sortDirection: "DESC",
          page: 0,
          size: 10,
        }),
        searchPublicSeries({
          contentType: "VIDEO",
          status: "PUBLISHED",
          sortBy: "views",
          sortDirection: "DESC",
          page: 0,
          size: 10,
        }),
        searchPublicSeries({
          contentType: "VIDEO",
          status: "PUBLISHED",
          sortBy: "averagerating",
          sortDirection: "DESC",
          page: 0,
          size: 10,
        }),
        searchPublicSeries({
          contentType: "VIDEO",
          status: "PUBLISHED",
          sortBy: "likes",
          sortDirection: "DESC",
          page: 0,
          size: 10,
        }),
      ]);

      if (resLatest?.data?.content) setLatestMovies(resLatest.data.content);
      if (resViews?.data?.content) setTopViewsMovies(resViews.data.content);
      if (resRating?.data?.content) setTopRatedMovies(resRating.data.content);
      if (resLikes?.data?.content) setTopLikedMovies(resLikes.data.content);
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

        <Text className="text-[#7C766B] text-[10px] mt-1.5 px-0.5" numberOfLines={1}>
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
