import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { FontAwesome, Feather } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import {
  rateSeries,
  deleteSeriesRating,
  getSeriesRatings,
  getMyRatings,
} from "@/services/seriesRating";

interface InteractiveStarRatingProps {
  seriesId: string;
  seriesTitle?: string;
  averageRating?: number;
  totalRatingsCount?: number;
  onRatingUpdated?: () => void;
  variant?: "badge" | "card" | "full";
}

export function InteractiveStarRating({
  seriesId,
  seriesTitle = "Tác phẩm",
  averageRating = 0,
  totalRatingsCount = 0,
  onRatingUpdated,
  variant = "badge",
}: InteractiveStarRatingProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [realAvgScore, setRealAvgScore] = useState<number>(averageRating);
  const [realRatingsCount, setRealRatingsCount] = useState<number>(totalRatingsCount);

  // Fetch real average score and ratings list for this series from API
  const refreshSeriesRatings = useCallback(async () => {
    if (!seriesId) return;
    try {
      const [ratingsRes, myRes] = await Promise.all([
        getSeriesRatings(seriesId, 0, 100),
        getMyRatings(0, 100),
      ]);

      // 1. My rating check
      const myItems = myRes?.content || myRes?.items || [];
      const match = myItems.find((item: any) => item.seriesId === seriesId);
      if (match && typeof match.rate === "number") {
        setUserRating(match.rate);
      } else {
        setUserRating(null);
      }

      // 2. Dynamic Average rating calculation: sum(rate) / count
      const list = ratingsRes?.content || ratingsRes?.items || [];
      const count = typeof ratingsRes?.totalElements === "number" ? ratingsRes.totalElements : list.length;

      if (list.length > 0) {
        const sum = list.reduce((acc: number, item: any) => acc + (item.rate || 0), 0);
        const calcAvg = sum / list.length;
        setRealAvgScore(calcAvg);
        setRealRatingsCount(count);
      } else if (averageRating > 0) {
        setRealAvgScore(averageRating);
        setRealRatingsCount(totalRatingsCount);
      } else {
        setRealAvgScore(0);
        setRealRatingsCount(0);
      }
    } catch (e) {
      console.log("Fetch ratings error:", e);
    }
  }, [seriesId, averageRating, totalRatingsCount]);

  useEffect(() => {
    refreshSeriesRatings();
  }, [refreshSeriesRatings]);

  const handleRate = async (starValue: number) => {
    if (!seriesId) return;
    try {
      setLoading(true);
      await rateSeries(seriesId, starValue);
      setUserRating(starValue);
      Toast.show({
        type: "success",
        text1: "Đánh giá thành công!",
        text2: `Bạn đã chấm ${starValue}.0 ⭐ cho tác phẩm`,
      });
      await refreshSeriesRatings();
      if (onRatingUpdated) onRatingUpdated();
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Đánh giá thất bại",
        text2: "Vui lòng thử lại sau",
      });
    } finally {
      setLoading(false);
      setModalVisible(false);
    }
  };

  const handleDeleteRating = async () => {
    if (!seriesId) return;
    try {
      setLoading(true);
      await deleteSeriesRating(seriesId);
      setUserRating(null);
      Toast.show({
        type: "success",
        text1: "Đã xóa đánh giá!",
      });
      await refreshSeriesRatings();
      if (onRatingUpdated) onRatingUpdated();
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Không thể xóa đánh giá",
      });
    } finally {
      setLoading(false);
      setModalVisible(false);
    }
  };

  const getStarLabel = (val: number) => {
    switch (val) {
      case 1:
        return "1.0 ⭐ - Rất dở";
      case 2:
        return "2.0 ⭐ - Tạm được";
      case 3:
        return "3.0 ⭐ - Khá hay";
      case 4:
        return "4.0 ⭐ - Rất hay";
      case 5:
        return "5.0 ⭐ - Tuyệt phẩm!";
      default:
        return "";
    }
  };

  const hasRatings = realRatingsCount > 0;
  const displayRatingScore = hasRatings ? realAvgScore.toFixed(1) : "0.0";

  return (
    <>
      {/* BADGE TRIGGER BUTTON */}
      {hasRatings ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setModalVisible(true)}
          className="flex-row items-center bg-[#D4AF37]/15 border border-[#D4AF37]/35 px-2 py-0.5 rounded-lg"
        >
          <FontAwesome name="star" size={11} color="#D4AF37" />
          <Text className="text-[#D4AF37] text-[11px] font-black ml-1">
            {displayRatingScore}
          </Text>
          <Text className="text-zinc-400 text-[9px] font-semibold ml-0.5">
            ({realRatingsCount})
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setModalVisible(true)}
          className="flex-row items-center bg-[#D4AF37]/10 border border-[#D4AF37]/45 px-2.5 py-0.5 rounded-lg active:scale-95"
        >
          <FontAwesome name="star-o" size={11} color="#D4AF37" />
          <Text className="text-[#D4AF37] text-[11px] font-black ml-1.5">
            Đánh giá ngay
          </Text>
        </TouchableOpacity>
      )}

      {/* RATING INTERACTIVE MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/75 items-center justify-center p-4">
          <View className="w-full max-w-sm bg-[#1A1A1E] border border-[#D4AF37]/40 rounded-3xl p-6 shadow-2xl">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <FontAwesome name="star" size={18} color="#D4AF37" />
                <Text className="text-white text-base font-black ml-2">
                  Đánh giá Tác phẩm
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="p-1"
              >
                <Feather name="x" size={20} color="#71717A" />
              </TouchableOpacity>
            </View>

            {/* Series Title */}
            <Text className="text-zinc-400 text-xs font-bold mb-3" numberOfLines={1}>
              {seriesTitle}
            </Text>

            {/* Average Rating Score Showcase */}
            <View className="bg-[#242428] border border-zinc-800 rounded-2xl p-3 items-center mb-4 flex-row justify-center space-x-2">
              <FontAwesome
                name={hasRatings ? "star" : "star-o"}
                size={24}
                color={hasRatings ? "#D4AF37" : "#9CA3AF"}
              />
              <Text
                className={`${
                  hasRatings ? "text-[#D4AF37]" : "text-zinc-400"
                } text-2xl font-black ml-2`}
              >
                {displayRatingScore}
              </Text>
              <Text className="text-zinc-500 text-xs font-bold">/ 5.0</Text>

              <Text className="text-zinc-400 text-xs font-medium ml-3 border-l border-zinc-700 pl-3">
                {hasRatings ? `${realRatingsCount} lượt đánh giá` : "Chưa có lượt đánh giá"}
              </Text>
            </View>

            {/* User rating indicator */}
            {userRating !== null && (
              <View className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl mb-4 flex-row items-center justify-between">
                <Text className="text-emerald-400 text-xs font-bold">
                  ✓ Bạn đã đánh giá {userRating}.0 ⭐
                </Text>
                <TouchableOpacity onPress={handleDeleteRating} disabled={loading}>
                  <Feather name="trash-2" size={14} color="#F43F5E" />
                </TouchableOpacity>
              </View>
            )}

            {/* 5 Interactive Stars */}
            <View className="flex-row justify-center space-x-2 my-2">
              {[1, 2, 3, 4, 5].map((star) => {
                const activeVal = hoveredStar ?? userRating ?? 0;
                const isFilled = activeVal >= star;

                return (
                  <TouchableOpacity
                    key={star}
                    disabled={loading}
                    onPressIn={() => setHoveredStar(star)}
                    onPressOut={() => setHoveredStar(null)}
                    onPress={() => handleRate(star)}
                    className="p-2"
                  >
                    <FontAwesome
                      name={isFilled ? "star" : "star-o"}
                      size={32}
                      color={isFilled ? "#D4AF37" : "#52525B"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Star Hover Label */}
            <View className="h-6 items-center justify-center my-1">
              <Text className="text-[#D4AF37] text-xs font-black">
                {getStarLabel(hoveredStar ?? userRating ?? 0)}
              </Text>
            </View>

            {loading && (
              <ActivityIndicator size="small" color="#D4AF37" className="mt-2" />
            )}

            {/* Close Button */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="bg-zinc-800 h-10 items-center justify-center rounded-xl mt-4"
            >
              <Text className="text-zinc-300 font-bold text-xs">Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
