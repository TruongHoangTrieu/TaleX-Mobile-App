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
import { getEpisodeLikes, LikedUser } from "@/services/like";

interface LikedUsersModalProps {
  visible: boolean;
  episodeId: string;
  onClose: () => void;
}

export const LikedUsersModal: React.FC<LikedUsersModalProps> = ({
  visible,
  episodeId,
  onClose,
}) => {
  const [users, setUsers] = useState<LikedUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && episodeId) {
      setLoading(true);
      getEpisodeLikes(episodeId, 0, 50)
        .then((res) => {
          setUsers(res.content || []);
        })
        .catch((err) => {
          console.error("Lỗi lấy danh sách người dùng đã thích:", err);
          setUsers([]);
        })
        .finally(() => setLoading(false));
    }
  }, [visible, episodeId]);

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
              <Ionicons name="heart" size={20} color="#EF4444" />
              <Text className="text-white text-base font-bold ml-2">
                Người dùng đã thích ({users.length})
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
          ) : users.length === 0 ? (
            <View className="py-12 items-center justify-center">
              <Feather name="heart" size={32} color="#3F3F46" />
              <Text className="text-zinc-500 text-xs mt-2">Chưa có người dùng nào thích tập này</Text>
            </View>
          ) : (
            <FlatList
              data={users}
              keyExtractor={(item, index) => item.accountId || index.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View className="flex-row items-center justify-between py-3 border-b border-white/5">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-white/10 mr-3">
                      <Image
                        source={
                          item.avatarUrl
                            ? { uri: item.avatarUrl }
                            : require("@assets/icon.png")
                        }
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-bold text-sm" numberOfLines={1}>
                        {item.username || "Người dùng TaleX"}
                      </Text>
                      {item.likedAt && (
                        <Text className="text-zinc-500 text-[11px] mt-0.5">
                          {new Date(item.likedAt).toLocaleDateString("vi-VN")}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              )}
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
    height: "55%",
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
