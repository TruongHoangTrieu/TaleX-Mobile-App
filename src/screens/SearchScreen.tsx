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
  ActivityIndicator,
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

import {
  searchPublicSeries,
  SearchSeriesItem,
} from "@/services/series";
import {
  getPublicCategories,
  getPublicTags,
  PublicOption,
} from "@/services/userFeature";

export interface SearchItem {
  id: string;
  seriesId: string;
  title: string;
  category: "Phim" | "Truyện";
  subCategory?: string;
  genre: string[];
  year: string;
  country: string;
  rating: number;
  image: any;
  info?: string;
  creatorName?: string;
  creatorAvatar?: string;
  totalViews?: number;
  ageRating?: string;
}

export default function SearchScreen() {
  const navigation = useNavigation<any>();

  // Dữ liệu nội dung từ API thực
  const [database, setDatabase] = useState<SearchItem[]>([]);
  const [apiCategories, setApiCategories] = useState<PublicOption[]>([]);
  const [apiTags, setApiTags] = useState<PublicOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Trạng thái input & Focus
  const [searchQuery, setSearchQuery] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Modal bộ lọc & Trạng thái mở rộng danh sách
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isExpandCategories, setIsExpandCategories] = useState(false);
  const [isExpandTags, setIsExpandTags] = useState(false);

  // Bộ lọc tạm thời trong Modal (đầy đủ các trường theo API Backend)
  const [tempCategory, setTempCategory] = useState<"Tất cả" | "Phim" | "Truyện">("Tất cả");
  const [tempGenres, setTempGenres] = useState<string[]>([]); // Selected Category Names
  const [tempTags, setTempTags] = useState<string[]>([]); // Selected Tag Names
  const [tempAgeRating, setTempAgeRating] = useState<string>("Tất cả"); // EVERYONE, TEEN, MATURE
  const [tempSortBy, setTempSortBy] = useState<string>("releasedupdatetime"); // releasedupdatetime, views, averagerating, likes, watchtime
  const [tempSortDirection, setTempSortDirection] = useState<"DESC" | "ASC">("DESC");

  // Bộ lọc chính thức áp dụng
  const [appliedCategory, setAppliedCategory] = useState<"Tất cả" | "Phim" | "Truyện">("Tất cả");
  const [appliedGenres, setAppliedGenres] = useState<string[]>([]);
  const [appliedTags, setAppliedTags] = useState<string[]>([]);
  const [appliedAgeRating, setAppliedAgeRating] = useState<string>("Tất cả");
  const [appliedSortBy, setAppliedSortBy] = useState<string>("releasedupdatetime");
  const [appliedSortDirection, setAppliedSortDirection] = useState<"DESC" | "ASC">("DESC");

  // Lấy danh sách Thể loại & Tags thực tế từ API
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [cats, tags] = await Promise.all([
          getPublicCategories(),
          getPublicTags(),
        ]);
        setApiCategories(cats);
        setApiTags(tags);
      } catch (err) {
        console.error("[SearchScreen] Error fetching categories/tags:", err);
      }
    };
    fetchMetadata();
  }, []);

  // Lấy dữ liệu tìm kiếm thực tế từ Server TaleX qua GET /api/v1/public/series/search
  useEffect(() => {
    const fetchSearchResults = async () => {
      setIsLoading(true);
      try {
        let contentTypeParam: "VIDEO" | "COMIC" | undefined = undefined;
        if (appliedCategory === "Phim") contentTypeParam = "VIDEO";
        if (appliedCategory === "Truyện") contentTypeParam = "COMIC";

        // Áp dụng categoryIds từ Thể loại đã chọn
        const selectedCategoryIds = appliedGenres.length > 0
          ? apiCategories.filter((c) => appliedGenres.includes(c.name)).map((c) => c.id)
          : undefined;

        // Áp dụng tagIds từ Tags đã chọn
        const selectedTagIds = appliedTags.length > 0
          ? apiTags.filter((t) => appliedTags.includes(t.name)).map((t) => t.id)
          : undefined;

        // Áp dụng ageRatings
        const ageRatingsParam = (appliedAgeRating && appliedAgeRating !== "Tất cả")
          ? [appliedAgeRating]
          : undefined;

        const res = await searchPublicSeries({
          search: searchQuery.trim() || undefined,
          contentType: contentTypeParam,
          categoryIds: selectedCategoryIds,
          tagIds: selectedTagIds,
          ageRatings: ageRatingsParam,
          status: "PUBLISHED",
          sortBy: appliedSortBy,
          sortDirection: appliedSortDirection,
          page: 0,
          size: 20,
        });

        if (res && res.data && Array.isArray(res.data.content)) {
          const apiItems: SearchItem[] = res.data.content.map((item: SearchSeriesItem) => {
            const isComic = item.contentType === "COMIC";
            const coverUri = item.coverUrl || item.bannerUrl;
            const imageSource = coverUri
              ? { uri: coverUri }
              : isComic
              ? require("@assets/comic4.webp")
              : require("@assets/movie2.jpg");

            return {
              id: item.seriesId,
              seriesId: item.seriesId,
              title: item.title,
              category: isComic ? "Truyện" : "Phim",
              subCategory: isComic ? "Truyện tranh" : "Phim bộ",
              genre: [isComic ? "Truyện tranh" : "Phim bộ"],
              year: item.createdAt ? new Date(item.createdAt).getFullYear().toString() : "2026",
              country: "TaleX",
              rating: item.averageRating ?? 0,
              image: imageSource,
              info: item.description || (isComic ? "Truyện tranh TaleX" : "Phim bộ TaleX"),
              creatorName: item.creatorName,
              creatorAvatar: item.creatorAvatar,
              totalViews: item.totalViews ?? 0,
              ageRating: item.ageRating,
            };
          });

          setDatabase(apiItems);
        } else {
          setDatabase([]);
        }
      } catch (err) {
        console.error("Lỗi tìm kiếm từ API:", err);
        setDatabase([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchSearchResults();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    searchQuery,
    appliedCategory,
    appliedGenres,
    appliedTags,
    appliedAgeRating,
    appliedSortBy,
    appliedSortDirection,
    apiCategories,
    apiTags,
  ]);

  // Số lượng bộ lọc đang áp dụng
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (appliedCategory !== "Tất cả") count++;
    if (appliedGenres.length > 0) count += appliedGenres.length;
    if (appliedTags.length > 0) count += appliedTags.length;
    if (appliedAgeRating !== "Tất cả") count++;
    if (appliedSortBy !== "releasedupdatetime") count++;
    if (appliedSortDirection !== "DESC") count++;
    return count;
  }, [
    appliedCategory,
    appliedGenres,
    appliedTags,
    appliedAgeRating,
    appliedSortBy,
    appliedSortDirection,
  ]);

  // Nút Áp dụng bộ lọc
  const handleApplyFilter = () => {
    setAppliedCategory(tempCategory);
    setAppliedGenres([...tempGenres]);
    setAppliedTags([...tempTags]);
    setAppliedAgeRating(tempAgeRating);
    setAppliedSortBy(tempSortBy);
    setAppliedSortDirection(tempSortDirection);
    setIsFilterModalVisible(false);
  };

  // Nút Thiết lập lại bộ lọc
  const handleResetFilter = () => {
    setTempCategory("Tất cả");
    setTempGenres([]);
    setTempTags([]);
    setTempAgeRating("Tất cả");
    setTempSortBy("releasedupdatetime");
    setTempSortDirection("DESC");

    setAppliedCategory("Tất cả");
    setAppliedGenres([]);
    setAppliedTags([]);
    setAppliedAgeRating("Tất cả");
    setAppliedSortBy("releasedupdatetime");
    setAppliedSortDirection("DESC");
  };

  const handleOpenDetail = (item: SearchItem) => {
    if (item.category === "Phim") {
      navigation.navigate("MovieDetailScreen", { movieId: item.id, seriesItem: item });
    } else {
      navigation.navigate("ComicDetailScreen", { comicId: item.id });
    }
  };

  const formatViewsNumber = (num?: number): string => {
    if (num == null || num <= 0) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Render Huy hiệu Độ tuổi ở góc trên BÊN PHẢI (Nổi bật)
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

  // Render Huy hiệu Loại nội dung Phim / Truyện ở góc trên BÊN TRÁI (Nền Solid 100% rực rỡ, chữ trắng font-black)
  const renderCategoryBadge = (category?: string) => {
    const catStr = (category || "").toUpperCase();
    const isComic = catStr === "TRUYỆN" || catStr === "COMIC";
    const label = isComic ? "TRUYỆN" : "PHIM";

    // PHIM: Màu Đỏ Rực Rỡ (Solid Red #DC2626)
    // TRUYỆN: Màu Xanh Dương Rực Rỡ (Solid Royal Blue #2563EB)
    const bgColor = isComic ? "#2563EB" : "#DC2626";
    const borderColor = isComic ? "#60A5FA" : "#F87171";

    return (
      <View
        style={{ backgroundColor: bgColor, borderColor: borderColor }}
        className="absolute top-2 left-2 px-2.5 py-0.5 rounded-lg border z-20 shadow-lg"
      >
        <Text className="text-white text-[10px] font-black uppercase tracking-wider">
          {label}
        </Text>
      </View>
    );
  };

  // Render Thẻ Card Poster Đứng (Chuẩn đẹp mắt như mẫu)
  const renderVerticalPosterCard = ({ item }: { item: SearchItem }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => handleOpenDetail(item)}
      className="mr-3.5 mb-4 w-[135px]"
    >
      <View className="w-full h-[190px] rounded-2xl overflow-hidden bg-[#1E1B18] border border-white/10 relative shadow-lg">
        {/* Góc trên BÊN TRÁI: Loại nội dung Phim / Truyện (Nền phân màu nổi bật) */}
        {renderCategoryBadge(item.category)}

        {/* Góc trên BÊN PHẢI: Độ tuổi (EVERYONE / 13+ / 18+) */}
        {renderAgeRatingBadge(item.ageRating)}

        <Image source={item.image} className="w-full h-full" resizeMode="cover" />
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
                {(item.rating ?? 0).toFixed(1)}
              </Text>
            </View>
          </View>
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
              setTempCategory(appliedCategory);
              setTempGenres([...appliedGenres]);
              setTempTags([...appliedTags]);
              setTempAgeRating(appliedAgeRating);
              setTempSortBy(appliedSortBy);
              setTempSortDirection(appliedSortDirection);
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
            {appliedCategory !== "Tất cả" && (
              <TouchableOpacity
                onPress={() => {
                  setAppliedCategory("Tất cả");
                  setTempCategory("Tất cả");
                }}
                className="flex-row items-center bg-[#D4AF37] px-3 py-1.5 rounded-full mr-2 shadow-sm"
              >
                <Text className="text-[#141210] text-xs font-bold mr-1.5">{appliedCategory}</Text>
                <Feather name="x" size={12} color="#141210" />
              </TouchableOpacity>
            )}
            {appliedGenres.map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => {
                  const next = appliedGenres.filter((item) => item !== g);
                  setAppliedGenres(next);
                  setTempGenres(next);
                }}
                className="flex-row items-center bg-[#D4AF37] px-3 py-1.5 rounded-full mr-2 shadow-sm"
              >
                <Text className="text-[#141210] text-xs font-bold mr-1.5">{g}</Text>
                <Feather name="x" size={12} color="#141210" />
              </TouchableOpacity>
            ))}
            {appliedTags.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => {
                  const next = appliedTags.filter((item) => item !== t);
                  setAppliedTags(next);
                  setTempTags(next);
                }}
                className="flex-row items-center bg-[#D4AF37] px-3 py-1.5 rounded-full mr-2 shadow-sm"
              >
                <Text className="text-[#141210] text-xs font-bold mr-1.5">#{t}</Text>
                <Feather name="x" size={12} color="#141210" />
              </TouchableOpacity>
            ))}
            {appliedAgeRating !== "Tất cả" && (
              <TouchableOpacity
                onPress={() => {
                  setAppliedAgeRating("Tất cả");
                  setTempAgeRating("Tất cả");
                }}
                className="flex-row items-center bg-[#D4AF37] px-3 py-1.5 rounded-full mr-2 shadow-sm"
              >
                <Text className="text-[#141210] text-xs font-bold mr-1.5">
                  {appliedAgeRating === "EVERYONE" ? "P" : appliedAgeRating === "TEEN" ? "13+" : "18+"}
                </Text>
                <Feather name="x" size={12} color="#141210" />
              </TouchableOpacity>
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* ================= BODY CONTENT RENDER THEO MẪU ĐẠO ĐA DẠNG ================= */}
      {/* ================= NỘI DUNG HIỂN THỊ KẾT QUẢ TỪ API THỰC ================= */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text className="text-[#7C766B] text-xs mt-3">Đang tìm kiếm dữ liệu thực từ TaleX...</Text>
        </View>
      ) : database.length === 0 ? (
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
            Rất tiếc, máy chủ TaleX không tìm thấy nội dung phù hợp với từ khóa hoặc bộ lọc của bạn :(
          </Text>
        </View>
      ) : (
        /* DANH SÁCH KẾT QUẢ THỰC TỪ SERVER TALEX DẠNG GRID 2 CỘT */
        <FlatList
          data={database}
          numColumns={2}
          keyExtractor={(item) => item.id}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={true}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleOpenDetail(item)}
              className="flex-1 p-2"
            >
              <View className="w-full h-[225px] rounded-2xl overflow-hidden bg-[#1E1B18] border border-white/10 relative shadow-md">
                {/* Góc trên BÊN TRÁI: Loại nội dung Phim / Truyện (Nền phân màu nổi bật, không bị chìm ảnh) */}
                {renderCategoryBadge(item.category)}

                {/* Góc trên BÊN PHẢI: Độ tuổi (EVERYONE / 13+ / 18+) */}
                {renderAgeRatingBadge(item.ageRating)}

                <Image source={item.image} className="w-full h-full" resizeMode="cover" />

                {/* Overlay Gradient phủ bóng mượt bên dưới */}
                <LinearGradient
                  colors={["transparent", "rgba(10, 8, 6, 0.98)"]}
                  className="absolute bottom-0 left-0 right-0 h-16 justify-end p-2.5"
                >
                  {/* Hàng dưới cùng: Tên tác phẩm bên trái + Điểm Rating bên phải (Cùng hàng, chữ đậm font-black) */}
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="flex-1 text-white text-xs font-black mr-2"
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item.title}
                    </Text>

                    {/* Góc dưới bên phải: Điểm Đánh Giá Rating (Nổi bật) */}
                    <View className="flex-row items-center bg-black/90 px-2 py-0.5 rounded-full border border-white/20">
                      <Ionicons name="star" size={10} color="#D4AF37" style={{ marginRight: 3 }} />
                      <Text className="text-[#E5E0D8] text-[10px] font-black">
                        {(item.rating ?? 0).toFixed(1)}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ padding: 10, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
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
              {/* 1. Loại nội dung (contentType) */}
              <Text className="text-white text-sm font-bold mb-3">Loại nội dung</Text>
              <View className="flex-row bg-[#141210] p-1.5 rounded-2xl mb-6 border border-white/5">
                {[
                  { label: "Tất cả", val: "Tất cả", icon: "apps" },
                  { label: "Phim ảnh", val: "Phim", icon: "movie-roll" },
                  { label: "Truyện tranh", val: "Truyện", icon: "book-open-variant" },
                ].map((cat) => {
                  const isSelected = tempCategory === cat.val;
                  return (
                    <TouchableOpacity
                      key={cat.val}
                      onPress={() => setTempCategory(cat.val as any)}
                      className={`flex-1 py-2.5 rounded-xl items-center justify-center flex-row ${
                        isSelected ? "bg-[#D4AF37]" : "bg-transparent"
                      }`}
                    >
                      <MaterialCommunityIcons
                        name={cat.icon as any}
                        size={15}
                        color={isSelected ? "#141210" : "#7C766B"}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        className={`text-xs font-bold ${
                          isSelected ? "text-[#141210]" : "text-[#7C766B]"
                        }`}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 2. Thể loại (categoryIds) - Giới hạn 2 hàng + Nút mở rộng +N */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-sm font-bold">Thể loại</Text>
                {apiCategories.length > 8 && (
                  <TouchableOpacity onPress={() => setIsExpandCategories(!isExpandCategories)}>
                    <Text className="text-[#D4AF37] text-xs font-bold">
                      {isExpandCategories ? "Thu gọn" : `+${apiCategories.length - 8} thể loại`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View className="flex-row flex-wrap mb-6">
                {apiCategories.length === 0 ? (
                  <Text className="text-[#7C766B] text-xs">Đang tải danh sách thể loại...</Text>
                ) : (
                  (isExpandCategories ? apiCategories : apiCategories.slice(0, 8)).map((cat) => {
                    const isSelected = tempGenres.includes(cat.name);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => {
                          if (isSelected) {
                            setTempGenres(tempGenres.filter((item) => item !== cat.name));
                          } else {
                            setTempGenres([...tempGenres, cat.name]);
                          }
                        }}
                        className={`px-3.5 py-1.5 rounded-full mr-2 mb-2 border ${
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
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
                {!isExpandCategories && apiCategories.length > 8 && (
                  <TouchableOpacity
                    onPress={() => setIsExpandCategories(true)}
                    className="px-3 py-1.5 rounded-full mr-2 mb-2 bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex-row items-center"
                  >
                    <Text className="text-[#D4AF37] text-xs font-black">
                      +{apiCategories.length - 8}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 3. Thẻ Tag (tagIds) - Giới hạn 2 hàng + Nút mở rộng +N */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-sm font-bold">Thẻ Tag</Text>
                {apiTags.length > 8 && (
                  <TouchableOpacity onPress={() => setIsExpandTags(!isExpandTags)}>
                    <Text className="text-[#D4AF37] text-xs font-bold">
                      {isExpandTags ? "Thu gọn" : `+${apiTags.length - 8} tag`}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View className="flex-row flex-wrap mb-6">
                {apiTags.length === 0 ? (
                  <Text className="text-[#7C766B] text-xs">Đang tải danh sách thẻ tag...</Text>
                ) : (
                  (isExpandTags ? apiTags : apiTags.slice(0, 8)).map((tag) => {
                    const isSelected = tempTags.includes(tag.name);
                    return (
                      <TouchableOpacity
                        key={tag.id}
                        onPress={() => {
                          if (isSelected) {
                            setTempTags(tempTags.filter((item) => item !== tag.name));
                          } else {
                            setTempTags([...tempTags, tag.name]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full mr-2 mb-2 border ${
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
                          #{tag.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
                {!isExpandTags && apiTags.length > 8 && (
                  <TouchableOpacity
                    onPress={() => setIsExpandTags(true)}
                    className="px-3 py-1.5 rounded-full mr-2 mb-2 bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex-row items-center"
                  >
                    <Text className="text-[#D4AF37] text-xs font-black">
                      +{apiTags.length - 8}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>



              {/* 5. Độ tuổi (ageRatings: EVERYONE / TEEN / MATURE) */}
              <View className="flex-row justify-between items-center py-3.5 border-b border-white/5">
                <View className="flex-row items-center">
                  <Feather name="user-check" size={16} color="#D4AF37" />
                  <Text className="text-white text-sm font-medium ml-2">Độ tuổi</Text>
                </View>
                <View className="flex-row items-center">
                  {[
                    { label: "Tất cả", val: "Tất cả" },
                    { label: "P", val: "EVERYONE" },
                    { label: "13+", val: "TEEN" },
                    { label: "18+", val: "MATURE" },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.val}
                      onPress={() => setTempAgeRating(item.val)}
                      className={`px-2.5 py-1 rounded-lg ml-1 ${
                        tempAgeRating === item.val ? "bg-[#D4AF37]" : "bg-transparent"
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          tempAgeRating === item.val ? "text-[#141210] font-bold" : "text-[#7C766B]"
                        }`}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 6. Tiêu chí Sắp xếp (sortBy: releasedupdatetime / views / averagerating / likes / watchtime) */}
              <View className="py-3.5 border-b border-white/5">
                <View className="flex-row items-center mb-3">
                  <Feather name="sliders" size={16} color="#D4AF37" />
                  <Text className="text-white text-sm font-medium ml-2">Sắp xếp theo</Text>
                </View>
                <View className="flex-row flex-wrap">
                  {[
                    { label: "Mới cập nhật", val: "releasedupdatetime" },
                    { label: "Lượt xem", val: "views" },
                    { label: "Đánh giá cao", val: "averagerating" },
                    { label: "Lượt thích", val: "likes" },
                    { label: "Thời lượng xem", val: "watchtime" },
                  ].map((sortOpt) => {
                    const isSelected = tempSortBy === sortOpt.val;
                    return (
                      <TouchableOpacity
                        key={sortOpt.val}
                        onPress={() => setTempSortBy(sortOpt.val)}
                        className={`px-3 py-1.5 rounded-xl mr-2 mb-2 border ${
                          isSelected
                            ? "bg-[#D4AF37] border-[#D4AF37]"
                            : "bg-zinc-900 border-white/5"
                        }`}
                      >
                        <Text
                          className={`text-xs ${
                            isSelected ? "text-[#141210] font-bold" : "text-[#7C766B]"
                          }`}
                        >
                          {sortOpt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 7. Hướng Sắp xếp (sortDirection: DESC / ASC) - Xuống hàng đẹp mắt */}
              <View className="py-3.5 mb-2">
                <View className="flex-row items-center mb-3">
                  <Ionicons name="swap-vertical" size={16} color="#D4AF37" />
                  <Text className="text-white text-sm font-medium ml-2">Thứ tự sắp xếp</Text>
                </View>
                <View className="flex-row space-x-2">
                  {[
                    { label: "Giảm dần (Mới/Cao nhất)", val: "DESC" },
                    { label: "Tăng dần (Cũ/Thấp nhất)", val: "ASC" },
                  ].map((item) => {
                    const isSelected = tempSortDirection === item.val;
                    return (
                      <TouchableOpacity
                        key={item.val}
                        onPress={() => setTempSortDirection(item.val as any)}
                        className={`flex-1 py-2.5 px-3 rounded-xl items-center justify-center border mr-2 ${
                          isSelected
                            ? "bg-[#D4AF37] border-[#D4AF37]"
                            : "bg-zinc-900 border-white/5"
                        }`}
                      >
                        <Text
                          className={`text-xs text-center ${
                            isSelected ? "text-[#141210] font-bold" : "text-[#7C766B]"
                          }`}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
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