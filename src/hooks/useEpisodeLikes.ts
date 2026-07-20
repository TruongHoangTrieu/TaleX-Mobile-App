import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";
import { useAuth } from "@/context/AuthContext";
import {
  likeEpisode,
  unlikeEpisode,
  getMyLikedEpisodes,
  getEpisodeLikes,
  AccountLikeResponse,
} from "@/services/like";

export function useEpisodeLikes(episodeId?: string) {
  const { isAuthenticated } = useAuth();
  const [myLikes, setMyLikes] = useState<AccountLikeResponse[]>([]);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const fetchLikeData = useCallback(async () => {
    if (!episodeId) return;
    setIsLoading(true);

    try {
      // 1. If authenticated, fetch my liked episodes list
      if (isAuthenticated) {
        getMyLikedEpisodes(0, 200)
          .then((res) => setMyLikes(res.content || []))
          .catch((err) => console.log("[useEpisodeLikes] My likes error:", err));
      } else {
        setMyLikes([]);
      }

      // 2. Fetch public likes count for this episode
      const likesRes = await getEpisodeLikes(episodeId, 0, 20);
      setLikesCount(likesRes.numberOfElements ?? (likesRes.content?.length || 0));
    } catch (err) {
      console.log("[useEpisodeLikes] Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [episodeId, isAuthenticated]);

  useEffect(() => {
    fetchLikeData();
  }, [fetchLikeData]);

  const isLiked = episodeId
    ? myLikes.some((item) => item.episodeId === episodeId)
    : false;

  const toggleLike = async () => {
    if (!isAuthenticated) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để thích tập này.");
      return;
    }
    if (!episodeId || isMutating) return;

    const previousMyLikes = [...myLikes];
    const previousCount = likesCount;
    setIsMutating(true);

    try {
      if (isLiked) {
        // Optimistic update: remove like and decrement count
        setMyLikes((prev) => prev.filter((item) => item.episodeId !== episodeId));
        setLikesCount((prev) => Math.max(0, prev - 1));
        await unlikeEpisode(episodeId);
        Toast.show({ type: "success", text1: "Đã bỏ thích" });
      } else {
        // Optimistic update: add like and increment count
        setMyLikes((prev) => [
          { episodeId, likedAt: new Date().toISOString() },
          ...prev,
        ]);
        setLikesCount((prev) => prev + 1);
        await likeEpisode(episodeId);
        Toast.show({ type: "success", text1: "Đã thích tập này" });
      }
    } catch (err: any) {
      // Revert optimistic updates
      setMyLikes(previousMyLikes);
      setLikesCount(previousCount);
      Alert.alert("Lỗi", err.message || "Thao tác không thành công. Vui lòng thử lại!");
    } finally {
      setIsMutating(false);
      fetchLikeData();
    }
  };

  return {
    isLiked,
    likeCount: Math.max(likesCount, isLiked ? 1 : 0),
    toggleLike,
    isLoading,
    isMutating,
    refreshLikes: fetchLikeData,
  };
}
