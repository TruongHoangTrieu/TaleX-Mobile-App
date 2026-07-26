import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import {
  CommentDto,
  getEpisodeComments,
  createComment,
} from "@/services/comments";
import { CommentItem } from "./CommentItem";

interface EpisodeCommentsSectionProps {
  episodeId: string;
  style?: any;
}

export function EpisodeCommentsSection({
  episodeId,
  style,
}: EpisodeCommentsSectionProps) {
  const { user } = useAuth();
  const isAuthenticated = Boolean(user);

  const [comments, setComments] = useState<CommentDto[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalElements, setTotalElements] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [content, setContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch root comments
  const fetchComments = useCallback(
    async (pageToFetch = 0, isRefreshing = false) => {
      if (isRefreshing) {
        setIsFetching(true);
      } else if (pageToFetch === 0) {
        setIsLoading(true);
      } else {
        setIsFetching(true);
      }

      try {
        const res = await getEpisodeComments(episodeId, pageToFetch, 10);
        const newItems = res.content || [];
        if (pageToFetch === 0) {
          setComments(newItems);
        } else {
          setComments((prev) => [...prev, ...newItems]);
        }

        setHasMore(!res.isLast);
        setPage(pageToFetch);
        if (typeof res.totalElements === "number") {
          setTotalElements(res.totalElements);
        }
      } catch (err: any) {
        console.error("Error fetching episode comments:", err);
      } finally {
        setIsLoading(false);
        setIsFetching(false);
      }
    },
    [episodeId]
  );

  useEffect(() => {
    if (episodeId) {
      fetchComments(0);
    }
  }, [episodeId, fetchComments]);

  // Submit root comment
  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (!isAuthenticated) {
      Alert.alert("Thông báo", "Vui lòng đăng nhập để bình luận.");
      return;
    }

    setIsCreating(true);
    try {
      await createComment({
        content: content.trim(),
        episodeId,
      });
      setContent("");
      fetchComments(0, true);
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể đăng bình luận.");
    } finally {
      setIsCreating(false);
    }
  };

  const userAvatarLetter = (user?.fullName || user?.username || "U")
    .charAt(0)
    .toUpperCase();

  const commentCount = totalElements !== null ? totalElements : comments.length;

  return (
    <View
      style={style}
      className="w-full bg-[#181614] rounded-2xl border border-stone-800 p-4 my-4"
    >
      {/* HEADER SECTION */}
      <View className="flex-row items-center justify-between pb-3 mb-4 border-b border-stone-800">
        <View className="flex-row items-center">
          <View className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 items-center justify-center mr-2.5">
            <Feather name="message-square" size={18} color="#D4AF37" />
          </View>
          <View>
            <Text className="text-white font-extrabold text-sm tracking-wide">
              Bình Luận ({commentCount})
            </Text>
            <Text className="text-[#7C766B] text-[10px] font-semibold">
              Chia sẻ cảm nghĩ của bạn về tập này
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => fetchComments(0, true)}
          disabled={isFetching}
          className="p-1.5"
        >
          <Feather
            name="refresh-cw"
            size={14}
            color={isFetching ? "#D4AF37" : "#7C766B"}
          />
        </TouchableOpacity>
      </View>

      {/* ROOT COMMENT INPUT BOX */}
      <View className="flex-row items-start mb-6">
        <View className="w-9 h-9 rounded-full bg-zinc-800 border border-stone-700 items-center justify-center overflow-hidden mr-2.5 mt-0.5">
          {user?.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-[#D4AF37] font-black text-xs">
              {userAvatarLetter}
            </Text>
          )}
        </View>

        <View className="flex-1">
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder={
              isAuthenticated
                ? "Viết bình luận của bạn..."
                : "Vui lòng đăng nhập để tham gia bình luận."
            }
            placeholderTextColor="#7C766B"
            editable={isAuthenticated && !isCreating}
            multiline
            numberOfLines={3}
            className="w-full bg-[#141210] rounded-xl border border-stone-800 p-2.5 text-white text-xs min-h-[70px] leading-5"
          />

          {isAuthenticated && (
            <View className="flex-row justify-end mt-2">
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isCreating || !content.trim()}
                className={`flex-row items-center px-4 py-2 rounded-xl bg-[#D4AF37] ${
                  isCreating || !content.trim() ? "opacity-50" : "active:opacity-80"
                }`}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#141210" />
                ) : (
                  <>
                    <Feather
                      name="send"
                      size={12}
                      color="#141210"
                      style={{ marginRight: 6 }}
                    />
                    <Text className="text-[#141210] font-black text-xs">
                      Đăng bình luận
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* COMMENTS LIST */}
      <View>
        {isLoading && comments.length === 0 ? (
          <View className="items-center justify-center py-8">
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text className="text-[#7C766B] text-xs mt-2 font-medium">
              Đang tải bình luận...
            </Text>
          </View>
        ) : comments.length === 0 ? (
          <View className="items-center justify-center py-8 bg-[#141210]/50 rounded-xl border border-stone-800/50 p-4">
            <Feather name="message-square" size={32} color="#7C766B" />
            <Text className="text-stone-300 font-bold text-xs mt-2">
              Chưa có bình luận nào
            </Text>
            <Text className="text-[#7C766B] text-[10px] mt-1 text-center font-medium">
              Hãy là người đầu tiên để lại bình luận cho tập này!
            </Text>
          </View>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.commentId}
              comment={comment}
              episodeId={episodeId}
              onRefreshParent={() => fetchComments(0, true)}
            />
          ))
        )}

        {/* LOAD MORE BUTTON */}
        {hasMore && (
          <View className="items-center pt-3">
            <TouchableOpacity
              onPress={() => fetchComments(page + 1)}
              disabled={isFetching}
              className="flex-row items-center bg-[#141210] px-4 py-2 rounded-xl border border-stone-800"
            >
              {isFetching ? (
                <>
                  <ActivityIndicator size="small" color="#D4AF37" />
                  <Text className="text-stone-300 text-xs font-bold ml-2">
                    Đang tải thêm...
                  </Text>
                </>
              ) : (
                <Text className="text-stone-300 text-xs font-bold">
                  Xem thêm bình luận khác
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
