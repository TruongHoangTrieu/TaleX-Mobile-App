import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComboItem } from "@/services/series";

interface ComboDetailModalProps {
  visible: boolean;
  combo: ComboItem | null;
  onClose: () => void;
  onPurchase: (combo: ComboItem) => void;
}

const { height: screenHeight } = Dimensions.get("window");

export function ComboDetailModal({
  visible,
  combo,
  onClose,
  onPurchase,
}: ComboDetailModalProps) {
  if (!combo) return null;

  const originalPrice = combo.originalPriceVnd ?? combo.priceVnd;
  const discountPercentage =
    originalPrice > combo.priceVnd
      ? Math.round(((originalPrice - combo.priceVnd) / originalPrice) * 100)
      : 0;
  const episodes = combo.episodes || [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={StyleSheet.absoluteFillObject} className="bg-black/85 justify-end z-50">
        {/* Backdrop Dismiss Area */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        {/* Modal Bottom Sheet Container */}
        <View
          style={{ height: Math.min(screenHeight * 0.75, 620) }}
          className="bg-[#18181B] rounded-t-3xl p-6 border-t border-white/10 shadow-2xl flex-col"
        >
          {/* Drag Indicator Bar */}
          <View className="w-12 h-1.5 rounded-full bg-zinc-600 self-center mb-4" />

          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-white/10 mb-3">
            <View className="flex-row items-center flex-1 mr-2">
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={20}
                color="#D4AF37"
                style={{ marginRight: 8 }}
              />
              <Text className="text-white text-base font-black truncate" numberOfLines={1}>
                Chi tiết Gói Combo
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="w-8 h-8 rounded-full bg-zinc-800 items-center justify-center border border-white/10"
            >
              <Feather name="x" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Title & Discount Badge */}
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white text-lg font-black flex-1 mr-2">
                {combo.title}
              </Text>
              {discountPercentage > 0 && (
                <View className="bg-red-500/15 border border-red-500/30 px-2.5 py-1 rounded-full">
                  <Text className="text-red-400 font-black text-[11px]">
                    Tiết kiệm {discountPercentage}%
                  </Text>
                </View>
              )}
            </View>

            {/* Description */}
            <Text className="text-zinc-400 text-xs leading-5 mb-4">
              {combo.description || "Mở khóa trọn bộ combo các tập nội dung đặc sắc với mức giá ưu đãi nhất trên TaleX."}
            </Text>

            {/* Price Box */}
            <View className="bg-zinc-900/80 border border-white/5 rounded-2xl p-4 mb-4 flex-row items-center justify-between">
              <View>
                <Text className="text-zinc-400 text-[11px] font-bold">
                  Giá trọn gói Combo:
                </Text>
                {originalPrice > combo.priceVnd && (
                  <Text className="text-zinc-500 text-xs line-through mt-0.5 font-semibold">
                    {originalPrice.toLocaleString("vi-VN")} đ
                  </Text>
                )}
              </View>
              <Text className="text-[#D4AF37] text-2xl font-black">
                {(combo.priceVnd || 0).toLocaleString("vi-VN")} đ
              </Text>
            </View>

            {/* Episode List */}
            <View className="space-y-2">
              <Text className="text-white text-xs font-black uppercase tracking-wider mb-2">
                Danh sách {episodes.length} tập bao gồm:
              </Text>

              {episodes.length > 0 ? (
                episodes.map((ep, idx) => (
                  <View
                    key={ep.episodeId || idx}
                    className="flex-row items-center justify-between bg-zinc-900/50 border border-white/5 px-3.5 py-3 rounded-xl mb-2"
                  >
                    <View className="flex-row items-center flex-1 mr-2">
                      <View className="w-6 h-6 rounded-full bg-[#D4AF37]/15 items-center justify-center mr-3 border border-[#D4AF37]/30">
                        <Text className="text-[#D4AF37] text-[10px] font-black">
                          {ep.episodeNumber ?? idx + 1}
                        </Text>
                      </View>
                      <Text className="text-zinc-200 text-xs font-bold flex-1" numberOfLines={1}>
                        {ep.title || `Tập ${ep.episodeNumber ?? idx + 1}`}
                      </Text>
                    </View>
                    <Ionicons name="lock-closed" size={14} color="#D4AF37" />
                  </View>
                ))
              ) : (
                <Text className="text-zinc-500 text-xs italic py-2">
                  Toàn bộ các tập phát hành trong gói.
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Bottom Action Button */}
          <View className="pt-3 border-t border-white/10">
            <TouchableOpacity
              onPress={() => {
                onClose();
                onPurchase(combo);
              }}
              activeOpacity={0.85}
              className="w-full bg-[#D4AF37] py-3.5 rounded-2xl items-center justify-center flex-row shadow-lg"
            >
              <Ionicons name="flash" size={16} color="#141210" style={{ marginRight: 6 }} />
              <Text className="text-[#141210] font-black text-sm uppercase tracking-wide">
                Mở khóa ngay • {(combo.priceVnd || 0).toLocaleString("vi-VN")} đ
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
