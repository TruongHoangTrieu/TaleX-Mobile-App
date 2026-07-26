import React, { useState, useCallback } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
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
import {
  ComicItem,
  comicCategories,
  comboComics,
  newComics,
  recommendedComics,
} from "./comicMockData";
import { getPublicSeries } from "@/services/series";

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

  const [apiComics, setApiComics] = useState<any[]>([]);

  const loadComics = async (isRefreshing = false) => {
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
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadComics(false);
    }, [])
  );

  const openComicDetail = (comicId: string) => {
    navigateTo("ComicDetailScreen", { comicId });
  };

  // Modern Card Component
  const renderComicCard = ({ item }: { item: ComicItem }) => (
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
            {item.rating && (
              <View className="flex-row items-center bg-black/60 px-1.5 py-0.5 rounded">
                <Ionicons name="star" size={10} color="#D4AF37" />
                <Text className="text-white text-[10px] font-bold ml-1">
                  {item.rating}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </View>

      <Text
        className="text-white font-bold text-xs mt-2 px-0.5 leading-tight"
        numberOfLines={2}
      >
        {item.title}
      </Text>
      <Text className="text-[#A1A1AA] text-[11px] mt-0.5 px-0.5">
        {item.author || "TaleX"}
      </Text>
    </TouchableOpacity>
  );

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
              numberOfLines={2}
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
    <SafeAreaView edges={[]} className="flex-1 bg-[#141619]">
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

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

        {/* 3. Continue Reading Bar (Widget "Tiếp Tục Đọc") */}
        <View className="px-4 mt-4">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openComicDetail(newComics[0].id)}
            className="flex-row items-center bg-[#1E2024] p-3 rounded-2xl border border-[#D4AF37]/30 shadow-lg"
          >
            <Image
              source={newComics[0].image}
              className="w-12 h-16 rounded-xl bg-zinc-800"
              resizeMode="cover"
            />
            <View className="flex-1 ml-3 justify-center">
              <View className="flex-row items-center">
                <Feather name="book-open" size={12} color="#D4AF37" />
                <Text className="text-[#D4AF37] text-[10px] font-bold tracking-wider uppercase ml-1">
                  Đang đọc tiếp
                </Text>
              </View>
              <Text
                className="text-white font-bold text-sm mt-0.5"
                numberOfLines={1}
              >
                {newComics[0].title}
              </Text>
              <Text className="text-[#A1A1AA] text-xs mt-0.5">
                Chương 1100 · Tiến độ 85%
              </Text>
              {/* Progress Bar */}
              <View className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                <View className="w-[85%] h-full bg-[#D4AF37] rounded-full" />
              </View>
            </View>

            <View className="bg-[#D4AF37] px-3.5 py-2 rounded-xl ml-3 flex-row items-center">
              <Text className="text-[#141619] font-extrabold text-xs mr-1">
                Đọc
              </Text>
              <Ionicons name="play" size={11} color="#141619" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 4. Top Webtoon Ranking (Bảng Xếp Hạng Tuần) */}
        <View className="mt-7">
          <View className="flex-row justify-between items-center px-4 mb-3">
            <View className="flex-row items-center">
              <FontAwesome5 name="trophy" size={15} color="#D4AF37" />
              <Text className="text-white text-base font-bold tracking-wide ml-2">
                Bảng Xếp Hạng Tuần Này
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => navigateTo("Search")}
              activeOpacity={0.7}
              className="flex-row items-center py-1 px-1"
            >
              <Text className="text-[#A1A1AA] text-xs font-medium mr-0.5">
                Xem tất cả
              </Text>
              <Ionicons name="chevron-forward" size={13} color="#A1A1AA" />
            </TouchableOpacity>
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
            views: item.views || "0",
            rating: item.rating || "10.0",
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
}: {
  title: string;
  icon?: React.ReactNode;
  data: ComicItem[];
  renderItem: ({ item }: { item: ComicItem }) => React.ReactElement;
  emptyText: string;
  highlighted?: boolean;
  onSeeMore?: () => void;
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
            className={`text-base font-bold tracking-wide ${
              highlighted ? "text-[#D4AF37]" : "text-white"
            }`}
          >
            {title}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onSeeMore}
          activeOpacity={0.7}
          className="flex-row items-center py-1 px-1"
        >
          <Text className="text-[#A1A1AA] text-xs font-medium mr-0.5">
            Xem thêm
          </Text>
          <Ionicons name="chevron-forward" size={13} color="#A1A1AA" />
        </TouchableOpacity>
      </View>

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
    </View>
  );
}



