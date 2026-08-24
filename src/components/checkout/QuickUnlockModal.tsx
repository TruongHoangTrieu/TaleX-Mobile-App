import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import {
  cancelOrder,
  confirmCoinPayment,
  createContentOrder,
  type ContentItemType,
  type OrderResponseDto,
} from "@/services/order";
import { getWallet } from "@/services/rewardService";
import { useReward } from "@/context/RewardContext";
import { buildComboWebUrl, buildEpisodeWebUrl } from "@/utils/web-checkout-links";
import { formatVnd } from "./format-vnd";

export interface QuickUnlockModalProps {
  visible: boolean;
  onClose: () => void;
  /** Pass either itemId or episodeId */
  itemId?: string | null;
  episodeId?: string | null;
  itemType?: ContentItemType;
  episodeTitle?: string;
  itemTitle?: string;
  comicTitle?: string;
  seriesTitle?: string;
  seriesId?: string;
  contentKind?: "COMIC" | "VIDEO";
  onSuccess: () => void;
}

export default function QuickUnlockModal({
  visible,
  onClose,
  itemId,
  episodeId,
  itemType = "EPISODE",
  episodeTitle,
  itemTitle,
  comicTitle,
  seriesTitle,
  seriesId,
  contentKind = "COMIC",
  onSuccess,
}: QuickUnlockModalProps) {
  const { refreshRewardData } = useReward();
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [order, setOrder] = useState<OrderResponseDto | null>(null);
  const [insufficientCoin, setInsufficientCoin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const orderRef = useRef<OrderResponseDto | null>(null);
  const finalizedRef = useRef(false);
  orderRef.current = order;

  const targetId = itemId || episodeId;
  const displayItemTitle = itemTitle || episodeTitle;
  const displaySeriesTitle = seriesTitle || comicTitle;
  const isCombo = itemType === "COMBO";

  useEffect(() => {
    if (!visible || !targetId) {
      setLoading(true);
      setOrder(null);
      setInsufficientCoin(false);
      setErrorMsg(null);
      setConfirming(false);
      finalizedRef.current = false;
      return;
    }

    let isMounted = true;
    setLoading(true);
    setErrorMsg(null);
    setInsufficientCoin(false);
    finalizedRef.current = false;

    async function initOrder() {
      if (!targetId) return;
      try {
        let balance = 0;
        try {
          const wallet = await getWallet();
          balance = wallet.balance || 0;
        } catch (e) {
          balance = 0;
        }

        if (!isMounted) return;
        setWalletBalance(balance);

        const orderResult = await createContentOrder(targetId, itemType, balance);
        if (!isMounted) return;

        if (orderResult.success && orderResult.data) {
          const createdOrder = orderResult.data;
          setOrder(createdOrder);

          // If total amount exceeds balance or coinAmountUsed is less than totalAmount,
          // then the user does not have enough Coin.
          if (
            balance < createdOrder.totalAmount ||
            createdOrder.coinAmountUsed < createdOrder.totalAmount
          ) {
            setInsufficientCoin(true);
          }
        } else {
          setErrorMsg(orderResult.message || "Không thể khởi tạo đơn hàng mở khóa.");
        }
      } catch (err: any) {
        if (!isMounted) return;
        setErrorMsg(err?.message || "Đã xảy ra lỗi khi kết nối.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initOrder();

    return () => {
      isMounted = false;
      // Best-effort cancel dangling awaiting-payment order on unmount if not finalized
      const pending = orderRef.current;
      if (!finalizedRef.current && pending && pending.status === "AWAITING_PAYMENT") {
        cancelOrder(pending.orderId).catch(() => {});
      }
    };
  }, [visible, targetId, itemType]);

  const handleClose = () => {
    const pending = orderRef.current;
    if (!finalizedRef.current && pending && pending.status === "AWAITING_PAYMENT") {
      cancelOrder(pending.orderId).catch(() => {});
    }
    onClose();
  };

  const handleConfirmPayment = async () => {
    if (!order) return;
    setConfirming(true);
    try {
      const result = await confirmCoinPayment(order.orderId);
      if (result.success && result.data) {
        finalizedRef.current = true;
        void refreshRewardData({ silent: true });
        Toast.show({
          type: "success",
          text1: "Mở khóa thành công!",
          text2: "Nội dung đã được mở khóa cho tài khoản của bạn.",
        });
        onClose();
        onSuccess();
      } else {
        Toast.show({
          type: "error",
          text1: result.message || "Xác nhận mở khóa thất bại.",
        });
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: err?.message || "Lỗi khi xác nhận mở khóa.",
      });
    } finally {
      setConfirming(false);
    }
  };

  const handleOpenWeb = () => {
    handleClose();
    if (isCombo && seriesId) {
      Linking.openURL(buildComboWebUrl(seriesId)).catch((err) => {
        console.warn("Không thể mở website combo:", err);
      });
    } else if (targetId) {
      const kind = contentKind || (comicTitle ? "COMIC" : "VIDEO");
      Linking.openURL(buildEpisodeWebUrl(targetId, kind)).catch((err) => {
        console.warn("Không thể mở website tập:", err);
      });
    }
  };

  const modalTitle = isCombo
    ? "Mở Khóa Gói Combo"
    : contentKind === "VIDEO"
    ? "Mở Khóa Tập Phim"
    : "Mở Khóa Tập Truyện";

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={handleClose}
    >
      <View className="flex-1 items-center justify-center bg-black/80 px-5">
        <View className="w-full max-w-sm overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-[#1A1918] p-6 shadow-2xl">
          {/* Header Bar */}
          <View className="flex-row items-center justify-between pb-3 border-b border-white/10">
            <View className="flex-row items-center">
              <View className="mr-2.5 h-8 w-8 items-center justify-center rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40">
                <Ionicons
                  name={isCombo ? "gift-outline" : "lock-closed"}
                  size={16}
                  color="#D4AF37"
                />
              </View>
              <Text className="text-base font-bold text-white tracking-wide">
                {modalTitle}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              disabled={confirming}
              className="h-8 w-8 items-center justify-center rounded-full bg-zinc-800 active:opacity-70"
            >
              <Ionicons name="close" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Item / Episode / Series Info */}
          {(displayItemTitle || displaySeriesTitle) && (
            <View className="mt-4 rounded-xl bg-black/30 p-3 border border-white/5">
              {displaySeriesTitle && (
                <Text className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-0.5">
                  {displaySeriesTitle}
                </Text>
              )}
              {displayItemTitle && (
                <Text className="text-sm font-bold text-white" numberOfLines={2}>
                  {displayItemTitle}
                </Text>
              )}
            </View>
          )}

          {/* Body Content */}
          {loading ? (
            <View className="items-center justify-center py-10">
              <ActivityIndicator size="large" color="#D4AF37" />
              <Text className="mt-3 text-xs font-medium text-zinc-400">
                Đang chuẩn bị thông tin thanh toán...
              </Text>
            </View>
          ) : errorMsg ? (
            <View className="items-center py-6">
              <MaterialCommunityIcons name="alert-circle-outline" size={44} color="#EF4444" />
              <Text className="mt-2 text-center text-sm font-bold text-red-400">
                {errorMsg}
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                className="mt-5 h-11 w-full items-center justify-center rounded-xl bg-zinc-800 active:opacity-80"
              >
                <Text className="text-xs font-bold text-zinc-300">Đóng</Text>
              </TouchableOpacity>
            </View>
          ) : insufficientCoin ? (
            /* Insufficient Coin View - strictly no top-up money warning */
            <View className="items-center py-5">
              <View className="h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 mb-3">
                <MaterialCommunityIcons name="cash-multiple" size={30} color="#F59E0B" />
              </View>
              <Text className="text-center text-base font-bold text-white">
                Số dư Coin không đủ
              </Text>
              <Text className="mt-1.5 text-center text-xs text-zinc-400 leading-5">
                {isCombo
                  ? "Tài khoản của bạn hiện không có đủ Coin để mua gói combo này."
                  : "Tài khoản của bạn hiện không có đủ Coin để mua tập này."}
              </Text>

              <View className="mt-4 w-full rounded-2xl bg-black/40 p-3.5 border border-white/5 space-y-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs text-zinc-400">Số dư hiện tại:</Text>
                  <Text className="text-xs font-bold text-white">
                    {walletBalance.toLocaleString("vi-VN")} Coin
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs text-zinc-400">
                    Giá {isCombo ? "combo" : "tập"}:
                  </Text>
                  <Text className="text-xs font-bold text-[#D4AF37]">
                    {(order?.totalAmount || 0).toLocaleString("vi-VN")} Coin
                  </Text>
                </View>
                <View className="flex-row justify-between items-center pt-1 border-t border-white/5">
                  <Text className="text-xs font-semibold text-red-400">Còn thiếu:</Text>
                  <Text className="text-xs font-bold text-red-400">
                    {Math.max(0, (order?.totalAmount || 0) - walletBalance).toLocaleString("vi-VN")} Coin
                  </Text>
                </View>
              </View>

              {/* Nút chuyển sang Website để mua */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleOpenWeb}
                className="mt-5 h-12 w-full flex-row items-center justify-center rounded-xl bg-[#D4AF37]"
              >
                <Feather name="external-link" size={16} color="#141210" style={{ marginRight: 6 }} />
                <Text className="text-xs font-black uppercase tracking-wide text-[#141210]">
                  MUA TRÊN WEBSITE
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleClose}
                className="mt-2.5 h-11 w-full items-center justify-center rounded-xl bg-zinc-800/80 border border-white/5 active:opacity-80"
              >
                <Text className="text-xs font-bold text-zinc-400">Đóng</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Sufficient Coin View - Ready to confirm payment */
            <View className="mt-4">
              <View className="items-center rounded-2xl bg-black/40 p-4 border border-[#D4AF37]/20">
                <MaterialCommunityIcons name="hand-coin-outline" size={36} color="#D4AF37" />
                <Text className="mt-2 text-center text-xs text-zinc-400">
                  Thanh toán trực tiếp bằng Coin từ ví của bạn.
                </Text>

                <Text className="mt-3 text-2xl font-black text-[#D4AF37]">
                  -{(order?.coinAmountUsed || 0).toLocaleString("vi-VN")} Coin
                </Text>
                {!!order?.totalAmount && (
                  <Text className="mt-0.5 text-[11px] text-zinc-500">
                    Tương đương {formatVnd(order.totalAmount)}
                  </Text>
                )}

                <View className="mt-3.5 w-full flex-row items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <Text className="text-xs text-zinc-400">Số dư hiện tại:</Text>
                  <Text className="text-xs font-bold text-white">
                    {walletBalance.toLocaleString("vi-VN")} Coin
                  </Text>
                </View>

                <View className="mt-1.5 w-full flex-row items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                  <Text className="text-xs text-zinc-400">Còn lại sau khi mua:</Text>
                  <Text className="text-xs font-bold text-amber-400">
                    {Math.max(0, walletBalance - (order?.coinAmountUsed || 0)).toLocaleString("vi-VN")} Coin
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                disabled={confirming}
                onPress={handleConfirmPayment}
                className="mt-5 h-12 w-full items-center justify-center rounded-xl bg-[#D4AF37]"
                style={confirming ? { opacity: 0.6 } : undefined}
              >
                {confirming ? (
                  <ActivityIndicator color="#141210" />
                ) : (
                  <Text className="text-xs font-black uppercase tracking-wide text-[#141210]">
                    Xác nhận mở khóa bằng Coin
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
