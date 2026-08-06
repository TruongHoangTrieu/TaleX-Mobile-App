import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  children: React.ReactNode;
}

export default function CinematicBackground({ children }: Props) {
  return (
    <View className="flex-1 bg-black relative" style={{ backgroundColor: "#000000" }}>
      {/* Floating Cinema, Comic & Celestial Decorative Icons */}
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject} className="overflow-hidden">
        {/* Row 1 */}
        <View className="absolute top-[4%] left-[6%] rotate-12 opacity-40">
          <Ionicons name="sparkles" size={26} color="#D4AF37" />
        </View>
        <View className="absolute top-[7%] right-[8%] -rotate-12 opacity-35">
          <MaterialCommunityIcons name="movie-open-outline" size={30} color="#E5E0D8" />
        </View>

        {/* Row 2 */}
        <View className="absolute top-[16%] left-[12%] rotate-45 opacity-35">
          <Ionicons name="flash-outline" size={22} color="#F5D46E" />
        </View>
        <View className="absolute top-[20%] right-[14%] -rotate-6 opacity-35">
          <MaterialCommunityIcons name="crown-outline" size={28} color="#D4AF37" />
        </View>

        {/* Row 3 */}
        <View className="absolute top-[28%] left-[4%] -rotate-12 opacity-40">
          <MaterialCommunityIcons name="book-open-page-variant-outline" size={28} color="#D4AF37" />
        </View>
        <View className="absolute top-[34%] right-[6%] rotate-12 opacity-35">
          <Ionicons name="rocket-outline" size={24} color="#38BDF8" />
        </View>

        {/* Row 4 */}
        <View className="absolute top-[42%] left-[10%] rotate-12 opacity-35">
          <MaterialCommunityIcons name="theater" size={26} color="#E5A93C" />
        </View>
        <View className="absolute top-[46%] right-[5%] rotate-45 opacity-40">
          <Ionicons name="star-outline" size={26} color="#FFE58F" />
        </View>

        {/* Row 5 */}
        <View className="absolute top-[54%] left-[6%] -rotate-12 opacity-35">
          <Ionicons name="headset-outline" size={24} color="#A855F7" />
        </View>
        <View className="absolute top-[58%] right-[12%] rotate-12 opacity-35">
          <Ionicons name="trophy-outline" size={24} color="#F5D46E" />
        </View>

        {/* Row 6 */}
        <View className="absolute top-[66%] left-[8%] -rotate-12 opacity-35">
          <Ionicons name="heart-outline" size={24} color="#F43F5E" />
        </View>
        <View className="absolute top-[72%] right-[7%] rotate-12 opacity-40">
          <Ionicons name="film-outline" size={30} color="#38BDF8" />
        </View>

        {/* Row 7 */}
        <View className="absolute top-[80%] left-[14%] rotate-6 opacity-35">
          <MaterialCommunityIcons name="crystal-ball" size={26} color="#C084FC" />
        </View>
        <View className="absolute top-[86%] right-[10%] -rotate-12 opacity-40">
          <Ionicons name="color-palette-outline" size={24} color="#E5A93C" />
        </View>

        {/* Row 8 */}
        <View className="absolute top-[92%] left-[10%] rotate-12 opacity-40">
          <MaterialCommunityIcons name="diamond-stone" size={24} color="#D4AF37" />
        </View>
        <View className="absolute top-[95%] right-[6%] rotate-45 opacity-35">
          <Ionicons name="sparkles-outline" size={24} color="#FFE58F" />
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 z-10">{children}</View>
    </View>
  );
}
