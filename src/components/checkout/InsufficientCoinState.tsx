import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatVnd } from "./format-vnd";

interface InsufficientCoinStateProps {
  walletBalance: number;
  requiredCoin: number;
  fiatShortfall: number;
  onOpenWeb: () => void;
  openingWeb?: boolean;
  onClose: () => void;
}

export default function InsufficientCoinState({
  walletBalance,
  requiredCoin,
  fiatShortfall,
  onOpenWeb,
  openingWeb,
  onClose,
}: InsufficientCoinStateProps) {
  return (
    <View className="items-center rounded-3xl border border-white/5 bg-[#1C1A18] p-6">
      <MaterialCommunityIcons name="hand-coin-outline" size={44} color="#D4AF37" />
      <Text className="mt-3 text-center text-base font-bold text-white">
        Số dư Coin không đủ
      </Text>
      <Text className="mt-2 text-center text-sm leading-5 text-[#A19E95]">
        Bạn cần {requiredCoin.toLocaleString("vi-VN")} Coin nhưng ví chỉ có{" "}
        {walletBalance.toLocaleString("vi-VN")} Coin. Trên app chỉ hỗ trợ thanh toán bằng
        Coin — vui lòng mua trên website để thanh toán phần còn thiếu ({formatVnd(fiatShortfall)}
        ) bằng tiền.
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        disabled={openingWeb}
        onPress={onOpenWeb}
        className="mt-5 h-12 w-full items-center justify-center rounded-xl bg-[#D4AF37]"
      >
        {openingWeb ? (
          <ActivityIndicator color="#141210" />
        ) : (
          <Text className="text-sm font-black uppercase tracking-wide text-[#141210]">
            Mua trên Website
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onClose}
        className="mt-3 h-11 w-full items-center justify-center rounded-xl border border-white/10"
      >
        <Text className="text-sm font-bold text-[#A19E95]">Đóng</Text>
      </TouchableOpacity>
    </View>
  );
}
