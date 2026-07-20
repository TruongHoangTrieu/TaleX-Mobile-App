import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { getFollowers, AccountFollowInfoDto } from "@/services/follow";
import { FollowButton } from "./FollowButton";
import { useCreatorFollow } from "@/hooks/useCreatorFollow";

function FollowerUserRow({ user }: { user: AccountFollowInfoDto }) {
  const { isFollowing, toggleFollow, isMutating } = useCreatorFollow(user.accountId);

  return (
    <View className="flex-row items-center justify-between py-3 border-b border-white/5">
      <View className="flex-row items-center flex-1 mr-3">
        <View className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-white/10 mr-3">
          <Image
            source={
              user.avatarUrl
                ? { uri: user.avatarUrl }
                : require("@assets/icon.png")
            }
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold text-sm" numberOfLines={1}>
            {user.username || user.fullName || "Người dùng TaleX"}
          </Text>
          {user.followedAt && (
            <Text className="text-zinc-500 text-[11px] mt-0.5">
              Theo dõi từ: {new Date(user.followedAt).toLocaleDateString("vi-VN")}
            </Text>
          )}
        </View>
      </View>

      <FollowButton
        isFollowing={isFollowing}
        onFollowToggle={toggleFollow}
        isMutating={isMutating}
        size="small"
      />
    </View>
  );
}

interface FollowersModalProps {
  visible: boolean;
  creatorAccountId?: string;
  onClose: () => void;
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
  visible,
  creatorAccountId,
  onClose,
}) => {
  const [followers, setFollowers] = useState<AccountFollowInfoDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      getFollowers(0, 50, creatorAccountId)
        .then((res) => {
          setFollowers(res.content || []);
        })
        .catch((err) => {
          console.error("Lỗi lấy danh sách người theo dõi:", err);
          setFollowers([]);
        })
        .finally(() => setLoading(false));
    }
  }, [visible, creatorAccountId]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-white/5 mb-3">
            <View className="flex-row items-center">
              <Feather name="users" size={18} color="#D4AF37" />
              <Text className="text-white text-base font-bold ml-2">
                Người theo dõi tác giả ({followers.length})
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={22} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {loading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator size="small" color="#D4AF37" />
              <Text className="text-zinc-500 text-xs mt-2">Đang tải danh sách...</Text>
            </View>
          ) : followers.length === 0 ? (
            <View className="py-12 items-center justify-center">
              <Feather name="user-x" size={32} color="#3F3F46" />
              <Text className="text-zinc-500 text-xs mt-2">Chưa có ai theo dõi tác giả này</Text>
            </View>
          ) : (
            <FlatList
              data={followers}
              keyExtractor={(item, index) => item.accountId || index.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => <FollowerUserRow user={item} />}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  container: {
    height: "60%",
    backgroundColor: "#161618",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
});
