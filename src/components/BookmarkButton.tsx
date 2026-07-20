import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useEpisodeBookmarks } from "@/hooks/useEpisodeBookmarks";

interface BookmarkButtonProps {
  episodeId?: string;
  contentType?: "VIDEO" | "COMIC";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  style?: ViewStyle;
}

export function BookmarkButton({
  episodeId,
  contentType,
  size = "md",
  showLabel = false,
  style,
}: BookmarkButtonProps) {
  const { isBookmarked, isMutating, toggleBookmark } = useEpisodeBookmarks(episodeId);

  const getIconSize = () => {
    switch (size) {
      case "sm":
        return 16;
      case "lg":
        return 22;
      default:
        return 18;
    }
  };

  const getPadding = () => {
    switch (size) {
      case "sm":
        return "px-2.5 py-1.5";
      case "lg":
        return "px-4 py-2.5";
      default:
        return "px-3 py-2";
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isMutating}
      onPress={() => toggleBookmark(contentType)}
      className={`flex-row items-center justify-center rounded-full border ${getPadding()} ${
        isBookmarked
          ? "bg-[#D4AF37]/15 border-[#D4AF37]/50"
          : "bg-white/[0.04] border-white/10"
      }`}
      style={style}
    >
      {isMutating ? (
        <ActivityIndicator
          size="small"
          color={isBookmarked ? "#D4AF37" : "#E5E0D8"}
          style={{ marginRight: showLabel ? 6 : 0 }}
        />
      ) : (
        <Ionicons
          name={isBookmarked ? "bookmark" : "bookmark-outline"}
          size={getIconSize()}
          color={isBookmarked ? "#D4AF37" : "#E5E0D8"}
          style={{ marginRight: showLabel ? 6 : 0 }}
        />
      )}
      {showLabel && (
        <Text
          className={`text-xs font-bold ${
            isBookmarked ? "text-[#D4AF37]" : "text-stone-300"
          }`}
        >
          {isBookmarked ? "Đã lưu" : "Lưu"}
        </Text>
      )}
    </TouchableOpacity>
  );
}
