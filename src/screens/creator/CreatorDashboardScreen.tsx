import React from "react";
import { StatusBar, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CreatorDashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#121214]">
      <StatusBar barStyle="light-content" backgroundColor="#121214" />

      <View className="flex-1 items-center justify-center px-6">
        <View className="mb-6 h-24 w-24 items-center justify-center rounded-3xl border border-[#D4AF37]/30 bg-[#D4AF37]/10">
          <MaterialCommunityIcons
            name="movie-open-play-outline"
            size={64}
            color="#D4AF37"
          />
        </View>

        <Text className="text-center text-3xl font-black text-[#D4AF37]">
          TaleX Creator Studio
        </Text>
        <Text className="mt-3 text-center text-base font-semibold leading-6 text-[#D1D1D1]">
          Chào mừng bạn đã trở thành Nhà Sáng Tạo!
        </Text>
      </View>
    </SafeAreaView>
  );
}
