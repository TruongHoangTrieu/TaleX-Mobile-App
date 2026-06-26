import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

interface HeaderProps {
  titleType?: "logo" | "text";
  titleText?: string;
  showCategories?: boolean;
  activeCategory?: string; // THÊM: Theo dõi danh mục đang chọn
  onCategoryChange?: (cat: string) => void; // THÊM: Hàm báo cáo khi bấm nút
}

// Khởi tạo danh sách các tab thể loại dùng chung cho trang Home
const homeCategories = [
  "Đề xuất",
  "Phim Bộ",
  "Tiểu Thuyết",
  "Tình Cảm",
  "Viễn Tưởng",
];

export default function Header({
  titleType = "logo",
  titleText = "",
  showCategories = true,
  activeCategory = "Đề xuất", // Mặc định chọn Đề xuất
  onCategoryChange,
}: HeaderProps) {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView
      edges={["top"]}
      className="bg-[#141210] pt-2"
      style={{ zIndex: 999, position: "relative" }}
    >
      <View className="flex-row items-center px-4 py-2 justify-between">
        {titleType === "logo" ? (
          <Image
            source={require("@assets/icon.png")}
            className="w-12 h-12"
            resizeMode="contain"
          />
        ) : (
          <Text className="text-white text-2xl font-bold tracking-wide">
            {titleText}
          </Text>
        )}

        <TouchableOpacity
          onPress={() => navigation.navigate("Search")}
          className="flex-1 flex-row h-9 bg-[#252830]/60 items-center px-3 ml-3 rounded-md"
        >
          <View className="mr-2">
            <Feather name="search" size={16} color="#7C766B" />
          </View>
          <Text className="text-[#7C766B] text-xs">
            Tìm truyện, phim hot...
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row h-9 bg-[#252830] items-center px-3 ml-3 rounded-full">
          <View className="mr-1.5">
            <FontAwesome5 name="coins" size={11} color="#D4AF37" />
          </View>
          <Text className="text-[#E5E0D8] text-xs font-bold">150</Text>
        </TouchableOpacity>
      </View>

      {/* SỬA LẠI LOGIC BẤM TẠI ĐÂY */}
      {showCategories && (
        <View className="h-10 mt-2 bg-[#141210]">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              alignItems: "center",
            }}
          >
            {homeCategories.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => onCategoryChange && onCategoryChange(cat)} // Bắn tín hiệu về trang Home
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
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}
