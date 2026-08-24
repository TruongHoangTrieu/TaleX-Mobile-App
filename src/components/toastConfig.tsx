import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import type { ToastConfig } from "react-native-toast-message";

const { width } = Dimensions.get("window");

export const toastConfig: ToastConfig = {
  success: ({ text1, text2 }) => (
    <View style={styles.container} className="bg-[#18181B] border border-[#10B981]/40 shadow-2xl">
      <View className="w-9 h-9 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 items-center justify-center mr-3">
        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
      </View>
      <View className="flex-1 justify-center">
        {text1 ? (
          <Text className="text-white font-black text-[13.5px] leading-tight">
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text className="text-zinc-300 text-[11.5px] font-medium leading-4 mt-0.5">
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),

  error: ({ text1, text2 }) => (
    <View style={styles.container} className="bg-[#18181B] border border-[#EF4444]/40 shadow-2xl">
      <View className="w-9 h-9 rounded-full bg-[#EF4444]/20 border border-[#EF4444]/40 items-center justify-center mr-3">
        <Ionicons name="alert-circle" size={20} color="#EF4444" />
      </View>
      <View className="flex-1 justify-center">
        {text1 ? (
          <Text className="text-white font-black text-[13.5px] leading-tight">
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text className="text-zinc-300 text-[11.5px] font-medium leading-4 mt-0.5">
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),

  info: ({ text1, text2 }) => (
    <View style={styles.container} className="bg-[#18181B] border border-[#D4AF37]/40 shadow-2xl">
      <View className="w-9 h-9 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 items-center justify-center mr-3">
        <Ionicons name="information-circle" size={20} color="#D4AF37" />
      </View>
      <View className="flex-1 justify-center">
        {text1 ? (
          <Text className="text-white font-black text-[13.5px] leading-tight">
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text className="text-zinc-300 text-[11.5px] font-medium leading-4 mt-0.5">
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  ),
};

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    marginTop: 6,
  },
});
