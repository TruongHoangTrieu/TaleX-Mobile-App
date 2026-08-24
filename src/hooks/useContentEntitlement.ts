import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getOrderHistory } from "@/services/order";
import { getActiveSubscription } from "@/services/subscription";
import {
  getPublicCombos,
  getEpisodePlayback,
  getPublicEpisodeMedia,
  ComboItem,
  EpisodeItem,
} from "@/services/series";

interface UseContentEntitlementParams {
  contentType?: "VIDEO" | "COMIC" | string;
  creatorAccountId?: string | null;
  combos?: ComboItem[];
  episodes?: EpisodeItem[];
}

// Module-level persistent cache across screen transitions
const globalPurchasedCache = new Set<string>();

export function useContentEntitlement({
  contentType,
  creatorAccountId,
  combos = [],
  episodes = [],
}: UseContentEntitlementParams) {
  const { user, isAuthenticated } = useAuth();
  const [purchasedEpisodeIds, setPurchasedEpisodeIds] = useState<Set<string>>(
    () => new Set(globalPurchasedCache)
  );
  const [isSubscriptionUnlocked, setIsSubscriptionUnlocked] = useState(false);
  const [loadingEntitlements, setLoadingEntitlements] = useState(false);

  const episodesRef = useRef(episodes);
  episodesRef.current = episodes;
  const combosRef = useRef(combos);
  combosRef.current = combos;
  const inFlightRef = useRef(false);

  // Stable string keys to avoid re-triggering on object reference changes
  const episodeIdsKey = useMemo(
    () => (episodes || []).map((e) => e?.episodeId || e?.id || "").filter(Boolean).sort().join(","),
    [episodes]
  );
  const comboIdsKey = useMemo(
    () => (combos || []).map((c) => c?.comboId || c?.id || "").filter(Boolean).sort().join(","),
    [combos]
  );

  const isCreator = useMemo(() => {
    if (!isAuthenticated || !user?.accountId || !creatorAccountId) return false;
    return String(user.accountId).toLowerCase() === String(creatorAccountId).toLowerCase();
  }, [isAuthenticated, user?.accountId, creatorAccountId]);

  const isFullyUnlocked = isCreator || isSubscriptionUnlocked;

  const refreshEntitlements = useCallback(async () => {
    if (!isAuthenticated) {
      setPurchasedEpisodeIds(new Set());
      setIsSubscriptionUnlocked(false);
      return;
    }

    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoadingEntitlements(true);

    try {
      const currentPurchasedSet = new Set<string>(globalPurchasedCache);

      // 1. Check Active Subscription
      try {
        const sub = await getActiveSubscription();
        if (sub) {
          const typeUpper = (contentType || "").toUpperCase();
          if (typeUpper === "VIDEO" && sub.isMovieUnlocked) {
            setIsSubscriptionUnlocked(true);
          } else if (typeUpper === "COMIC" && sub.isStoryUnlocked) {
            setIsSubscriptionUnlocked(true);
          } else if (!typeUpper && (sub.isMovieUnlocked || sub.isStoryUnlocked)) {
            setIsSubscriptionUnlocked(true);
          } else {
            setIsSubscriptionUnlocked(false);
          }
        } else {
          setIsSubscriptionUnlocked(false);
        }
      } catch (subErr) {
        console.warn("useContentEntitlement: Error checking subscription", subErr);
      }

      // 2. Fetch Order History (both page 0 and 1)
      try {
        const [orderRes0, orderRes1] = await Promise.all([
          getOrderHistory(0, 100).catch(() => null),
          getOrderHistory(1, 100).catch(() => null),
        ]);

        const orders0 = orderRes0?.data?.content || [];
        const orders1 = orderRes1?.data?.content || [];
        const allOrders = [...orders0, ...orders1];

        const orderMap = new Map<string, any>();
        allOrders.forEach((o: any) => {
          if (o && (o.orderId || o.id)) {
            orderMap.set(o.orderId || o.id, o);
          }
        });
        const orders = Array.from(orderMap.values());

        let allCombos = combosRef.current;
        if (!allCombos || allCombos.length === 0) {
          allCombos = await getPublicCombos().catch(() => []);
        }

        for (const order of orders) {
          const status = String(order.status || "").toUpperCase();
          if (
            status === "COMPLETED" ||
            status === "PAID" ||
            status === "SUCCESS" ||
            status === "SUCCESSFUL" ||
            status === "DONE"
          ) {
            const typeUpper = String(order.itemType || "").toUpperCase();
            if (typeUpper === "EPISODE") {
              const epId = order.itemId || order.episodeId || order.contentId;
              if (epId) {
                currentPurchasedSet.add(String(epId));
                globalPurchasedCache.add(String(epId));
              }
            } else if (typeUpper === "COMBO") {
              const comboId = order.itemId || order.contentId;
              if (comboId && allCombos.length > 0) {
                const foundCombo = allCombos.find(
                  (c) =>
                    String(c.comboId) === String(comboId) ||
                    String(c.id) === String(comboId) ||
                    (c.title && order.itemTitle && c.title.toLowerCase() === order.itemTitle.toLowerCase())
                );
                if (foundCombo?.episodes && Array.isArray(foundCombo.episodes)) {
                  foundCombo.episodes.forEach((ep) => {
                    if (ep.episodeId) {
                      currentPurchasedSet.add(String(ep.episodeId));
                      globalPurchasedCache.add(String(ep.episodeId));
                    }
                    if ((ep as any).id) {
                      currentPurchasedSet.add(String((ep as any).id));
                      globalPurchasedCache.add(String((ep as any).id));
                    }
                  });
                }
              }
            }
          }
        }
      } catch (orderErr) {
        console.warn("useContentEntitlement: Error fetching orders", orderErr);
      }

      // 3. Direct backend playback/media verification for current season's PAID episodes
      const currentEps = episodesRef.current || [];
      if (currentEps.length > 0) {
        const paidEpisodesToCheck = currentEps.filter(
          (ep) =>
            ep.unlockType === "PAID" &&
            ep.episodeId &&
            !currentPurchasedSet.has(String(ep.episodeId))
        );

        if (paidEpisodesToCheck.length > 0) {
          const isVideo = (contentType || "").toUpperCase() === "VIDEO";

          await Promise.allSettled(
            paidEpisodesToCheck.map(async (ep) => {
              try {
                if (isVideo) {
                  const res = await getEpisodePlayback(ep.episodeId, user?.accountId);
                  const data = res?.data || res;
                  const isLocked = Boolean(
                    data?.isLocked === true ||
                    data?.isEntitled === false ||
                    data?.playbackType === "MP4"
                  );
                  if (!isLocked && data?.playbackUrl) {
                    currentPurchasedSet.add(String(ep.episodeId));
                    globalPurchasedCache.add(String(ep.episodeId));
                    if (ep.id) {
                      currentPurchasedSet.add(String(ep.id));
                      globalPurchasedCache.add(String(ep.id));
                    }
                  }
                } else {
                  const res = await getPublicEpisodeMedia(ep.episodeId, user?.accountId);
                  const data = Array.isArray(res)
                    ? res
                    : Array.isArray(res?.data)
                    ? res.data
                    : res?.data?.media || [];
                  const isLocked = Boolean(
                    res?.isLocked === true ||
                    res?.isEntitled === false ||
                    (Array.isArray(data) &&
                      data.some(
                        (m: any) =>
                          m.isLocked === true ||
                          m.isEntitled === false ||
                          m.locked === true
                      ))
                  );
                  if (!isLocked) {
                    currentPurchasedSet.add(String(ep.episodeId));
                    globalPurchasedCache.add(String(ep.episodeId));
                    if (ep.id) {
                      currentPurchasedSet.add(String(ep.id));
                      globalPurchasedCache.add(String(ep.id));
                    }
                  }
                }
              } catch (err: any) {
                // If 403 or locked, ignore
              }
            })
          );
        }
      }

      // Update state ONCE only if there's an actual difference to prevent re-render flickers
      setPurchasedEpisodeIds((prev) => {
        if (prev.size === currentPurchasedSet.size) {
          let hasDiff = false;
          for (const id of currentPurchasedSet) {
            if (!prev.has(id)) {
              hasDiff = true;
              break;
            }
          }
          if (!hasDiff) return prev;
        }
        return new Set(currentPurchasedSet);
      });
    } catch (err) {
      console.warn("useContentEntitlement: Error in entitlement workflow", err);
    } finally {
      inFlightRef.current = false;
      setLoadingEntitlements(false);
    }
  }, [isAuthenticated, user?.accountId, contentType, episodeIdsKey, comboIdsKey]);

  useEffect(() => {
    refreshEntitlements();
  }, [refreshEntitlements]);

  const isEpisodeUnlocked = useCallback(
    (ep: EpisodeItem | null | undefined): boolean => {
      if (!ep) return false;

      // Free episodes are always unlocked
      if (ep.unlockType !== "PAID") return true;

      // If whole series is unlocked (creator ownership or active subscription)
      if (isFullyUnlocked) return true;

      // Backend explicit entitlement flags
      if (
        ep.isLocked === false ||
        ep.isEntitled === true ||
        ep.isPurchased === true ||
        ep.isUnlocked === true
      ) {
        return true;
      }

      const epIdStr = ep.episodeId ? String(ep.episodeId) : "";
      const idStr = ep.id ? String(ep.id) : "";

      // Check state set or global cache
      if (epIdStr && (purchasedEpisodeIds.has(epIdStr) || globalPurchasedCache.has(epIdStr))) {
        return true;
      }
      if (idStr && (purchasedEpisodeIds.has(idStr) || globalPurchasedCache.has(idStr))) {
        return true;
      }

      return false;
    },
    [isFullyUnlocked, purchasedEpisodeIds]
  );

  return {
    isEpisodeUnlocked,
    isFullyUnlocked,
    isCreator,
    isSubscriptionUnlocked,
    purchasedEpisodeIds,
    loadingEntitlements,
    refreshEntitlements,
  };
}
