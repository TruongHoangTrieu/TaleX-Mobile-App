import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { cancelOrder, confirmCoinPayment, type OrderResponseDto } from "@/services/order";
import { getWallet } from "@/services/rewardService";
import { getSsoHandoffCode } from "@/services/auth";
import { useContentOrderCreation } from "@/hooks/useContentOrderCreation";
import { buildContentCheckoutWebUrl } from "@/utils/web-checkout-links";
import CoinConfirmPanel from "@/components/checkout/CoinConfirmPanel";
import InsufficientCoinState from "@/components/checkout/InsufficientCoinState";
import { ErrorState, SuccessState } from "@/components/checkout/CheckoutResultStates";

/**
 * Mobile only ever pays with Coin — Premium and any fiat (money) purchase
 * happen on the website. This screen creates a content order using the
 * user's full Coin balance; if that doesn't fully cover the price, it
 * cancels the order and hands off to the web checkout instead of showing a
 * QR code in-app.
 */
export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = route.params ?? {};
  const { itemId, itemType, title, returnScreen = "MainTabs" } = params;

  const { order, creating, error, create } = useContentOrderCreation(itemId, itemType);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [openingWeb, setOpeningWeb] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderResponseDto | null>(null);
  const orderRef = useRef<OrderResponseDto | null>(null);
  const finalizedRef = useRef(false);
  orderRef.current = order;

  useEffect(() => {
    getWallet()
      .then((wallet) => {
        setWalletBalance(wallet.balance);
        create(wallet.balance);
      })
      .catch(() => {
        setWalletBalance(0);
        create();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      // Best-effort: don't leave a dangling AWAITING_PAYMENT order behind when
      // the user backs out before confirming (already-finalized/cancelled
      // orders are skipped so we don't double-cancel).
      const pending = orderRef.current;
      if (!finalizedRef.current && pending && pending.status === "AWAITING_PAYMENT") {
        cancelOrder(pending.orderId).catch(() => {});
      }
    };
  }, []);

  const handleConfirmCoin = async () => {
    if (!order) return;
    setConfirming(true);
    const result = await confirmCoinPayment(order.orderId);
    setConfirming(false);
    if (result.success && result.data) {
      finalizedRef.current = true;
      setCompletedOrder(result.data);
    } else {
      Toast.show({ type: "error", text1: result.message || "Xác nhận thất bại." });
    }
  };

  const handleCancelAndClose = () => {
    finalizedRef.current = true;
    if (order) cancelOrder(order.orderId).catch(() => {});
    navigation.goBack();
  };

  const handleDone = () => {
    navigation.navigate(returnScreen, { refreshKey: String(Date.now()) });
  };

  const handleOpenWeb = async () => {
    // Fetch the SSO code at press time (not earlier) so it can't go stale —
    // the 60s TTL starts counting the moment it's issued.
    setOpeningWeb(true);
    const code = await getSsoHandoffCode();
    setOpeningWeb(false);
    Linking.openURL(buildContentCheckoutWebUrl({ itemId, itemType, title }, code));
  };

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
        <Text className="text-[18px] font-bold text-[#E5E0D8]" numberOfLines={1}>
          {title || "Thanh toán bằng Coin"}
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, flexGrow: 1 }}>
        {error ? (
          <ErrorState message={error} onRetry={() => navigation.goBack()} />
        ) : completedOrder ? (
          <SuccessState onDone={handleDone} />
        ) : creating || !order || walletBalance === null ? (
          <View className="flex-1 items-center justify-center py-24">
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text className="mt-4 text-sm text-[#A19E95]">Đang kiểm tra ví Coin...</Text>
          </View>
        ) : order.fiatAmount > 0 ? (
          <InsufficientCoinState
            walletBalance={walletBalance}
            requiredCoin={order.totalAmount}
            fiatShortfall={order.fiatAmount}
            onOpenWeb={handleOpenWeb}
            openingWeb={openingWeb}
            onClose={handleCancelAndClose}
          />
        ) : (
          <CoinConfirmPanel
            totalAmount={order.totalAmount}
            coinAmountUsed={order.coinAmountUsed}
            confirming={confirming}
            onConfirm={handleConfirmCoin}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
