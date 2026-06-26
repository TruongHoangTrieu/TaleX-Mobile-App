import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ImageSourcePropType } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

const BANNER_HEIGHT = 250;

interface MovieBannerItem {
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;
  image: ImageSourcePropType;
}

const movieBannerData: MovieBannerItem[] = [
  {
    id: "1",
    title: "Ma Tôn Bản Truyền Kỳ",
    subtitle: "Tập 1120 • Vietsub • Cực Hot",
    tag: "Độc Quyền",
    image: require("@assets/comic4.webp"),
  },
  {
    id: "2",
    title: "Võ Thần Chí Tôn",
    subtitle: "Phần Mới • Full HD",
    tag: "Trending",
    image: require("@assets/movie2.jpg"),
  },
  {
    id: "3",
    title: "Tiểu Thư Ác Độc Đại Chiến",
    subtitle: "Mới Cập Nhật",
    tag: "Mới",
    image: require("@assets/movie3.jpg"),
  },
];

export default function MovieCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex =
        activeIndex + 1 >= movieBannerData.length
          ? 0
          : activeIndex + 1;

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      setActiveIndex(nextIndex);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeIndex]);

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const index = Math.round(
      event.nativeEvent.contentOffset.x / screenWidth
    );

    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const renderItem = ({ item }: { item: MovieBannerItem }) => {
    return (
      <View
        style={{
          width: screenWidth,
          paddingHorizontal: 16,
        }}
      >
        <View
          className="overflow-hidden rounded-3xl"
          style={{
            height: BANNER_HEIGHT,
          }}
        >
          {/* Background Image */}
          <Image
            source={item.image}
            resizeMode="cover"
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
            }}
          />

          {/* Overlay */}
          <LinearGradient
            colors={[
              "rgba(0,0,0,0.05)",
              "rgba(0,0,0,0.3)",
              "rgba(0,0,0,0.85)",
            ]}
            style={{
              flex: 1,
              padding: 20,
              justifyContent: "space-between",
            }}
          >
            {/* TOP */}
            <View>
              {item.tag && (
                <View className="self-start bg-[#D4AF37] px-3 py-1 rounded-full">
                  <Text className="text-[#141210] text-[11px] font-bold">
                    {item.tag}
                  </Text>
                </View>
              )}
            </View>

            {/* BOTTOM */}
            <View>
              <Text
                numberOfLines={2}
                className="text-white text-[26px] font-extrabold"
              >
                {item.title}
              </Text>

              <Text
                numberOfLines={2}
                className="text-gray-300 mt-2 text-sm"
              >
                {item.subtitle}
              </Text>

              <View className="flex-row mt-4">
                <TouchableOpacity className="bg-[#D4AF37] px-5 py-3 rounded-2xl flex-row items-center">
                  <FontAwesome5
                    name="play"
                    size={12}
                    color="#141210"
                  />

                  <Text className="text-[#141210] font-bold ml-2">
                    Xem Ngay
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity className="ml-3 bg-white/15 px-4 py-3 rounded-2xl">
                  <FontAwesome5
                    name="plus"
                    size={14}
                    color="white"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  };

  return (
    <View
      style={{
        height: BANNER_HEIGHT + 25,
      }}
    >
      <FlatList
        ref={flatListRef}
        data={movieBannerData}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />

      {/* Dots */}
      <View className="absolute bottom-0 left-0 right-0 flex-row justify-center">
        {movieBannerData.map((_, index) => {
          const active = index === activeIndex;

          return (
            <View
              key={index}
              style={{
                width: active ? 22 : 6,
                height: 6,
                borderRadius: 99,
                marginHorizontal: 3,
                backgroundColor: active
                  ? "#D4AF37"
                  : "rgba(255,255,255,0.3)",
              }}
            />
          );
        })}
      </View>
    </View>
  );
}