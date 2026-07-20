import React from "react";
import { TouchableOpacity, Text, View, ActivityIndicator } from "react-native";
import { FontAwesome, Feather } from "@expo/vector-icons";

interface LikeButtonProps {
  isLiked: boolean;
  likeCount?: number;
  onLikeToggle: () => Promise<void> | void;
  isLoading?: boolean;
  isMutating?: boolean;
  size?: "small" | "medium" | "large";
  showCount?: boolean;
  style?: any;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  isLiked,
  likeCount = 0,
  onLikeToggle,
  isLoading = false,
  isMutating = false,
  size = "medium",
  showCount = true,
  style,
}) => {
  const disabled = isLoading || isMutating;

  const getPadding = () => {
    switch (size) {
      case "small":
        return "px-3 py-1.5";
      case "large":
        return "px-5 py-2.5";
      case "medium":
      default:
        return "px-4 py-2";
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "small":
        return "text-[10px]";
      case "large":
        return "text-[13px]";
      case "medium":
      default:
        return "text-[11px]";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "small":
        return 12;
      case "large":
        return 18;
      case "medium":
      default:
        return 15;
    }
  };

  return (
    <TouchableOpacity
      onPress={onLikeToggle}
      disabled={disabled}
      activeOpacity={0.75}
      className={`flex-row items-center justify-center rounded-full border ${getPadding()} ${
        isLiked
          ? "bg-red-500/10 border-red-500/30"
          : "bg-white/[0.04] border-white/10"
      } ${disabled ? "opacity-60" : ""}`}
      style={style}
    >
      {isMutating ? (
        <ActivityIndicator
          size="small"
          color={isLiked ? "#EF4444" : "#E5E0D8"}
          style={{ marginRight: 6 }}
        />
      ) : (
        <FontAwesome
          name={isLiked ? "heart" : "heart-o"}
          size={getIconSize()}
          color={isLiked ? "#EF4444" : "#E5E0D8"}
          style={{ marginRight: 6 }}
        />
      )}

      <Text
        className={`font-bold ${getTextSize()} ${
          isLiked ? "text-red-500" : "text-[#E5E0D8]"
        }`}
      >
        {isLiked ? "ĐÃ THÍCH" : "YÊU THÍCH"}
      </Text>

      {showCount && (
        <View
          className={`ml-2 px-1.5 py-0.5 rounded border ${
            isLiked
              ? "bg-red-500/20 border-red-500/30"
              : "bg-white/10 border-white/5"
          }`}
        >
          <Text
            className={`font-black text-[9px] ${
              isLiked ? "text-red-500" : "text-gray-300"
            }`}
          >
            {likeCount.toLocaleString("vi-VN")}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
