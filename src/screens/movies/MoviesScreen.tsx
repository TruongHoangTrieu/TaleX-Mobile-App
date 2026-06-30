import React, { useState, useEffect } from "react";
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
import { FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

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
  const navigation = useNavigation<any>();
  const [activeCategory, setActiveCategory] = useState("Đề xuất");
  const [apiSeries, setApiSeries] = useState<SeriesItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicSeries(1, 20)
      .then((res) => {
        if (res && res.code === 200 && res.data && res.data.content) {
          setApiSeries(res.data.content);
        }
      })
      .catch((err) => {
        console.error("Error fetching public series:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const filterContent = (list: MovieItem[]) => {
    if (activeCategory === "Đề xuất") return list;
    return list.filter((item) => item.category === activeCategory);
  };

  const renderMovieCard = ({ item }: { item: MovieItem }) => (
    <TouchableOpacity
      className="mr-4 w-[210px]"
      activeOpacity={0.85}
      onPress={() => navigation.navigate("MovieDetailScreen", { movieId: item.id })}
    >
      <View className="w-full h-[120px] rounded-2xl overflow-hidden bg-zinc-800 relative">
        <Image
          source={item.image}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute bottom-2 right-2 w-7 h-7 bg-[#D4AF37] rounded-full items-center justify-center">
          <FontAwesome5 name="play" size={9} color="#141210" />
        </View>
      </View>

      <Text className="text-white text-xs font-semibold mt-2" numberOfLines={1}>
        {item.title}
      </Text>

      {item.subtitle && (
        <Text className="text-[#7C766B] text-[10px] mt-0.5" numberOfLines={1}>
          {item.subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderApiSeriesCard = ({ item }: { item: SeriesItem }) => {
    const imageSource = (item.coverUrl || item.bannerUrl || item.thumbnailUrl)
      ? { uri: item.coverUrl || item.bannerUrl || item.thumbnailUrl }
      : require("@assets/movie2.jpg");

    return (
      <TouchableOpacity
        className="mr-4 w-[210px]"
        activeOpacity={0.85}
        onPress={() => {
          navigation.navigate("MovieDetailScreen", {
            movieId: item.seriesId || item.id,
            seriesItem: item,
          });
        }}
      >
        <View className="w-full h-[120px] rounded-2xl overflow-hidden bg-zinc-800 relative">
          <Image
            source={imageSource}
            className="w-full h-full"
            resizeMode="cover"
          />
          <View className="absolute bottom-2 right-2 w-7 h-7 bg-[#D4AF37] rounded-full items-center justify-center">
            <FontAwesome5 name="play" size={9} color="#141210" />
          </View>
        </View>

        <Text className="text-white text-xs font-semibold mt-2" numberOfLines={1}>
          {item.title}
        </Text>

        <Text className="text-[#7C766B] text-[10px] mt-0.5" numberOfLines={1}>
          {item.category || "Phim bộ"}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-[#141210]">
      <StatusBar barStyle="light-content" translucent />

      <Header
        titleType="text"
        titleText="Phim"
        showCategories={true}
        activeCategory={activeCategory}
        onCategoryChange={(cat) => setActiveCategory(cat)}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ================= HERO CAROUSEL ================= */}
        <View className="mt-3">
          <MovieCarousel />
        </View>

        {/* ================= SECTION SYSTEM SERIES (FROM API) ================= */}
        <View className="mt-7">
          <View className="flex-row justify-between items-center px-4 mb-3">
            <Text className="text-white font-bold text-base">🎬 Phim bộ mới (Hệ thống)</Text>
            <Text className="text-[#7C766B] text-xs">Xem thêm</Text>
          </View>

          {loading ? (
            <View className="px-4 py-4">
              <Text className="text-[#7C766B] text-xs italic">Đang tải phim bộ...</Text>
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
                <Text className="text-[#7C766B] text-xs px-4 py-2 italic">
                  Không có phim bộ nào từ hệ thống
                </Text>
              }
            />
          )}
        </View>

        {/* ================= SECTION 1 (Đã áp dụng bộ lọc) ================= */}
        <View className="mt-7">
          <View className="flex-row justify-between items-center px-4 mb-3">
            <Text className="text-white font-bold text-base">🔥 Đang thịnh hành</Text>
            <Text className="text-[#7C766B] text-xs">Xem thêm</Text>
          </View>

          <FlatList
            horizontal
            data={filterContent(trendingMovies)}
            renderItem={renderMovieCard}
            keyExtractor={(i) => "trend-" + i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            ListEmptyComponent={<Text className="text-[#7C766B] text-xs px-4 py-2 italic">Không có phim thuộc thể loại này</Text>}
          />
        </View>

        {/* ================= SECTION 2 (Đã áp dụng bộ lọc) ================= */}
        <View className="mt-7">
          <View className="flex-row justify-between items-center px-4 mb-3">
            <Text className="text-white font-bold text-base">🔥 Anime Hot</Text>
            <Text className="text-[#7C766B] text-xs">Xem thêm</Text>
          </View>

          <FlatList
            horizontal
            data={filterContent(animeHotMovies)}
            renderItem={renderMovieCard}
            keyExtractor={(i) => "anime-" + i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            ListEmptyComponent={<Text className="text-[#7C766B] text-xs px-4 py-2 italic">Không có phim thuộc thể loại này</Text>}
          />
        </View>

        {/* ================= SECTION 3 (Đã áp dụng bộ lọc) ================= */}
        <View className="mt-7">
          <View className="flex-row justify-between items-center px-4 mb-3">
            <Text className="text-white font-bold text-base">🎬 Phim bộ mới</Text>
            <Text className="text-[#7C766B] text-xs">Xem thêm</Text>
          </View>

          <FlatList
            horizontal
            data={filterContent(newSeriesMovies)}
            renderItem={renderMovieCard}
            keyExtractor={(i) => "series-" + i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            ListEmptyComponent={<Text className="text-[#7C766B] text-xs px-4 py-2 italic">Không có phim thuộc thể loại này</Text>}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
