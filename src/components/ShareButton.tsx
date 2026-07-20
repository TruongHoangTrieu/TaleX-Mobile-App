import React, { useState } from "react";
import { TouchableOpacity, Text, Share, ActivityIndicator, ViewStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { shareEpisode } from "@/services/share";

interface ShareButtonProps {
  episodeId?: string;
  title?: string;
  shareUrl?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  style?: ViewStyle;
}

export function ShareButton({
  episodeId,
  title = "TaleX - Nền tảng Phim & Truyện Tranh",
  shareUrl,
  size = "md",
  showLabel = false,
  style,
}: ShareButtonProps) {
  const [sharing, setSharing] = useState(false);

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

  const handleShare = async () => {
    const urlToShare = shareUrl || `https://talex.pro.vn/watch/${episodeId || ""}`;
    const message = `Xem ngay "${title}" trên TaleX: ${urlToShare}`;

    setSharing(true);
    try {
      if (episodeId) {
        // Record share count on server asynchronously
        shareEpisode(episodeId).catch(() => {});
      }

      const result = await Share.share({
        title,
        message,
        url: urlToShare,
      });

      if (result.action === Share.sharedAction) {
        Toast.show({
          type: "success",
          text1: "Đã chia sẻ thành công!",
        });
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: err.message || "Không thể chia sẻ lúc này.",
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={sharing}
      onPress={handleShare}
      className={`flex-row items-center justify-center rounded-full bg-white/[0.04] border border-white/10 ${getPadding()}`}
      style={style}
    >
      {sharing ? (
        <ActivityIndicator
          size="small"
          color="#E5E0D8"
          style={{ marginRight: showLabel ? 6 : 0 }}
        />
      ) : (
        <Feather
          name="share-2"
          size={getIconSize()}
          color="#E5E0D8"
          style={{ marginRight: showLabel ? 6 : 0 }}
        />
      )}
      {showLabel && (
        <Text className="text-xs font-bold text-stone-300">Chia sẻ</Text>
      )}
    </TouchableOpacity>
  );
}
