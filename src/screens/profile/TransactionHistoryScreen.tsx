import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";
import { useReward } from "@/context/RewardContext";
import { getCoinTransactions, getWallet } from "@/services/rewardService";
import { getOrderHistory, OrderHistoryItemDto } from "@/services/order";
import {
  getSubscriptionHistory,
  AccountSubscription,
} from "@/services/subscription";
import type { CoinTransaction, WalletData } from "@/types/reward";

type MainSection = "COIN" | "CONTENT" | "PREMIUM";
type CoinFilterTab = "ALL" | "EARNED" | "SPENT";

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

function getRemainingDays(endTime: string) {
  const endMs = new Date(endTime).getTime();
  return Math.max(0, Math.ceil((endMs - Date.now()) / 86_400_000));
}

export default function TransactionHistoryScreen() {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuth();
  const { refreshRewardData } = useReward();

  // Active Main Section (Coin | Mua nội dung | Gói Premium)
  const [activeSection, setActiveSection] = useState<MainSection>("COIN");

  // 1. Coin Data
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [coinFilter, setCoinFilter] = useState<CoinFilterTab>("ALL");
  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>([]);
  const [coinTotalElements, setCoinTotalElements] = useState(0);
  const [coinLoading, setCoinLoading] = useState(true);

  // 2. Content Orders Data (Episode & Combo)
  const [orders, setOrders] = useState<OrderHistoryItemDto[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // 3. Premium Subscriptions Data
  const [subscriptions, setSubscriptions] = useState<AccountSubscription[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  // Fetch Wallet Info
  const fetchWallet = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setWalletLoading(true);
      const data = await getWallet();
      setWallet(data);
    } catch {
      // ignore
    } finally {
      setWalletLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch Coin Transactions
  const fetchCoinTx = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setCoinLoading(true);
      const res = await getCoinTransactions(1, 50);
      const items = res?.content || [];
      setCoinTransactions(items);
      setCoinTotalElements(res?.totalElements ?? items.length);
    } catch (error) {
      console.log("Error fetching coin transactions:", error);
    } finally {
      setCoinLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch Content Orders
  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setOrdersLoading(true);
      const res = await getOrderHistory(1, 50);
      if (res.success && res.data) {
        setOrders(res.data.content || []);
      }
    } catch (error) {
      console.log("Error fetching order history:", error);
    } finally {
      setOrdersLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch Subscriptions
  const fetchSubs = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setSubsLoading(true);
      const res = await getSubscriptionHistory(1, 50);
      if (res.success && res.data) {
        setSubscriptions(res.data.content || []);
      }
    } catch (error) {
      console.log("Error fetching subscription history:", error);
    } finally {
      setSubsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWallet();
      fetchCoinTx();
      fetchOrders();
      fetchSubs();
    }
  }, [isAuthenticated, fetchWallet, fetchCoinTx, fetchOrders, fetchSubs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    refreshRewardData({ silent: true });
    await Promise.all([fetchWallet(), fetchCoinTx(), fetchOrders(), fetchSubs()]);
    setRefreshing(false);
  };

  const filteredCoinTransactions = coinTransactions.filter((t) => {
    const isCredit = isCreditTransaction(t);
    if (coinFilter === "ALL") return true;
    if (coinFilter === "EARNED") return isCredit;
    if (coinFilter === "SPENT") return !isCredit;
    return true;
  });

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#101012]">
      <StatusBar barStyle="light-content" backgroundColor="#101012" />

      {/* HEADER */}
      <View className="px-4 py-3 border-b border-white/10 bg-[#121214]">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/[0.06] border border-white/10"
            activeOpacity={0.75}
          >
            <Feather name="arrow-left" size={20} color="#E5E0D8" />
          </TouchableOpacity>

          <View className="flex-1 items-center px-2">
            <Text className="text-white text-base font-bold tracking-wide">
              Lịch Sử Giao Dịch
            </Text>
            <Text className="text-zinc-400 text-[11px] font-medium mt-0.5">
              Toàn bộ Coin, Đơn hàng & Gói VIP
            </Text>
          </View>

          <View className="w-10" />
        </View>
      </View>

      {/* 3 MAIN SECTION TABS (COIN, MUA NỘI DUNG, GÓI PREMIUM) */}
      <View className="flex-row px-4 py-2.5 bg-[#121214] border-b border-white/10">
        {[
          { key: "COIN", label: "Lịch Sử Coin", icon: "coins" },
          { key: "CONTENT", label: "Mua Nội Dung", icon: "film" },
          { key: "PREMIUM", label: "Gói Premium", icon: "crown" },
        ].map((sec) => {
          const isSelected = activeSection === sec.key;
          return (
            <TouchableOpacity
              key={sec.key}
              onPress={() => setActiveSection(sec.key as MainSection)}
              className={`flex-1 py-2 rounded-xl flex-row items-center justify-center border mx-1 ${
                isSelected
                  ? "bg-[#D4AF37] border-[#D4AF37]"
                  : "bg-white/[0.04] border-white/5"
              }`}
              activeOpacity={0.8}
            >
              <FontAwesome5
                name={sec.icon}
                size={11}
                color={isSelected ? "#141210" : "#A1A1AA"}
              />
              <Text
                className={`text-xs font-black ml-1.5 ${
                  isSelected ? "text-[#141210]" : "text-zinc-400"
                }`}
              >
                {sec.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!isAuthenticated ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 items-center justify-center mb-4">
            <FontAwesome5 name="receipt" size={26} color="#D4AF37" />
          </View>
          <Text className="text-white font-black text-lg text-center">
            Bạn chưa đăng nhập
          </Text>
          <Text className="text-zinc-400 text-xs text-center mt-2 leading-5">
            Đăng nhập tài khoản TaleX để theo dõi toàn bộ lịch sử giao dịch và mua hàng.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("LoginScreen")}
            className="mt-6 bg-[#D4AF37] px-7 py-3 rounded-xl shadow-lg active:scale-98"
          >
            <Text className="text-[#141210] font-black text-xs uppercase tracking-wide">
              Đăng nhập ngay
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#D4AF37"
            />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* ================= 1. TAB LỊCH SỬ COIN ================= */}
          {activeSection === "COIN" && (
            <View>
              {/* Wallet Summary Banner (Hiện có, Đã nhận, Đã dùng) */}
              <View className="p-4 bg-[#121214] border-b border-white/10">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2.5 py-1 rounded-full flex-row items-center">
                    <FontAwesome5 name="wallet" size={10} color="#D4AF37" />
                    <Text className="text-[#D4AF37] text-[10px] font-black uppercase tracking-wider ml-1.5">
                      TaleX Wallet
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("CoinCenter")}
                    className="bg-[#D4AF37] px-3 py-1 rounded-xl flex-row items-center shadow-md active:scale-98"
                  >
                    <FontAwesome5 name="gift" size={10} color="#141210" />
                    <Text className="text-[#141210] font-black text-[11px] ml-1.5">
                      Nhận Coin
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Hiện có */}
                <View className="bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-2xl p-3.5 mb-2.5 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/30 items-center justify-center mr-3">
                      <FontAwesome5 name="coins" size={16} color="#D4AF37" />
                    </View>
                    <View>
                      <Text className="text-[#F5D46E]/80 text-[11px] font-bold">
                        Hiện có
                      </Text>
                      <Text className="text-white text-xl font-black mt-0.5">
                        {walletLoading ? "..." : `${formatCoin(wallet?.balance)} Coin`}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Đã nhận & Đã dùng */}
                <View className="flex-row gap-2.5">
                  <View className="flex-1 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-2xl p-3">
                    <View className="flex-row items-center mb-1">
                      <Feather name="arrow-down-left" size={14} color="#10B981" />
                      <Text className="text-emerald-200/70 text-[11px] font-bold ml-1">
                        Đã nhận
                      </Text>
                    </View>
                    <Text className="text-emerald-300 text-sm font-bold">
                      {walletLoading ? "..." : `+${formatCoin(wallet?.totalEarned)} Coin`}
                    </Text>
                  </View>

                  <View className="flex-1 bg-rose-500/[0.08] border border-rose-500/20 rounded-2xl p-3">
                    <View className="flex-row items-center mb-1">
                      <Feather name="arrow-up-right" size={14} color="#F43F5E" />
                      <Text className="text-rose-200/70 text-[11px] font-bold ml-1">
                        Đã dùng
                      </Text>
                    </View>
                    <Text className="text-rose-300 text-sm font-bold">
                      {walletLoading ? "..." : `-${formatCoin(wallet?.totalSpent)} Coin`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Sub Filter & Danh sách */}
              <View className="px-4 pt-3 pb-2 flex-row items-center justify-between border-b border-white/5">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name="receipt-text-outline"
                    size={18}
                    color="#D4AF37"
                  />
                  <Text className="text-white font-bold text-[13px] ml-1.5">
                    Lịch sử thu chi ({coinTotalElements})
                  </Text>
                </View>

                <View className="flex-row items-center">
                  {[
                    { key: "ALL", label: "Tất cả" },
                    { key: "EARNED", label: "+ Nhận" },
                    { key: "SPENT", label: "- Dùng" },
                  ].map((tab) => {
                    const isSelected = coinFilter === tab.key;
                    return (
                      <TouchableOpacity
                        key={tab.key}
                        onPress={() => setCoinFilter(tab.key as CoinFilterTab)}
                        className={`px-2.5 py-1 rounded-lg ml-1.5 border ${
                          isSelected
                            ? "bg-[#D4AF37] border-[#D4AF37]"
                            : "bg-white/[0.04] border-white/10"
                        }`}
                        activeOpacity={0.8}
                      >
                        <Text
                          className={`text-[11px] font-bold ${
                            isSelected ? "text-[#141210]" : "text-zinc-400"
                          }`}
                        >
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Coin List Items */}
              <View className="p-4">
                {coinLoading ? (
                  <ActivityIndicator size="large" color="#D4AF37" className="py-8" />
                ) : filteredCoinTransactions.length === 0 ? (
                  <View className="py-12 items-center">
                    <FontAwesome5 name="receipt" size={24} color="#71717A" />
                    <Text className="text-white font-bold text-sm mt-3">
                      Chưa có giao dịch coin
                    </Text>
                  </View>
                ) : (
                  filteredCoinTransactions.map((item, idx) => {
                    const isCredit = isCreditTransaction(item);

                    return (
                      <TouchableOpacity
                        key={item.transactionId || `coin-${idx}`}
                        onPress={() =>
                          navigation.navigate("TransactionDetailScreen", {
                            type: "COIN",
                            data: item,
                          })
                        }
                        activeOpacity={0.8}
                        className="bg-[#18181C]/90 p-3.5 rounded-2xl mb-2.5 border border-white/10 shadow-sm active:border-[#D4AF37]/40"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1 mr-3">
                            <View
                              className={`w-10 h-10 rounded-xl items-center justify-center mr-3 border ${
                                isCredit
                                  ? "bg-emerald-500/10 border-emerald-500/25"
                                  : "bg-rose-500/10 border-rose-500/25"
                              }`}
                            >
                              <Feather
                                name={isCredit ? "arrow-down-left" : "arrow-up-right"}
                                size={18}
                                color={isCredit ? "#10B981" : "#F43F5E"}
                              />
                            </View>

                            <View className="flex-1">
                              <Text
                                className="text-white font-bold text-[13.5px] leading-snug"
                                numberOfLines={1}
                              >
                                {item.description || item.referenceType || item.transactionType}
                              </Text>
                              <View className="flex-row items-center mt-1">
                                <Feather name="clock" size={11} color="#71717A" />
                                <Text className="text-zinc-500 text-[10.5px] font-medium ml-1">
                                  {formatDate(item.changedAt)}
                                </Text>
                              </View>
                            </View>
                          </View>

                          <View className="items-end">
                            <Text
                              className={`font-black text-sm tabular-nums ${
                                isCredit ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {isCredit ? "+" : "-"}
                              {formatCoin(item.amount)}
                            </Text>
                            <Feather name="chevron-right" size={14} color="#71717A" style={{ marginTop: 2 }} />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>
          )}

          {/* ================= 2. TAB MUA NỘI DUNG (EPISODE & COMBO) ================= */}
          {activeSection === "CONTENT" && (
            <View className="p-4">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-white font-bold text-sm">
                  Lịch sử mua nội dung ({orders.length})
                </Text>
                <Text className="text-zinc-500 text-[11px]">
                  Chạm để xem chi tiết
                </Text>
              </View>

              {ordersLoading ? (
                <ActivityIndicator size="large" color="#D4AF37" className="py-8" />
              ) : orders.length === 0 ? (
                <View className="py-16 items-center">
                  <Feather name="film" size={32} color="#71717A" />
                  <Text className="text-white font-bold text-base mt-3">
                    Chưa có đơn mua nội dung
                  </Text>
                </View>
              ) : (
                orders.map((order, idx) => {
                  const isCompleted = order.status === "COMPLETED";

                  return (
                    <TouchableOpacity
                      key={order.orderId || `order-${idx}`}
                      onPress={() =>
                        navigation.navigate("TransactionDetailScreen", {
                          type: "CONTENT",
                          data: order,
                        })
                      }
                      activeOpacity={0.8}
                      className="bg-[#18181C] p-4 rounded-2xl mb-3 border border-white/10 active:border-[#D4AF37]/40 shadow-sm"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center">
                          <View className="bg-[#D4AF37]/15 px-2.5 py-0.5 rounded mr-2 border border-[#D4AF37]/30">
                            <Text className="text-[#D4AF37] text-[10px] font-black uppercase">
                              {order.itemType === "COMBO" ? "Combo Trọn Bộ" : "Tập Phim / Truyện"}
                            </Text>
                          </View>
                          <Text className="text-zinc-400 text-xs font-semibold">
                            {order.paymentMethod === "COIN" ? "🪙 Coin" : order.paymentMethod || "Tiền mặt"}
                          </Text>
                        </View>

                        <Text
                          className={`text-[11px] font-bold ${
                            isCompleted ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {isCompleted ? "Đã thanh toán" : order.status}
                        </Text>
                      </View>

                      <Text className="text-white font-black text-sm mb-1 leading-snug">
                        {order.itemTitle || "Mở khóa nội dung TaleX"}
                      </Text>

                      <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-white/5">
                        <Text className="text-zinc-500 text-[11px]">
                          {formatDate(order.createdAt)}
                        </Text>
                        <View className="flex-row items-center">
                          <Text className="text-white font-black text-sm mr-1">
                            {order.paymentMethod === "COIN"
                              ? `${formatCoin(order.totalAmount)} Coin`
                              : formatCurrency(order.totalAmount)}
                          </Text>
                          <Feather name="chevron-right" size={14} color="#71717A" />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {/* ================= 3. TAB GÓI PREMIUM (SUBSCRIPTIONS) ================= */}
          {activeSection === "PREMIUM" && (
            <View className="p-4">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-white font-bold text-sm">
                  Lịch sử đăng ký ({subscriptions.length})
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("SubscriptionPlans")}
                  className="bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-3 py-1 rounded-xl"
                >
                  <Text className="text-[#D4AF37] text-xs font-bold">
                    + Gia hạn gói
                  </Text>
                </TouchableOpacity>
              </View>

              {subsLoading ? (
                <ActivityIndicator size="large" color="#D4AF37" className="py-8" />
              ) : subscriptions.length === 0 ? (
                <View className="py-16 items-center">
                  <FontAwesome5 name="crown" size={32} color="#D4AF37" />
                  <Text className="text-white font-bold text-base mt-3">
                    Chưa đăng ký gói VIP nào
                  </Text>
                </View>
              ) : (
                subscriptions.map((sub, idx) => {
                  const isActive =
                    !sub.isCancelled && new Date(sub.endTime).getTime() > Date.now();
                  const remainingDays = getRemainingDays(sub.endTime);

                  return (
                    <TouchableOpacity
                      key={sub.accountSubscriptionId || `sub-${idx}`}
                      onPress={() =>
                        navigation.navigate("TransactionDetailScreen", {
                          type: "PREMIUM",
                          data: sub,
                        })
                      }
                      activeOpacity={0.8}
                      className="bg-[#18181C] p-4 rounded-2xl mb-3 border border-white/10 active:border-[#D4AF37]/40 shadow-sm"
                    >
                      <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center">
                          <FontAwesome5 name="crown" size={14} color="#D4AF37" />
                          <Text className="text-white font-black text-sm ml-2">
                            TaleX Premium VIP Pass
                          </Text>
                        </View>

                        <Text
                          className={`text-[11px] font-bold ${
                            isActive ? "text-emerald-400" : "text-zinc-500"
                          }`}
                        >
                          {isActive ? `Đang chạy (${remainingDays} ngày)` : "Đã kết thúc"}
                        </Text>
                      </View>

                      <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-white/5">
                        <Text className="text-zinc-400 text-xs">
                          Hạn: {formatDate(sub.startTime)} ➔ {formatDate(sub.endTime)}
                        </Text>
                        <Feather name="chevron-right" size={14} color="#71717A" />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
