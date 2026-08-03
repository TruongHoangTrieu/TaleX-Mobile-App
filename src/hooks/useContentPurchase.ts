import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { ContentItemType } from "@/services/order";

interface BuyContentParams {
  itemId: string;
  itemType: ContentItemType;
  title?: string;
  returnScreen?: string;
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

  const buy = ({ itemId, itemType, title, returnScreen }: BuyContentParams) => {
    Alert.alert(
      "Thanh toán bằng Coin",
      "Trên ứng dụng di động, nội dung này chỉ có thể mua bằng Coin. Nếu số dư Coin của bạn không đủ, bạn sẽ cần thanh toán phần còn thiếu trên website talex.pro.vn.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Tiếp tục",
          onPress: () =>
            navigation.navigate("Checkout", { itemId, itemType, title, returnScreen }),
        },
      ],
    );
  };

  return { buy };
}
