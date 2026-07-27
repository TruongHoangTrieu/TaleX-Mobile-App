import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  StatusBar,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  Octicons,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

// Import dữ liệu thực từ TaleX App (Movies & Comics)
import {
  trendingMovies,
  newSeriesMovies,
  animeHotMovies,
} from "@screens/movies/movieMockData";
import {
  newComics,
  recommendedComics,
  comboComics,
} from "@screens/comics/comicMockData";
import { getPublicSeries, SeriesItem } from "@/services/series";

export interface SearchItem {
  id: string;
  title: string;
  category: "Phim" | "Truyện";
  subCategory?: string;
  genre: string[];
  year: string;
  country: string;
  rating: number;
  image: any;
  info?: string;
}

// Chuyển đổi dữ liệu chuẩn TaleX về SearchItem
const parseMovieItem = (item: any, subCategory = "Phim bộ"): SearchItem => {
  const genres = item.regionAndGenre
    ? item.regionAndGenre.split("·").map((s: string) => s.trim())
    : [item.category || "Phim bộ"];

  return {
    id: item.id || `movie-${Math.random()}`,
    title: item.title,
    category: "Phim",
    subCategory,
    genre: genres.length > 0 ? genres : ["Tiên Hiệp", "Hành động"],
    year: item.year || "2024",
    country: genres[0] || "Trung Quốc",
    rating: item.rating ? parseFloat(item.rating) : 9.6,
    image:
      typeof item.image === "number" || typeof item.image === "object"
        ? item.image
        : require("@assets/movie2.jpg"),
    info: item.subtitle || `${item.category || "Phim bộ"} · Vietsub`,
  };
};

const parseComicItem = (item: any): SearchItem => {
  return {
    id: item.id || `comic-${Math.random()}`,
    title: item.title,
    category: "Truyện",
    subCategory: "Truyện tranh",
    genre: [item.category || "Shounen", "Truyện tranh"],
    year: "2024",
    country: "Nhật Bản",
    rating: item.rating ? parseFloat(item.rating) : 9.8,
    image:
      typeof item.image === "number" || typeof item.image === "object"
        ? item.image
        : require("@assets/comic4.webp"),
    info: item.tag ? `Chương ${item.tag}` : "Truyện tranh · Đang cập nhật",
  };
};

// Kho dữ liệu đa dạng phong phú cho TaleX
const buildFullDatabase = (): SearchItem[] => {
  const list: SearchItem[] = [];

  // Phim bộ hot
  trendingMovies.forEach((m) => list.push(parseMovieItem(m, "Phim bộ")));
  newSeriesMovies.forEach((m) => list.push(parseMovieItem(m, "Phim bộ")));

  // Phim chiếu rạp / Anime
  animeHotMovies.forEach((m) => list.push(parseMovieItem(m, "Phim chiếu rạp")));

  // Truyện tranh hot
  newComics.forEach((c) => list.push(parseComicItem(c)));
  recommendedComics.forEach((c) => list.push(parseComicItem(c)));
  comboComics.forEach((c) => list.push(parseComicItem(c)));

  // Lọc trùng lặp theo ID
  const uniqueMap = new Map<string, SearchItem>();
  list.forEach((item) => {
    if (!uniqueMap.has(item.id)) {
      uniqueMap.set(item.id, item);
    }
  });

  return Array.from(uniqueMap.values());
};

const GENRE_LIST = [
  "Tiên Hiệp",
  "Hành động",
  "Tình cảm",
  "Trinh thám",
  "Shounen",
  "Hài hước",
  "Xuyên không",
  "Kinh dị",
];

const YEAR_LIST = ["Tất cả", "2026", "2024", "2023"];
const COUNTRY_LIST = ["Tất cả", "Trung Quốc", "Nhật Bản", "Hàn Quốc", "Mỹ"];

export default function SearchScreen() {
  const navigation = useNavigation<any>();

  // Dữ liệu nội dung
  const [database, setDatabase] = useState<SearchItem[]>(buildFullDatabase());

  // Trạng thái input & Focus
  const [searchQuery, setSearchQuery] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Modal bộ lọc
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Bộ lọc tạm thời (Phim / Truyện)
  const [tempCategory, setTempCategory] = useState<"Phim" | "Truyện">("Phim");
  const [tempGenres, setTempGenres] = useState<string[]>([]);
  const [tempYear, setTempYear] = useState<string>("Tất cả");
  const [tempCountry, setTempCountry] = useState<string>("Tất cả");
  const [tempSort, setTempSort] = useState<string>("Đề xuất");

  // Bộ lọc chính thức
  const [appliedCategory, setAppliedCategory] = useState<"Phim" | "Truyện" | null>(null);
  const [appliedGenres, setAppliedGenres] = useState<string[]>([]);
  const [appliedYear, setAppliedYear] = useState<string | null>(null);
  const [appliedCountry, setAppliedCountry] = useState<string | null>(null);
  const [appliedSort, setAppliedSort] = useState<string>("Đề xuất");

  // Đồng bộ API thực từ Server TaleX nếu có
  useEffect(() => {
    const fetchApiSeries = async () => {
      try {
        const res = await getPublicSeries(1, 50);
        if (res && res.data && res.data.content) {
          const apiItems: SearchItem[] = res.data.content.map((item: SeriesItem) => {
            const isComic = item.contentType === "COMIC" || item.contentType === "comic";
            const imageSource =
              item.coverUrl || item.thumbnailUrl || item.bannerUrl
                ? { uri: item.coverUrl || item.thumbnailUrl || item.bannerUrl }
                : isComic
                ? require("@assets/comic4.webp")
                : require("@assets/movie2.jpg");

            return {
              id: item.seriesId || item.id || `api-${Math.random()}`,
              title: item.title,
              category: isComic ? "Truyện" : "Phim",
              subCategory: isComic ? "Truyện tranh" : "Phim bộ",
              genre: item.category ? [item.category] : [isComic ? "Truyện tranh" : "Phim bộ"],
              year: item.year || "2024",
              country: item.regionAndGenre?.split("·")[0]?.trim() || "TaleX",
              rating: item.rating ? parseFloat(item.rating) : 9.5,
              image: imageSource,
              info: item.category || (isComic ? "Truyện tranh TaleX" : "Phim bộ TaleX"),
            };
          });

          if (apiItems.length > 0) {
            setDatabase((prev) => {
              const combined = [...apiItems, ...prev];
              const map = new Map<string, SearchItem>();
              combined.forEach((i) => map.set(i.id, i));
              return Array.from(map.values());
            });
          }
        }
      } catch (err) {
        console.log("Dùng kho dữ liệu local chuẩn TaleX:", err);
      }
    };

    fetchApiSeries();
  }, []);

  // Số lượng bộ lọc đang dùng
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (appliedCategory) count++;
    if (appliedGenres.length > 0) count += appliedGenres.length;
    if (appliedYear && appliedYear !== "Tất cả") count++;
    if (appliedCountry && appliedCountry !== "Tất cả") count++;
    return count;
  }, [appliedCategory, appliedGenres, appliedYear, appliedCountry]);

  // Áp dụng bộ lọc
  const handleApplyFilter = () => {
    setAppliedCategory(tempCategory);
    setAppliedGenres([...tempGenres]);
    setAppliedYear(tempYear);
    setAppliedCountry(tempCountry);
    setAppliedSort(tempSort);
    setIsFilterModalVisible(false);
  };

  // Reset bộ lọc
  const handleResetFilter = () => {
    setTempCategory("Phim");
    setTempGenres([]);
    setTempYear("Tất cả");
    setTempCountry("Tất cả");
    setTempSort("Đề xuất");

    setAppliedCategory(null);
    setAppliedGenres([]);
    setAppliedYear(null);
    setAppliedCountry(null);
    setAppliedSort("Đề xuất");
  };

  // Xóa 1 chip bộ lọc lẻ
  const removeFilterChip = (type: "category" | "genre" | "year" | "country", value?: string) => {
    if (type === "category") {
      setAppliedCategory(null);
    } else if (type === "genre" && value) {
      const next = appliedGenres.filter((g) => g !== value);
      setAppliedGenres(next);
      setTempGenres(next);
    } else if (type === "year") {
      setAppliedYear(null);
    } else if (type === "country") {
      setAppliedCountry(null);
    }
  };

  // Lọc nội dung theo từ khóa + bộ lọc
  const filteredResults = useMemo(() => {
    return database.filter((item) => {
      // 1. Lọc theo từ khóa
      if (searchQuery.trim() !== "") {
        const queryLower = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(queryLower);
        const matchCategory = item.category.toLowerCase().includes(queryLower);
        const matchGenre = item.genre.some((g) => g.toLowerCase().includes(queryLower));
        if (!matchTitle && !matchCategory && !matchGenre) return false;
      }

      // 2. Lọc theo Phim / Truyện
      if (appliedCategory && item.category !== appliedCategory) {
        return false;
      }

      // 3. Lọc theo thể loại
      if (appliedGenres.length > 0) {
        const hasGenreMatch = appliedGenres.some((g) =>
          item.genre.some((ig) => ig.toLowerCase().includes(g.toLowerCase()))
        );
        if (!hasGenreMatch) return false;
      }

      // 4. Lọc theo năm
      if (appliedYear && appliedYear !== "Tất cả" && item.year !== appliedYear) {
        return false;
      }

      // 5. Lọc theo quốc gia
      if (appliedCountry && appliedCountry !== "Tất cả" && !item.country.includes(appliedCountry)) {
        return false;
      }

      return true;
    });
  }, [database, searchQuery, appliedCategory, appliedGenres, appliedYear, appliedCountry]);

  // Phân chia dữ liệu Phim và Truyện khi gõ từ khóa
  const moviesResults = useMemo(() => filteredResults.filter((i) => i.category === "Phim"), [filteredResults]);
  const comicsResults = useMemo(() => filteredResults.filter((i) => i.category === "Truyện"), [filteredResults]);

  // Mở chi tiết Phim hoặc Truyện
  const handleOpenDetail = (item: SearchItem) => {
    if (item.category === "Phim") {
      navigation.navigate("MovieDetailScreen", { movieId: item.id, seriesItem: item });
    } else {
      navigation.navigate("ComicDetailScreen", { comicId: item.id });
    }
  };

  // Render Huy hiệu điểm IMDb (Vàng TaleX)
  const renderImdbBadge = (rating: number) => (
    <View className="absolute top-2 left-2 flex-row items-center bg-[#141210]/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-[#D4AF37]/30 z-10">
      <View className="bg-[#D4AF37] px-1 rounded-xs mr-1">
        <Text className="text-[#141210] text-[8px] font-black tracking-tighter">IMDb</Text>
      </View>
      <Text className="text-white text-[10px] font-bold">{rating.toFixed(1)}</Text>
    </View>
  );

  // Render Thẻ Card Poster Đứng (Chuẩn đẹp mắt như mẫu)
  const renderVerticalPosterCard = ({ item }: { item: SearchItem }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => handleOpenDetail(item)}
      className="mr-3.5 mb-4 w-[135px]"
    >
      <View className="w-full h-[190px] rounded-2xl overflow-hidden bg-[#1E1B18] border border-white/10 relative shadow-lg">
        {renderImdbBadge(item.rating)}
        <Image source={item.image} className="w-full h-full" resizeMode="cover" />
        <LinearGradient
          colors={["transparent", "rgba(20, 18, 16, 0.95)"]}
          className="absolute bottom-0 left-0 right-0 h-16 justify-end p-2.5"
        >
          <Text className="text-white text-xs font-bold" numberOfLines={1}>
            {item.title}
          </Text>
          {item.info && (
            <Text className="text-[#7C766B] text-[10px] mt-0.5" numberOfLines={1}>
              {item.info}
            </Text>
          )}
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );

  // Các danh sách nội dung đa dạng
  const recommendationList = useMemo(() => database.slice(0, 6), [database]);
  const newSeriesList = useMemo(() => database.filter((i) => i.category === "Phim").slice(0, 6), [database]);
  const topComicsList = useMemo(() => database.filter((i) => i.category === "Truyện").slice(0, 6), [database]);
  const popularSearchList = useMemo(() => database.slice(6, 12), [database]);

  return (
    <View className="flex-1 bg-[#141210]">
      <StatusBar barStyle="light-content" translucent />

      {/* ================= HEADER & Ô SEARCH INPUT BAR ================= */}
      <SafeAreaView edges={["top"]} className="bg-[#1A1816] border-b border-white/5 pb-3">
        <View className="flex-row items-center px-4 mt-2">
          {/* Nút quay lại */}
          <TouchableOpacity onPress={() => navigation.goBack()} className="pr-3 py-1">
            <Feather name="arrow-left" size={22} color="#E5E0D8" />
          </TouchableOpacity>

          {/* Ô Input: Icon Kính lúp Xám -> Vàng khi Click vào */}
          <View
            className={`flex-1 flex-row h-11 bg-zinc-900 border items-center px-3.5 rounded-2xl relative transition-all ${
              isInputFocused ? "border-[#D4AF37]" : "border-white/10"
            }`}
          >
            <Feather
              name="search"
              size={16}
              color={isInputFocused ? "#D4AF37" : "#7C766B"}
              className="mr-2"
            />
            <TextInput
              className="flex-1 text-white text-sm h-full pt-0 pb-0"
              placeholder="Tìm kiếm phim, truyện tranh..."
              placeholderTextColor="#7C766B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} className="px-1">
                <Feather name="x-circle" size={16} color="#7C766B" />
              </TouchableOpacity>
            )}
          </View>

          {/* Nút Filter có Badge số lượng Vàng TaleX */}
          <TouchableOpacity
            onPress={() => {
              setTempCategory(appliedCategory || "Phim");
              setTempGenres([...appliedGenres]);
              setTempYear(appliedYear || "Tất cả");
              setTempCountry(appliedCountry || "Tất cả");
              setTempSort(appliedSort);
              setIsFilterModalVisible(true);
            }}
            activeOpacity={0.8}
            className="ml-3 w-11 h-11 bg-zinc-900 border border-white/10 rounded-2xl items-center justify-center relative"
          >
            <Ionicons name="options-outline" size={20} color="#D4AF37" />
            {activeFiltersCount > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#D4AF37] items-center justify-center border-2 border-[#141210]">
                <Text className="text-[#141210] text-[9px] font-black">{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* BAR CHIP BỘ LỌC ĐANG APPLIED */}
        {activeFiltersCount > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4 mt-3 flex-row"
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {appliedCategory && (
              <TouchableOpacity
                onPress={() => removeFilterChip("category")}
                className="flex-row items-center bg-[#D4AF37] px-3 py-1.5 rounded-full mr-2 shadow-sm"
              >
                <Text className="text-[#141210] text-xs font-bold mr-1.5">{appliedCategory}</Text>
                <Feather name="x" size={12} color="#141210" />
              </TouchableOpacity>
            )}
            {appliedGenres.map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => removeFilterChip("genre", g)}
                className="flex-row items-center bg-[#D4AF37] px-3 py-1.5 rounded-full mr-2 shadow-sm"
              >
                <Text className="text-[#141210] text-xs font-bold mr-1.5">{g}</Text>
                <Feather name="x" size={12} color="#141210" />
              </TouchableOpacity>
            ))}
            {appliedYear && appliedYear !== "Tất cả" && (
              <TouchableOpacity
                onPress={() => removeFilterChip("year")}
                className="flex-row items-center bg-[#D4AF37] px-3 py-1.5 rounded-full mr-2 shadow-sm"
              >
                <Text className="text-[#141210] text-xs font-bold mr-1.5">{appliedYear}</Text>
                <Feather name="x" size={12} color="#141210" />
              </TouchableOpacity>
            )}
            {appliedCountry && appliedCountry !== "Tất cả" && (
              <TouchableOpacity
                onPress={() => removeFilterChip("country")}
                className="flex-row items-center bg-[#D4AF37] px-3 py-1.5 rounded-full mr-2 shadow-sm"
              >
                <Text className="text-[#141210] text-xs font-bold mr-1.5">{appliedCountry}</Text>
                <Feather name="x" size={12} color="#141210" />
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* ================= BODY CONTENT RENDER THEO MẪU ĐẠO ĐA DẠNG ================= */}
      {filteredResults.length === 0 ? (
        /* TRẠNG THÁI KHÔNG TÌM THẤY KẾT QUẢ (VIỆT HÓA TOÀN BỘ) */
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-28 h-28 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 items-center justify-center mb-6 relative">
            <View className="w-20 h-20 rounded-full bg-[#D4AF37]/20 items-center justify-center">
              <MaterialCommunityIcons name="folder-search-outline" size={44} color="#D4AF37" />
            </View>
            <View className="absolute top-2 right-2">
              <Octicons name="sparkle" size={16} color="#D4AF37" />
            </View>
          </View>
          <Text className="text-white text-xl font-bold text-center">Không tìm thấy kết quả</Text>
          <Text className="text-[#7C766B] text-xs text-center mt-2 px-8 leading-5">
            Rất tiếc, TaleX không tìm thấy nội dung phù hợp với từ khóa của bạn :(
          </Text>
        </View>
      ) : searchQuery.length > 0 ? (
        /* TRẠNG THÁI KẾT QUẢ KHI GÕ TỪ KHÓA (DANH MỤC PHIM VÀ TRUYỆN TRANH DẠNG SLIDER NGANG ĐẸP) */
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
        >
          {/* SECTION PHIM */}
          {moviesResults.length > 0 && (
            <View className="mb-6">
              <Text className="text-white text-base font-bold px-4 mb-3">Phim ảnh</Text>
              <FlatList
                horizontal
                data={moviesResults}
                renderItem={renderVerticalPosterCard}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              />
            </View>
          )}

          {/* SECTION TRUYỆN TRANH */}
          {comicsResults.length > 0 && (
            <View className="mb-6">
              <Text className="text-white text-base font-bold px-4 mb-3">Truyện tranh</Text>
              <FlatList
                horizontal
                data={comicsResults}
                renderItem={renderVerticalPosterCard}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              />
            </View>
          )}
        </ScrollView>
      ) : activeFiltersCount > 0 ? (
        /* TRẠNG THÁI KẾT QUẢ ĐÃ LỌC DẠNG GRID (2 CỘT TỶ LỆ DỌC NỔI BẬT) */
        <FlatList
          data={filteredResults}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleOpenDetail(item)}
              className="flex-1 p-2"
            >
              <View className="w-full h-[220px] rounded-2xl overflow-hidden bg-[#1E1B18] border border-white/10 relative shadow-md">
                {renderImdbBadge(item.rating)}
                <Image source={item.image} className="w-full h-full" resizeMode="cover" />
                <LinearGradient
                  colors={["transparent", "rgba(20, 18, 16, 0.95)"]}
                  className="absolute bottom-0 left-0 right-0 h-20 justify-end p-2.5"
                >
                  <Text className="text-[#D4AF37] text-[9px] font-bold uppercase tracking-wider">
                    {item.category}
                  </Text>
                  <Text className="text-white text-xs font-bold mt-0.5" numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text className="text-[#7C766B] text-[10px] mt-0.5" numberOfLines={1}>
                    {item.genre.join(", ")}
                  </Text>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 10, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        /* TRẠNG THÁI MẶC ĐỊNH VIỆT HÓA CHUẨN: ĐỀ XUẤT CHO BẠN + PHIM BỘ MỚI + TRUYỆN TRANH NỔI BẬT + TÌM KIẾM PHỔ BIẾN */
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 16 }}
        >
          {/* MỤC 1: Đề xuất cho bạn */}
          <View className="mb-6">
            <View className="flex-row items-center px-4 mb-3">
              <Ionicons name="sparkles" size={16} color="#D4AF37" className="mr-2" />
              <Text className="text-white text-base font-bold ml-1">Đề xuất cho bạn</Text>
            </View>
            <FlatList
              horizontal
              data={recommendationList}
              renderItem={renderVerticalPosterCard}
              keyExtractor={(item) => "rec-" + item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
          </View>

          {/* MỤC 2: Phim Bộ Mới Cập Nhật */}
          <View className="mb-6">
            <View className="flex-row items-center px-4 mb-3">
              <MaterialCommunityIcons name="movie-roll" size={16} color="#D4AF37" className="mr-2" />
              <Text className="text-white text-base font-bold ml-1">Phim Bộ Mới Cập Nhật</Text>
            </View>
            <FlatList
              horizontal
              data={newSeriesList}
              renderItem={renderVerticalPosterCard}
              keyExtractor={(item) => "series-" + item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
          </View>

          {/* MỤC 3: Truyện Tranh Nổi Bật */}
          <View className="mb-6">
            <View className="flex-row items-center px-4 mb-3">
              <MaterialCommunityIcons name="book-open-variant" size={16} color="#D4AF37" className="mr-2" />
              <Text className="text-white text-base font-bold ml-1">Truyện Tranh Nổi Bật</Text>
            </View>
            <FlatList
              horizontal
              data={topComicsList}
              renderItem={renderVerticalPosterCard}
              keyExtractor={(item) => "comic-" + item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
          </View>

          {/* MỤC 4: Tìm kiếm phổ biến */}
          <View className="mb-6">
            <View className="flex-row items-center px-4 mb-3">
              <Ionicons name="flame" size={16} color="#D4AF37" className="mr-2" />
              <Text className="text-white text-base font-bold ml-1">Tìm kiếm phổ biến</Text>
            </View>
            <FlatList
              horizontal
              data={popularSearchList}
              renderItem={renderVerticalPosterCard}
              keyExtractor={(item) => "pop-" + item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
          </View>
        </ScrollView>
      )}

      {/* ================= FILTER BOTTOM SHEET MODAL (CHỈ CÓ PHIM VÀ TRUYỆN) ================= */}
      <Modal
        visible={isFilterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setIsFilterModalVisible(false)}
          className="flex-1 bg-black/70 justify-end"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-[#1A1816] rounded-t-3xl border-t border-white/10 px-5 pt-3 pb-8 max-h-[85%]"
          >
            {/* Thanh kéo Indicator */}
            <View className="w-12 h-1.5 bg-white/20 rounded-full self-center mb-4" />

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Phân loại danh mục: CHỈ PHIM & TRUYỆN */}
              <Text className="text-white text-sm font-bold mb-3">Loại nội dung</Text>
              <View className="flex-row bg-[#141210] p-1.5 rounded-2xl mb-6 border border-white/5">
                {(["Phim", "Truyện"] as const).map((cat) => {
                  const isSelected = tempCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setTempCategory(cat)}
                      className={`flex-1 py-3 rounded-xl items-center justify-center flex-row ${
                        isSelected ? "bg-[#D4AF37]" : "bg-transparent"
                      }`}
                    >
                      <MaterialCommunityIcons
                        name={cat === "Phim" ? "movie-roll" : "book-open-variant"}
                        size={16}
                        color={isSelected ? "#141210" : "#7C766B"}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? "text-[#141210]" : "text-[#7C766B]"
                        }`}
                      >
                        {cat === "Phim" ? "Phim ảnh" : "Truyện tranh"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Thể loại (Genre) */}
              <Text className="text-white text-sm font-bold mb-3">Thể loại</Text>
              <View className="flex-row flex-wrap mb-6">
                {GENRE_LIST.map((g) => {
                  const isSelected = tempGenres.includes(g);
                  return (
                    <TouchableOpacity
                      key={g}
                      onPress={() => {
                        if (isSelected) {
                          setTempGenres(tempGenres.filter((item) => item !== g));
                        } else {
                          setTempGenres([...tempGenres, g]);
                        }
                      }}
                      className={`px-4 py-2 rounded-full mr-2.5 mb-2.5 border ${
                        isSelected
                          ? "bg-[#D4AF37] border-[#D4AF37]"
                          : "bg-zinc-900 border-white/5"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          isSelected ? "text-[#141210] font-bold" : "text-[#7C766B]"
                        }`}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Năm phát hành */}
              <View className="flex-row justify-between items-center py-3.5 border-b border-white/5">
                <View className="flex-row items-center">
                  <Feather name="calendar" size={16} color="#D4AF37" className="mr-3" />
                  <Text className="text-white text-sm font-medium ml-2">Năm phát hành</Text>
                </View>
                <View className="flex-row items-center">
                  {YEAR_LIST.map((y) => (
                    <TouchableOpacity
                      key={y}
                      onPress={() => setTempYear(y)}
                      className={`px-2.5 py-1 rounded-lg ml-1 ${
                        tempYear === y ? "bg-[#D4AF37]" : "bg-transparent"
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          tempYear === y ? "text-[#141210] font-bold" : "text-[#7C766B]"
                        }`}
                      >
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Quốc gia */}
              <View className="flex-row justify-between items-center py-3.5 border-b border-white/5">
                <View className="flex-row items-center">
                  <Feather name="globe" size={16} color="#D4AF37" className="mr-3" />
                  <Text className="text-white text-sm font-medium ml-2">Quốc gia</Text>
                </View>
                <View className="flex-row items-center flex-wrap">
                  {COUNTRY_LIST.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setTempCountry(c)}
                      className={`px-2 py-1 rounded-lg ml-1 mb-1 ${
                        tempCountry === c ? "bg-[#D4AF37]" : "bg-transparent"
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          tempCountry === c ? "text-[#141210] font-bold" : "text-[#7C766B]"
                        }`}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Sắp xếp */}
              <View className="flex-row justify-between items-center py-3.5 mb-6">
                <View className="flex-row items-center">
                  <Feather name="sliders" size={16} color="#D4AF37" className="mr-3" />
                  <Text className="text-white text-sm font-medium ml-2">Sắp xếp theo</Text>
                </View>
                <Text className="text-[#D4AF37] text-xs font-bold">{tempSort}</Text>
              </View>

              {/* Nút thao tác: Thiết lập lại & Áp dụng */}
              <View className="flex-row items-center space-x-3 mt-2">
                <TouchableOpacity
                  onPress={handleResetFilter}
                  activeOpacity={0.8}
                  className="flex-1 bg-zinc-900 py-3.5 rounded-full items-center justify-center border border-white/10 mr-3"
                >
                  <Text className="text-white text-sm font-bold">Thiết lập lại</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleApplyFilter}
                  activeOpacity={0.8}
                  className="flex-1 bg-[#D4AF37] py-3.5 rounded-full items-center justify-center shadow-lg shadow-[#D4AF37]/30"
                >
                  <Text className="text-[#141210] text-sm font-black">Áp dụng</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}