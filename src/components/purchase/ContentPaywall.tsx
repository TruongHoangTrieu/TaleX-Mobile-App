import React from "react";
import { Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ContentItemType } from "@/services/order";
import BuyContentButton from "./BuyContentButton";

interface ContentPaywallProps {
  episodeId: string;
  itemType?: ContentItemType;
  title?: string;
  priceVnd?: number;
  returnScreen?: string;
  contentKind: "COMIC" | "VIDEO";
  /** comicId/movieId this episode belongs to — needed so the reader/player
   * screen can resolve the right series after a successful purchase returns
   * it here via navigate(). */
  seriesId?: string;
  message?: string;
}

export default function ContentPaywall({
  episodeId,
  itemType = "EPISODE",
  title,
  priceVnd,
  returnScreen,
  contentKind,
  seriesId,
  message,
}: ContentPaywallProps) {
  return (
    <View className="items-center rounded-2xl border border-[#D4AF37]/20 bg-[#1C1A18] p-6">
      <MaterialCommunityIcons name="lock-outline" size={40} color="#D4AF37" />
      <Text className="mt-3 text-center text-base font-bold text-white">
        Nội dung này cần mua để xem
      </Text>
      <Text className="mt-1.5 text-center text-sm text-[#A19E95]">
        {message || "Mua tập này để tiếp tục xem/đọc không giới hạn."}
      </Text>

      <View className="mt-5">
        <BuyContentButton
          itemId={episodeId}
          itemType={itemType}
          title={title}
          priceVnd={priceVnd}
          returnScreen={returnScreen}
          contentKind={contentKind}
          seriesId={seriesId}
          label="Mua tập này"
        />
      </View>
    </View>
  );
}
