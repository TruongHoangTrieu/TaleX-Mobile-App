import React, { useState } from "react";
import {
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import ComicCarousel from "@components/ComicCarousel";
import Header from "@components/Header";
import {
  ComicItem,
  comicCategories,
  comboComics,
  newComics,
  recommendedComics,
} from "./comicMockData";

export default function ComicsScreen() {
  const navigation = useNavigation<any>();
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  const filterByCategory = (comicList: ComicItem[]) => {
    if (selectedCategory === "Tất cả") return comicList;
    return comicList.filter((comic) => comic.category === selectedCategory);
  };

  const openComicDetail = (comic: ComicItem) => {
    navigation.navigate("ComicDetailScreen", { comicId: comic.id });
  };

  const renderComicCard = ({ item }: { item: ComicItem }) => (
    <TouchableOpacity
      className="mr-4 w-[135px] relative"
      activeOpacity={0.85}
      onPress={() => openComicDetail(item)}
    >
      <Image
        source={item.image}
        className="w-full h-[185px] rounded-2xl bg-zinc-800"
        resizeMode="cover"
      />

      {item.tag && (
        <View
          className="absolute top-2 left-2 bg-[#D4AF37] px-2 py-0.5 rounded-md shadow-sm"
          style={{ transform: [{ rotate: "-12deg" }] }}
        >
          <Text className="text-[#141210] text-[10px] font-extrabold tracking-wider">
            {item.tag}
          </Text>
        </View>
      )}

      <Text
        className="text-[#E5E0D8] font-semibold text-xs mt-2 px-0.5"
        numberOfLines={2}
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-[#141210]">
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <Header titleType="text" titleText="Truyện Tranh" showCategories={false} />

      <View className="h-10 border-b border-white/5 bg-[#141210]">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, alignItems: "center" }}
        >
          {comicCategories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                className="mr-6 h-full justify-center"
                activeOpacity={0.7}
              >
                <Text
                  className={`text-[15px] ${
                    isSelected
                      ? "text-[#D4AF37] font-bold text-base"
                      : "text-[#E5E0D8]/70 font-medium"
                  }`}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 130 }}
      >
        <View className="mt-3">
          <ComicCarousel />
        </View>

        <ComicSection
          title="Nội Dung Mới - Xem Ngay"
          data={filterByCategory(newComics)}
          renderItem={renderComicCard}
          emptyText="Không có truyện mới thuộc thể loại này"
        />

        <ComicSection
          title="Đề Xuất Cho Bạn"
          data={filterByCategory(recommendedComics)}
          renderItem={renderComicCard}
          emptyText="Chưa có đề xuất cho thể loại này"
        />

        <ComicSection
          title="Combo Siêu Tiết Kiệm"
          data={filterByCategory(comboComics)}
          renderItem={renderComicCard}
          emptyText="Không có gói combo nào cho thể loại này"
          highlighted
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function ComicSection({
  title,
  data,
  renderItem,
  emptyText,
  highlighted,
}: {
  title: string;
  data: ComicItem[];
  renderItem: ({ item }: { item: ComicItem }) => React.ReactElement;
  emptyText: string;
  highlighted?: boolean;
}) {
  return (
    <View
      className={`mt-7 ${
        highlighted ? "bg-zinc-900/40 py-5 border-t border-b border-white/5" : ""
      }`}
    >
      <View className="flex-row justify-between items-center px-4 mb-3">
        <Text
          className={`text-base font-bold tracking-wide ${
            highlighted ? "text-[#D4AF37]" : "text-white"
          }`}
        >
          {title}
        </Text>
        <TouchableOpacity>
          <Text className="text-[#7C766B] text-xs font-medium">Xem thêm</Text>
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
          <Text className="text-[#7C766B] text-xs px-4 py-2 italic">
            {emptyText}
          </Text>
        }
      />
    </View>
  );
}
