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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5, Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { navigate as safeNavigateRef } from "@/navigation/navigationRef";

import Header from "@components/Header";
import MovieCarousel from "@components/MovieCarousel";
import RecentWatchSection from "@/components/RecentWatchSection";
import {
  MovieItem,
  trendingMovies,
  animeHotMovies,
  newSeriesMovies,
} from "./movieMockData";
import { getPublicSeries, SeriesItem, formatAnalyticNumber } from "@/services/series";

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

  const [activeCategory, setActiveCategory] = useState("Đề xuất");
  const [apiSeries, setApiSeries] = useState<SeriesItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMovies = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    try {
      const res = await getPublicSeries(1, 100);
      if (res && res.code === 200 && res.data && res.data.content) {
        const filtered = res.data.content.filter(
          (item) =>
            item.contentType === "VIDEO" || item.contentType === "video",
        );
        setApiSeries(filtered);
      }
    } catch (err) {
      console.error("Error fetching public series:", err);
    } finally {
      if (!isRefreshing) setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadMovies(false);
    }, []),
  );

  const filterContent = (list: MovieItem[]) => {
    if (activeCategory === "Đề xuất") return list;
    return list.filter((item) => item.category === activeCategory);
  };

  const openMovieDetail = (movieId: string, extra?: any) => {
    navigateTo("MovieDetailScreen", { movieId, ...extra });
  };

  // Helper render 5 sao theo đánh giá
  const render5Stars = (ratingStr?: string) => {
    const score = ratingStr ? parseFloat(ratingStr) : 9.5;
    const activeStars = Math.min(5, Math.max(1, Math.round((score / 10) * 5)));

    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= activeStars) {
        stars.push(
          <Ionicons
            key={i}
            name="star"
            size={11}
            color="#FFFFFF"
            style={{ marginRight: 2 }}
          />,
        );
      } else {
        stars.push(
          <Ionicons
            key={i}
            name="star-outline"
            size={11}
            color="#52525B"
            style={{ marginRight: 2 }}
          />,
        );
      }
    }

    return <View className="flex-row items-center mt-1">{stars}</View>;
  };

  const getBadgeBg = (ageRatingStr?: string) => {
    if (!ageRatingStr) return "bg-emerald-600/95";
    const str = ageRatingStr.toUpperCase();
    if (str.includes("18")) return "bg-red-600/95";
    if (str.includes("16")) return "bg-amber-600/95";
    if (str.includes("13")) return "bg-blue-600/95";
    return "bg-amber-500/95";
  };

  // Render Movie Card theo mẫu chuẩn Disney+ / Max
  const renderMovieCard = ({ item }: { item: MovieItem }) => {
    const ageRatingStr = item.ageRating ? String(item.ageRating).trim() : null;
    return (
      <TouchableOpacity
        className="mr-4 w-[135px]"
        activeOpacity={0.85}
        onPress={() => openMovieDetail(item.id)}
      >
        <View className="w-full h-[180px] rounded-2xl overflow-hidden bg-zinc-800 border border-white/10 shadow-md relative">
          <Image
            source={item.image}
            className="w-full h-full"
            resizeMode="cover"
          />

          {/* Age Rating Badge Top Right */}
          {ageRatingStr && (
            <View className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md ${getBadgeBg(ageRatingStr)} shadow-md z-10`}>
              <Text className="text-white text-[9px] font-black tracking-tight">
                {ageRatingStr}
              </Text>
            </View>
          )}

          {/* Views Counter Badge Bottom Right */}
          <View className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 flex-row items-center border border-white/10 z-10">
            <Ionicons name="eye" size={9} color="#38bdf8" />
            <Text className="text-white text-[9px] font-bold ml-1">
              {formatAnalyticNumber(item.analyticData?.views ?? item.views ?? item.totalViews ?? 1250)}
            </Text>
          </View>
        </View>

        <Text
          className="text-white text-xs font-bold mt-2 leading-tight"
          numberOfLines={1}
        >
          {item.title}
        </Text>

        <Text className="text-[#A1A1AA] text-[11px] mt-0.5" numberOfLines={1}>
          {item.description || item.regionAndGenre?.split("·")[0]?.trim() || item.category || ""}
        </Text>

        {render5Stars(item.rating)}
      </TouchableOpacity>
    );
  };

  // Render API Series Card
  const renderApiSeriesCard = ({ item }: { item: SeriesItem }) => {
    const imageSource =
      item.coverUrl || item.bannerUrl || item.thumbnailUrl
        ? { uri: item.coverUrl || item.bannerUrl || item.thumbnailUrl }
        : require("@assets/movie2.jpg");
    const rawRating = (item as any).ageRating || (item as any).targetAudience || (item as any).contentRating;
    const ageRatingStr = rawRating && typeof rawRating === "string" && rawRating.trim() ? rawRating.trim() : null;

    return (
      <TouchableOpacity
        className="mr-4 w-[135px]"
        activeOpacity={0.85}
        onPress={() =>
          openMovieDetail(item.seriesId || item.id || "", { seriesItem: item })
        }
      >
        <View className="w-full h-[180px] rounded-2xl overflow-hidden bg-zinc-800 border border-white/10 shadow-md relative">
          <Image
            source={imageSource}
            className="w-full h-full"
            resizeMode="cover"
          />

          {/* Age Rating Badge Top Right */}
          {ageRatingStr && (
            <View className={`absolute top-2 right-2 px-1.5 py-0.5 rounded-md ${getBadgeBg(ageRatingStr)} shadow-md z-10`}>
              <Text className="text-white text-[9px] font-black tracking-tight">
                {ageRatingStr}
              </Text>
            </View>
          )}

          {/* Views Counter Badge Bottom Right */}
          <View className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/75 flex-row items-center border border-white/10 z-10">
            <Ionicons name="eye" size={9} color="#38bdf8" />
            <Text className="text-white text-[9px] font-bold ml-1">
              {formatAnalyticNumber(item.analyticData?.views ?? item.totalViews ?? item.views ?? 0)}
            </Text>
          </View>
        </View>

        <Text
          className="text-white text-xs font-bold mt-2 leading-tight"
          numberOfLines={1}
        >
          {item.title}
        </Text>

        <Text className="text-[#7C766B] text-[10px] mt-0.5" numberOfLines={1}>
          {item.description || item.category || ""}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-[#141619]">
      <StatusBar barStyle="light-content" translucent />

      <Header titleType="text" titleText="Phim" showCategories={false} />

      <ScrollView
        className="flex-1"
        alwaysBounceVertical={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
      >
        {/* ================= HERO CAROUSEL PHIM VỚI BỘ 3 NÚT BẤM NETFLIX ================= */}
        <View className="mt-3">
          <MovieCarousel />
        </View>

        {/* TIẾP TỤC XEM PHIM SECTION */}
        <RecentWatchSection filterType="VIDEO" title="Tiếp Tục Xem Phim" />

        {/* ================= SECTION 1: PHIM BỘ HỆ THỐNG ================= */}
        <View className="mt-6">
          <View className="flex-row justify-between items-center px-4 mb-3">
            <View className="flex-row items-center">
              <FontAwesome5 name="film" size={15} color="#D4AF37" />
              <Text className="text-white font-bold text-base tracking-wide ml-2">
                Phim Bộ Hệ Thống
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
              data={apiSeries}
              renderItem={renderApiSeriesCard}
              keyExtractor={(i) => "api-series-" + (i.seriesId || i.id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              ListEmptyComponent={
                <Text className="text-[#A1A1AA] text-xs px-4 py-2 italic">
                  Không có phim bộ hệ thống nào
                </Text>
              }
            />
          )}
        </View>

        {/* ================= SECTION 2: PHIM ĐANG THỊNH HÀNH ================= */}
        <MovieSection
          title="Phim Đang Thịnh Hành"
          icon={<Ionicons name="flame" size={16} color="#D4AF37" />}
          data={filterContent(trendingMovies)}
          renderItem={renderMovieCard}
          onSeeMore={() => navigateTo("Search")}
        />

        {/* ================= SECTION 3: ANIME NỔI BẬT ================= */}
        <MovieSection
          title="Anime Nổi Bật"
          icon={<Ionicons name="sparkles" size={16} color="#D4AF37" />}
          data={filterContent(animeHotMovies)}
          renderItem={renderMovieCard}
          onSeeMore={() => navigateTo("Search")}
        />

        {/* ================= SECTION 4: PHIM BỘ CHỌN LỌC ================= */}
        <MovieSection
          title="Phim Bộ Chọn Lọc"
          icon={<Feather name="tv" size={16} color="#D4AF37" />}
          data={filterContent(newSeriesMovies)}
          renderItem={renderMovieCard}
          onSeeMore={() => navigateTo("Search")}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function MovieSection({
  title,
  icon,
  data,
  renderItem,
  onSeeMore,
}: {
  title: string;
  icon?: React.ReactNode;
  data: MovieItem[];
  renderItem: ({ item }: { item: MovieItem }) => React.ReactElement;
  onSeeMore?: () => void;
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

      <FlatList
        horizontal
        data={data}
        renderItem={renderItem}
        keyExtractor={(i) => "movie-" + i.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </View>
  );
}
