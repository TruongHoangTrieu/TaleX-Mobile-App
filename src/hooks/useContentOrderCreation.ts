import { useCallback, useRef, useState } from "react";
import {
  cancelOrder,
  createContentOrder,
  type ContentItemType,
  type OrderResponseDto,
} from "@/services/order";

export interface ContentOrderCreationResult {
  orderId: string | null;
  order: OrderResponseDto | null;
  creating: boolean;
  error: string | null;
  /** Creates a fresh order for the given coin amount, cancelling the previous one (best-effort). */
  create: (coinAmountToUse?: number) => Promise<void>;
}

export function useContentOrderCreation(
  itemId: string,
  itemType: ContentItemType,
): ContentOrderCreationResult {
  const [order, setOrder] = useState<OrderResponseDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousOrderIdRef = useRef<string | null>(null);

  const create = useCallback(
    async (coinAmountToUse?: number) => {
      setCreating(true);
      setError(null);

      if (previousOrderIdRef.current) {
        // Best-effort: an expired/replaced order shouldn't block creating the new one.
        cancelOrder(previousOrderIdRef.current).catch(() => {});
      }

      const result = await createContentOrder(itemId, itemType, coinAmountToUse);

      if (result.success && result.data) {
        previousOrderIdRef.current = result.data.orderId;
        setOrder(result.data);
      } else {
        setError(result.message || "Không thể tạo đơn hàng.");
      }

      setCreating(false);
    },
    [itemId, itemType],
  );

  return {
    orderId: order?.orderId ?? null,
    order,
    creating,
    error,
    create,
  };
}
