import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Image,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { navigate as safeNavigateRef } from "@/navigation/navigationRef";
import { searchPublicSeries, SearchSeriesItem } from "@/services/series";

const { width: screenWidth } = Dimensions.get("window");
const bannerHeight = 280;

export default function ComicCarousel() {
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
  const flatListRef = useRef<FlatList>(null);
  const isMounted = useRef(true);

  // Fetch real top comics from API for Carousel
  useEffect(() => {
    let active = true;
    const fetchTopComics = async () => {
      try {
        const res = await searchPublicSeries({
          contentType: "COMIC",
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
        console.error("[ComicCarousel] Error fetching carousel data:", err);
      }
    };
    fetchTopComics();
    return () => {
      active = false;
    };
  }, []);

  // TỰ ĐỘNG LƯỚT CAROUSEL 5 GIÂY MỘT LẦN
  useEffect(() => {
    if (bannerData.length <= 1) return;
    isMounted.current = true;
    const interval = setInterval(() => {
      if (isMounted.current && flatListRef.current) {
        setActiveIndex((prevIndex) => {
          const nextIndex =
            prevIndex + 1 >= bannerData.length ? 0 : prevIndex + 1;
          flatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          return nextIndex;
        });
      }
    }, 5000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [bannerData]);

  const handleScroll = (event: any) => {
    if (bannerData.length === 0) return;
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    if (
      isMounted.current &&
      index !== activeIndex &&
      index >= 0 &&
      index < bannerData.length
    ) {
      setActiveIndex(index);
    }
  };

  const renderBannerItem = ({ item }: { item: SearchSeriesItem }) => {
    const coverUri = item.coverUrl || item.bannerUrl;
    const imageSource = coverUri
      ? { uri: coverUri }
      : require("@assets/comic4.webp");

    return (
      <View
        style={{ width: screenWidth }}
        className="h-full justify-center px-4"
      >
        <View className="w-full h-[240px] bg-zinc-900/50 border border-white/5 rounded-[28px] p-4 flex-row items-center shadow-2xl">
          {/* BÊN TRÁI: ẢNH BÌA TRUYỆN */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigateTo("ComicDetailScreen", { comicId: item.seriesId })}
            className="w-[145px] h-[208px] rounded-2xl overflow-hidden bg-zinc-800 shadow-lg"
          >
            <Image
              source={imageSource}
              className="w-full h-full"
              resizeMode="cover"
            />
          </TouchableOpacity>

          {/* BÊN PHẢI: THÔNG TIN TRUYỆN THỰC TẾ */}
          <View className="flex-1 ml-5 h-[200px] justify-between py-1">
            <View>
              <View className="flex-row items-center mb-2">
                <View className="bg-[#D4AF37]/10 px-2.5 py-1 rounded-md border border-[#D4AF37]/30">
                  <Text className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest">
                    Hot Comic
                  </Text>
                </View>
              </View>

              <Text
                className="text-white text-lg font-extrabold tracking-wide leading-6"
                numberOfLines={2}
              >
                {item.title}
              </Text>

              <Text
                className="text-[#7C766B] text-xs font-medium mt-2 leading-5"
                numberOfLines={2}
              >
                {item.description || item.creatorName || "Truyện tranh hấp dẫn trên TaleX"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => navigateTo("ComicDetailScreen", { comicId: item.seriesId })}
              className="flex-row h-11 bg-[#D4AF37] rounded-2xl items-center justify-center self-start px-6 shadow-md active:opacity-80"
            >
              <FontAwesome5 name="book-open" size={11} color="#141210" />
              <Text className="text-[#141210] font-extrabold text-sm ml-2 tracking-wide">
                Đọc Ngay
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (bannerData.length === 0) {
    return null;
  }

  return (
    <View style={{ height: bannerHeight }} className="relative">
      <FlatList
        ref={flatListRef}
        data={bannerData}
        renderItem={renderBannerItem}
        keyExtractor={(item) => item.seriesId}
        horizontal
        pagingEnabled
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={true}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />

      <View className="absolute bottom-2 left-0 right-0 flex-row justify-center items-center">
        {bannerData.map((_, index) => {
          const isActive = index === activeIndex;
          return (
            <View
              key={index}
              style={{
                height: 5,
                width: isActive ? 16 : 5,
                borderRadius: 3,
                backgroundColor: isActive
                  ? "#D4AF37"
                  : "rgba(124, 118, 107, 0.4)",
                marginHorizontal: 3.5,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
