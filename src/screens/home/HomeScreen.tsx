import React, { useState } from "react";
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
import {
  FontAwesome5,
  Feather,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootNavigator";

import Header from "@components/Header";
import BannerCarousel from "@components/BannerCarousel";
import {
  MediaItem,
  ContinueItem,
  CreatorItem,
  RankedItem,
  continueItems,
  trendingComics,
  hotMovies,
  topRankedItems,
  spotlightCreators,
  dailyFreshItems,
} from "./homeData";

// Danh sách các tab lọc nhanh trên cùng
const quickFilterTabs = [
  { id: "all", label: "Tất cả", icon: "grid" },
  { id: "hot", label: "Phim Hot", icon: "film" },
  { id: "comics", label: "Truyện Mới", icon: "book-open" },
  { id: "rank", label: "Bảng Xếp Hạng", icon: "award" },
  { id: "continue", label: "Xem Tiếp", icon: "play-circle" },
];

export default function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState("all");

  // RENDER MỤC 1: TIẾP TỤC XEM / ĐỌC DỞ (KÈM THANH TIẾN TRÌNH % PROGRESS BAR)
  const renderContinueItem = ({ item }: { item: ContinueItem }) => (
    <TouchableOpacity
      className="mr-3.5 w-[200px]"
      activeOpacity={0.85}
      onPress={() => {
        if (item.type === "comic") {
          (navigation.navigate as any)("ComicDetailScreen", {
            comicId: item.id,
            comicTitle: item.title,
            comicImage: item.image,
          });
        } else {
          (navigation.navigate as any)("MovieDetailScreen", {
            movieId: item.id,
            movieTitle: item.title,
            movieImage: item.image,
          });
        }
      }}
    >
      <View className="w-full h-[120px] rounded-2xl overflow-hidden bg-zinc-900 border border-stone-800 relative shadow-xl">
        <Image
          source={item.image}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* Nút Play Resume phủ ở giữa */}
        <View className="absolute inset-0 items-center justify-center bg-black/40">
          <View className="w-9 h-9 rounded-full bg-[#D4AF37] items-center justify-center shadow-lg">
            <View className="ml-0.5">
              <FontAwesome5 name="play" size={13} color="#141210" />
            </View>
          </View>
        </View>

        {/* Thanh tiến trình Progress Bar bên dưới */}
        <View className="absolute bottom-0 left-0 right-0 h-1.5 bg-stone-800">
          <View
            style={{ width: `${item.progressPercentage}%` }}
            className="h-full bg-[#D4AF37]"
          />
        </View>
      </View>

      <Text
        className="text-stone-100 font-bold text-xs mt-2 px-0.5"
        numberOfLines={1}
      >
        {item.title}
      </Text>
      <Text
        className="text-[#D4AF37] text-[10px] font-semibold mt-0.5 px-0.5"
        numberOfLines={1}
      >
        {item.episodeText} · Đã xem {item.progressPercentage}%
      </Text>
    </TouchableOpacity>
  );

  // RENDER MỤC TRUYỆN TRANH XU HƯỚNG & PHIM HOT
  const renderMediaCard = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity
      className="mr-3.5 w-[130px]"
      activeOpacity={0.85}
      onPress={() => {
        if (item.type === "comic") {
          (navigation.navigate as any)("ComicDetailScreen", {
            comicId: item.id,
            comicTitle: item.title,
            comicImage: item.image,
          });
        } else {
          (navigation.navigate as any)("MovieDetailScreen", {
            movieId: item.id,
            movieTitle: item.title,
            movieImage: item.image,
          });
        }
      }}
    >
      <View className="w-full h-[185px] rounded-2xl overflow-hidden bg-zinc-900 border border-stone-800/80 relative shadow-xl">
        <Image
          source={item.image}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* Tag Thể loại hoặc Chất lượng ở góc trên */}
        {item.typeBadge ? (
          <View className="absolute top-2 right-2 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-md backdrop-blur-md">
            <Text className="text-amber-400 text-[9px] font-black uppercase">
              {item.typeBadge}
            </Text>
          </View>
        ) : null}

        {item.rating ? (
          <View className="absolute top-2 left-2 flex-row items-center bg-black/70 border border-amber-500/40 px-1.5 py-0.5 rounded-md">
            <FontAwesome5 name="star" size={8} color="#D4AF37" style={{ marginRight: 3 }} />
            <Text className="text-amber-400 font-extrabold text-[9px]">
              {item.rating}
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
        className="text-[#7C766B] text-[10px] font-medium mt-0.5 px-0.5"
        numberOfLines={1}
      >
        {item.subtitle || item.category}
      </Text>
    </TouchableOpacity>
  );

  // RENDER MỤC 4: TOP 10 BẢNG XẾP HẠNG SIÊU CẤP (#1, #2, #3 HẠNG MẠ VÀNG)
  const renderRankedCard = ({ item }: { item: RankedItem }) => (
    <TouchableOpacity
      className="mr-4 w-[140px]"
      activeOpacity={0.85}
      onPress={() => {
        if (item.type === "comic") {
          (navigation.navigate as any)("ComicDetailScreen", {
            comicId: item.id,
            comicTitle: item.title,
            comicImage: item.image,
          });
        } else {
          (navigation.navigate as any)("MovieDetailScreen", {
            movieId: item.id,
            movieTitle: item.title,
            movieImage: item.image,
          });
        }
      }}
    >
      <View className="w-full h-[190px] rounded-2xl overflow-hidden bg-zinc-900 border border-amber-500/30 relative shadow-2xl">
        <Image
          source={item.image}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* HUY HIỆU SỐ THỨ HẠNG MẠ VÀNG SIÊU ĐẮNG CẤP GÓC TRÊN TRÁI */}
        <View className="absolute top-2 left-2 w-7 h-7 rounded-full bg-[#141210]/90 border border-[#D4AF37] items-center justify-center shadow-lg">
          <Text className="text-[#D4AF37] font-black text-xs">
            #{item.rankNumber}
          </Text>
        </View>

        {/* Dòng lượt xem mờ đè chân poster */}
        <View className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black via-black/80 to-transparent">
          <Text className="text-amber-400 text-[10px] font-extrabold text-right">
            {item.viewCount} Lượt xem
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
        {item.category}
      </Text>
    </TouchableOpacity>
  );

  // RENDER MỤC 5: GÓC TÁC GIẢ NỔI BẬT
  const renderCreatorItem = ({ item }: { item: CreatorItem }) => (
    <View className="mr-3.5 w-[135px] bg-[#1E1B18] p-3.5 rounded-2xl items-center border border-stone-800 shadow-md">
      <View className="relative">
        <Image
          source={item.avatar}
          className="w-14 h-14 rounded-full bg-zinc-800 border-2 border-[#D4AF37]/50"
          resizeMode="cover"
        />
        {item.isVerified && (
          <View className="absolute bottom-0 right-0 bg-[#141210] rounded-full p-0.5">
            <MaterialCommunityIcons
              name="check-decagram"
              size={15}
              color="#D4AF37"
            />
          </View>
        )}
      </View>

      <Text
        className="text-stone-100 font-bold text-xs mt-2 text-center"
        numberOfLines={1}
      >
        {item.name}
      </Text>
      <Text
        className="text-[#D4AF37] text-[10px] font-semibold text-center mt-0.5"
        numberOfLines={1}
      >
        {item.followerCount} Theo dõi
      </Text>
    </View>
  );

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-[#141619]" style={{ backgroundColor: "#141619" }}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Header thương hiệu */}
      <Header />

      <ScrollView
        className="flex-1"
        alwaysBounceVertical={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* Banner Hero 3 Lớp Parallax */}
        <BannerCarousel />

        {/* ========================================================================= */}
        {/* THANH LỌC NHANH THỂ LOẠI (QUICK CATEGORY CHIPS BAR)                       */}
        {/* ========================================================================= */}
        <View className="mt-4 mb-2">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {quickFilterTabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => {
                    setActiveTab(tab.id);
                    if (tab.id === "rank" || tab.id === "hot") {
                      (navigation.navigate as any)("Top10Movies");
                    }
                  }}
                  activeOpacity={0.8}
                  className={`mr-2.5 px-4 py-2 rounded-full flex-row items-center border ${
                    isSelected
                      ? "bg-[#D4AF37] border-[#D4AF37]"
                      : "bg-[#1E1B18] border-stone-800"
                  }`}
                >
                  <Feather
                    name={tab.icon as any}
                    size={12}
                    color={isSelected ? "#141210" : "#7C766B"}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? "text-[#141210]" : "text-stone-300"
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ========================================================================= */}
        {/* MỤC 1: TIẾP TỤC XEM / ĐỌC DỞ (CONTINUE WATCHING & READING)                */}
        {/* ========================================================================= */}
        <View className="mt-5">
          <View className="flex-row justify-between items-center px-4 mb-3">
            <View className="flex-row items-center">
              <Ionicons name="play-circle-outline" size={18} color="#D4AF37" />
              <Text className="text-white text-base font-bold tracking-wide ml-2">
                Tiếp Tục Xem & Đọc
              </Text>
            </View>
            <TouchableOpacity>
              <Text className="text-[#7C766B] text-xs font-medium">
                Tất cả
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            horizontal
            data={continueItems}
            renderItem={renderContinueItem}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        </View>

        {/* ========================================================================= */}
        {/* MỤC 2: TRUYỆN TRANH XU HƯỚNG 🔥                                          */}
        {/* ========================================================================= */}
        <View className="mt-7">
          <View className="flex-row justify-between items-center px-4 mb-3">
            <View className="flex-row items-center">
              <FontAwesome5 name="fire" size={15} color="#D4AF37" />
              <Text className="text-white text-base font-bold tracking-wide ml-2">
                Truyện Tranh Xu Hướng
              </Text>
            </View>
            <TouchableOpacity>
              <Text className="text-[#7C766B] text-xs font-medium">
                Xem thêm
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            horizontal
            data={trendingComics}
            renderItem={renderMediaCard}
            keyExtractor={(item) => "trend-" + item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        </View>

        {/* ========================================================================= */}
        {/* MỤC 3: PHIM BỘ HOT TRONG TUẦN 🎬                                         */}
        {/* ========================================================================= */}
        <View className="mt-7">
          <View className="flex-row justify-between items-center px-4 mb-3">
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => (navigation.navigate as any)("Top10Movies")}
            >
              <FontAwesome5 name="film" size={14} color="#D4AF37" />
              <Text className="text-white text-base font-bold tracking-wide ml-2">
                Phim Bộ Hot Trong Tuần
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => (navigation.navigate as any)("Top10Movies")}
            >
              <Text className="text-[#7C766B] text-xs font-medium">
                Xem thêm
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            horizontal
            data={hotMovies}
            renderItem={renderMediaCard}
            keyExtractor={(item) => "hotmov-" + item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        </View>

        {/* ========================================================================= */}
        {/* MỤC 4: TOP 10 BẢNG XẾP HẠNG SIÊU CẤP 🏆                                  */}
        {/* ========================================================================= */}
        <View className="mt-7">
          <View className="flex-row justify-between items-center px-4 mb-3">
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => (navigation.navigate as any)("Top10Movies")}
            >
              <FontAwesome5 name="crown" size={15} color="#D4AF37" />
              <Text className="text-white text-base font-bold tracking-wide ml-2">
                Top 10 Bảng Xếp Hạng Tuần Này
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => (navigation.navigate as any)("Top10Movies")}
            >
              <Text className="text-[#7C766B] text-xs font-medium">
                Chi tiết
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            horizontal
            data={topRankedItems}
            renderItem={renderRankedCard}
            keyExtractor={(item) => "rank-" + item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        </View>

        {/* ========================================================================= */}
        {/* MỤC 5: GÓC TÁC GIẢ & STUDIO NỔI BẬT 🌟                                   */}
        {/* ========================================================================= */}
        <View className="mt-7">
          <View className="flex-row justify-between items-center px-4 mb-3">
            <View className="flex-row items-center">
              <MaterialCommunityIcons
                name="star-shooting"
                size={18}
                color="#D4AF37"
              />
              <Text className="text-white text-base font-bold tracking-wide ml-2">
                Góc Tác Giả Nổi Bật
              </Text>
            </View>
          </View>

          <FlatList
            horizontal
            data={spotlightCreators}
            renderItem={renderCreatorItem}
            keyExtractor={(item) => "cr-" + item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        </View>

        {/* ========================================================================= */}
        {/* MỤC 6: MỚI CẬP NHẬT TRONG NGÀY ⚡                                         */}
        {/* ========================================================================= */}
        <View className="mt-7">
          <View className="flex-row justify-between items-center px-4 mb-3">
            <View className="flex-row items-center">
              <Ionicons name="flash" size={16} color="#D4AF37" />
              <Text className="text-white text-base font-bold tracking-wide ml-2">
                Mới Cập Nhật Trong Ngày
              </Text>
            </View>
            <TouchableOpacity>
              <Text className="text-[#7C766B] text-xs font-medium">
                Xem tất cả
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            horizontal
            data={dailyFreshItems}
            renderItem={renderMediaCard}
            keyExtractor={(item) => "fresh-" + item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
