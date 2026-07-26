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
import { FontAwesome5, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ImageSourcePropType } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { navigate as safeNavigateRef } from "@/navigation/navigationRef";

const { width: screenWidth } = Dimensions.get("window");

const BANNER_HEIGHT = 275;

interface MovieBannerItem {
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;
  image: ImageSourcePropType;
  movieId?: string;
}

const movieBannerData: MovieBannerItem[] = [
  {
    id: "1",
    title: "Ma Tôn Bản Truyền Kỳ",
    subtitle: "Tập 1120 • Vietsub • Cực Hot",
    tag: "Độc Quyền",
    image: require("@assets/comic4.webp"),
    movieId: "tm1",
  },
  {
    id: "2",
    title: "Võ Thần Chí Tôn",
    subtitle: "Phần Mới • Full HD",
    tag: "Trending",
    image: require("@assets/movie2.jpg"),
    movieId: "tm2",
  },
  {
    id: "3",
    title: "Tiểu Thư Ác Độc Đại Chiến",
    subtitle: "Mới Cập Nhật",
    tag: "Mới",
    image: require("@assets/movie3.jpg"),
    movieId: "tm3",
  },
];

export default function MovieCarousel() {
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

  const [activeIndex, setActiveIndex] = useState(0);
  const [bookmarkedIds, setBookmarkedIds] = useState<{ [key: string]: boolean }>({});
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex =
        activeIndex + 1 >= movieBannerData.length ? 0 : activeIndex + 1;

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      setActiveIndex(nextIndex);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeIndex]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);

    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleNavigate = (item: MovieBannerItem) => {
    navigateTo("MovieDetailScreen", {
      movieId: item.movieId || item.id,
      movieTitle: item.title,
    });
  };

  const renderItem = ({ item }: { item: MovieBannerItem }) => {
    const isBookmarked = !!bookmarkedIds[item.id];

    return (
      <View
        style={{
          width: screenWidth,
          paddingHorizontal: 16,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => handleNavigate(item)}
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

          {/* Overlay Gradient */}
          <LinearGradient
            colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.45)", "rgba(0,0,0,0.92)"]}
            style={{
              flex: 1,
              padding: 16,
              justifyContent: "space-between",
            }}
          >
            {/* TOP TAG */}
            <View>
              {item.tag && (
                <View className="self-start bg-[#D4AF37] px-3 py-1 rounded-full shadow-md">
                  <Text className="text-[#141210] text-[11px] font-extrabold uppercase tracking-wide">
                    {item.tag}
                  </Text>
                </View>
              )}
            </View>

            {/* BOTTOM: TITLE + SUBTITLE + CƠ CHẾ 3 NÚT NETFLIX CÂN ĐỐI NẰM GIỮA */}
            <View className="items-center">
              <Text
                numberOfLines={1}
                className="text-white text-2xl font-black tracking-wide text-center"
                style={{
                  textShadowColor: "rgba(0, 0, 0, 0.8)",
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 4,
                }}
              >
                {item.title}
              </Text>

              {item.subtitle && (
                <Text
                  numberOfLines={1}
                  className="text-stone-300 mt-1 text-xs font-semibold text-center"
                  style={{
                    textShadowColor: "rgba(0, 0, 0, 0.8)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  }}
                >
                  {item.subtitle}
                </Text>
              )}

              {/* 3 NÚT BẤM CÂN ĐỐI NẰM GIỮA (HIỂN THỊ ĐẦY ĐỦ "XEM NGAY") */}
              <View className="flex-row items-center justify-between w-full mt-4 px-2">
                {/* 1. Nút bên trái: + Danh sách / Đã lưu */}
                <TouchableOpacity
                  onPress={() => toggleBookmark(item.id)}
                  className="items-center justify-center w-16 active:opacity-75"
                  activeOpacity={0.75}
                >
                  <Feather
                    name={isBookmarked ? "check" : "plus"}
                    size={20}
                    color={isBookmarked ? "#D4AF37" : "#FFFFFF"}
                  />
                  <Text className="text-white text-[11px] font-bold mt-1">
                    {isBookmarked ? "Đã lưu" : "Danh sách"}
                  </Text>
                </TouchableOpacity>

                {/* 2. Nút ở giữa: ► Xem Ngay (Nút vàng bo góc nổi bật, 1 hàng chuẩn) */}
                <TouchableOpacity
                  onPress={() => handleNavigate(item)}
                  activeOpacity={0.85}
                  className="bg-[#D4AF37] px-5 py-2.5 rounded-xl flex-row items-center justify-center shadow-lg shadow-amber-500/30"
                >
                  <FontAwesome5 name="play" size={12} color="#141210" />
                  <Text
                    numberOfLines={1}
                    className="text-[#141210] font-black text-xs ml-1.5 tracking-wide"
                  >
                    Xem Ngay
                  </Text>
                </TouchableOpacity>

                {/* 3. Nút bên phải: ⓘ Thông tin */}
                <TouchableOpacity
                  onPress={() => handleNavigate(item)}
                  className="items-center justify-center w-16 active:opacity-75"
                  activeOpacity={0.75}
                >
                  <Feather name="info" size={20} color="#FFFFFF" />
                  <Text className="text-white text-[11px] font-bold mt-1">
                    Thông tin
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
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

      {/* Dots Indicator */}
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
                backgroundColor: active ? "#D4AF37" : "rgba(255,255,255,0.3)",
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

