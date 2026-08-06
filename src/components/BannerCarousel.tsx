import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { HomeFeedSeries } from "@/services/recommendations";

const { width: screenWidth } = Dimensions.get("window");
// 16:9 Banner height calculation
const bannerHeight = Math.round((screenWidth * 9) / 16);
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=1400&auto=format&fit=crop";

function formatViews(value?: number) {
  if (typeof value !== "number" || value <= 0) return "0 lượt xem";
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M lượt xem`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k lượt xem`;
  }
  return `${value} lượt xem`;
}

function getReleaseYear(item: HomeFeedSeries) {
  const dateStr = item.releasedUpdateTime || item.createdAt || item.updatedAt;
  if (!dateStr) return null;
  const year = new Date(dateStr).getFullYear();
  return isNaN(year) ? null : String(year);
}

function getImageUri(series?: HomeFeedSeries) {
  if (!series) return FALLBACK_IMAGE;
  return series.bannerUrl || series.coverUrl || FALLBACK_IMAGE;
}

export interface BannerCarouselProps {
  promotedItems?: HomeFeedSeries[];
  navigation?: any;
}

export default function BannerCarousel({
  promotedItems,
  navigation,
}: BannerCarouselProps) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);
  const currentIndex = useRef(0);

  // Only use real API items if available (max 3 items)
  const slides = React.useMemo(() => {
    if (promotedItems && promotedItems.length > 0) {
      return promotedItems.slice(0, 3);
    }
    return [];
  }, [promotedItems]);

  // Auto scroll timer
  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      let nextIndex = currentIndex.current + 1;
      if (nextIndex >= slides.length) {
        nextIndex = 0;
      }
      currentIndex.current = nextIndex;

      flatListRef.current?.scrollToOffset({
        offset: nextIndex * screenWidth,
        animated: true,
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [slides.length]);

  const handleMomentumScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    currentIndex.current = Math.round(contentOffsetX / screenWidth);
  };

  const handleNavigate = (item: HomeFeedSeries) => {
    const isComic = item.contentType?.toUpperCase() === "COMIC";
    const imageUri = getImageUri(item);
    if (isComic) {
      navigation?.navigate("ComicDetailScreen", {
        comicId: item.seriesId,
        comicTitle: item.title,
        comicImage: imageUri,
      });
    } else {
      navigation?.navigate("MovieDetailScreen", {
        movieId: item.seriesId,
        movieTitle: item.title,
        movieImage: imageUri,
      });
    }
  };

  // Skeleton loading state if no real data yet
  if (!slides || slides.length === 0) {
    return (
      <View
        style={{ width: screenWidth, height: bannerHeight }}
        className="relative bg-transparent p-4 flex-col justify-end"
      >
        <View className="w-full h-full absolute inset-0 bg-zinc-900/90 animate-pulse" />
        <LinearGradient
          colors={["transparent", "rgba(13, 11, 10, 0.6)", "rgba(13, 11, 10, 0.95)"]}
          className="absolute inset-0"
        />
        <View className="relative mb-2">
          <View className="w-3/4 h-7 bg-zinc-800 rounded-lg mb-2 animate-pulse" />
          <View className="flex-row gap-2">
            <View className="w-12 h-5 bg-zinc-800 rounded-md animate-pulse" />
            <View className="w-14 h-5 bg-zinc-800 rounded-md animate-pulse" />
          </View>
        </View>
      </View>
    );
  }

  const renderCarouselItem = ({
    item,
    index,
  }: {
    item: HomeFeedSeries;
    index: number;
  }) => {
    const inputRange = [
      (index - 1) * screenWidth,
      index * screenWidth,
      (index + 1) * screenWidth,
    ];

    const translateXBg = scrollX.interpolate({
      inputRange,
      outputRange: [-screenWidth * 0.05, 0, screenWidth * 0.05],
      extrapolate: "clamp",
    });

    const translateXText = scrollX.interpolate({
      inputRange,
      outputRange: [-screenWidth * 0.4, 0, screenWidth * 0.4],
      extrapolate: "clamp",
    });

    const opacityText = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    });

    const yearStr = getReleaseYear(item);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => handleNavigate(item)}
        style={{ width: screenWidth, height: bannerHeight }}
        className="relative overflow-hidden bg-transparent"
      >
        {/* 16:9 FULL BANNER IMAGE FROM API */}
        <Animated.Image
          source={{ uri: getImageUri(item) }}
          style={{
            width: screenWidth,
            height: bannerHeight,
            position: "absolute",
            top: 0,
            left: 0,
            transform: [{ translateX: translateXBg }],
          }}
          resizeMode="cover"
        />

        {/* VIBRANT AGE RATING BADGE AT TOP-RIGHT CORNER (NO BORDER) */}
        {item.ageRating ? (
          <View className="absolute top-3 right-3 z-10 bg-[#D4AF37] px-2.5 py-1 rounded-md shadow-xl">
            <Text className="text-[#141210] text-xs font-black uppercase tracking-wider">
              {item.ageRating}
            </Text>
          </View>
        ) : null}

        {/* GRADIENT VIGNETTE OVERLAY */}
        <LinearGradient
          colors={[
            "transparent",
            "rgba(13, 11, 10, 0.25)",
            "rgba(13, 11, 10, 0.75)",
            "rgba(13, 11, 10, 0.95)",
          ]}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 120,
          }}
          pointerEvents="none"
        />

        {/* BOTTOM-LEFT OVERLAY (ONLY REAL DATA FROM API) */}
        <Animated.View
          style={{
            position: "absolute",
            bottom: 12,
            left: 0,
            right: 0,
            paddingHorizontal: 16,
            opacity: opacityText,
            transform: [{ translateX: translateXText }],
          }}
        >
          {/* TITLE FROM API */}
          <Text
            className="text-white text-2xl font-black tracking-wide mb-2"
            style={{
              textShadowColor: "rgba(0, 0, 0, 0.95)",
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 8,
            }}
            numberOfLines={1}
          >
            {item.title}
          </Text>

          {/* BADGES ROW (NO BORDERS) */}
          <View className="flex-row items-center flex-wrap gap-1.5">
            {/* Release Year (e.g. 2026) */}
            {yearStr ? (
              <View className="bg-black/50 px-2.5 py-0.5 rounded-md">
                <Text className="text-white text-[11px] font-bold">
                  {yearStr}
                </Text>
              </View>
            ) : null}

            {/* Content Type (Truyện / Phim) */}
            <View className="bg-black/50 px-2.5 py-0.5 rounded-md">
              <Text className="text-white text-[11px] font-bold">
                {item.contentType?.toUpperCase() === "COMIC"
                  ? "Truyện"
                  : "Phim"}
              </Text>
            </View>

            {/* Views Count */}
            <View className="bg-black/50 px-2.5 py-0.5 rounded-md">
              <Text className="text-white text-[11px] font-bold">
                {formatViews(item.analyticData?.views ?? item.totalViews)}
              </Text>
            </View>

            {/* Average Rating Score (if > 0) */}
            {item.averageRating && item.averageRating > 0 ? (
              <View className="bg-black/50 px-2.5 py-0.5 rounded-md flex-row items-center">
                <Text className="text-amber-400 text-[11px] font-black">
                  ★ {item.averageRating.toFixed(1)}
                </Text>
              </View>
            ) : null}
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={{ height: bannerHeight }}
      className="relative bg-transparent"
    >
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderCarouselItem}
        keyExtractor={(item, index) =>
          `banner-real-${item.seriesId || index}-${index}`
        }
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
          { useNativeDriver: true },
        )}
      />
    </View>
  );
}
