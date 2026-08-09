import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { CommonActions, useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { cancelOrder, confirmCoinPayment, type OrderResponseDto } from "@/services/order";
import { getWallet } from "@/services/rewardService";
import { useContentOrderCreation } from "@/hooks/useContentOrderCreation";
import { buildComboWebUrl, buildEpisodeWebUrl } from "@/utils/web-checkout-links";
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
  const {
    itemId,
    itemType,
    title,
    returnScreen = "MainTabs",
    contentKind,
    seriesId,
  } = params;

  const { order, creating, error, create } = useContentOrderCreation(itemId, itemType);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
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
    const extra: Record<string, string> = { refreshKey: String(Date.now()) };
    if (itemType === "EPISODE") {
      extra.episodeId = itemId;
      if (contentKind === "COMIC" && seriesId) extra.comicId = seriesId;
      if (contentKind === "VIDEO" && seriesId) extra.movieId = seriesId;
    }
    // navigate({..., merge: true}) relies on React Navigation finding an
    // existing route with this name to pop back to — unreliable here, it was
    // still leaving this success screen in the stack (back button landed on
    // it instead of the series page). Instead, directly pop this screen off
    // the stack and merge params into whatever screen is now on top — no
    // dependency on name-matching, guaranteed to remove Checkout.
    navigation.dispatch((state: any) => {
      const routes = state.routes.slice(0, -1);
      if (routes.length === 0) {
        return CommonActions.navigate({ name: returnScreen, params: extra });
      }
      const lastIndex = routes.length - 1;
      routes[lastIndex] = {
        ...routes[lastIndex],
        params: { ...routes[lastIndex].params, ...extra },
      };
      return CommonActions.reset({ ...state, routes, index: lastIndex });
    });
  };

  const handleOpenWeb = () => {
    const url =
      itemType === "COMBO"
        ? buildComboWebUrl(seriesId)
        : buildEpisodeWebUrl(itemId, contentKind);
    Linking.openURL(url);
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
            onClose={handleCancelAndClose}
          />
        ) : (
          <CoinConfirmPanel
            walletBalance={walletBalance}
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
