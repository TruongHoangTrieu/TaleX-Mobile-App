import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { CoinTransaction } from "@/types/reward";
import type { OrderHistoryItemDto } from "@/services/order";
import type { AccountSubscription } from "@/services/subscription";

const CREDIT_TYPES = new Set(["CREDIT", "EARN", "EARNED", "REWARD", "CHECK_IN"]);
const DEBIT_TYPES = new Set(["DEBIT", "SPEND", "SPENT", "PAYMENT", "UNLOCK", "COMBO"]);

function isCreditTransaction(transaction: CoinTransaction): boolean {
  const transactionType = String(transaction.transactionType || "").toUpperCase();
  if (CREDIT_TYPES.has(transactionType)) return true;
  if (DEBIT_TYPES.has(transactionType)) return false;
  return transaction.amount >= 0;
}

function formatDate(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCoin(amount?: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.abs(amount ?? 0));
}

function formatCurrency(amount?: number) {
  return `${new Intl.NumberFormat("vi-VN").format(amount ?? 0)}đ`;
}

function getDurationDays(startTime: string, endTime: string) {
  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();
  return Math.max(0, Math.ceil((endMs - startMs) / 86_400_000));
}

function getRemainingDays(endTime: string) {
  const endMs = new Date(endTime).getTime();
  return Math.max(0, Math.ceil((endMs - Date.now()) / 86_400_000));
}

function getSubscriptionProgress(startTime: string, endTime: string) {
  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const totalMs = endMs - startMs;
  if (totalMs <= 0) return 100;
  return Math.min(100, Math.max(0, ((Date.now() - startMs) / totalMs) * 100));
}

export default function TransactionDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { type, data } = route.params || {};

  if (!data) {
    return (
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#0F0F12] items-center justify-center p-6">
        <Text className="text-white font-bold text-base">Không tìm thấy thông tin giao dịch</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-4 bg-[#D4AF37] px-6 py-2.5 rounded-xl"
        >
          <Text className="text-[#141210] font-black text-xs">Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // 1. COIN TRANSACTION DETAIL
  if (type === "COIN") {
    const coinTx = data as CoinTransaction;
    const isCredit = isCreditTransaction(coinTx);

    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-[#0F0F12]">
        <StatusBar barStyle="light-content" backgroundColor="#0F0F12" />

        {/* HEADER */}
        <View className="h-14 px-4 flex-row items-center justify-between border-b border-white/10 bg-[#121216]">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/[0.06] border border-white/10"
            activeOpacity={0.75}
          >
            <Feather name="arrow-left" size={20} color="#E5E0D8" />
          </TouchableOpacity>

          <Text className="text-white text-base font-bold tracking-wide">
            Chi Tiết Giao Dịch
          </Text>

          <View className="w-10" />
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 80,
            flexGrow: 1,
            justifyContent: "space-between",
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Full Digital Receipt Card */}
          <View className="bg-[#16161B] border border-[#D4AF37]/30 rounded-3xl p-6 shadow-2xl">
            {/* Top Status Icon & Amount */}
            <View className="items-center pb-5 border-b border-white/10">
              <View
                className={`w-16 h-16 rounded-2xl items-center justify-center mb-3 border shadow-md ${
                  isCredit
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                    : "bg-rose-500/15 border-rose-500/30 text-rose-400"
                }`}
              >
                <Feather
                  name={isCredit ? "arrow-down-left" : "arrow-up-right"}
                  size={30}
                  color={isCredit ? "#10B981" : "#F43F5E"}
                />
              </View>

              <Text
                className={`text-3xl font-black tabular-nums tracking-tight ${
                  isCredit ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {isCredit ? "+" : "-"}
                {formatCoin(coinTx.amount)} Coin
              </Text>

              <Text className="text-white font-bold text-base mt-2 text-center leading-snug">
                {coinTx.description || coinTx.transactionType}
              </Text>

              <View className="bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-3 py-1 rounded-full mt-3 flex-row items-center">
                <Feather name="clock" size={11} color="#D4AF37" />
                <Text className="text-[#D4AF37] text-xs font-semibold ml-1.5">
                  {formatDate(coinTx.changedAt)}
                </Text>
              </View>
            </View>

            {/* Info Key-Value Rows */}
            <View className="pt-5 space-y-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-zinc-400 text-xs font-medium">Loại giao dịch</Text>
                <Text className="text-white font-bold text-xs">{coinTx.transactionType}</Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-zinc-400 text-xs font-medium">Nguồn phát sinh</Text>
                <Text className="text-white font-bold text-xs">{coinTx.referenceType || "Hệ thống TaleX"}</Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-zinc-400 text-xs font-medium">Số dư trước</Text>
                <Text className="text-zinc-300 font-semibold text-xs">{formatCoin(coinTx.balanceBefore)} Coin</Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-zinc-400 text-xs font-medium">Số dư sau biến động</Text>
                <Text className="text-[#D4AF37] font-black text-sm">{formatCoin(coinTx.balanceAfter)} Coin</Text>
              </View>

              <View className="pt-3 border-t border-white/5">
                <Text className="text-zinc-500 text-[10.5px] font-bold uppercase tracking-wider mb-1">
                  Mã giao dịch
                </Text>
                <View className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <Text className="text-zinc-300 font-mono text-[11px] select-all" numberOfLines={1}>
                    {coinTx.transactionId}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Back Button */}
          <View className="mt-6">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-full bg-[#D4AF37] h-13 rounded-2xl items-center justify-center active:scale-98 shadow-xl shadow-yellow-500/10"
              activeOpacity={0.85}
            >
              <Text className="text-[#141210] font-black text-sm uppercase tracking-wider">
                Quay Lại
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 2. CONTENT ORDER DETAIL
  if (type === "CONTENT") {
    const order = data as OrderHistoryItemDto;
    const isCompleted = order.status === "COMPLETED";

    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-[#0F0F12]">
        <StatusBar barStyle="light-content" backgroundColor="#0F0F12" />

        {/* HEADER */}
        <View className="h-14 px-4 flex-row items-center justify-between border-b border-white/10 bg-[#121216]">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/[0.06] border border-white/10"
            activeOpacity={0.75}
          >
            <Feather name="arrow-left" size={20} color="#E5E0D8" />
          </TouchableOpacity>

          <Text className="text-white text-base font-bold tracking-wide">
            Chi Tiết Đơn Hàng
          </Text>

          <View className="w-10" />
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 80,
            flexGrow: 1,
            justifyContent: "space-between",
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Full Digital Receipt Card */}
          <View className="bg-[#16161B] border border-[#D4AF37]/30 rounded-3xl p-6 shadow-2xl">
            {/* Top Icon & Title */}
            <View className="items-center pb-5 border-b border-white/10">
              <View className="w-16 h-16 rounded-2xl bg-sky-500/15 border border-sky-500/30 items-center justify-center mb-3">
                <Feather name="shopping-bag" size={28} color="#38BDF8" />
              </View>

              <Text className="text-white font-black text-xl text-center leading-snug">
                {order.itemTitle || "Mở khóa nội dung TaleX"}
              </Text>

              <Text className="text-[#D4AF37] font-black text-2xl mt-2 tabular-nums">
                {order.paymentMethod === "COIN"
                  ? `${formatCoin(order.totalAmount)} Coin`
                  : formatCurrency(order.totalAmount)}
              </Text>

              <View className="mt-3 flex-row items-center gap-2">
                <View
                  className={`px-3 py-1 rounded-full border ${
                    isCompleted
                      ? "bg-emerald-500/15 border-emerald-500/30"
                      : "bg-amber-500/15 border-amber-500/30"
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isCompleted ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {isCompleted ? "Đã thanh toán" : order.status}
                  </Text>
                </View>

                <View className="bg-white/10 px-3 py-1 rounded-full border border-white/5">
                  <Text className="text-zinc-300 text-xs font-semibold">
                    {order.itemType === "COMBO" ? "Combo Trọn Bộ" : "Tập Phim / Truyện"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Key-Value Rows */}
            <View className="pt-5 space-y-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-zinc-400 text-xs font-medium">Phương thức thanh toán</Text>
                <Text className="text-white font-bold text-xs">
                  {order.paymentMethod === "COIN" ? "🪙 Ví Coin TaleX" : order.paymentMethod || "Tiền mặt"}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-zinc-400 text-xs font-medium">Thời gian đặt mua</Text>
                <Text className="text-white font-semibold text-xs">{formatDate(order.createdAt)}</Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-zinc-400 text-xs font-medium">Loại sản phẩm</Text>
                <Text className="text-white font-bold text-xs">{order.itemType}</Text>
              </View>

              <View className="pt-3 border-t border-white/5">
                <Text className="text-zinc-500 text-[10.5px] font-bold uppercase tracking-wider mb-1">
                  Mã đơn hàng
                </Text>
                <View className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <Text className="text-zinc-300 font-mono text-[11px] select-all" numberOfLines={1}>
                    {order.orderId}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Back Button */}
          <View className="mt-6">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-full bg-[#D4AF37] h-13 rounded-2xl items-center justify-center active:scale-98 shadow-xl shadow-yellow-500/10"
              activeOpacity={0.85}
            >
              <Text className="text-[#141210] font-black text-sm uppercase tracking-wider">
                Quay Lại
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 3. PREMIUM SUBSCRIPTION DETAIL
  if (type === "PREMIUM") {
    const sub = data as AccountSubscription;
    const isActive = !sub.isCancelled && new Date(sub.endTime).getTime() > Date.now();
    const totalDays = getDurationDays(sub.startTime, sub.endTime);
    const remainingDays = getRemainingDays(sub.endTime);
    const progress = getSubscriptionProgress(sub.startTime, sub.endTime);

    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-[#0F0F12]">
        <StatusBar barStyle="light-content" backgroundColor="#0F0F12" />

        {/* HEADER */}
        <View className="h-14 px-4 flex-row items-center justify-between border-b border-white/10 bg-[#121216]">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/[0.06] border border-white/10"
            activeOpacity={0.75}
          >
            <Feather name="arrow-left" size={20} color="#E5E0D8" />
          </TouchableOpacity>

          <Text className="text-white text-base font-bold tracking-wide">
            Chi Tiết Gói VIP
          </Text>

          <View className="w-10" />
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 80,
            flexGrow: 1,
            justifyContent: "space-between",
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Full Digital Receipt Card */}
          <View className="bg-[#16161B] border border-[#D4AF37]/30 rounded-3xl p-6 shadow-2xl">
            {/* Top Icon & Title */}
            <View className="items-center pb-5 border-b border-white/10">
              <View className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 items-center justify-center mb-3">
                <FontAwesome5 name="crown" size={28} color="#D4AF37" />
              </View>

              <Text className="text-white font-black text-2xl text-center">
                TaleX Premium VIP Pass
              </Text>

              <View
                className={`mt-3 px-3.5 py-1 rounded-full border ${
                  isActive
                    ? "bg-emerald-500/15 border-emerald-500/30"
                    : "bg-zinc-800 border-white/5"
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isActive ? "text-emerald-400" : "text-zinc-500"
                  }`}
                >
                  {isActive ? `Đang hoạt động (Còn ${remainingDays} ngày)` : "Đã hết hạn"}
                </Text>
              </View>

              {isActive && (
                <View className="w-full mt-4 bg-black/40 p-3.5 rounded-2xl border border-white/5">
                  <View className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mb-1.5">
                    <View
                      className="h-full bg-[#D4AF37] rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-zinc-500 text-[11px]">Tổng: {totalDays} ngày</Text>
                    <Text className="text-[#D4AF37] text-[11px] font-bold">Còn: {remainingDays} ngày</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Key-Value Rows */}
            <View className="pt-5 space-y-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-zinc-400 text-xs font-medium">Ngày kích hoạt</Text>
                <Text className="text-white font-bold text-xs">{formatDate(sub.startTime)}</Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-zinc-400 text-xs font-medium">Ngày hết hạn</Text>
                <Text className="text-[#D4AF37] font-black text-sm">{formatDate(sub.endTime)}</Text>
              </View>

              <View className="pt-3 border-t border-white/5">
                <Text className="text-zinc-400 text-xs font-medium mb-2.5">Quyền lợi thành viên</Text>
                <View className="flex-row flex-wrap gap-2">
                  {sub.isAdBlocked && (
                    <View className="bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                      <Text className="text-emerald-300 text-xs font-semibold">🛡️ Không quảng cáo</Text>
                    </View>
                  )}
                  {sub.isMovieUnlocked && (
                    <View className="bg-sky-500/10 px-3 py-1.5 rounded-xl border border-sky-500/20">
                      <Text className="text-sky-300 text-xs font-semibold">🎬 Mở khóa phim VIP</Text>
                    </View>
                  )}
                  {sub.isStoryUnlocked && (
                    <View className="bg-purple-500/10 px-3 py-1.5 rounded-xl border border-purple-500/20">
                      <Text className="text-purple-300 text-xs font-semibold">📖 Mở khóa truyện VIP</Text>
                    </View>
                  )}
                </View>
              </View>

              <View className="pt-3 border-t border-white/5">
                <Text className="text-zinc-500 text-[10.5px] font-bold uppercase tracking-wider mb-1">
                  Mã đăng ký gói
                </Text>
                <View className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <Text className="text-zinc-300 font-mono text-[11px] select-all" numberOfLines={1}>
                    {sub.accountSubscriptionId}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Action Buttons */}
          <View className="mt-6 gap-2.5">
            <TouchableOpacity
              onPress={() => navigation.navigate("SubscriptionPlans")}
              className="w-full bg-[#D4AF37] h-13 rounded-2xl items-center justify-center active:scale-98 shadow-xl shadow-yellow-500/10"
              activeOpacity={0.85}
            >
              <Text className="text-[#141210] font-black text-sm uppercase tracking-wider">
                Gia Hạn Gói VIP
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="w-full bg-white/[0.06] h-13 rounded-2xl items-center justify-center border border-white/10 active:bg-white/10"
              activeOpacity={0.85}
            >
              <Text className="text-zinc-300 font-bold text-xs uppercase tracking-wider">
                Quay Lại Lịch Sử
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}
