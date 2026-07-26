import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { FontAwesome5, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

const { width: screenWidth } = Dimensions.get("window");

export interface ParallaxItem {
  id: string;
  title: string;
  subtitle: string;
  bg: any;
  character: any;
  screenType: "movie" | "comic";
  targetId: string;
}

const parallaxData: ParallaxItem[] = [
  {
    id: "p1",
    title: "Vân Tú Hành",
    subtitle: "Trung Quốc đại lục · Cập nhật tập 14",
    bg: require("@assets/movie1_bg.webp"),
    character: require("@assets/movie1_char.webp"),
    screenType: "movie",
    targetId: "hm1",
  },
  {
    id: "p2",
    title: "Mùa Hè Nồng Nhiệt",
    subtitle: "Hàn Quốc · Trọn bộ bản đẹp",
    bg: require("@assets/movie2_bg.webp"),
    character: require("@assets/movie2_char.webp"),
    screenType: "movie",
    targetId: "hm2",
  },
  {
    id: "p3",
    title: "Story Of Kunning Place",
    subtitle: "Trung Quốc · Trọn bộ bản đẹp",
    bg: require("@assets/movie3_bg.webp"),
    character: require("@assets/movie3_char.webp"),
    screenType: "movie",
    targetId: "top-1",
  },
];

export default function BannerCarousel() {
  let navigation: any = null;
  try {
    navigation = useNavigation<any>();
  } catch (_e) {
    navigation = null;
  }
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);
  const currentIndex = useRef(0);

  const [bookmarkedIds, setBookmarkedIds] = useState<{ [key: string]: boolean }>({});

  // Tự động lướt trang sau mỗi 4.5 giây
  useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = currentIndex.current + 1;
      if (nextIndex >= parallaxData.length) {
        nextIndex = 0;
      }
      currentIndex.current = nextIndex;

      flatListRef.current?.scrollToOffset({
        offset: nextIndex * screenWidth,
        animated: true,
      });
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const handleMomentumScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    currentIndex.current = Math.round(contentOffsetX / screenWidth);
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleNavigate = (item: ParallaxItem) => {
    if (item.screenType === "movie") {
      navigation.navigate("MovieDetailScreen", {
        movieId: item.targetId,
        movieTitle: item.title,
        movieImage: item.bg,
      });
    } else {
      navigation.navigate("ComicDetailScreen", {
        comicId: item.targetId,
        comicTitle: item.title,
        comicImage: item.bg,
      });
    }
  };

  const renderParallaxItem = ({
    item,
    index,
  }: {
    item: ParallaxItem;
    index: number;
  }) => {
    const inputRange = [
      (index - 1) * screenWidth,
      index * screenWidth,
      (index + 1) * screenWidth,
    ];

    // LỚP 1: BACKGROUND NỀN ARTWORK
    const translateXBg = scrollX.interpolate({
      inputRange,
      outputRange: [-screenWidth * 0.05, 0, screenWidth * 0.05],
      extrapolate: "clamp",
    });

    // LỚP 2: CHARACTER NHÂN VẬT
    const translateXChar = scrollX.interpolate({
      inputRange,
      outputRange: [-screenWidth * 0.22, 0, screenWidth * 0.22],
      extrapolate: "clamp",
    });

    const scaleChar = scrollX.interpolate({
      inputRange,
      outputRange: [0.92, 1, 0.92],
      extrapolate: "clamp",
    });

    // LỚP 3: CHỮ & BỘ 3 NÚT BẤM NETFLIX
    const translateXText = scrollX.interpolate({
      inputRange,
      outputRange: [-screenWidth * 0.65, 0, screenWidth * 0.65],
      extrapolate: "clamp",
    });

    const opacityText = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    });

    const isBookmarked = !!bookmarkedIds[item.id];

    return (
      <View
        style={{ width: screenWidth }}
        className="h-[430px] relative overflow-hidden bg-[#141619]"
      >
        {/* LỚP 1: BACKGROUND ARTWORK */}
        <Animated.Image
          source={item.bg}
          style={{
            width: screenWidth * 1.15,
            height: "120%",
            position: "absolute",
            top: "-10%",
            left: "-7.5%",
            transform: [{ translateX: translateXBg }],
          }}
          resizeMode="cover"
        />

        {/* LỚP 2: CHARACTER ARTWORK */}
        <Animated.Image
          source={item.character}
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            transform: [{ translateX: translateXChar }, { scale: scaleChar }],
          }}
          resizeMode="contain"
        />

        {/* DẢI GRADIENT MỜ DỐC ĐEN CHÂN BANNER HÒA VÀO NỀN #141619 CỰC MỊN */}
        <LinearGradient
          colors={[
            "transparent",
            "rgba(20, 22, 25, 0.35)",
            "rgba(20, 22, 25, 0.85)",
            "#141619",
            "#141619",
          ]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 160,
          }}
          pointerEvents="none"
        />

        {/* LỚP 3: BỘ 3 NÚT BẤM CỦA NETFLIX + TIÊU ĐỀ */}
        <Animated.View
          style={{
            position: "absolute",
            bottom: 20,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            alignItems: "center",
            opacity: opacityText,
            transform: [{ translateX: translateXText }],
          }}
        >
          {/* Tiêu đề & Phụ đề chính */}
          <Text
            className="text-white text-2xl font-black tracking-wide text-center"
            style={{
              textShadowColor: "rgba(0, 0, 0, 0.9)",
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 8,
            }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            className="text-stone-300 text-xs font-semibold mt-1 mb-4 text-center"
            style={{
              textShadowColor: "rgba(0, 0, 0, 0.9)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }}
            numberOfLines={1}
          >
            {item.subtitle}
          </Text>

          {/* BỘ 3 NÚT BẤM BIỂU TƯỢNG NETFLIX (+ DANH SÁCH | ► PHÁT / ĐỌC | ⓘ THÔNG TIN) */}
          <View className="flex-row items-center justify-around w-full max-w-[340px]">
            {/* 1. Nút bên trái: + Danh sách (Thêm vào tủ sách/yêu thích) */}
            <TouchableOpacity
              onPress={() => toggleBookmark(item.id)}
              className="items-center justify-center w-20 active:opacity-75"
              activeOpacity={0.75}
            >
              <Feather
                name={isBookmarked ? "check" : "plus"}
                size={22}
                color={isBookmarked ? "#D4AF37" : "#FFFFFF"}
              />
              <Text className="text-white text-[11px] font-bold mt-1">
                {isBookmarked ? "Đã lưu" : "Danh sách"}
              </Text>
            </TouchableOpacity>

            {/* 2. Nút ở giữa: ► Phát / Đọc (Nút hình chữ nhật bo góc màu Vàng Gold nổi bật) */}
            <TouchableOpacity
              onPress={() => handleNavigate(item)}
              activeOpacity={0.85}
              className="bg-[#D4AF37] px-7 py-2.5 rounded-xl flex-row items-center shadow-lg shadow-amber-500/40"
            >
              <FontAwesome5
                name={item.screenType === "movie" ? "play" : "book-open"}
                size={14}
                color="#141210"
                style={{ marginRight: 8 }}
              />
              <Text className="text-[#141210] font-black text-sm tracking-wide">
                {item.screenType === "movie" ? "Phát" : "Đọc"}
              </Text>
            </TouchableOpacity>

            {/* 3. Nút bên phải: ⓘ Thông tin (Mở màn hình chi tiết) */}
            <TouchableOpacity
              onPress={() => handleNavigate(item)}
              className="items-center justify-center w-20 active:opacity-75"
              activeOpacity={0.75}
            >
              <Feather name="info" size={22} color="#FFFFFF" />
              <Text className="text-white text-[11px] font-bold mt-1">
                Thông tin
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View className="relative h-[430px] bg-[#141619]">
      <Animated.FlatList
        ref={flatListRef}
        data={parallaxData}
        renderItem={renderParallaxItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={false}
        snapToInterval={screenWidth}
        snapToAlignment="center"
        decelerationRate={0.992}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
      />
    </View>
  );
}