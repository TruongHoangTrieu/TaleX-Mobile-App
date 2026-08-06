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
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  Feather,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import type { RootStackParamList } from "@/navigation/RootNavigator";
import { navigate as safeNavigateRef } from "@/navigation/navigationRef";

import ComicCarousel from "@components/ComicCarousel";
import Header from "@components/Header";
import RecentWatchSection from "@/components/RecentWatchSection";
import CinematicBackground from "@/components/CinematicBackground";
import {
  ComicItem,
  comicCategories,
  comboComics,
  newComics,
  recommendedComics,
} from "./comicMockData";
import { formatAnalyticNumber, getPublicSeries } from "@/services/series";

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
  const [apiComics, setApiComics] = useState<any[]>([]);

  const loadComics = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    try {
      const res = await getPublicSeries(1, 100);
      if (res && res.data && res.data.content) {
        const filtered = res.data.content.filter(
          (item: any) =>
            item.contentType === "COMIC" || item.contentType === "comic",
        );
        setApiComics(filtered);
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách truyện từ API:", err);
    } finally {
      if (!isRefreshing) setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadComics(false);
    }, []),
  );

  const openComicDetail = (comicId: string) => {
    navigateTo("ComicDetailScreen", { comicId });
  };

  // Modern Card Component
  const renderComicCard = ({ item }: { item: ComicItem }) => {
    const rawRating = item.ageRating;
    const ageRatingStr = rawRating && typeof rawRating === "string" && rawRating.trim() ? rawRating.trim() : null;

    const isRed = ageRatingStr?.toUpperCase().includes("18");
    const isAmber = ageRatingStr?.toUpperCase().includes("16");
    const isBlue = ageRatingStr?.toUpperCase().includes("13");
    const badgeBg = isRed
      ? "bg-red-600"
      : isAmber
      ? "bg-amber-600"
      : isBlue
      ? "bg-blue-600"
      : "bg-emerald-600";

    return (
      <TouchableOpacity
        className="mr-3.5 w-[135px]"
        activeOpacity={0.85}
        onPress={() => openComicDetail(item.id)}
      >
        <View className="relative w-full h-[185px] rounded-2xl overflow-hidden border border-white/10 bg-zinc-800 shadow-md">
          <Image
            source={item.image}
            className="w-full h-full"
            resizeMode="cover"
          />

          {/* Age Rating Badge Top Right */}
          {ageRatingStr && (
            <View className={`absolute top-2 right-2 px-2 py-0.5 rounded-md ${badgeBg} shadow-lg z-20 border border-white/20`}>
              <Text className="text-white text-[10px] font-black tracking-wider uppercase">
                {ageRatingStr}
              </Text>
            </View>
          )}

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.85)"]}
            className="absolute bottom-0 left-0 right-0 h-20 justify-end p-2.5"
          >
            <View className="flex-row items-center justify-between">
              {item.tag ? (
                <View className="bg-[#D4AF37] px-1.5 py-0.5 rounded shadow-sm">
                  <Text className="text-[#141210] text-[9px] font-black tracking-tight">
                    {item.tag}
                  </Text>
                </View>
              ) : (
                <View />
              )}

              {/* Views Counter Badge Bottom Right */}
              <View className="px-1.5 py-0.5 rounded-md bg-black/75 flex-row items-center border border-white/10">
                <Ionicons name="eye" size={9} color="#38bdf8" />
                <Text className="text-white text-[9px] font-bold ml-1">
                  {formatAnalyticNumber(item.analyticData?.views ?? (item as any).totalViews ?? (item as any).views ?? 0)}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

      <Text
        className="text-white font-bold text-xs mt-2 px-0.5 leading-tight"
        numberOfLines={1}
      >
        {item.title}
      </Text>
      <Text
        className="text-[#A1A1AA] text-[11px] mt-0.5 px-0.5"
        numberOfLines={1}
      >
        {item.description || item.author || ""}
      </Text>
    </TouchableOpacity>
    );
  };

  // Top Ranked Card Component (Top Webtoon)
  const renderRankedCard = ({
    item,
    index,
  }: {
    item: ComicItem;
    index: number;
  }) => {
    const rankColors = ["#D4AF37", "#C0C0C0", "#CD7F32"];
    const rankColor = index < 3 ? rankColors[index] : "#A1A1AA";

    return (
      <TouchableOpacity
        className="mr-3.5 flex-row items-center w-[230px] bg-[#1A1C20] p-2.5 rounded-2xl border border-white/10"
        activeOpacity={0.85}
        onPress={() => openComicDetail(item.id)}
      >
        {/* Rank Number */}
        <Text
          className="text-3xl font-black italic mr-2.5 w-8 text-center"
          style={{ color: rankColor }}
        >
          #{index + 1}
        </Text>

        {/* Comic Thumbnail */}
        <Image
          source={item.image}
          className="w-[70px] h-[95px] rounded-xl bg-zinc-800"
          resizeMode="cover"
        />

        {/* Comic Info */}
        <View className="flex-1 ml-2.5 justify-between h-[90px] py-1">
          <View>
            <Text
              className="text-white font-bold text-xs leading-tight"
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text className="text-[#A1A1AA] text-[10px] mt-1">
              {item.category}
            </Text>
          </View>

          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-row items-center">
              <Ionicons name="eye-outline" size={11} color="#D4AF37" />
              <Text className="text-[#D4AF37] text-[10px] font-semibold ml-1">
                {item.views || "100K"}
              </Text>
            </View>
            {item.rating && (
              <View className="flex-row items-center bg-black/40 px-1.5 py-0.5 rounded">
                <Ionicons name="star" size={10} color="#D4AF37" />
                <Text className="text-white text-[10px] font-bold ml-1">
                  {item.rating}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const topRankedComics = [...newComics, ...recommendedComics].slice(0, 5);

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
        >
          {/* 2. Carousel Banner */}
          <View className="mt-1">
            <ComicCarousel />
          </View>

          {/* 3. Continue Reading Bar (Tiếp tục đọc thực tế từ API) */}
          <RecentWatchSection filterType="COMIC" title="Tiếp Tục Đọc Truyện" />

          {/* 4. Top Webtoon Ranking (Bảng Xếp Hạng Tuần) */}
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
              data={topRankedComics}
              renderItem={renderRankedCard}
              keyExtractor={(item) => `rank-${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            />
          </View>

          {/* 5. Spotlight Banner (Siêu Phẩm Chọn Lọc Tuần Này) */}
          <View className="px-4 mt-7">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => openComicDetail(newComics[2]?.id || newComics[0].id)}
              className="relative rounded-3xl overflow-hidden border border-white/15 bg-zinc-900"
            >
              <Image
                source={newComics[2]?.image || newComics[0].image}
                className="w-full h-[170px]"
                resizeMode="cover"
              />
              <LinearGradient
                colors={["rgba(20,22,25,0.2)", "rgba(20,22,25,0.95)"]}
                className="absolute inset-0 p-4 justify-end"
              >
                <View className="bg-[#D4AF37]/90 self-start px-2 py-0.5 rounded-md mb-1.5 flex-row items-center">
                  <Ionicons name="flame" size={12} color="#141619" />
                  <Text className="text-[#141619] text-[10px] font-black uppercase tracking-wider ml-1">
                    SIÊU PHẨM TUẦN NÀY
                  </Text>
                </View>
                <Text className="text-white font-extrabold text-lg leading-tight">
                  {newComics[2]?.title || "Chú Thuật Hồi Chiến"}
                </Text>
                <Text
                  className="text-[#D1D5DB] text-xs mt-1 leading-snug"
                  numberOfLines={2}
                >
                  {newComics[2]?.description ||
                    "Cuộc chiến giữa các chú thuật sư và lời nguyền ngày càng khốc liệt."}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* 6. Truyện Tranh Hệ Thống (Mới Lên Sóng API) */}
          <ComicSection
            title="Truyện Tranh Mới Lên Sóng"
            icon={<Ionicons name="flash" size={16} color="#D4AF37" />}
            loading={loading}
            data={apiComics.map((item) => ({
              id: item.seriesId || item.id,
              title: item.title,
              image: item.coverUrl
                ? { uri: item.coverUrl }
                : require("@assets/comic1.webp"),
              category: "Tất cả",
              author: item.author || "TaleX Creator",
              status:
                item.status === "PUBLISHED" ? "Đã xuất bản" : "Đang tiến hành",
              views: item.analyticData?.views ?? item.totalViews ?? item.views ?? 0,
              analyticData: item.analyticData,
              averageRating: item.averageRating,
              totalViews: item.totalViews,
              rating: item.rating || "10.0",
              ageRating: item.ageRating || item.targetAudience || item.contentRating,
              chapters: [],
              description: item.description || "",
            }))}
            renderItem={renderComicCard}
            emptyText="Chưa có truyện tranh hệ thống nào"
            onSeeMore={() => navigateTo("Search")}
          />

          {/* 7. Nội Dung Mới */}
          <ComicSection
            title="Nội Dung Mới - Xem Ngay"
            icon={<Ionicons name="sparkles" size={16} color="#D4AF37" />}
            data={newComics}
            renderItem={renderComicCard}
            emptyText="Chưa có truyện mới"
            onSeeMore={() => navigateTo("Search")}
          />

          {/* 8. Đề Xuất Cho Bạn */}
          <ComicSection
            title="Đề Xuất Dành Cho Bạn"
            icon={<FontAwesome5 name="bullseye" size={15} color="#D4AF37" />}
            data={recommendedComics}
            renderItem={renderComicCard}
            emptyText="Chưa có đề xuất"
            onSeeMore={() => navigateTo("Search")}
          />

          {/* 9. Combo Siêu Tiết Kiệm */}
          <ComicSection
            title="Combo Siêu Tiết Kiệm"
            icon={<MaterialCommunityIcons name="diamond-stone" size={16} color="#D4AF37" />}
            data={comboComics}
            renderItem={renderComicCard}
            emptyText="Không có gói combo nào"
            highlighted
            onSeeMore={() => navigateTo("Search")}
          />
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
  onSeeMore,
  loading,
}: {
  title: string;
  icon?: React.ReactNode;
  data: ComicItem[];
  renderItem: ({ item }: { item: ComicItem }) => React.ReactElement;
  emptyText: string;
  highlighted?: boolean;
  onSeeMore?: () => void;
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
          keyExtractor={(item) => item.id}
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



