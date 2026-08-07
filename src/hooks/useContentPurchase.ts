import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";
import type { ContentItemType } from "@/services/order";

interface BuyContentParams {
  itemId: string;
  itemType: ContentItemType;
  title?: string;
  returnScreen?: string;
  /** Required for itemType "EPISODE" — picks the web page: /read (comic) vs /watch (video). */
  contentKind?: "COMIC" | "VIDEO";
  /** Required for itemType "COMBO" — the combo's own page is /series/{seriesId}, there's no dedicated combo page. */
  seriesId?: string;
}

/**
 * Thin navigation wrapper — order creation happens inside CheckoutScreen
 * (pending-content mode) so the Coin toggle there can decide the final
 * `coinAmountToUse` before any order is created.
 *
 * Mobile only ever pays with Coin, so every entry point warns the user up
 * front before entering Checkout (which itself redirects to the website if
 * the Coin balance turns out to be insufficient).
 */
export function useContentPurchase() {
  const navigation = useNavigation<any>();
  const { isAuthenticated } = useAuth();

  const buy = ({
    itemId,
    itemType,
    title,
    returnScreen,
    contentKind,
    seriesId,
  }: BuyContentParams) => {
    // Checkout needs a wallet/order lookup right away — without this guard a
    // guest hits an unhandled "No refresh token available" error instead of
    // being sent to log in first.
    if (!isAuthenticated) {
      navigation.navigate("LoginScreen");
      return;
    }

    Alert.alert(
      "Thanh toán bằng Coin",
      "Trên ứng dụng di động, nội dung này chỉ có thể mua bằng Coin. Nếu số dư Coin của bạn không đủ, bạn sẽ cần thanh toán phần còn thiếu trên website talex.pro.vn.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Tiếp tục",
          onPress: () =>
            navigation.navigate("Checkout", {
              itemId,
              itemType,
              title,
              returnScreen,
              contentKind,
              seriesId,
            }),
        },
      ],
    );
  };

  return { buy };
}
