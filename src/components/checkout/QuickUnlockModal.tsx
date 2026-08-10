import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import {
  cancelOrder,
  confirmCoinPayment,
  createContentOrder,
  type OrderResponseDto,
} from "@/services/order";
import { getWallet } from "@/services/rewardService";
import { formatVnd } from "./format-vnd";

interface QuickUnlockModalProps {
  visible: boolean;
  onClose: () => void;
  episodeId: string | null;
  episodeTitle?: string;
  comicTitle?: string;
  onSuccess: () => void;
}

export default function QuickUnlockModal({
  visible,
  onClose,
  episodeId,
  episodeTitle,
  comicTitle,
  onSuccess,
}: QuickUnlockModalProps) {
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [order, setOrder] = useState<OrderResponseDto | null>(null);
  const [insufficientCoin, setInsufficientCoin] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const orderRef = useRef<OrderResponseDto | null>(null);
  const finalizedRef = useRef(false);
  orderRef.current = order;

  useEffect(() => {
    if (!visible || !episodeId) {
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
      if (!episodeId) return;
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

        const orderResult = await createContentOrder(episodeId, "EPISODE", balance);
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
  }, [visible, episodeId]);

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
          text1: "Xác nhận thất bại",
          text2: result.message || "Không thể hoàn tất thanh toán Coin.",
        });
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Lỗi thanh toán",
        text2: err?.message || "Lỗi xử lý giao dịch.",
      });
    } finally {
      setConfirming(false);
    }
  };

  if (!visible) return null;

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
                <Ionicons name="lock-closed" size={16} color="#D4AF37" />
              </View>
              <Text className="text-base font-bold text-white tracking-wide">
                Mở Khóa Tập Truyện
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

          {/* Episode Info */}
          {(episodeTitle || comicTitle) && (
            <View className="mt-4 rounded-xl bg-black/30 p-3 border border-white/5">
              {comicTitle && (
                <Text className="text-xs font-semibold text-[#D4AF37] uppercase tracking-wider mb-0.5">
                  {comicTitle}
                </Text>
              )}
              {episodeTitle && (
                <Text className="text-sm font-bold text-white" numberOfLines={2}>
                  {episodeTitle}
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
                Không đủ Coin
              </Text>
              <Text className="mt-1.5 text-center text-xs text-zinc-400 leading-5">
                Tài khoản của bạn hiện không có đủ Coin để mua tập này.
              </Text>

              <View className="mt-4 w-full rounded-2xl bg-black/40 p-3.5 border border-white/5 space-y-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs text-zinc-400">Số dư hiện tại:</Text>
                  <Text className="text-xs font-bold text-white">
                    {walletBalance.toLocaleString("vi-VN")} Coin
                  </Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs text-zinc-400">Giá tập truyện:</Text>
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

              <TouchableOpacity
                onPress={handleClose}
                className="mt-5 h-11 w-full items-center justify-center rounded-xl bg-zinc-800 active:opacity-80"
              >
                <Text className="text-xs font-bold text-zinc-300">Đóng</Text>
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
