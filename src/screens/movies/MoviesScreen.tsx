import React, { useState, useCallback } from "react";
import {
  ScrollView,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  FontAwesome5,
  Ionicons,
  Feather,
} from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { navigate as safeNavigateRef } from "@/navigation/navigationRef";

import Header from "@components/Header";
import MovieCarousel from "@components/MovieCarousel";
import {
  MovieItem,
  trendingMovies,
  animeHotMovies,
  newSeriesMovies,
} from "./movieMockData";
import { getPublicSeries, SeriesItem } from "@/services/series";

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
      const res = await getPublicSeries(1, 20);
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
    }, [])
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
          />
        );
      } else {
        stars.push(
          <Ionicons
            key={i}
            name="star-outline"
            size={11}
            color="#52525B"
            style={{ marginRight: 2 }}
          />
        );
      }
    }

    return <View className="flex-row items-center mt-1">{stars}</View>;
  };

  // Render Movie Card theo mẫu chuẩn Disney+ / Max
  const renderMovieCard = ({ item }: { item: MovieItem }) => (
    <TouchableOpacity
      className="mr-4 w-[135px]"
      activeOpacity={0.85}
      onPress={() => openMovieDetail(item.id)}
    >
      <View className="w-full h-[180px] rounded-2xl overflow-hidden bg-zinc-800 border border-white/10 shadow-md">
        <Image
          source={item.image}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      <Text
        className="text-white text-xs font-bold mt-2 leading-tight"
        numberOfLines={1}
      >
        {item.title}
      </Text>

      <Text
        className="text-[#A1A1AA] text-[11px] mt-0.5"
        numberOfLines={1}
      >
        {item.regionAndGenre?.split("·")[0]?.trim() || item.category || "TaleX Studio"}
      </Text>

      {render5Stars(item.rating)}
    </TouchableOpacity>
  );

  // Render API Series Card
  const renderApiSeriesCard = ({ item }: { item: SeriesItem }) => {
    const imageSource =
      item.coverUrl || item.bannerUrl || item.thumbnailUrl
        ? { uri: item.coverUrl || item.bannerUrl || item.thumbnailUrl }
        : require("@assets/movie2.jpg");

    return (
      <TouchableOpacity
        className="mr-4 w-[135px]"
        activeOpacity={0.85}
        onPress={() =>
          openMovieDetail(item.seriesId || item.id, { seriesItem: item })
        }
      >
        <View className="w-full h-[180px] rounded-2xl overflow-hidden bg-zinc-800 border border-white/10 shadow-md">
          <Image
            source={imageSource}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        <Text
          className="text-white text-xs font-bold mt-2 leading-tight"
          numberOfLines={1}
        >
          {item.title}
        </Text>

        <Text className="text-[#7C766B] text-[10px] mt-0.5" numberOfLines={1}>
          {item.category || "Phim bộ"}
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

        {/* ================= SECTION 1: PHIM BỘ HỆ THỐNG ================= */}
        <View className="mt-6">
          <View className="flex-row justify-between items-center px-4 mb-3">
            <View className="flex-row items-center">
              <FontAwesome5 name="film" size={15} color="#D4AF37" />
              <Text className="text-white font-bold text-base tracking-wide ml-2">
                Phim Bộ Hệ Thống
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigateTo("Search")}
              activeOpacity={0.7}
            >
              <Text className="text-[#A1A1AA] text-xs font-medium">
                Xem thêm
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="px-4 py-4">
              <Text className="text-[#A1A1AA] text-xs italic">
                Đang tải danh sách phim...
              </Text>
            </View>
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
        <TouchableOpacity onPress={onSeeMore} activeOpacity={0.7}>
          <Text className="text-[#A1A1AA] text-xs font-medium">Xem thêm</Text>
        </TouchableOpacity>
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

