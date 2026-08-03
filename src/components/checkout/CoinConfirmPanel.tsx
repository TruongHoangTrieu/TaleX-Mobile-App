import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { formatVnd } from "./format-vnd";

interface CoinConfirmPanelProps {
  totalAmount: number;
  coinAmountUsed: number;
  confirming: boolean;
  onConfirm: () => void;
}

export default function CoinConfirmPanel({
  totalAmount,
  coinAmountUsed,
  confirming,
  onConfirm,
}: CoinConfirmPanelProps) {
  return (
    <View className="items-center rounded-3xl border border-[#D4AF37]/20 bg-[#1C1A18] p-5">
      <MaterialCommunityIcons name="hand-coin-outline" size={40} color="#D4AF37" />
      <Text className="mt-3 text-center text-sm text-[#A19E95]">
        Đơn hàng được thanh toán đủ bằng Coin, không cần quét QR.
      </Text>
      <Text className="mt-3 text-2xl font-black text-[#D4AF37]">
        {coinAmountUsed.toLocaleString("vi-VN")} Coin
      </Text>
      <Text className="mt-1 text-xs text-[#7C766B]">
        Tương đương {formatVnd(totalAmount)}
      </Text>

      <TouchableOpacity
        activeOpacity={0.85}
        disabled={confirming}
        onPress={onConfirm}
        className="mt-5 h-12 w-full items-center justify-center rounded-xl bg-[#D4AF37]"
        style={confirming ? { opacity: 0.6 } : undefined}
      >
        {confirming ? (
          <ActivityIndicator color="#141210" />
        ) : (
          <Text className="text-sm font-black uppercase tracking-wide text-[#141210]">
            Xác nhận thanh toán bằng Coin
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
