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
import { ImageSourcePropType } from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const bannerHeight = 280; // PHÓNG LỚN: Tăng chiều cao tổng thể từ 220 lên 280

interface MediaItem {
  id: string;
  title: string;
  image: ImageSourcePropType;
  subtitle?: string;
}

const comicBannerData: MediaItem[] = [
  {
    id: "cb1",
    title: "One Piece - Wano Quốc",
    subtitle: "Cập nhật Chương 1100 · Hấp dẫn",
    image: require("@assets/comic7.webp"),
  },
  {
    id: "cb2",
    title: "Pokémon Đặc Biệt",
    subtitle: "Nội dung mới xem ngay · Độc quyền",
    image: require("@assets/comic8.jpg"),
  },
  {
    id: "cb3",
    title: "Yu-Gi-Oh! Vua Trò Chơi",
    subtitle: "Trọn bộ màu sắc nét · Huyền thoại",
    image: require("@assets/comic9.jpg"),
  },
];

export default function ComicCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const isMounted = useRef(true);

  // TỰ ĐỘNG LƯỚT CAROUSEL 4 GIÂY MỘT LẦN
  useEffect(() => {
    isMounted.current = true;
    const interval = setInterval(() => {
      if (isMounted.current && flatListRef.current) {
        setActiveIndex((prevIndex) => {
          const nextIndex = prevIndex + 1 >= comicBannerData.length ? 0 : prevIndex + 1;
          flatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          return nextIndex;
        });
      }
    }, 6000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, []);

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    if (isMounted.current && index !== activeIndex && index >= 0 && index < comicBannerData.length) {
      setActiveIndex(index);
    }
  };

  const renderBannerItem = ({ item }: { item: MediaItem }) => {
    return (
      <View style={{ width: screenWidth }} className="h-full justify-center px-4">
        
        {/* KHUNG CHỨA LỚN: Nâng chiều cao từ 185px lên thành 240px */}
        <View className="w-full h-[240px] bg-zinc-900/50 border border-white/5 rounded-[28px] p-4 flex-row items-center shadow-2xl">
          
          {/* BÊN TRÁI: PHÓNG TO ẢNH BÌA TRUYỆN (Từ 110x161 lên thành 145x208) */}
          {/* Tỷ lệ vàng này giúp ảnh to, hoành tráng và hiển thị trọn vẹn, sắc nét */}
          <View className="w-[145px] h-[208px] rounded-2xl overflow-hidden bg-zinc-800 shadow-lg">
            <Image
              source={item.image}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>

          {/* BÊN PHẢI: KHỐI CHỮ ĐƯỢC MỞ RỘNG KHÔNG GIAN THOÁNG ĐÃNG */}
          <View className="flex-1 ml-5 h-[200px] justify-between py-1">
            <View>
              {/* Nhãn Hot Tag sắc nét */}
              <View className="flex-row items-center mb-2">
                <View className="bg-[#D4AF37]/10 px-2.5 py-1 rounded-md">
                  <Text className="text-[#D4AF37] text-[10px] font-black uppercase tracking-widest">Hot Story</Text>
                </View>
              </View>

              {/* PHÓNG LỚN TIÊU ĐỀ: Tăng từ text-base lên text-xl để nổi bật */}
              <Text className="text-white text-xl Hong font-extrabold tracking-wide leading-7" numberOfLines={2}>
                {item.title}
              </Text>
              
              {/* PHÓNG LỚN SUBTITLE: Tăng cỡ chữ lên text-sm cho dễ đọc */}
              <Text className="text-[#7C766B] text-sm font-medium mt-2 leading-5" numberOfLines={2}>
                {item.subtitle}
              </Text>
            </View>

            {/* Nút bấm Đọc Ngay to rõ, bấm cực nhạy */}
            <TouchableOpacity 
              className="flex-row h-11 bg-[#D4AF37] rounded-2xl items-center justify-center self-start px-6 shadow-md active:opacity-80"
            >
              <FontAwesome5 name="book-open" size={11} color="#141210" />
              <Text className="text-[#141210] font-extrabold text-sm ml-2 tracking-wide">Đọc Ngay</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    );
  };

  return (
    <View style={{ height: bannerHeight }} className="relative">
      <FlatList
        ref={flatListRef}
        data={comicBannerData}
        renderItem={renderBannerItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled 
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
      />

      {/* CHẤM CHỈ SỐ SLIDE (DOTS INDICATOR) CHỈNH LẠI CỰ LY */}
      <View className="absolute bottom-2 left-0 right-0 flex-row justify-center items-center">
        {comicBannerData.map((_, index) => {
          const isActive = index === activeIndex;
          return (
            <View
              key={index}
              style={{
                height: 5,
                width: isActive ? 16 : 5,
                borderRadius: 3,
                backgroundColor: isActive ? "#D4AF37" : "rgba(124, 118, 107, 0.4)",
                marginHorizontal: 3.5,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}