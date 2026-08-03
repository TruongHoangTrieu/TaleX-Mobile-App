import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export function SuccessState({ onDone }: { onDone: () => void }) {
  return (
    <View className="flex-1 items-center justify-center py-16">
      <MaterialCommunityIcons name="check-decagram" size={64} color="#10B981" />
      <Text className="mt-4 text-lg font-black text-white">Thanh toán thành công!</Text>
      <Text className="mt-2 text-center text-sm text-[#A19E95]">
        Nội dung đã được mở khóa cho tài khoản của bạn.
      </Text>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onDone}
        className="mt-6 h-12 w-full items-center justify-center rounded-xl bg-[#D4AF37]"
      >
        <Text className="text-sm font-black uppercase tracking-wide text-[#141210]">Xong</Text>
      </TouchableOpacity>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center py-16">
      <MaterialCommunityIcons name="alert-circle-outline" size={56} color="#EF4444" />
      <Text className="mt-3 text-center text-sm font-semibold text-red-400">{message}</Text>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onRetry}
        className="mt-5 h-11 items-center justify-center rounded-xl bg-[#D4AF37] px-6"
      >
        <Text className="text-sm font-black text-[#141210]">Quay lại</Text>
      </TouchableOpacity>
    </View>
  );
}
