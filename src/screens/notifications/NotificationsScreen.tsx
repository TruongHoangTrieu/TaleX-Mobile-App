import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import {
  deleteReadNotifications,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notificationService";
import type { NotificationItem } from "@/types/notification";

const PAGE_SIZE = 20;

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getTypeLabel(type?: string) {
  switch (type) {
    case "SUBSCRIPTION_PURCHASE_SUCCESS":
      return "Hội viên";
    case "COMBO_PURCHASE_SUCCESS":
      return "Mua combo";
    case "EPISODE_PURCHASE_SUCCESS":
      return "Mua tập";
    case "EPISODE_FORCE_HIDDEN":
      return "Tập bị ẩn";
    case "EPISODE_RESTORED":
      return "Tập khôi phục";
    case "PENALTY_WARNING":
      return "Cảnh báo";
    case "APPEAL_RESULT":
      return "Khiếu nại";
    case "REPORT_RESULT":
      return "Báo cáo";
    case "SYSTEM_NOTICE":
      return "Hệ thống";
    default:
      return "Thông báo";
  }
}

function getNotificationIcon(type?: string) {
  switch (type) {
    case "SUBSCRIPTION_PURCHASE_SUCCESS":
      return <MaterialCommunityIcons name="crown-outline" size={20} color="#D4AF37" />;
    case "COMBO_PURCHASE_SUCCESS":
      return <MaterialCommunityIcons name="package-variant-closed" size={20} color="#38BDF8" />;
    case "EPISODE_PURCHASE_SUCCESS":
      return <MaterialCommunityIcons name="play-circle-outline" size={21} color="#34D399" />;
    case "EPISODE_FORCE_HIDDEN":
      return <Ionicons name="eye-off-outline" size={20} color="#F97316" />;
    case "EPISODE_RESTORED":
      return <Ionicons name="eye-outline" size={20} color="#10B981" />;
    case "PENALTY_WARNING":
      return <Feather name="alert-triangle" size={19} color="#FB7185" />;
    case "APPEAL_RESULT":
      return <MaterialCommunityIcons name="gavel" size={20} color="#A78BFA" />;
    default:
      return <Ionicons name="notifications-outline" size={20} color="#D4AF37" />;
  }
}

function getNavigationTarget(item: NotificationItem): { name: string; params?: any } | null {
  const refType = item.referenceType?.toUpperCase();
  const refId = item.referenceId;

  // 1. Direct Reference Target (Series or Episode)
  if (refType === "SERIES" && refId) {
    return { name: "ComicDetailScreen", params: { comicId: refId } };
  }

  if (refType === "EPISODE" && refId) {
    return { name: "ComicReader", params: { episodeId: refId } };
  }

  // 2. Creator Moderation & Violations
  const isModeration =
    ["APPEAL", "MODERATION", "PENALTY", "REPORT", "TICKET", "VIOLATION"].includes(refType || "") ||
    ["vi phạm", "xử phạt", "cảnh báo", "khiếu nại", "appeal", "penalty", "violation"].some((k) =>
      (item.title + " " + item.content).toLowerCase().includes(k),
    );

  if (isModeration) {
    return { name: "CreatorChannel" };
  }

  // 3. Type-based targets
  switch (item.type) {
    case "SUBSCRIPTION_PURCHASE_SUCCESS":
      return { name: "SubscriptionPlans" };
    case "COMBO_PURCHASE_SUCCESS":
    case "EPISODE_PURCHASE_SUCCESS":
      return { name: "HistoryScreen" };
    case "EPISODE_FORCE_HIDDEN":
    case "EPISODE_RESTORED":
      return { name: "CreatorChannel" };
    default:
      return null;
  }
}

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuth();
  const {
    unreadCount,
    refreshUnreadCount,
    decrementUnreadCount,
    clearUnreadCount,
  } = useNotifications();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(1);
  const [isLast, setIsLast] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false);
  const [clearingRead, setClearingRead] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationItem | null>(null);

  const unreadLabel = useMemo(() => {
    if (unreadCount <= 0) return "Không có thông báo mới";
    if (unreadCount > 99) return "99+ thông báo chưa đọc";
    return `${unreadCount} thông báo chưa đọc`;
  }, [unreadCount]);

  const hasReadNotifications = useMemo(
    () => notifications.some((item) => item.isRead),
    [notifications],
  );

  const updateItemRead = useCallback((notificationId: string, isRead: boolean) => {
    setNotifications((current) =>
      current.map((item) =>
        item.notificationId === notificationId ? { ...item, isRead } : item,
      ),
    );
  }, []);

  const fetchNotifications = useCallback(
    async (nextPage = 1, mode: "replace" | "append" = "replace") => {
      if (!isAuthenticated) {
        setNotifications([]);
        setPage(1);
        setIsLast(true);
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }

      if (mode === "replace") setLoading(true);
      if (mode === "append") setLoadingMore(true);
      setError(null);

      const result = await getMyNotifications({
        page: nextPage,
        pageSize: PAGE_SIZE,
      });

      if (result.success && result.data) {
        const data = result.data;
        setPage(data.pageNumber || nextPage);
        setIsLast(Boolean(data.isLast ?? nextPage >= (data.totalPages || 1)));
        setNotifications((current) => {
          if (mode === "replace") return data.content || [];

          const seen = new Set(current.map((item) => item.notificationId));
          const nextItems = (data.content || []).filter(
            (item) => !seen.has(item.notificationId),
          );
          return [...current, ...nextItems];
        });
        void refreshUnreadCount({ silent: true });
      } else {
        setError(result.message || "Không thể tải danh sách thông báo.");
      }

      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    },
    [isAuthenticated, refreshUnreadCount],
  );

  useEffect(() => {
    void fetchNotifications(1, "replace");
  }, [fetchNotifications]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchNotifications(1, "replace");
  }, [fetchNotifications]);

  const handleLoadMore = useCallback(() => {
    if (loading || refreshing || loadingMore || isLast) return;
    void fetchNotifications(page + 1, "append");
  }, [fetchNotifications, isLast, loading, loadingMore, page, refreshing]);

  const handleOpenNotification = useCallback(
    async (item: NotificationItem) => {
      if (!item.isRead) {
        updateItemRead(item.notificationId, true);
        decrementUnreadCount();

        const result = await markNotificationRead(item.notificationId);
        if (!result.success) {
          updateItemRead(item.notificationId, false);
          void refreshUnreadCount({ silent: true });
          Toast.show({
            type: "error",
            text1: "Không thể đánh dấu đã đọc",
            text2: result.message,
          });
          return;
        }
      }

      const target = getNavigationTarget(item);
      if (target) {
        navigation.navigate(target.name, target.params);
        return;
      }

      setSelectedNotification({ ...item, isRead: true });
    },
    [
      decrementUnreadCount,
      navigation,
      refreshUnreadCount,
      updateItemRead,
    ],
  );

  const handleMarkAllRead = useCallback(async () => {
    if (notifications.length === 0 || markingAll) return;
    setMarkingAll(true);
    const previous = notifications;

    setNotifications((current) =>
      current.map((item) => ({ ...item, isRead: true })),
    );
    clearUnreadCount();

    const result = await markAllNotificationsRead();
    setMarkingAll(false);

    if (result.success) {
      Toast.show({
        type: "success",
        text1: "Đã đánh dấu tất cả là đã đọc",
      });
      void fetchNotifications(1, "replace");
      return;
    }

    setNotifications(previous);
    void refreshUnreadCount({ silent: true });
    Toast.show({
      type: "error",
      text1: "Không thể đánh dấu tất cả",
      text2: result.message,
    });
  }, [
    clearUnreadCount,
    fetchNotifications,
    markingAll,
    notifications,
    refreshUnreadCount,
  ]);

  const handleClearReadNotifications = useCallback(async () => {
    if (!hasReadNotifications || clearingRead) return;
    setClearingRead(true);

    const result = await deleteReadNotifications();
    setClearingRead(false);
    setClearConfirmVisible(false);

    if (result.success) {
      const count = result.data ?? 0;
      setNotifications((current) => current.filter((item) => !item.isRead));
      Toast.show({
        type: "success",
        text1: "Xoá thông báo thành công",
        text2: `Đã xoá ${count} thông báo đã xem.`,
      });
      void refreshUnreadCount({ silent: true });
      return;
    }

    Toast.show({
      type: "error",
      text1: "Không thể xoá thông báo",
      text2: result.message || "Vui lòng thử lại sau.",
    });
  }, [clearingRead, hasReadNotifications, refreshUnreadCount]);

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={() => void handleOpenNotification(item)}
      className={`mx-4 mb-3 rounded-2xl border px-4 py-3.5 ${
        item.isRead
          ? "border-white/5 bg-[#171513]"
          : "border-[#D4AF37]/35 bg-[#211D14]"
      }`}
    >
      <View className="flex-row">
        <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-black/25">
          {getNotificationIcon(item.type)}
        </View>

        <View className="flex-1">
          <View className="flex-row items-start justify-between">
            <Text
              className="mr-3 flex-1 text-[15px] font-bold text-[#F4EFE6]"
              numberOfLines={2}
            >
              {item.title || "Thông báo"}
            </Text>
            {!item.isRead && (
              <View className="mt-1 h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />
            )}
          </View>

          <Text
            className="mt-1.5 text-[13px] leading-5 text-[#A19E95]"
            numberOfLines={3}
          >
            {item.content || "Bạn có một thông báo mới."}
          </Text>

          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-[11px] font-semibold text-[#D4AF37]">
              {getTypeLabel(item.type)}
            </Text>
            <Text className="text-[11px] text-zinc-500">
              {formatDateTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View className="items-center px-8 py-20">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37]/10">
          <Ionicons name="notifications-outline" size={30} color="#D4AF37" />
        </View>
        <Text className="text-center text-lg font-bold text-[#F4EFE6]">
          Chưa có thông báo
        </Text>
        <Text className="mt-2 text-center text-sm leading-6 text-[#A19E95]">
          Khi hệ thống có cập nhật mới, thông báo sẽ xuất hiện tại đây.
        </Text>
      </View>
    );
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#141210]">
        <StatusBar barStyle="light-content" backgroundColor="#141210" />
        <View className="h-[56px] flex-row items-center justify-between border-b border-white/5 px-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="h-10 w-10 items-center justify-center rounded-full bg-[#252830]"
          >
            <Feather name="arrow-left" size={22} color="#E5E0D8" />
          </TouchableOpacity>
          <Text className="text-[18px] font-bold text-[#E5E0D8]">
            Thông báo
          </Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="lock-closed-outline" size={42} color="#D4AF37" />
          <Text className="mt-4 text-center text-lg font-bold text-white">
            Vui lòng đăng nhập
          </Text>
          <Text className="mt-2 text-center text-sm leading-6 text-[#A19E95]">
            Bạn cần đăng nhập để xem thông báo của tài khoản.
          </Text>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => navigation.navigate("LoginScreen")}
            className="mt-6 h-11 items-center justify-center rounded-xl bg-[#D4AF37] px-6"
          >
            <Text className="font-black text-[#141210]">Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#141210]">
      <StatusBar barStyle="light-content" backgroundColor="#141210" />

      <View className="h-[56px] flex-row items-center justify-between border-b border-white/5 px-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#252830]"
          activeOpacity={0.75}
        >
          <Feather name="arrow-left" size={22} color="#E5E0D8" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-[18px] font-bold text-[#E5E0D8]">
            Thông báo
          </Text>
          <Text className="mt-0.5 text-[11px] text-[#A19E95]">
            {unreadLabel}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {/* Nút Xoá thông báo đã xem */}
          <TouchableOpacity
            onPress={() => setClearConfirmVisible(true)}
            disabled={!hasReadNotifications || clearingRead}
            activeOpacity={0.75}
            className="h-10 w-10 items-center justify-center rounded-full bg-[#252830] disabled:opacity-30"
          >
            {clearingRead ? (
              <ActivityIndicator size="small" color="#FB7185" />
            ) : (
              <Feather name="trash-2" size={17} color="#FB7185" />
            )}
          </TouchableOpacity>

          {/* Nút Đánh dấu tất cả đã đọc */}
          <TouchableOpacity
            onPress={() => void handleMarkAllRead()}
            disabled={markingAll || notifications.length === 0 || unreadCount === 0}
            activeOpacity={0.75}
            className="h-10 w-10 items-center justify-center rounded-full bg-[#252830] disabled:opacity-30"
          >
            {markingAll ? (
              <ActivityIndicator size="small" color="#D4AF37" />
            ) : (
              <Feather name="check-circle" size={18} color="#D4AF37" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading && notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text className="mt-3 text-sm text-[#A19E95]">
            Đang tải thông báo...
          </Text>
        </View>
      ) : error && notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Feather name="alert-circle" size={38} color="#FB7185" />
          <Text className="mt-4 text-center text-lg font-bold text-white">
            Không thể tải thông báo
          </Text>
          <Text className="mt-2 text-center text-sm leading-6 text-[#A19E95]">
            {error}
          </Text>
          <TouchableOpacity
            activeOpacity={0.82}
            onPress={() => void fetchNotifications(1, "replace")}
            className="mt-6 h-11 items-center justify-center rounded-xl bg-[#D4AF37] px-6"
          >
            <Text className="font-black text-[#141210]">Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.notificationId}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
          renderItem={renderItem}
          contentContainerStyle={{ paddingTop: 14, paddingBottom: 28 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#D4AF37"
              colors={["#D4AF37"]}
            />
          }
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-5">
                <ActivityIndicator size="small" color="#D4AF37" />
              </View>
            ) : null
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.25}
        />
      )}

      {/* Modal chi tiết thông báo */}
      <Modal
        transparent
        animationType="fade"
        visible={!!selectedNotification}
        onRequestClose={() => setSelectedNotification(null)}
      >
        <View className="flex-1 justify-center bg-black/80 px-5">
          <View className="overflow-hidden rounded-2xl border border-[#D4AF37]/25 bg-[#1A1918]">
            <View className="flex-row items-center justify-between border-b border-white/10 px-5 py-4">
              <View className="flex-1 pr-3">
                <Text className="text-xs font-bold uppercase text-[#D4AF37]">
                  {getTypeLabel(selectedNotification?.type)}
                </Text>
                <Text className="mt-1 text-lg font-black text-white">
                  {selectedNotification?.title || "Thông báo"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedNotification(null)}
                className="h-9 w-9 items-center justify-center rounded-full bg-[#252830]"
              >
                <Ionicons name="close" size={20} color="#E5E0D8" />
              </TouchableOpacity>
            </View>

            <View className="px-5 py-4">
              <Text className="text-sm leading-6 text-[#D8D2C8]">
                {selectedNotification?.content || "Bạn có một thông báo mới."}
              </Text>
              <Text className="mt-4 text-xs text-zinc-500">
                {formatDateTime(selectedNotification?.createdAt)}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => setSelectedNotification(null)}
              className="mx-5 mb-5 h-11 items-center justify-center rounded-xl bg-[#D4AF37]"
            >
              <Text className="font-black text-[#141210]">Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal xác nhận xoá thông báo đã xem */}
      <Modal
        transparent
        animationType="fade"
        visible={clearConfirmVisible}
        onRequestClose={() => setClearConfirmVisible(false)}
      >
        <View className="flex-1 justify-center bg-black/80 px-6">
          <View className="overflow-hidden rounded-3xl border border-rose-500/25 bg-[#1C1818] p-6 shadow-2xl">
            <View className="mb-4 h-14 w-14 items-center justify-center self-center rounded-full bg-rose-500/10 border border-rose-500/20">
              <Feather name="trash-2" size={26} color="#FB7185" />
            </View>

            <Text className="text-center text-lg font-black text-white">
              Xoá thông báo đã xem
            </Text>
            <Text className="mt-2 text-center text-sm leading-6 text-[#A19E95]">
              Bạn có chắc chắn muốn xoá vĩnh viễn tất cả thông báo đã đọc không? Hành động này không thể hoàn tác.
            </Text>

            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setClearConfirmVisible(false)}
                className="flex-1 h-12 items-center justify-center rounded-xl bg-zinc-800 border border-white/10"
              >
                <Text className="font-bold text-zinc-300">Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => void handleClearReadNotifications()}
                disabled={clearingRead}
                className="flex-1 h-12 items-center justify-center rounded-xl bg-rose-600 shadow-lg shadow-rose-900/40"
              >
                {clearingRead ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="font-black text-white">Xoá ngay</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
