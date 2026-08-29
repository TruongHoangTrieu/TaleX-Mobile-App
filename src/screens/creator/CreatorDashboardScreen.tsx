import React, { useState, useMemo, useEffect } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import {
  MaterialCommunityIcons,
  Feather,
  Ionicons,
  FontAwesome5,
} from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";
import { LinearGradient } from "expo-linear-gradient";
import { navigationRef } from "@/navigation/navigationRef";
import { InteractiveStarRating } from "@/components/InteractiveStarRating";
import {
  getCreatorLogs,
  listSeriesByCreator,
  getCreatorFollowersCount,
  getOwnCreator,
  getCoinWallet,
  CreatorLogItem,
  CreatorSeriesResponseItem,
  OwnCreatorResponse,
  CoinWalletResponse,
} from "@/services/creator";

const { width } = Dimensions.get("window");

// Format number utility (1.5K, 2.4M)
function formatNum(num: number = 0): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString("vi-VN");
}

// Mini Sparkline component (Render visual bars from real backend data)
function MiniSparklineChart({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length === 0) {
    return (
      <View className="h-10 w-20 items-center justify-center border border-dashed border-zinc-800 rounded">
        <Text className="text-zinc-600 text-[9px]">Chưa có data</Text>
      </View>
    );
  }
  const max = Math.max(...data, 1);
  return (
    <View className="flex-row items-end h-10 w-20 justify-between">
      {data.map((val, idx) => {
        const heightPct = max > 0 ? Math.max(10, Math.round((val / max) * 100)) : 10;
        return (
          <View
            key={idx}
            style={{
              height: `${heightPct}%`,
              backgroundColor: color,
              opacity: 0.3 + (idx / data.length) * 0.7,
              width: 3.5,
              borderRadius: 2,
            }}
          />
        );
      })}
    </View>
  );
}// Custom Straight Line Segment Renderer (Draws line between 2 points using Center Rotation)
function LineSegment({
  x1,
  y1,
  x2,
  y2,
  color,
  strokeWidth = 2.5,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  strokeWidth?: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return null;

  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: cx - length / 2,
        top: cy - strokeWidth / 2,
        width: length,
        height: strokeWidth,
        backgroundColor: color,
        transform: [{ rotate: `${angle}deg` }],
      }}
    />
  );
}

// Connected Straight Line Chart Component with Left Y-Axis Scale Column (0, 10, 20, 30, 40, 50)
function ConnectedLineChart({
  data,
  maxVal,
  selectedIdx,
  onSelectIdx,
}: {
  data: { label: string; views: number; engagement: number }[];
  maxVal: number;
  selectedIdx: number | null;
  onSelectIdx: (idx: number) => void;
}) {
  const yAxisWidth = 36;
  const chartWidth = width - 88 - yAxisWidth; // Reserved left column for Y-axis scale
  const chartHeight = 160;
  const paddingTop = 12;
  const paddingBottom = 12;
  const usableHeight = chartHeight - paddingTop - paddingBottom;
  const numItems = data.length;

  if (numItems === 0) return null;

  // Compute 6 Y-Axis Scale Ticks (effectiveMax, 0.8*max, 0.6*max, 0.4*max, 0.2*max, 0)
  const effectiveMax = maxVal > 0 ? maxVal : 10;
  const yTicks = [
    effectiveMax,
    Math.round(effectiveMax * 0.8),
    Math.round(effectiveMax * 0.6),
    Math.round(effectiveMax * 0.4),
    Math.round(effectiveMax * 0.2),
    0,
  ];

  const stepX = numItems > 1 ? chartWidth / (numItems - 1) : chartWidth / 2;

  // Calculate Point coordinates (x, y) for each data point
  const points = data.map((item, idx) => {
    const x = numItems > 1 ? idx * stepX : chartWidth / 2;
    // Precise Y coordinate relative to chartHeight and scale
    const yViews = chartHeight - paddingBottom - (item.views / effectiveMax) * usableHeight;
    const yEng = chartHeight - paddingBottom - (item.engagement / effectiveMax) * usableHeight;
    return { x, yViews, yEng, item, idx };
  });

  return (
    <View className="relative">
      {/* Outer Flex Container: Left Y-Axis Scale Column + Right Line Canvas */}
      <View className="flex-row items-start">
        
        {/* Left Y-Axis Scale Column (0, 10, 20, 30, 40, 50) */}
        <View style={{ width: yAxisWidth, height: chartHeight }} className="relative pr-2 border-r border-zinc-800/80">
          {yTicks.map((val, idx) => {
            const yPos = paddingTop + idx * (usableHeight / 5);
            return (
              <View
                key={idx}
                style={{ position: "absolute", top: yPos - 6, right: 8 }}
              >
                <Text className="text-zinc-500 text-[9px] font-bold text-right">
                  {formatNum(val)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Right Line Canvas Area */}
        <View style={{ width: chartWidth, height: chartHeight }} className="relative ml-2 overflow-visible">
          
          {/* Horizontal Translucent Guidelines aligned with Y-ticks */}
          <View className="absolute inset-0 pointer-events-none">
            {yTicks.map((_, idx) => {
              const yPos = paddingTop + idx * (usableHeight / 5);
              return (
                <View
                  key={idx}
                  style={{ position: "absolute", top: yPos, left: 0, right: 0 }}
                  className="border-b border-zinc-800/50 w-full"
                />
              );
            })}
          </View>

          {/* 1. Straight Line Segments for Views (Gold Line) */}
          {points.map((pt, i) => {
            if (i === points.length - 1) return null;
            const nextPt = points[i + 1];
            return (
              <LineSegment
                key={`line-v-${i}`}
                x1={pt.x}
                y1={pt.yViews}
                x2={nextPt.x}
                y2={nextPt.yViews}
                color="#D4AF37"
                strokeWidth={2.5}
              />
            );
          })}

          {/* 2. Straight Line Segments for Engagement (Rose Line) */}
          {points.map((pt, i) => {
            if (i === points.length - 1) return null;
            const nextPt = points[i + 1];
            return (
              <LineSegment
                key={`line-e-${i}`}
                x1={pt.x}
                y1={pt.yEng}
                x2={nextPt.x}
                y2={nextPt.yEng}
                color="#F43F5E"
                strokeWidth={2.5}
              />
            );
          })}

          {/* 3. Laser Pointer Vertical Line & Vertex Nodes */}
          {points.map((pt) => {
            const isSelected =
              selectedIdx === pt.idx ||
              (selectedIdx === null && pt.idx === points.length - 1);

            return (
              <React.Fragment key={`node-${pt.idx}`}>
                {/* Laser Pointer Vertical Line */}
                {isSelected && (
                  <View
                    style={{ left: pt.x }}
                    className="absolute top-0 bottom-0 w-[1.5px] bg-[#D4AF37]/50 pointer-events-none"
                  />
                )}

                {/* Views Node Circle (Gold) */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onSelectIdx(pt.idx)}
                  style={{
                    position: "absolute",
                    left: pt.x - 12,
                    top: pt.yViews - 12,
                    width: 24,
                    height: 24,
                  }}
                  className="z-20 items-center justify-center"
                >
                  <View
                    style={{
                      width: isSelected ? 12 : 8,
                      height: isSelected ? 12 : 8,
                      borderRadius: 6,
                      backgroundColor: "#D4AF37",
                      borderWidth: isSelected ? 2 : 1.5,
                      borderColor: "#FFFFFF",
                    }}
                  />
                </TouchableOpacity>

                {/* Engagement Node Circle (Rose) */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onSelectIdx(pt.idx)}
                  style={{
                    position: "absolute",
                    left: pt.x - 12,
                    top: pt.yEng - 12,
                    width: 24,
                    height: 24,
                  }}
                  className="z-20 items-center justify-center"
                >
                  <View
                    style={{
                      width: isSelected ? 12 : 8,
                      height: isSelected ? 12 : 8,
                      borderRadius: 6,
                      backgroundColor: "#F43F5E",
                      borderWidth: isSelected ? 2 : 1.5,
                      borderColor: "#FFFFFF",
                    }}
                  />
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {/* Date Labels positioned absolutely straight under chart points pt.x */}
      <View style={{ marginLeft: yAxisWidth + 8, width: chartWidth, height: 24 }} className="relative mt-3">
        {points.map((pt) => {
          const isSelected =
            selectedIdx === pt.idx ||
            (selectedIdx === null && pt.idx === points.length - 1);
          return (
            <TouchableOpacity
              key={pt.idx}
              onPress={() => onSelectIdx(pt.idx)}
              style={{
                position: "absolute",
                left: pt.x - 20,
                width: 40,
                alignItems: "center",
              }}
            >
              <Text
                className={`text-[10px] font-bold text-center ${
                  isSelected ? "text-[#D4AF37]" : "text-zinc-500"
                }`}
              >
                {pt.item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function CreatorDashboardScreen({ navigation: propNav }: { navigation?: any }) {
  // Safe Navigation Handler using propNav or navigationRef (No useNavigation hook call)
  const safeGoBack = () => {
    try {
      if (propNav && typeof propNav.canGoBack === "function" && propNav.canGoBack()) {
        propNav.goBack();
      } else if (propNav && typeof propNav.navigate === "function") {
        propNav.navigate("MainTabs");
      } else if (navigationRef.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
      } else if (navigationRef.isReady()) {
        navigationRef.navigate("MainTabs");
      }
    } catch (e) {
      console.log("Safe goBack error:", e);
    }
  };

  const safeNavigate = (routeName: string, params?: any) => {
    try {
      if (propNav && typeof propNav.navigate === "function") {
        propNav.navigate(routeName, params);
      } else if (navigationRef.isReady()) {
        navigationRef.navigate(routeName, params);
      }
    } catch (e) {
      console.log("Safe navigate error:", e);
    }
  };

  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const [activeTab, setActiveTab] = useState<"overview" | "content" | "comments" | "revenue">(
    "overview"
  );
  const [preset, setPreset] = useState<"7d" | "30d">("7d");
  const [selectedDayIdx, setSelectedDayIdx] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // API State (100% Real Backend Data)
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [logs, setLogs] = useState<CreatorLogItem[]>([]);
  const [seriesList, setSeriesList] = useState<CreatorSeriesResponseItem[]>([]);
  const [realFollowerCount, setRealFollowerCount] = useState<number>(0);
  const [ownCreator, setOwnCreator] = useState<OwnCreatorResponse | null>(null);
  const [wallet, setWallet] = useState<CoinWalletResponse>({ balance: 0, totalEarned: 0 });

  // Fetch API data matching web endpoints 100%
  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        setIsLoading(true);

        const now = new Date();
        const fromDate = new Date();
        fromDate.setDate(now.getDate() - (preset === "7d" ? 7 : 30));

        const [logsRes, seriesRes, followersRes, creatorRes, walletRes] = await Promise.allSettled([
          getCreatorLogs({ from: fromDate.toISOString(), to: now.toISOString() }),
          listSeriesByCreator(0, 50),
          getCreatorFollowersCount(),
          getOwnCreator(),
          getCoinWallet(),
        ]);

        if (!isMounted) return;

        if (logsRes.status === "fulfilled" && Array.isArray(logsRes.value)) {
          setLogs(logsRes.value);
        } else {
          setLogs([]);
        }

        if (seriesRes.status === "fulfilled" && seriesRes.value) {
          const val = seriesRes.value as any;
          const list = Array.isArray(val)
            ? val
            : Array.isArray(val?.content)
            ? val.content
            : Array.isArray(val?.items)
            ? val.items
            : Array.isArray(val?.data)
            ? val.data
            : Array.isArray(val?.data?.content)
            ? val.data.content
            : [];
          setSeriesList(list);
        } else {
          setSeriesList([]);
        }

        let fCount = 0;
        if (followersRes.status === "fulfilled" && typeof followersRes.value === "number") {
          fCount = Math.max(fCount, followersRes.value);
        }

        if (creatorRes.status === "fulfilled" && creatorRes.value) {
          setOwnCreator(creatorRes.value);
          if (typeof creatorRes.value.followerCount === "number") {
            fCount = Math.max(fCount, creatorRes.value.followerCount);
          }
        }
        setRealFollowerCount(fCount);

        if (walletRes.status === "fulfilled" && walletRes.value) {
          setWallet(walletRes.value);
        }
      } catch (err) {
        console.log("Error fetching creator dashboard APIs:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [preset]);

  // Real aggregate totals computed from backend logs
  const apiTotals = useMemo(() => {
    return logs.reduce(
      (acc: Record<string, number>, item) => {
        const data = (item as any).analyticData || {};
        return {
          views: (acc.views || 0) + (data.views || (item as any).views || 0),
          likes: (acc.likes || 0) + (data.likes || (item as any).likes || 0),
          comments: (acc.comments || 0) + (data.comments || (item as any).comments || 0),
          bookmarks: (acc.bookmarks || 0) + (data.bookmarks || (item as any).bookmarks || 0),
          shares: (acc.shares || 0) + (data.shares || (item as any).shares || 0),
          follows: (acc.follows || 0) + ((item as any).follows || 0),
          watchTime: (acc.watchTime || 0) + (data.watchTime || (item as any).watchTime || 0),
        };
      },
      { views: 0, likes: 0, comments: 0, bookmarks: 0, shares: 0, follows: 0, watchTime: 0 }
    );
  }, [logs]);

  // Daily grouped points for sparklines & line chart from real logs
  const dailyDataMap = useMemo(() => {
    const map = new Map<
      string,
      { views: number; likes: number; comments: number; bookmarks: number; shares: number; follows: number; engagement: number }
    >();

    for (const item of logs) {
      if (!item.hourBucket) continue;
      const d = new Date(item.hourBucket);
      const dayKey = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;

      const existing = map.get(dayKey) || {
        views: 0,
        likes: 0,
        comments: 0,
        bookmarks: 0,
        shares: 0,
        follows: 0,
        engagement: 0,
      };

      const data = item.analyticData || {};
      const eng = (data.likes || 0) + (data.comments || 0) + (data.bookmarks || 0) + (data.shares || 0);

      map.set(dayKey, {
        views: existing.views + (data.views || 0),
        likes: existing.likes + (data.likes || 0),
        comments: existing.comments + (data.comments || 0),
        bookmarks: existing.bookmarks + (data.bookmarks || 0),
        shares: existing.shares + (data.shares || 0),
        follows: existing.follows + (item.follows || 0),
        engagement: existing.engagement + eng,
      });
    }

    return map;
  }, [logs]);

  // Mini sparklines data arrays
  const sparklines = useMemo(() => {
    const entries = Array.from(dailyDataMap.values());
    if (entries.length === 0) {
      return { views: [], follows: [], engagement: [] };
    }
    return {
      views: entries.map((e) => e.views),
      follows: entries.map((e) => e.follows),
      engagement: entries.map((e) => e.engagement),
    };
  }, [dailyDataMap]);

  // Activity trend points from API
  const activityTrendData = useMemo(() => {
    const entries = Array.from(dailyDataMap.entries());
    if (entries.length === 0) return [];
    return entries.slice(-7).map(([label, val]) => ({
      label,
      views: val.views,
      engagement: val.engagement,
    }));
  }, [dailyDataMap]);

  const maxActivityVal = Math.max(
    ...activityTrendData.map((d) => d.views),
    ...activityTrendData.map((d) => d.engagement),
    1
  );

  // Active highlighted day data for Tooltip when clicked
  const selectedItem = useMemo(() => {
    if (selectedDayIdx !== null && activityTrendData[selectedDayIdx]) {
      return activityTrendData[selectedDayIdx];
    }
    return activityTrendData[activityTrendData.length - 1] || null;
  }, [selectedDayIdx, activityTrendData]);

  // Dynamic Engagement Breakdown percentages from real API totals
  const engagementBreakdown = useMemo(() => {
    const totalInteractions =
      apiTotals.likes +
      apiTotals.comments +
      apiTotals.bookmarks +
      apiTotals.shares +
      apiTotals.follows;

    const calcPct = (val: number) =>
      totalInteractions > 0 ? Math.round((val / totalInteractions) * 100) : 0;

    return [
      { type: "Thích tác phẩm", count: apiTotals.likes, pct: calcPct(apiTotals.likes), color: "#F43F5E", icon: "heart" },
      { type: "Bình luận", count: apiTotals.comments, pct: calcPct(apiTotals.comments), color: "#3B82F6", icon: "message-square" },
      { type: "Lưu thư viện", count: apiTotals.bookmarks, pct: calcPct(apiTotals.bookmarks), color: "#D4AF37", icon: "bookmark" },
      { type: "Chia sẻ", count: apiTotals.shares, pct: calcPct(apiTotals.shares), color: "#A855F7", icon: "share-2" },
      { type: "Đăng ký mới", count: apiTotals.follows, pct: calcPct(apiTotals.follows), color: "#10B981", icon: "user-plus" },
    ];
  }, [apiTotals]);

  // Dynamic Top Series List from real API seriesList
  const topSeriesList = useMemo(() => {
    if (!seriesList || seriesList.length === 0) return [];
    return [...seriesList]
      .sort((a, b) => ((b as any).totalViews || (b as any).views || 0) - ((a as any).totalViews || (a as any).views || 0))
      .slice(0, 5)
      .map((s: any, idx) => ({
        id: s.seriesId || s.id || String(idx),
        title: s.title,
        category: s.contentType === "VIDEO" ? "Video / Phim" : "Truyện tranh",
        views: s.totalViews ?? s.views ?? (s.analyticData?.views || 0),
        subs: s.totalSubscriptions ?? s.subscriptions ?? s.followersCount ?? 0,
        coverUrl: s.coverUrl || s.bannerUrl,
        averageRating: Number(s.averageRating ?? s.rating ?? 5.0),
        totalRatingsCount: s.totalRatingsCount ?? s.ratingCount ?? s.totalSubscriptions ?? 0,
        coverColor: s.contentType === "VIDEO" ? "#3B82F6" : "#10B981",
      }));
  }, [seriesList]);

  // Dynamic Recent Content from real API seriesList with 100% Real Metrics
  const recentContent = useMemo(() => {
    if (!seriesList || seriesList.length === 0) return [];
    return seriesList.map((s: any) => {
      const views = s.totalViews ?? s.views ?? (s.analyticData?.views || 0);
      const subs = s.totalSubscriptions ?? s.subscriptions ?? s.followersCount ?? 0;
      const avgRating = Number(s.averageRating ?? s.rating ?? 5.0);
      const ratingCount = s.totalRatingsCount ?? s.ratingCount ?? 0;

      return {
        id: s.seriesId || s.id,
        title: s.title,
        type: s.contentType === "VIDEO" ? "video" : "comic",
        category: s.contentType === "VIDEO" ? "Video / Phim" : "Truyện tranh",
        views: views,
        formattedViews: formatNum(views),
        subs: subs,
        formattedSubs: formatNum(subs),
        status: s.status || "PUBLISHED",
        coverUrl: s.coverUrl || s.bannerUrl,
        averageRating: avgRating,
        totalRatingsCount: ratingCount,
        statusText:
          s.status === "PUBLISHED"
            ? "Đã xuất bản"
            : s.status === "DRAFT"
            ? "Bản nháp"
            : "Đang ẩn",
        date: s.createdAt
          ? new Date(s.createdAt).toLocaleDateString("vi-VN")
          : "Gần đây",
        raw: s,
      };
    });
  }, [seriesList]);

  const totalEngagement =
    apiTotals.likes + apiTotals.comments + apiTotals.bookmarks + apiTotals.shares;

  return (
    <SafeAreaView className="flex-1 bg-[#0F0F10]">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F10" />

      {/* ================= 1. HEADER & CREATOR HEADER BANNER ================= */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-900 bg-[#141416]">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={safeGoBack}
            className="p-2 mr-1 active:opacity-60"
          >
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="view-dashboard-variant" size={24} color="#D4AF37" />
            <Text className="text-white text-lg font-black tracking-tight ml-2">
              Creator Overview
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <TouchableOpacity
            className="relative p-2 active:opacity-60"
            onPress={() => safeNavigate("Notifications")}
          >
            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View className="absolute right-0 top-0 min-w-[17px] h-[17px] items-center justify-center rounded-full bg-[#D4AF37] px-1 border border-[#141416]">
                <Text className="text-[9px] font-black text-[#141210]">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ================= SCROLLABLE DASHBOARD ================= */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* CREATOR PROFILE BANNER CARD */}
        <LinearGradient
          colors={["#27221A", "#17171A", "#121214"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="mx-4 mt-4 p-5 rounded-3xl border border-[#D4AF37]/25 shadow-xl shadow-yellow-500/5"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#D4AF37] relative">
                <Image
                  source={
                    ownCreator?.avatarUrl
                      ? { uri: ownCreator.avatarUrl }
                      : require("@assets/icon.png")
                  }
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>

              <View className="ml-3.5 flex-1">
                <View className="flex-row items-center flex-wrap">
                  <Text className="text-white text-base font-black tracking-wide mr-2">
                    {ownCreator?.displayName || user?.fullName || user?.username || "TaleX Creator"}
                  </Text>
                  <View className="bg-[#D4AF37]/20 border border-[#D4AF37]/50 px-2 py-0.5 rounded-full">
                    <Text className="text-[#D4AF37] text-[9px] font-black tracking-wider uppercase">
                      Official Partner
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center mt-1">
                  <Text className="text-zinc-400 text-xs font-medium">
                    {formatNum(realFollowerCount)} người theo dõi kênh
                  </Text>
                  {isLoading && (
                    <ActivityIndicator size="small" color="#D4AF37" style={{ marginLeft: 8 }} />
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Quick Action Links */}
          <View className="flex-row items-center justify-between mt-4 pt-3.5 border-t border-zinc-800/80">
            <TouchableOpacity
              onPress={() => safeNavigate("CreatorChannel")}
              className="flex-row items-center"
            >
              <Feather name="globe" size={14} color="#D4AF37" />
              <Text className="text-[#D4AF37] text-xs font-bold ml-1.5">Trang cá nhân</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => safeNavigate("UploadComic")}
              className="flex-row items-center bg-[#D4AF37]/10 px-3 py-1.5 rounded-xl border border-[#D4AF37]/30"
            >
              <Feather name="plus-circle" size={14} color="#D4AF37" />
              <Text className="text-[#D4AF37] text-xs font-black ml-1.5">Tạo tác phẩm mới</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ================= TAB NAVIGATION ================= */}
        <View className="flex-row justify-between px-4 mt-6 border-b border-zinc-900 bg-[#141416]/50">
          {(["overview", "content", "comments", "revenue"] as const).map((tab) => {
            const isSelected = activeTab === tab;
            let tabLabel = "";
            switch (tab) {
              case "overview":
                tabLabel = "Tổng quan";
                break;
              case "content":
                tabLabel = "Nội dung";
                break;
              case "comments":
                tabLabel = "Bình luận";
                break;
              case "revenue":
                tabLabel = "Doanh thu";
                break;
            }

            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                className="pb-3 flex-1 items-center"
                style={{
                  borderBottomWidth: isSelected ? 3 : 0,
                  borderBottomColor: "#D4AF37",
                }}
              >
                <Text
                  className={`text-[13px] font-bold ${
                    isSelected ? "text-[#D4AF37]" : "text-zinc-500"
                  }`}
                >
                  {tabLabel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ================= TỔNG QUAN (OVERVIEW) TAB ================= */}
        {activeTab === "overview" && (
          <View className="px-4 mt-5 space-y-6">

            {/* Range Preset Selector (7 ngày qua / 30 ngày qua) */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white text-base font-black tracking-wide">
                  Chỉ Số Tổng Quan
                </Text>
                <Text className="text-zinc-500 text-xs font-medium">Báo cáo hiệu suất kênh sáng tạo</Text>
              </View>

              {/* Interactive Range Preset Dropdown Selector */}
              <View className="relative z-50">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex-row items-center bg-[#1E1E22] border border-[#D4AF37]/45 px-3 py-1.5 rounded-xl shadow-lg"
                >
                  <Ionicons name="calendar-outline" size={14} color="#D4AF37" />
                  <Text className="text-white text-xs font-black ml-1.5 mr-2">
                    {preset === "7d" ? "7 ngày qua" : "30 ngày qua"}
                  </Text>
                  <Feather
                    name={isDropdownOpen ? "chevron-up" : "chevron-down"}
                    size={14}
                    color="#D4AF37"
                  />
                </TouchableOpacity>

                {/* Dropdown Options Menu Popup */}
                {isDropdownOpen && (
                  <View className="absolute right-0 top-9 w-36 bg-[#18181B] border border-[#D4AF37]/40 rounded-2xl p-1.5 shadow-2xl z-50">
                    <TouchableOpacity
                      onPress={() => {
                        setPreset("7d");
                        setSelectedDayIdx(null);
                        setIsDropdownOpen(false);
                      }}
                      className={`px-3 py-2 rounded-xl flex-row items-center justify-between ${
                        preset === "7d"
                          ? "bg-[#D4AF37]/20 border border-[#D4AF37]/40"
                          : "bg-transparent"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          preset === "7d" ? "text-[#D4AF37]" : "text-zinc-300"
                        }`}
                      >
                        7 ngày qua
                      </Text>
                      {preset === "7d" && (
                        <Feather name="check" size={14} color="#D4AF37" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setPreset("30d");
                        setSelectedDayIdx(null);
                        setIsDropdownOpen(false);
                      }}
                      className={`px-3 py-2 rounded-xl flex-row items-center justify-between mt-1 ${
                        preset === "30d"
                          ? "bg-[#D4AF37]/20 border border-[#D4AF37]/40"
                          : "bg-transparent"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          preset === "30d" ? "text-[#D4AF37]" : "text-zinc-300"
                        }`}
                      >
                        30 ngày qua
                      </Text>
                      {preset === "30d" && (
                        <Feather name="check" size={14} color="#D4AF37" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* ================= 2. TOP KPI CARDS (3 THẺ CHỈ SỐ TỔNG QUAN) ================= */}
            <View className="mt-3 space-y-3">
              {/* Card 1: Total Views (Gold #D4AF37) */}
              <View className="bg-[#17171A] border border-[#D4AF37]/35 rounded-2xl p-4 flex-row items-center justify-between shadow-lg shadow-yellow-500/5">
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center mb-1">
                    <Feather name="eye" size={16} color="#D4AF37" />
                    <Text className="text-[#D4AF37] text-sm font-black tracking-wide uppercase ml-2">
                      TỔNG LƯỢT XEM
                    </Text>
                  </View>
                  <Text className="text-[#D4AF37] text-2xl font-black mt-1">
                    {formatNum(apiTotals.views)}
                  </Text>
                  <Text className="text-zinc-500 text-[10px] font-medium mt-1">
                    Tổng lượt xem trong {preset === "7d" ? "7 ngày qua" : "30 ngày qua"}
                  </Text>
                </View>
                <MiniSparklineChart data={sparklines.views} color="#D4AF37" />
              </View>

              {/* Card 2: Subscribers (Emerald #10B981) */}
              <View className="bg-[#17171A] border border-emerald-500/35 rounded-2xl p-4 flex-row items-center justify-between">
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center mb-1">
                    <Feather name="users" size={16} color="#10B981" />
                    <Text className="text-[#10B981] text-sm font-black tracking-wide uppercase ml-2">
                      NGƯỜI ĐĂNG KÝ
                    </Text>
                  </View>
                  <Text className="text-white text-2xl font-black mt-1">
                    {formatNum(realFollowerCount)}
                  </Text>
                  <Text className="text-zinc-500 text-[10px] font-medium mt-1">
                    +{formatNum(apiTotals.follows)} đăng ký mới trong kì
                  </Text>
                </View>
                <MiniSparklineChart data={sparklines.follows} color="#10B981" />
              </View>

              {/* Card 3: Total Engagement (Rose #F43F5E) */}
              <View className="bg-[#17171A] border border-rose-500/35 rounded-2xl p-4 flex-row items-center justify-between">
                <View className="flex-1 pr-2">
                  <View className="flex-row items-center mb-1">
                    <Feather name="activity" size={16} color="#F43F5E" />
                    <Text className="text-[#F43F5E] text-sm font-black tracking-wide uppercase ml-2">
                      TỔNG TƯƠNG TÁC
                    </Text>
                  </View>
                  <Text className="text-white text-2xl font-black mt-1">
                    {formatNum(totalEngagement)}
                  </Text>
                  <Text className="text-zinc-500 text-[10px] font-medium mt-1">
                    Thích, Bình luận, Lưu, Chia sẻ
                  </Text>
                </View>
                <MiniSparklineChart data={sparklines.engagement} color="#F43F5E" />
              </View>
            </View>

            {/* ================= 3. DIỄN BIẾN HOẠT ĐỘNG (CONNECTED STRAIGHT LINE CHART) ================= */}
            <View className="mt-5 bg-[#17171A] border border-[#D4AF37]/30 rounded-3xl p-5 shadow-2xl shadow-yellow-500/5">
              
              {/* Header Title */}
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-white text-base font-black tracking-wide flex-row items-center">
                    <Feather name="trending-up" size={16} color="#D4AF37" /> Biểu đồ Đường Thẳng
                  </Text>
                  <Text className="text-zinc-400 text-xs font-medium mt-0.5">
                    Xu hướng lượt xem & tương tác liên tục
                  </Text>
                </View>
              </View>

              {/* Interactive Tooltip Card when clicking on a point */}
              {selectedItem ? (
                <LinearGradient
                  colors={["#27221A", "#1A1A1E"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="rounded-2xl p-3.5 mb-4 border border-[#D4AF37]/40 shadow-lg"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={14} color="#D4AF37" />
                      <Text className="text-white text-xs font-black ml-1.5">
                        Ngày {selectedItem.label}
                      </Text>
                    </View>

                    <View className="flex-row items-center space-x-3">
                      <View className="flex-row items-center mr-3 bg-[#D4AF37]/15 px-2 py-0.5 rounded-lg border border-[#D4AF37]/30">
                        <Text className="text-[#D4AF37] text-xs font-black">
                          {formatNum(selectedItem.views)} lượt xem
                        </Text>
                      </View>
                      <View className="flex-row items-center bg-rose-500/15 px-2 py-0.5 rounded-lg border border-rose-500/30">
                        <Text className="text-[#F43F5E] text-xs font-black">
                          {formatNum(selectedItem.engagement)} tương tác
                        </Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              ) : null}

              {activityTrendData.length === 0 ? (
                <View className="h-44 items-center justify-center border border-dashed border-zinc-800/80 rounded-2xl">
                  <Feather name="bar-chart-2" size={26} color="#52525B" />
                  <Text className="text-zinc-500 text-xs font-bold mt-2">
                    Chưa có nhật ký hoạt động trong {preset === "7d" ? "7 ngày qua" : "30 ngày qua"}
                  </Text>
                </View>
              ) : (
                <ConnectedLineChart
                  data={activityTrendData}
                  maxVal={maxActivityVal}
                  selectedIdx={selectedDayIdx}
                  onSelectIdx={setSelectedDayIdx}
                />
              )}

              {/* Chart Legend */}
              <View className="flex-row items-center justify-center space-x-6 mt-4 pt-3 border-t border-zinc-800/80">
                <View className="flex-row items-center">
                  <View className="w-6 h-0.5 bg-[#D4AF37] mr-1.5 shadow-sm shadow-yellow-500" />
                  <View className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] border border-white -ml-4 mr-1.5" />
                  <Text className="text-zinc-300 text-xs font-bold">Lượt xem (Đường vàng)</Text>
                </View>
                <View className="flex-row items-center ml-4">
                  <View className="w-6 h-0.5 bg-[#F43F5E] mr-1.5 shadow-sm shadow-rose-500" />
                  <View className="w-2.5 h-2.5 rounded-full bg-[#F43F5E] border border-white -ml-4 mr-1.5" />
                  <Text className="text-zinc-300 text-xs font-bold">Tương tác (Đường đỏ)</Text>
                </View>
              </View>
            </View>

            {/* ================= 4. CƠ CẤU TƯƠNG TÁC (ENGAGEMENT BREAKDOWN) ================= */}
            <View className="mt-5 bg-[#17171A] border border-zinc-800 rounded-3xl p-5">
              <Text className="text-white text-base font-black tracking-wide">
                Cơ cấu Tương tác
              </Text>
              <Text className="text-zinc-400 text-xs font-medium mt-0.5 mb-4">
                Phân tích chi tiết tỷ lệ tương tác người dùng
              </Text>

              {/* Progress visual bar */}
              <View className="h-4 w-full rounded-full overflow-hidden flex-row bg-zinc-800 mb-4">
                {engagementBreakdown.map((item, idx) => (
                  <View
                    key={idx}
                    style={{
                      width: `${item.pct}%`,
                      backgroundColor: item.color,
                    }}
                  />
                ))}
              </View>

              {/* Detailed Item List */}
              <View className="space-y-2.5">
                {engagementBreakdown.map((item, idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center justify-between bg-[#1E1E22] border border-zinc-800/80 p-3 rounded-2xl"
                  >
                    <View className="flex-row items-center">
                      <View
                        style={{ backgroundColor: item.color }}
                        className="w-8 h-8 rounded-xl items-center justify-center mr-3"
                      >
                        <Feather name={item.icon as any} size={14} color="#FFFFFF" />
                      </View>
                      <View>
                        <Text className="text-[#FFFFFF] text-xs font-bold">{item.type}</Text>
                        <Text className="text-zinc-400 text-[10px] font-bold">
                          {formatNum(item.count)} lượt
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text style={{ color: item.color }} className="text-sm font-black">
                        {item.pct}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* ================= 5. TOP TÁC PHẨM NỔI BẬT (TOP SERIES PERFORMANCE) ================= */}
            <View className="mt-5 bg-[#17171A] border border-zinc-800 rounded-3xl p-5">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-base font-black tracking-wide">
                  Tác Phẩm Nổi Bật
                </Text>
                <TouchableOpacity onPress={() => setActiveTab("content")}>
                  <Text className="text-[#D4AF37] text-xs font-bold">Xem tất cả</Text>
                </TouchableOpacity>
              </View>

              {topSeriesList.length === 0 ? (
                <View className="p-6 items-center justify-center border border-dashed border-zinc-800 rounded-2xl">
                  <Feather name="folder" size={24} color="#52525B" />
                  <Text className="text-zinc-500 text-xs font-bold mt-2">
                    Chưa có tác phẩm nào do bạn đăng tải
                  </Text>
                </View>
              ) : (
                <View className="space-y-3">
                  {topSeriesList.map((series, idx) => (
                    <View
                      key={series.id}
                      className="bg-[#1E1E22] border border-zinc-800 rounded-2xl p-3 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center flex-1 pr-3">
                        {/* Rank Badge #1, #2, #3 */}
                        <View className="w-6 h-6 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 items-center justify-center mr-2.5">
                          <Text className="text-[#D4AF37] text-xs font-black">#{idx + 1}</Text>
                        </View>

                        {/* Series Cover Thumbnail */}
                        <View className="w-11 h-14 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700/60 mr-3 items-center justify-center">
                          {series.coverUrl ? (
                            <Image
                              source={{ uri: series.coverUrl }}
                              className="w-full h-full"
                              resizeMode="cover"
                            />
                          ) : (
                            <View className="w-full h-full items-center justify-center bg-zinc-800">
                              <Feather name="image" size={16} color="#71717A" />
                            </View>
                          )}
                        </View>

                        {/* Title & Category */}
                        <View className="flex-1">
                          <Text className="text-white text-xs font-bold" numberOfLines={1}>
                            {series.title}
                          </Text>
                          <Text className="text-zinc-500 text-[10px] font-medium mt-0.5">
                            {series.category}
                          </Text>
                        </View>
                      </View>

                      <View className="items-end space-y-1">
                        <InteractiveStarRating
                          seriesId={series.id}
                          seriesTitle={series.title}
                          averageRating={series.averageRating}
                          totalRatingsCount={series.totalRatingsCount}
                        />
                        <Text className="text-[#D4AF37] text-xs font-black">
                          {formatNum(series.views)} lượt xem
                        </Text>
                        <Text className="text-[#FFFFFF] text-[10px] font-semibold">
                          {formatNum(series.subs)} theo dõi
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

          </View>
        )}

        {/* ================= 7. DANH SÁCH NỘI DUNG (CONTENT TAB) ================= */}
        {activeTab === "content" && (
          <View className="px-4 mt-5">
            <View className="mb-4">
              <Text className="text-white text-base font-black tracking-wide">
                Nội Dung Đã Xuất Bản ({recentContent.length})
              </Text>
              <Text className="text-zinc-500 text-xs font-medium mt-0.5">
                Tất cả phim & truyện tranh do bạn phát hành
              </Text>
            </View>

            {recentContent.length === 0 ? (
              <View className="p-8 items-center justify-center border border-dashed border-zinc-800 rounded-2xl">
                <Feather name="inbox" size={28} color="#52525B" />
                <Text className="text-zinc-400 text-xs font-bold mt-2">
                  Bạn chưa xuất bản tác phẩm nào
                </Text>
              </View>
            ) : (
              recentContent.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.85}
                  onPress={() => safeNavigate("CreatorChannel")}
                  className="bg-[#17171A] border border-zinc-800 rounded-2xl p-3.5 mb-3.5 shadow-sm"
                >
                  {/* Top Row: Fixed size thumbnail + Content info */}
                  <View className="flex-row items-start">
                    {/* Fixed Size Thumbnail */}
                    <View
                      style={{ width: 64, height: 86, borderRadius: 12, overflow: "hidden" }}
                      className="bg-zinc-800 border border-zinc-700/60 mr-3 items-center justify-center flex-shrink-0"
                    >
                      {item.coverUrl ? (
                        <Image
                          source={{ uri: item.coverUrl }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-full h-full items-center justify-center bg-zinc-800">
                          <Feather name="image" size={20} color="#71717A" />
                        </View>
                      )}
                    </View>

                    {/* Right Content Column */}
                    <View className="flex-1 justify-between" style={{ minHeight: 86 }}>
                      <View>
                        {/* Status Badge, Category & Date */}
                        <View className="flex-row items-center mb-1.5 flex-wrap">
                          <View
                            className={`px-2 py-0.5 rounded border mr-1.5 ${
                              item.status === "PUBLISHED"
                                ? "bg-emerald-500/10 border-emerald-500/20"
                                : "bg-amber-500/10 border-amber-500/20"
                            }`}
                          >
                            <Text
                              className={`text-[9px] font-bold ${
                                item.status === "PUBLISHED" ? "text-emerald-400" : "text-amber-400"
                              }`}
                            >
                              {item.statusText}
                            </Text>
                          </View>
                          <View className="bg-zinc-800 px-1.5 py-0.5 rounded mr-1.5">
                            <Text className="text-zinc-400 text-[9px] font-bold">
                              {item.category}
                            </Text>
                          </View>
                          <Text className="text-zinc-500 text-[10px] font-medium">{item.date}</Text>
                        </View>

                        {/* Series Title */}
                        <Text className="text-white text-sm font-bold leading-snug" numberOfLines={2}>
                          {item.title}
                        </Text>
                      </View>

                      {/* Real Views */}
                      <View className="flex-row items-center mt-2">
                        <Feather name="eye" size={12} color="#D4AF37" />
                        <Text className="text-[#D4AF37] text-xs font-bold ml-1.5">
                          {item.formattedViews} lượt xem
                        </Text>
                      </View>
                    </View>

                    {/* Arrow Right Action */}
                    <View className="p-1 pl-1">
                      <Feather name="chevron-right" size={18} color="#71717A" />
                    </View>
                  </View>

                  {/* Bottom Row: Rating */}
                  <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-zinc-800/80">
                    <InteractiveStarRating
                      seriesId={item.id}
                      seriesTitle={item.title}
                      averageRating={item.averageRating}
                      totalRatingsCount={item.totalRatingsCount}
                    />

                    <Text className="text-zinc-500 text-[11px] font-semibold">
                      Chạm để xem chi tiết
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* ================= 7. BÌNH LUẬN MỚI NHẤT (COMMENTS TAB) ================= */}
        {activeTab === "comments" && (
          <View className="px-4 mt-5">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-base font-black tracking-wide">
                Bình luận của độc giả
              </Text>
            </View>

            <View className="p-8 items-center justify-center border border-dashed border-zinc-800 rounded-2xl">
              <MaterialCommunityIcons name="comment-text-outline" size={32} color="#52525B" />
              <Text className="text-zinc-400 text-xs font-bold mt-2 text-center">
                Chưa có bình luận mới nào trên tác phẩm của bạn
              </Text>
            </View>
          </View>
        )}

        {/* ================= DOANH THU (REVENUE TAB) ================= */}
        {activeTab === "revenue" && (
          <View className="px-4 mt-5">
            <Text className="text-white text-base font-black tracking-wide mb-1">
              Quản Lý Tài Chính & Doanh Thu
            </Text>
            <Text className="text-zinc-500 text-xs font-medium mb-4">Dữ liệu từ Ví hệ thống TaleX Coins</Text>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => safeNavigate("CreatorMonetization")}
              className="mb-5 flex-row items-center rounded-3xl border border-[#D4AF37]/45 bg-[#17171A] p-5 shadow-lg shadow-yellow-500/10"
            >
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37]/15">
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={26}
                  color="#D4AF37"
                />
              </View>
              <View className="flex-1">
                <Text className="text-base font-black text-white">
                  Trung tâm Kiếm tiền
                </Text>
                <Text className="mt-1 text-xs font-semibold leading-5 text-zinc-400">
                  Hoàn thiện hồ sơ & thông tin tài khoản nhận tiền
                </Text>
              </View>
              <Feather name="chevron-right" size={22} color="#D4AF37" />
            </TouchableOpacity>

            {/* Wallet Balance Card */}
            <LinearGradient
              colors={["#27221A", "#17171A"]}
              className="border border-[#D4AF37]/30 rounded-3xl p-5 mb-5"
            >
              <Text className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                Số Dư Coin Hiện Tại
              </Text>
              <Text className="text-[#D4AF37] text-3xl font-black mt-2">
                {formatNum(wallet.balance || 0)} Coins
              </Text>
              <Text className="text-zinc-500 text-[10px] mt-1.5 font-bold">
                Tổng thu nhập tích lũy: {formatNum(wallet.totalEarned || 0)} Coins
              </Text>

              <TouchableOpacity className="bg-[#D4AF37] h-11 justify-center items-center rounded-xl mt-5 shadow-lg shadow-yellow-500/10 active:opacity-90">
                <Text className="text-zinc-950 font-black text-xs uppercase tracking-wide">
                  Yêu Cầu Rút Tiền Ngay
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
