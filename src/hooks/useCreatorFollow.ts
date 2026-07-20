import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";
import { useAuth } from "@/context/AuthContext";
import {
  followCreator,
  unfollowCreator,
  getFollowedCreators,
  AccountFollowInfoDto,
} from "@/services/follow";

export function useCreatorFollow(creatorAccountId?: string) {
  const { user, isAuthenticated } = useAuth();
  const [followedList, setFollowedList] = useState<AccountFollowInfoDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const fetchFollowed = useCallback(async () => {
    if (!isAuthenticated) {
      setFollowedList([]);
      return;
    }
    setIsLoading(true);
    try {
      const res = await getFollowedCreators(0, 250);
      setFollowedList(res.content || []);
    } catch (err) {
      console.log("[useCreatorFollow] Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchFollowed();
  }, [fetchFollowed]);

  const isFollowing = creatorAccountId
    ? followedList.some((item) => item.accountId === creatorAccountId)
    : false;

  const toggleFollow = async () => {
    if (!isAuthenticated) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để theo dõi nhà sáng tạo.");
      return;
    }
    if (!creatorAccountId || isMutating) return;

    if (user?.accountId && creatorAccountId && user.accountId === creatorAccountId) {
      Alert.alert("Thông báo", "Bạn không thể tự theo dõi chính mình!");
      return;
    }

    const previousList = [...followedList];
    setIsMutating(true);

    try {
      if (isFollowing) {
        // Optimistic update: remove creator
        setFollowedList((prev) => prev.filter((item) => item.accountId !== creatorAccountId));
        await unfollowCreator(creatorAccountId);
        Toast.show({ type: "success", text1: "Đã hủy theo dõi nhà sáng tạo." });
      } else {
        // Optimistic update: add creator
        setFollowedList((prev) => [
          ...prev,
          { accountId: creatorAccountId, followedAt: new Date().toISOString() },
        ]);
        await followCreator(creatorAccountId);
        Toast.show({ type: "success", text1: "Đã theo dõi nhà sáng tạo." });
      }
    } catch (err: any) {
      // Revert snapshot
      setFollowedList(previousList);
      Alert.alert("Lỗi", err.message || "Thao tác không thành công. Vui lòng thử lại!");
    } finally {
      setIsMutating(false);
      fetchFollowed();
    }
  };

  return {
    isFollowing,
    toggleFollow,
    isLoading,
    isMutating,
    refreshFollowed: fetchFollowed,
  };
}
