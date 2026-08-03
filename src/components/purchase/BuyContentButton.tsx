import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useContentPurchase } from "@/hooks/useContentPurchase";
import type { ContentItemType } from "@/services/order";
import { formatVnd } from "@/components/checkout/format-vnd";

interface BuyContentButtonProps {
  itemId: string;
  itemType: ContentItemType;
  title?: string;
  priceVnd?: number;
  returnScreen?: string;
  label?: string;
  size?: "small" | "medium";
}

export default function BuyContentButton({
  itemId,
  itemType,
  title,
  priceVnd,
  returnScreen,
  label,
  size = "medium",
}: BuyContentButtonProps) {
  const { buy } = useContentPurchase();
  const small = size === "small";

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => buy({ itemId, itemType, title, returnScreen })}
      className={`flex-row items-center justify-center rounded-full bg-[#D4AF37] ${
        small ? "px-3 py-1.5" : "px-4 py-2.5"
      }`}
    >
      <MaterialCommunityIcons name="lock-open-variant" size={small ? 12 : 14} color="#141210" />
      <View className="ml-1.5 flex-row items-center">
        <Text className={`font-black text-[#141210] ${small ? "text-[11px]" : "text-xs"}`}>
          {label || "Mua"}
        </Text>
        {typeof priceVnd === "number" && (
          <Text className={`ml-1 font-bold text-[#141210]/80 ${small ? "text-[10px]" : "text-[11px]"}`}>
            {formatVnd(priceVnd)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
