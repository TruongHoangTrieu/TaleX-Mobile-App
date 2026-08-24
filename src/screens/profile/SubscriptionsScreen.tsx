import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";
import { getFollowedCreators, AccountFollowInfoDto } from "@/services/follow";
import { FollowButton } from "@/components/FollowButton";
import { useCreatorFollow } from "@/hooks/useCreatorFollow";

function CreatorItemCard({
  creator,
  onPress,
}: {
  creator: AccountFollowInfoDto;
  onPress: () => void;
}) {
  const { isFollowing, toggleFollow, isMutating } = useCreatorFollow(creator.accountId);

  return (
    <View className="bg-[#1C1A17] p-3.5 rounded-2xl mb-3 flex-row items-center justify-between border border-white/5">
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        className="flex-row items-center flex-1 mr-3"
      >
        <View className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden border border-white/10 mr-3">
          <Image
            source={
              creator.avatarUrl
                ? { uri: creator.avatarUrl }
                : require("@assets/icon.png")
            }
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>
        <View className="flex-1">
          <Text className="text-white font-bold text-sm" numberOfLines={1}>
            {creator.username || creator.fullName || "Nhà sáng tạo"}
          </Text>
          {creator.followedAt && (
            <Text className="text-zinc-500 text-[11px] mt-0.5">
              Theo dõi từ: {new Date(creator.followedAt).toLocaleDateString("vi-VN")}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      <FollowButton
        isFollowing={isFollowing}
        onFollowToggle={toggleFollow}
        isMutating={isMutating}
        size="small"
      />
    </View>
  );
}

export default function SubscriptionsScreen() {
  const navigation = useNavigation<any>();
  const { isAuthenticated, user } = useAuth();

  const [creators, setCreators] = useState<AccountFollowInfoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFollowed = useCallback(async () => {
    if (!isAuthenticated) {
      setCreators([]);
      setLoading(false);
      return;
    }

    try {
      const res = await getFollowedCreators(0, 250);
      setCreators(res.content || []);
    } catch (err: any) {
      console.error("Lỗi lấy danh sách kênh đang theo dõi:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchFollowed();
  }, [fetchFollowed]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFollowed();
  };

  const handleCreatorPress = (creator: AccountFollowInfoDto) => {
    if (!creator.accountId) return;
    const isMyChannel =
      user?.accountId &&
      String(user.accountId).toLowerCase() === String(creator.accountId).toLowerCase();

    if (isMyChannel) {
      navigation.navigate("CreatorChannel");
    } else {
      navigation.navigate("PublicChannel", { creatorId: creator.accountId });
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#141210]">
      <StatusBar barStyle="light-content" backgroundColor="#141210" />

      {/* HEADER */}
      <View className="h-[56px] px-4 flex-row items-center justify-between border-b border-white/5">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center rounded-full bg-[#252830]"
          activeOpacity={0.75}
        >
          <Feather name="arrow-left" size={22} color="#E5E0D8" />
        </TouchableOpacity>
        <Text className="text-[#E5E0D8] text-[18px] font-bold">
          Kênh Đang Theo Dõi
        </Text>
        <View className="w-10" />
      </View>

      {/* CONTENT LIST */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text className="text-zinc-500 text-xs mt-3">Đang tải danh sách theo dõi...</Text>
        </View>
      ) : !isAuthenticated ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="people-outline" size={48} color="#7C766B" />
          <Text className="text-white font-bold text-base mt-4 text-center">
            Bạn chưa đăng nhập
          </Text>
          <Text className="text-zinc-500 text-xs text-center mt-2">
            Đăng nhập để xem và quản lý các nhà sáng tạo bạn đã nhấn theo dõi!
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("LoginScreen")}
            className="mt-6 bg-[#D4AF37] px-6 py-3 rounded-full"
          >
            <Text className="text-[#141210] font-bold text-sm">Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      ) : creators.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Feather name="user-check" size={48} color="#3F3F46" />
          <Text className="text-zinc-400 font-bold text-base mt-4 text-center">
            Chưa theo dõi nhà sáng tạo nào
          </Text>
          <Text className="text-zinc-600 text-xs text-center mt-1">
            Hãy theo dõi các tác giả yêu thích để nhận thông báo về tác phẩm mới nhất.
          </Text>
        </View>
      ) : (
        <FlatList
          data={creators}
          keyExtractor={(item, index) => item.accountId || index.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#D4AF37"
            />
          }
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <CreatorItemCard
              creator={item}
              onPress={() => handleCreatorPress(item)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
