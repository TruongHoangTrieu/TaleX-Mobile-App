import React, { useState } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComboItem } from "@/services/series";
import { ComboDetailModal } from "./ComboDetailModal";

const { width: screenWidth } = Dimensions.get("window");

interface ComboCardProps {
  combo: ComboItem;
  onPurchase: (combo: ComboItem) => void;
  variant?: "singleBanner" | "grid2" | "compact" | "full";
  style?: any;
}

export function ComboCard({
  combo,
  onPurchase,
  variant = "grid2",
  style,
}: ComboCardProps) {
  const [showDetailModal, setShowDetailModal] = useState(false);

  const originalPrice = combo.originalPriceVnd ?? combo.priceVnd;
  const discountPercentage =
    originalPrice > combo.priceVnd
      ? Math.round(((originalPrice - combo.priceVnd) / originalPrice) * 100)
      : 0;
  const episodeCount = combo.episodes?.length ?? 0;

  // VARIANT 1: GRID 2 / BALANCED RECTANGLE (HÌNH CHỮ NHẬT CÂN ĐỐI VỪA VẶN)
  if (variant === "grid2") {
    return (
      <>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setShowDetailModal(true)}
          style={style}
          className="rounded-2xl border border-white/10 bg-[#161619] p-3.5 shadow-lg relative overflow-hidden flex-col justify-between"
        >
          {/* Subtle top gold accent */}
          <View className="absolute top-0 left-0 right-0 h-[2px] bg-[#D4AF37]/50" />

          {/* Top Row: Icon + Discount Badge */}
          <View className="flex-row items-center justify-between mb-2">
            <View className="w-6 h-6 rounded-lg bg-[#D4AF37]/15 items-center justify-center border border-[#D4AF37]/30">
              <Ionicons name="flash" size={13} color="#D4AF37" />
            </View>

            {discountPercentage > 0 ? (
              <View className="bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded-full">
                <Text className="font-black text-[9.5px] text-red-400">
                  -{discountPercentage}%
                </Text>
              </View>
            ) : (
              <View className="bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                <Text className="font-bold text-[9.5px] text-zinc-400">Combo</Text>
              </View>
            )}
          </View>

          {/* Title & Info */}
          <View className="mb-2">
            <Text
              className="font-black text-[12.5px] text-white leading-4.5 mb-1 min-h-[34px]"
              numberOfLines={2}
            >
              {combo.title}
            </Text>
            <Text className="text-zinc-400 text-[11px] font-medium" numberOfLines={1}>
              {episodeCount} tập trọn bộ
            </Text>
          </View>

          {/* Price */}
          <View className="pt-2 border-t border-white/5 mb-2.5">
            {originalPrice > combo.priceVnd && (
              <Text className="text-[10px] text-zinc-500 line-through font-semibold leading-3">
                {originalPrice.toLocaleString("vi-VN")} đ
              </Text>
            )}
            <Text className="text-[15px] font-black text-[#D4AF37]">
              {(combo.priceVnd || 0).toLocaleString("vi-VN")} đ
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={() => onPurchase(combo)}
            activeOpacity={0.85}
            className="w-full py-2 rounded-xl bg-[#D4AF37] items-center justify-center shadow-sm flex-row"
          >
            <Ionicons name="flash" size={12} color="#141210" style={{ marginRight: 4 }} />
            <Text className="text-xs font-black text-[#141210] uppercase tracking-wide">
              Mua Ngay
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Modal chi tiết gói */}
        <ComboDetailModal
          visible={showDetailModal}
          combo={combo}
          onClose={() => setShowDetailModal(false)}
          onPurchase={onPurchase}
        />
      </>
    );
  }

  // VARIANT 2: FULL BANNER
  return (
    <>
      <View
        style={style}
        className="rounded-2xl border border-white/10 bg-[#161619] p-4 shadow-xl mb-3 relative overflow-hidden"
      >
        {/* Subtle decorative top accent */}
        <View className="absolute top-0 left-0 right-0 h-[2px] bg-[#D4AF37]/40" />

        {/* Header: Title + Discount Badge */}
        <View className="flex-row items-center justify-between gap-2 mb-1.5">
          <View className="flex-row items-center flex-1 mr-2">
            <MaterialCommunityIcons
              name="fire"
              size={18}
              color="#FF4E4E"
              style={{ marginRight: 4 }}
            />
            <Text className="font-black text-sm text-white flex-1" numberOfLines={1}>
              {combo.title}
            </Text>
          </View>

          {discountPercentage > 0 && (
            <View className="bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded-full">
              <Text className="font-black text-[10px] text-red-400">
                Tiết kiệm {discountPercentage}%
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        <Text className="text-zinc-400 text-xs leading-4 mb-3" numberOfLines={2}>
          {combo.description || "Mở khóa combo nội dung trọn gói với mức giá ưu đãi trên TaleX."}
        </Text>

        {/* Price & Detail Row */}
        <View className="flex-row items-baseline justify-between pt-2 border-t border-white/5 mb-3">
          <View>
            {originalPrice > combo.priceVnd && (
              <Text className="text-[10px] font-bold text-zinc-500 line-through">
                {originalPrice.toLocaleString("vi-VN")} đ
              </Text>
            )}
            <Text className="text-lg font-black text-[#D4AF37]">
              {(combo.priceVnd || 0).toLocaleString("vi-VN")} đ
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowDetailModal(true)}
            activeOpacity={0.75}
            className="flex-row items-center py-1 px-2.5 bg-white/5 rounded-lg border border-white/10"
          >
            <Text className="text-xs font-bold text-zinc-300 mr-0.5">Chi tiết</Text>
            <Feather name="chevron-right" size={14} color="#D4AF37" />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => setShowDetailModal(true)}
            activeOpacity={0.75}
            className="flex-1 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 items-center justify-center"
          >
            <Text className="text-xs font-bold text-zinc-200">Xem gói</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => onPurchase(combo)}
            activeOpacity={0.85}
            className="flex-1 py-2.5 rounded-xl bg-[#D4AF37] items-center justify-center shadow-md shadow-[#D4AF37]/20 flex-row"
          >
            <Ionicons name="flash" size={13} color="#141210" style={{ marginRight: 4 }} />
            <Text className="text-xs font-black text-[#141210] uppercase">Mua Ngay</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal chi tiết gói */}
      <ComboDetailModal
        visible={showDetailModal}
        combo={combo}
        onClose={() => setShowDetailModal(false)}
        onPurchase={onPurchase}
      />
    </>
  );
}

/**
 * Component hiển thị Combo dạng thẻ hình chữ nhật cân đối:
 * - Khi có 1 combo: Chiếm 58% màn hình (khoảng 225-235px), rộng rãi, rõ ràng và cân đối.
 * - Khi có từ 2 combo trở lên: Chiếm 48.5% mỗi bên (1 hàng 2 combo).
 */
export function CompactComboSection({
  combos,
  onPurchase,
}: {
  combos: ComboItem[];
  onPurchase: (combo: ComboItem) => void;
}) {
  if (!combos || combos.length === 0) return null;

  return (
    <View className="mt-2 mb-5">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center">
          <Ionicons name="pricetags" size={15} color="#D4AF37" style={{ marginRight: 6 }} />
          <Text className="text-white text-sm font-black uppercase tracking-wider">
            Gói Combo Ưu Đãi
          </Text>
        </View>
        <View className="bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-2 py-0.5 rounded-full">
          <Text className="text-[#D4AF37] font-black text-[9.5px]">Tiết kiệm chi phí</Text>
        </View>
      </View>

      {/* Grid: 1 combo (58% width bự hơn vừa mắt) hoặc 2 combo (48.5% mỗi bên) */}
      <View className="flex-row flex-wrap justify-between gap-y-2.5">
        {combos.map((combo) => {
          const isSingle = combos.length === 1;
          return (
            <View
              key={combo.comboId}
              style={{ width: isSingle ? "58%" : "48.5%" }}
            >
              <ComboCard
                combo={combo}
                variant="grid2"
                onPurchase={onPurchase}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}
