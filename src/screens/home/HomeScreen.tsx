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
import { FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootNavigator";

import Header from "@components/Header";
import BannerCarousel from "@components/BannerCarousel";
import {
  MediaItem,
  trendingComics,
  hotMovies,
  freshComics,
  topRankMovies,
} from "./homeData";

export default function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // State quản lý thể loại đang active (Mặc định 'Đề xuất' nghĩa là hiện Tất cả)
  const [activeCategory, setActiveCategory] = useState("Đề xuất");

  // Hàm filter nội dung thông minh dựa theo tab người dùng lựa chọn trên Header
  const filterContent = (list: MediaItem[]) => {
    if (activeCategory === "Đề xuất") return list;
    return list.filter((item) => item.category === activeCategory);
  };

  // Render card cho Truyện Tranh (Ảnh dọc đứng tỉ lệ chuẩn)
  const renderComicItem = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity className="mr-4 w-[140px]" activeOpacity={0.8}>
      <Image
        source={item.image}
        className="w-full h-[190px] rounded-xl bg-zinc-800"
        resizeMode="cover"
      />
      <Text
        className="text-stone-200 font-semibold text-xs mt-2 px-0.5"
        numberOfLines={1}
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  // Render card cho Phim (Ảnh ngang tỉ lệ 16:9 poster phim chuẩn)
  const renderMovieItem = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity className="mr-4 w-[220px]" activeOpacity={0.8}>
      <View className="w-full h-[125px] rounded-xl overflow-hidden bg-zinc-800 relative shadow-md">
        <Image
          source={item.image}
          className="w-full h-full"
          resizeMode="cover"
        />
        <View className="absolute bottom-2 right-2 w-7 h-7 bg-[#D4AF37] rounded-full items-center justify-center shadow">
          <FontAwesome5
            name="play"
            size={9}
            color="#141210"
            style={{ marginLeft: 1 }}
          />
        </View>
      </View>
      <Text
        className="text-stone-200 font-semibold text-xs mt-2 px-0.5"
        numberOfLines={1}
      >
        {item.title}
      </Text>
      {item.subtitle && (
        <Text
          className="text-[#7C766B] text-[10px] mt-0.5 px-0.5 font-medium"
          numberOfLines={1}
        >
          {item.subtitle}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-[#141210]">
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Truyền các hàm callback nhận diện state thay đổi từ Header sang nếu sau này bạn muốn đồng bộ */}
      <Header
        activeCategory={activeCategory}
        onCategoryChange={(cat) => setActiveCategory(cat)}
      />

      <ScrollView
        className="flex-1"
        alwaysBounceVertical={true}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
      >
        {/* Banner lớn mượt mà trên cùng */}
        <BannerCarousel />

        {/* MỤC 1: TRUYỆN TRANH XU HƯỚNG 🔥 */}
        <View className="mt-6">
          <View className="flex-row justify-between items-center px-4">
            <Text className="text-white text-base font-bold tracking-wide">
              🔥 Truyện Tranh Xu Hướng
            </Text>
            <TouchableOpacity>
              <Text className="text-[#7C766B] text-xs font-medium">
                Xem thêm
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={filterContent(trendingComics)}
            renderItem={renderComicItem}
            keyExtractor={(item) => "trend-" + item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, marginTop: 12 }}
            ListEmptyComponent={
              <Text className="text-[#7C766B] text-xs px-4 py-2 italic">
                Không có nội dung thuộc thể loại này
              </Text>
            }
          />
        </View>

        {/* MỤC 2: PHIM BỘ HOT TRONG TUẦN 🎬 */}
        <View className="mt-8">
          <View className="flex-row justify-between items-center px-4">
            <Text className="text-white text-base font-bold tracking-wide">
              🎬 Phim Bộ Hot Trong Tuần
            </Text>
            <TouchableOpacity>
              <Text className="text-[#7C766B] text-xs font-medium">
                Xem thêm
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={filterContent(hotMovies)}
            renderItem={renderMovieItem}
            keyExtractor={(item) => "hot-mov-" + item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, marginTop: 12 }}
            ListEmptyComponent={
              <Text className="text-[#7C766B] text-xs px-4 py-2 italic">
                Không có phim thuộc thể loại này
              </Text>
            }
          />
        </View>

        {/* MỤC 3: NỘI DUNG MỚI CẬP NHẬT 📚 */}
        <View className="mt-8">
          <View className="flex-row justify-between items-center px-4">
            <Text className="text-white text-base font-bold tracking-wide">
              ✨ Mới Cập Nhật Hôm Nay
            </Text>
            <TouchableOpacity>
              <Text className="text-[#7C766B] text-xs font-medium">
                Xem thêm
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={filterContent(freshComics)}
            renderItem={renderComicItem}
            keyExtractor={(item) => "fresh-com-" + item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, marginTop: 12 }}
            ListEmptyComponent={
              <Text className="text-[#7C766B] text-xs px-4 py-2 italic">
                Không có truyện thuộc thể loại này
              </Text>
            }
          />
        </View>

        {/* MỤC 4: BẢNG XẾP HẠNG SIÊU CẤP 🏆 */}
        <View className="mt-8">
          <View className="flex-row justify-between items-center px-4">
            <Text className="text-white text-base font-bold tracking-wide">
              🏆 Bảng Xếp Hạng Tổng Hợp
            </Text>
            <TouchableOpacity>
              <Text className="text-[#7C766B] text-xs font-medium">
                Chi tiết
              </Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            data={filterContent(topRankMovies)}
            renderItem={renderMovieItem}
            keyExtractor={(item) => "top-rank-" + item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, marginTop: 12 }}
            ListEmptyComponent={
              <Text className="text-[#7C766B] text-xs px-4 py-2 italic">
                Không có bảng xếp hạng thuộc thể loại này
              </Text>
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
