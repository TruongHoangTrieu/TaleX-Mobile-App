import React from "react";
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

interface FollowButtonProps {
  isFollowing: boolean;
  onFollowToggle: () => void;
  isLoading?: boolean;
  isMutating?: boolean;
  size?: "small" | "medium" | "large";
  style?: any;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  isFollowing,
  onFollowToggle,
  isLoading = false,
  isMutating = false,
  size = "medium",
  style,
}) => {
  const disabled = isLoading || isMutating;

  const getPadding = () => {
    switch (size) {
      case "small":
        return "px-3 py-1.5";
      case "large":
        return "px-6 py-3";
      case "medium":
      default:
        return "px-4 py-2";
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "small":
        return "text-[11px]";
      case "large":
        return "text-[14px]";
      case "medium":
      default:
        return "text-[12px]";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "small":
        return 12;
      case "large":
        return 16;
      case "medium":
      default:
        return 14;
    }
  };

  return (
    <TouchableOpacity
      onPress={onFollowToggle}
      disabled={disabled}
      activeOpacity={0.75}
      className={`flex-row items-center justify-center rounded-full border ${getPadding()} ${
        isFollowing
          ? "bg-[#252830] border-white/10"
          : "bg-[#D4AF37] border-[#D4AF37]"
      } ${disabled ? "opacity-60" : ""}`}
      style={style}
    >
      {isMutating || isLoading ? (
        <ActivityIndicator
          size="small"
          color={isFollowing ? "#E5E0D8" : "#141210"}
          style={{ marginRight: 6 }}
        />
      ) : isFollowing ? (
        <Feather
          name="check"
          size={getIconSize()}
          color="#E5E0D8"
          style={{ marginRight: 4 }}
        />
      ) : (
        <Feather
          name="plus"
          size={getIconSize()}
          color="#141210"
          style={{ marginRight: 4 }}
        />
      )}

      <Text
        className={`font-bold ${getTextSize()} ${
          isFollowing ? "text-[#E5E0D8]" : "text-[#141210]"
        }`}
      >
        {isFollowing ? "Đang theo dõi" : "Theo dõi"}
      </Text>
    </TouchableOpacity>
  );
};
