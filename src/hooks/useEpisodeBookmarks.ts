import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";
import { useAuth } from "@/context/AuthContext";
import {
  bookmarkEpisode,
  unbookmarkEpisode,
  getMyBookmarkedEpisodes,
} from "@/services/bookmark";

export function useEpisodeBookmarks(episodeId?: string) {
  const { isAuthenticated } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkBookmarkStatus = useCallback(async () => {
    if (!episodeId || !isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await getMyBookmarkedEpisodes(0, 100);
      const items = res.content || [];
      const found = items.some((item) => item.episodeId === episodeId);
      setIsBookmarked(found);
    } catch (e) {
      // Ignore errors silently for initial load
    } finally {
      setIsLoading(false);
    }
  }, [episodeId, isAuthenticated]);

  useEffect(() => {
    checkBookmarkStatus();
  }, [checkBookmarkStatus]);

  const toggleBookmark = async (contentType?: "VIDEO" | "COMIC") => {
    if (!episodeId) return;
    if (!isAuthenticated) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để lưu tập này!");
      return;
    }
    if (isMutating) return;

    const previousState = isBookmarked;
    const typeLabel = contentType === "COMIC" ? "chương truyện" : "tập phim";

    // Optimistic UI Update
    setIsBookmarked(!previousState);
    setIsMutating(true);

    try {
      if (previousState) {
        await unbookmarkEpisode(episodeId);
        Toast.show({
          type: "success",
          text1: `Đã bỏ lưu ${typeLabel} khỏi danh sách.`,
        });
      } else {
        await bookmarkEpisode(episodeId);
        Toast.show({
          type: "success",
          text1: `Đã lưu ${typeLabel} vào danh sách của bạn!`,
        });
      }
    } catch (err: any) {
      // Revert optimistic state on error
      setIsBookmarked(previousState);
      Toast.show({
        type: "error",
        text1: err.message || `Không thể ${previousState ? "bỏ lưu" : "lưu"} ${typeLabel}.`,
      });
    } finally {
      setIsMutating(false);
    }
  };

  return {
    isBookmarked,
    isLoading,
    isMutating,
    toggleBookmark,
    refreshBookmarkStatus: checkBookmarkStatus,
  };
}
