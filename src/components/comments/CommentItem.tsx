import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import {
  CommentDto,
  getCommentReplies,
  createComment,
  updateComment,
  deleteComment,
  hideComment,
} from "@/services/comments";

interface CommentItemProps {
  comment: CommentDto;
  episodeId: string;
  depth?: number;
  onRefreshParent?: () => void;
}

export function CommentItem({
  comment,
  episodeId,
  depth = 0,
  onRefreshParent,
}: CommentItemProps) {
  const { user } = useAuth();
  const currentAccountId = user?.accountId;

  const isCommentOwner =
    comment.isOwner ||
    (Boolean(currentAccountId) &&
      Boolean(comment.accountId) &&
      currentAccountId === comment.accountId);

  const canHideComment =
    user?.roleName === "ADMIN" || user?.roleName === "STAFF";

  // States
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isUpdating, setIsUpdating] = useState(false);

  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isCreatingReply, setIsCreatingReply] = useState(false);

  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<CommentDto[]>([]);
  const [repliesPage, setRepliesPage] = useState(0);
  const [hasMoreReplies, setHasMoreReplies] = useState(false);
  const [isRepliesLoading, setIsRepliesLoading] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isHiding, setIsHiding] = useState(false);

  // Fetch replies when opening showReplies
  const fetchReplies = async (page = 0) => {
    setIsRepliesLoading(true);
    try {
      const res = await getCommentReplies(comment.commentId, page, 5);
      const newItems = res.content || [];
      if (page === 0) {
        setReplies(newItems);
      } else {
        setReplies((prev) => [...prev, ...newItems]);
      }
      setHasMoreReplies(!res.isLast);
      setRepliesPage(page);
    } catch (err: any) {
      console.error("Error fetching replies:", err);
    } finally {
      setIsRepliesLoading(false);
    }
  };

  const toggleShowReplies = () => {
    if (!showReplies && replies.length === 0) {
      fetchReplies(0);
    }
    setShowReplies((prev) => !prev);
  };

  // Save edit
  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setIsUpdating(true);
    try {
      await updateComment(comment.commentId, editContent.trim());
      comment.content = editContent.trim();
      setIsEditing(false);
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể cập nhật bình luận.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Send reply
  const handleSendReply = async () => {
    if (!replyContent.trim()) return;
    setIsCreatingReply(true);
    try {
      await createComment({
        content: replyContent.trim(),
        episodeId,
        commentParentId: comment.commentId,
      });
      setReplyContent("");
      setIsReplying(false);
      setShowReplies(true);
      fetchReplies(0);
    } catch (err: any) {
      Alert.alert("Lỗi", err.message || "Không thể phản hồi bình luận.");
    } finally {
      setIsCreatingReply(false);
    }
  };

  // Delete comment
  const handleDelete = () => {
    Alert.alert(
      "Xóa bình luận",
      "Bạn có chắc chắn muốn xóa bình luận này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteComment(comment.commentId);
              if (onRefreshParent) onRefreshParent();
            } catch (err: any) {
              Alert.alert("Lỗi", err.message || "Không thể xóa bình luận.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  // Hide comment (Admin / Staff)
  const handleHide = () => {
    Alert.alert(
      "Ẩn bình luận",
      "Bình luận sẽ bị ẩn vĩnh viễn và không thể khôi phục. Bạn có chắc chắn?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận ẩn",
          style: "destructive",
          onPress: async () => {
            setIsHiding(true);
            try {
              await hideComment(comment.commentId);
              comment.status = "HIDDEN";
            } catch (err: any) {
              Alert.alert("Lỗi", err.message || "Không thể ẩn bình luận.");
            } finally {
              setIsHiding(false);
            }
          },
        },
      ]
    );
  };

  const isHidden = comment.status === "HIDDEN";
  const avatarLetter = (comment.displayName || comment.username || "U")
    .charAt(0)
    .toUpperCase();

  const formattedDate = comment.createdAt
    ? new Date(comment.createdAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const totalReplies =
    comment.repliesCount ?? comment.replyCount ?? replies.length;

  return (
    <View
      className={`relative mb-3 ${
        depth > 0 ? "pl-3 border-l-2 border-stone-800 ml-2" : ""
      }`}
    >
      <View className="flex-row items-start">
        {/* User Avatar */}
        <View className="w-8 h-8 rounded-full bg-zinc-800 border border-stone-700 items-center justify-center overflow-hidden mr-2.5 mt-0.5">
          {comment.avatarUrl ? (
            <Image
              source={{ uri: comment.avatarUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-[#D4AF37] font-black text-xs">
              {avatarLetter}
            </Text>
          )}
        </View>

        {/* Comment Body */}
        <View className="flex-1">
          {/* Header Info */}
          <View className="flex-row items-center flex-wrap mb-1">
            <Text className="text-white font-bold text-xs mr-2">
              {comment.displayName || comment.username || "Tài khoản TaleX"}
            </Text>
            {formattedDate !== "" && (
              <Text className="text-[#7C766B] text-[10px] font-medium mr-2">
                {formattedDate}
              </Text>
            )}
            {isHidden && (
              <View className="bg-zinc-800 px-1.5 py-0.2 rounded">
                <Text className="text-zinc-400 text-[9px] font-semibold">
                  Đã ẩn
                </Text>
              </View>
            )}
          </View>

          {/* Content / Edit Form */}
          {isEditing ? (
            <View className="mt-1 mb-2 bg-[#1E1B18] p-2 rounded-xl border border-[#D4AF37]/50">
              <TextInput
                value={editContent}
                onChangeText={setEditContent}
                multiline
                className="text-white text-xs p-1 min-h-[50px] leading-5"
                placeholderTextColor="#7C766B"
              />
              <View className="flex-row justify-end mt-2">
                <TouchableOpacity
                  onPress={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="px-3 py-1 bg-stone-800 rounded-lg mr-2"
                >
                  <Text className="text-stone-300 text-xs font-semibold">
                    Hủy
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveEdit}
                  disabled={isUpdating || !editContent.trim()}
                  className="px-3 py-1 bg-[#D4AF37] rounded-lg flex-row items-center"
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#141210" />
                  ) : (
                    <Text className="text-[#141210] text-xs font-bold">
                      Lưu
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text className="text-stone-300 text-xs leading-5">
              {comment.content}
            </Text>
          )}

          {/* Actions Bar */}
          {!isEditing && (
            <View className="flex-row items-center mt-1.5 space-x-4">
              {/* Reply Button */}
              <TouchableOpacity
                onPress={() => setIsReplying((prev) => !prev)}
                className="flex-row items-center mr-4"
              >
                <Feather name="corner-down-right" size={11} color="#7C766B" />
                <Text className="text-[#7C766B] text-[11px] font-semibold ml-1">
                  Phản hồi
                </Text>
              </TouchableOpacity>

              {/* Edit Button (if owner) */}
              {isCommentOwner && (
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  className="flex-row items-center mr-4"
                >
                  <Feather name="edit-2" size={11} color="#D4AF37" />
                  <Text className="text-[#D4AF37] text-[11px] font-semibold ml-1">
                    Sửa
                  </Text>
                </TouchableOpacity>
              )}

              {/* Delete Button (if owner) */}
              {isCommentOwner && (
                <TouchableOpacity
                  onPress={handleDelete}
                  disabled={isDeleting}
                  className="flex-row items-center mr-4"
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Feather name="trash-2" size={11} color="#EF4444" />
                  )}
                  <Text className="text-red-400 text-[11px] font-semibold ml-1">
                    Xóa
                  </Text>
                </TouchableOpacity>
              )}

              {/* Hide Button (if ADMIN/STAFF) */}
              {canHideComment && !isCommentOwner && (
                <TouchableOpacity
                  onPress={handleHide}
                  disabled={isHiding}
                  className="flex-row items-center mr-4"
                >
                  {isHiding ? (
                    <ActivityIndicator size="small" color="#F59E0B" />
                  ) : (
                    <Feather name="eye-off" size={11} color="#F59E0B" />
                  )}
                  <Text className="text-amber-400 text-[11px] font-semibold ml-1">
                    Ẩn
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Inline Reply Form */}
          {isReplying && (
            <View className="mt-2.5 bg-[#1E1B18] p-2.5 rounded-xl border border-stone-800 flex-row items-center">
              <TextInput
                value={replyContent}
                onChangeText={setReplyContent}
                placeholder={`Trả lời ${
                  comment.displayName || comment.username || "người dùng"
                }...`}
                placeholderTextColor="#7C766B"
                className="flex-1 text-white text-xs p-1"
                multiline
              />
              <TouchableOpacity
                onPress={() => setIsReplying(false)}
                className="p-1.5 mr-1"
              >
                <Feather name="x" size={14} color="#7C766B" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSendReply}
                disabled={isCreatingReply || !replyContent.trim()}
                className="bg-[#D4AF37] p-2 rounded-lg"
              >
                {isCreatingReply ? (
                  <ActivityIndicator size="small" color="#141210" />
                ) : (
                  <Feather name="send" size={12} color="#141210" />
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Toggle Replies List Button */}
          {(totalReplies > 0 || showReplies) && (
            <TouchableOpacity
              onPress={toggleShowReplies}
              className="mt-2 flex-row items-center"
            >
              <Feather name="message-square" size={10} color="#D4AF37" />
              <Text className="text-[#D4AF37] text-[11px] font-bold ml-1.5">
                {showReplies
                  ? "Ẩn phản hồi"
                  : `Xem ${totalReplies > 0 ? totalReplies : ""} phản hồi`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Nested Replies Rendering */}
          {showReplies && (
            <View className="mt-3">
              {isRepliesLoading && replies.length === 0 ? (
                <View className="flex-row items-center py-2">
                  <ActivityIndicator size="small" color="#D4AF37" />
                  <Text className="text-[#7C766B] text-xs ml-2">
                    Đang tải phản hồi...
                  </Text>
                </View>
              ) : (
                replies.map((reply) => (
                  <CommentItem
                    key={reply.commentId}
                    comment={reply}
                    episodeId={episodeId}
                    depth={depth + 1}
                    onRefreshParent={() => fetchReplies(0)}
                  />
                ))
              )}

              {hasMoreReplies && (
                <TouchableOpacity
                  onPress={() => fetchReplies(repliesPage + 1)}
                  disabled={isRepliesLoading}
                  className="py-1"
                >
                  <Text className="text-[#7C766B] text-[11px] font-bold">
                    {isRepliesLoading ? "Đang tải..." : "Xem thêm phản hồi khác"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
