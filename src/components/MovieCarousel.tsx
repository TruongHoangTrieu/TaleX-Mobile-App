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
import { useNavigation } from "@react-navigation/native";
import { navigate as safeNavigateRef } from "@/navigation/navigationRef";
import { searchPublicSeries, SearchSeriesItem } from "@/services/series";

const { width: screenWidth } = Dimensions.get("window");
const BANNER_HEIGHT = 275;

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

  const [bannerData, setBannerData] = useState<SearchSeriesItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [bookmarkedIds, setBookmarkedIds] = useState<{ [key: string]: boolean }>({});
  const flatListRef = useRef<FlatList>(null);

  // Fetch real top video series from API for Carousel
  useEffect(() => {
    let active = true;
    const fetchTopMovies = async () => {
      try {
        const res = await searchPublicSeries({
          contentType: "VIDEO",
          status: "PUBLISHED",
          sortBy: "views",
          sortDirection: "DESC",
          page: 0,
          size: 5,
        });
        if (active && res?.data?.content && res.data.content.length > 0) {
          setBannerData(res.data.content);
        }
      } catch (err) {
        console.error("[MovieCarousel] Error fetching carousel data:", err);
      }
    };
    fetchTopMovies();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (bannerData.length <= 1) return;
    const interval = setInterval(() => {
      const nextIndex =
        activeIndex + 1 >= bannerData.length ? 0 : activeIndex + 1;

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      setActiveIndex(nextIndex);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeIndex, bannerData]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (bannerData.length === 0) return;
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    if (index !== activeIndex && index >= 0 && index < bannerData.length) {
      setActiveIndex(index);
    }
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleNavigate = (item: SearchSeriesItem) => {
    navigateTo("MovieDetailScreen", {
      movieId: item.seriesId,
      movieTitle: item.title,
      seriesItem: item,
    });
  };

  const renderItem = ({ item }: { item: SearchSeriesItem }) => {
    const isBookmarked = !!bookmarkedIds[item.seriesId];
    const coverUri = item.bannerUrl || item.coverUrl;
    const imageSource = coverUri
      ? { uri: coverUri }
      : require("@assets/movie2.jpg");

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
            source={imageSource}
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
              <View className="self-start bg-[#D4AF37] px-3 py-1 rounded-full shadow-md">
                <Text className="text-[#141210] text-[11px] font-extrabold uppercase tracking-wide">
                  Độc Quyền TaleX
                </Text>
              </View>
            </View>

            {/* BOTTOM: TITLE + SUBTITLE + CƠ CHẾ 3 NÚT NETFLIX */}
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

              <Text
                numberOfLines={1}
                className="text-stone-300 mt-1 text-xs font-semibold text-center"
                style={{
                  textShadowColor: "rgba(0, 0, 0, 0.8)",
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 3,
                }}
              >
                {item.description || item.creatorName || "Phim đặc sắc trên TaleX"}
              </Text>

              {/* NÚT XEM NGAY CĂN GIỮA NỔI BẬT */}
              <TouchableOpacity
                onPress={() => handleNavigate(item)}
                activeOpacity={0.85}
                className="bg-[#D4AF37] px-8 py-2.5 rounded-2xl flex-row items-center justify-center shadow-lg shadow-amber-500/30 mt-3.5"
              >
                <FontAwesome5 name="play" size={12} color="#141210" />
                <Text
                  numberOfLines={1}
                  className="text-[#141210] font-extrabold text-sm ml-2 tracking-wide"
                >
                  Xem Ngay
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  if (bannerData.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        height: BANNER_HEIGHT + 25,
      }}
    >
      <FlatList
        ref={flatListRef}
        data={bannerData}
        horizontal
        pagingEnabled
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={true}
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        keyExtractor={(item) => item.seriesId}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />

      <View className="absolute bottom-0 left-0 right-0 flex-row justify-center">
        {bannerData.map((_, index) => {
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
