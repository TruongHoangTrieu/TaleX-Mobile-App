import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { getComicById } from "./comicMockData";

type ComicDetailRouteParams = {
  comicId?: string;
};

export default function ComicDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { comicId } = (route.params || {}) as ComicDetailRouteParams;
  const comic = getComicById(comicId);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#141210]">
      <StatusBar barStyle="light-content" backgroundColor="#141210" />

      <View className="h-[56px] px-4 flex-row items-center justify-center relative border-b border-white/5">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute left-4 w-10 h-10 items-center justify-center"
          activeOpacity={0.75}
        >
          <Feather name="arrow-left" size={24} color="#E5E0D8" />
        </TouchableOpacity>

        <Text className="text-[#E5E0D8] text-[18px] font-bold">
          Chi Tiết Truyện
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View className="p-4">
          <View className="flex-row">
            <View className="w-[140px] h-[200px] rounded-xl overflow-hidden bg-[#252830]">
              <Image
                source={comic.image}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>

            <View className="flex-1 ml-4">
              <Text className="text-white text-[20px] font-bold" numberOfLines={3}>
                {comic.title}
              </Text>

              <Text className="text-gray-400 mt-1 text-[14px]" numberOfLines={2}>
                Tác giả: {comic.author}
              </Text>

              <View className="flex-row items-center mt-3">
                <FontAwesome name="star" size={14} color="#FFD54F" />
                <Text className="text-[#FFD54F] ml-1 font-bold">
                  {comic.rating}
                </Text>

                <Feather
                  name="eye"
                  size={14}
                  color="#ccc"
                  style={{ marginLeft: 16 }}
                />
                <Text className="text-[#ccc] ml-1">{comic.views}</Text>
              </View>

              <View className="mt-3 px-3 py-1 rounded-full bg-[#252830] self-start">
                <Text className="text-[#D4AF37] text-[12px] font-bold">
                  {comic.status}
                </Text>
              </View>

              {comic.tag && (
                <View className="mt-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 self-start">
                  <Text className="text-[#D4AF37] text-[12px] font-bold">
                    {comic.tag}
                  </Text>
                </View>
              )}

              <TouchableOpacity className="mt-3 flex-row items-center px-4 h-[40px] rounded-full bg-[#252830] self-start">
                <FontAwesome name="star" size={16} color="#D4AF37" />
                <Text className="text-white ml-2">Theo dõi</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text className="text-[#E5E0D8] text-[16px] font-bold mt-6">
            Giới thiệu nội dung
          </Text>

          <Text className="text-gray-300 mt-2 leading-5">
            {comic.description}
          </Text>

          <View className="flex-row mt-5 bg-[#252830] rounded-xl p-3">
            <View className="flex-1 items-center">
              <Text className="text-white font-bold">{comic.views}</Text>
              <Text className="text-gray-500 text-[12px]">Lượt xem</Text>
            </View>

            <View className="flex-1 items-center">
              <Text className="text-white font-bold">{comic.rating}</Text>
              <Text className="text-gray-500 text-[12px]">Đánh giá</Text>
            </View>

            <View className="flex-1 items-center">
              <Text className="text-white font-bold">{comic.chapters.length}</Text>
              <Text className="text-gray-500 text-[12px]">Chương</Text>
            </View>
          </View>

          <View className="h-[1px] bg-[#252830] my-6" />

          <Text className="text-[#E5E0D8] text-[16px] font-bold">
            Danh sách chương
          </Text>

          <View className="mt-3">
            {comic.chapters.map((chapter, index) => {
              const isExpanded = expandedChapter === chapter.title;
              return (
                <View key={chapter.title} className="mb-2">
                  <TouchableOpacity
                    className={`h-12 border border-white/5 px-4 flex-row items-center justify-between bg-[#1F1C1A] ${
                      isExpanded ? "rounded-t-xl border-b-0" : "rounded-xl"
                    }`}
                    activeOpacity={0.75}
                    onPress={() =>
                      setExpandedChapter(isExpanded ? null : chapter.title)
                    }
                  >
                    <View>
                      <Text className="text-white font-semibold">{chapter.title}</Text>
                      <Text className="text-[#7C766B] text-[11px] mt-0.5">
                        {chapter.episodes.length} tập con • Cập nhật tập {index + 1}
                      </Text>
                    </View>
                    <Feather
                      name={isExpanded ? "chevron-down" : "chevron-right"}
                      size={18}
                      color={isExpanded ? "#D4AF37" : "#7C766B"}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View className="bg-[#181614] border-x border-b border-white/5 rounded-b-xl px-4 py-1">
                      {chapter.episodes.map((episode, epIndex) => (
                        <TouchableOpacity
                          key={episode}
                          className="py-3 flex-row items-center justify-between border-b border-white/5 last:border-b-0"
                          activeOpacity={0.7}
                        >
                          <View className="flex-row items-center">
                            <View className="w-5 h-5 rounded-full bg-[#D4AF37]/10 items-center justify-center mr-2.5">
                              <Text className="text-[#D4AF37] text-[10px] font-bold">
                                {epIndex + 1}
                              </Text>
                            </View>
                            <Text className="text-gray-300 text-sm font-medium">
                              {episode}
                            </Text>
                          </View>
                          <Feather name="book-open" size={16} color="#7C766B" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View className="h-[70px] bg-[#1F1C1A] px-4 justify-center border-t border-white/5">
        <TouchableOpacity className="h-[48px] bg-[#D4AF37] rounded-full items-center justify-center">
          <Text className="text-[#141210] font-bold text-[15px]">
            ĐỌC NGAY CHƯƠNG 1
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
