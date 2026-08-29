import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
  Image,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { useVideoPlayer, VideoView } from "expo-video";
import Toast from "react-native-toast-message";
import { useReward } from "@/context/RewardContext";
import {
  completeAdMissionSession,
  getMissionAds,
  startAdMissionSession,
  trackMissionAdClick,
  trackMissionAdImpression,
} from "@/services/rewardService";
import type { AdCampaignData, AdSessionData } from "@/types/reward";
import type { RootStackParamList } from "@/navigation/RootNavigator";

type WatchAdScreenRouteProp = RouteProp<RootStackParamList, "WatchAd">;

type AdMissionStatus =
  | "loading"
  | "watching"
  | "completing"
  | "success"
  | "error";

const WATCH_SECONDS = 15;
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

function pickRandomAd(ads: AdCampaignData[]) {
  if (ads.length === 0) return null;
  return ads[Math.floor(Math.random() * ads.length)] ?? ads[0];
}

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  return `00:${String(safeSeconds).padStart(2, "0")}`;
}

export default function WatchAdScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<WatchAdScreenRouteProp>();
  const { missionCode = "WATCH_AD_DAILY", rewardAmount = 1000, missionTitle } = route.params || {};

  const { refreshRewardData } = useReward();
  const [status, setStatus] = useState<AdMissionStatus>("loading");
  const [session, setSession] = useState<AdSessionData | null>(null);
  const [ad, setAd] = useState<AdCampaignData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(WATCH_SECONDS);
  const [isMuted, setIsMuted] = useState(false);

  const hasCompletedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);

  const isVideo = ad?.mediaType?.toUpperCase() === "VIDEO" && Boolean(ad?.mediaUrl);

  const videoSource = useMemo(() => {
    if (!isVideo || !ad?.mediaUrl) return null;
    return { uri: ad.mediaUrl };
  }, [ad?.mediaUrl, isVideo]);

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = isMuted;
  });

  // Tải ad và tạo session
  const loadAdMission = useCallback(async () => {
    const normalizedMissionCode = (missionCode || "").trim() || "WATCH_AD_DAILY";

    setStatus("loading");
    setErrorMessage("");
    setSession(null);
    setAd(null);
    setCountdown(WATCH_SECONDS);
    hasCompletedRef.current = false;

    try {
      const [sessionData, ads] = await Promise.all([
        startAdMissionSession(normalizedMissionCode),
        getMissionAds(),
      ]);

      const selectedAd = pickRandomAd(ads);
      if (!selectedAd) {
        setErrorMessage("Hiện tại chưa có quảng cáo phù hợp để phát.");
        setStatus("error");
        return;
      }

      setSession(sessionData);
      sessionIdRef.current = sessionData.sessionId;
      setAd(selectedAd);
      setStatus("watching");

      // Tự động play video nếu có
      if (player && selectedAd.mediaType?.toUpperCase() === "VIDEO") {
        try {
          player.play();
        } catch {}
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể khởi động phiên quảng cáo.");
      setStatus("error");
    }
  }, [missionCode, player]);

  useEffect(() => {
    void loadAdMission();

    return () => {
      try {
        player.pause();
      } catch {}
    };
  }, [loadAdMission, player]);

  // Hoàn tất nhận thưởng khi countdown về 0
  const completeCurrentSession = useCallback(async () => {
    const currentSessionId = sessionIdRef.current || session?.sessionId;
    if (!currentSessionId || hasCompletedRef.current) return;

    hasCompletedRef.current = true;
    setStatus("completing");

    try {
      try {
        player.pause();
      } catch {}

      await completeAdMissionSession(currentSessionId);

      // Track impression cho nhà quảng cáo
      if (ad?.campaignId) {
        trackMissionAdImpression(ad.campaignId).catch((error) => {
          console.warn("[WatchAdScreen] Impression tracking failed:", error);
        });
      }

      // Refresh lại số dư ví và nhiệm vụ trên toàn app
      await refreshRewardData();

      Toast.show({
        type: "success",
        text1: "Nhận xu thành công!",
        text2: `+${rewardAmount.toLocaleString("vi-VN")} Xu đã được cộng vào ví của bạn.`,
      });

      setStatus("success");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Lỗi xác nhận thưởng từ máy chủ.");
      setStatus("error");
    }
  }, [ad?.campaignId, player, refreshRewardData, rewardAmount, session?.sessionId]);

  // Bộ đếm ngược 15 giây độc lập (chuẩn xác như Web)
  useEffect(() => {
    if (status !== "watching") return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          void completeCurrentSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [completeCurrentSession, status]);

  // Chặn người dùng thoát sớm khi đang xem
  const handleExitAttempt = useCallback(() => {
    if (status === "success" || status === "error") {
      navigation.goBack();
      return;
    }

    Alert.alert(
      "Dừng xem quảng cáo?",
      `Bạn còn ${countdown} giây để nhận +${rewardAmount} Xu. Nếu rời đi bây giờ, bạn sẽ không nhận được thưởng.`,
      [
        { text: "Xem Tiếp", style: "cancel" },
        {
          text: "Rời Đi",
          style: "destructive",
          onPress: () => navigation.goBack(),
        },
      ],
    );
  }, [countdown, navigation, rewardAmount, status]);

  // Intercept nút Back cứng của Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      handleExitAttempt();
      return true;
    });

    return () => backHandler.remove();
  }, [handleExitAttempt]);

  const handleSponsorPress = useCallback(() => {
    if (!ad?.targetUrl) return;
    if (ad.campaignId) {
      trackMissionAdClick(ad.campaignId).catch(console.error);
    }
    Linking.openURL(ad.targetUrl).catch(console.error);
  }, [ad]);

  const progressPercentage = Math.max(
    0,
    Math.min(100, ((WATCH_SECONDS - countdown) / WATCH_SECONDS) * 100),
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent />

      {/* 1. MEDIA DISPLAY (VIDEO OR IMAGE) */}
      <View style={StyleSheet.absoluteFillObject} className="items-center justify-center bg-black">
        {isVideo && videoSource ? (
          <VideoView
            player={player}
            style={{ width: screenWidth, height: screenHeight }}
            contentFit="contain"
            nativeControls={false}
          />
        ) : ad?.mediaUrl ? (
          <Image
            source={{ uri: ad.mediaUrl }}
            style={{ width: screenWidth, height: screenHeight }}
            resizeMode="contain"
          />
        ) : (
          <View className="items-center justify-center">
            <ActivityIndicator size="large" color="#D4AF37" />
          </View>
        )}
      </View>

      {/* Dark overlay gradients for top and bottom controls */}
      <LinearGradient
        colors={["rgba(0,0,0,0.85)", "rgba(0,0,0,0.4)", "transparent"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 140 }}
        pointerEvents="none"
      />

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.92)"]}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 180 }}
        pointerEvents="none"
      />

      {/* 2. TOP FLOATING HUD BAR */}
      <SafeAreaView edges={["top"]} className="px-4 pt-2">
        <View className="flex-row items-center justify-between">
          {/* Exit / Close Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleExitAttempt}
            style={{ backgroundColor: "rgba(0,0,0,0.65)", borderColor: "rgba(255,255,255,0.15)" }}
            className="h-10 w-10 items-center justify-center rounded-full border"
          >
            <Feather name="x" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Center Countdown Badge */}
          <View
            style={{ backgroundColor: "rgba(0,0,0,0.75)", borderColor: "rgba(212, 175, 55, 0.4)" }}
            className="flex-row items-center px-3.5 py-1.5 rounded-full border shadow-lg"
          >
            <Feather name="clock" size={13} color="#D4AF37" />
            <Text className="text-white font-black text-xs ml-1.5 tracking-wider">
              {formatCountdown(countdown)}
            </Text>
            <View className="w-1 h-1 rounded-full bg-zinc-500 mx-2" />
            <FontAwesome5 name="coins" size={11} color="#D4AF37" />
            <Text className="text-[#D4AF37] font-black text-xs ml-1">
              +{rewardAmount}
            </Text>
          </View>

          {/* Sound Mute Toggle Button */}
          {isVideo ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                const nextMuted = !isMuted;
                setIsMuted(nextMuted);
                if (player) player.muted = nextMuted;
              }}
              style={{ backgroundColor: "rgba(0,0,0,0.65)", borderColor: "rgba(255,255,255,0.15)" }}
              className="h-10 w-10 items-center justify-center rounded-full border"
            >
              <Ionicons
                name={isMuted ? "volume-mute-outline" : "volume-high-outline"}
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          ) : (
            <View className="w-10 h-10" />
          )}
        </View>

        {/* Progress Bar under top bar */}
        <View className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
          <View
            style={{ width: `${progressPercentage}%`, backgroundColor: "#D4AF37" }}
            className="h-full rounded-full"
          />
        </View>
      </SafeAreaView>

      {/* 3. BOTTOM FLOATING SPONSOR CARD */}
      <View style={{ position: "absolute", bottom: 30, left: 16, right: 16 }}>
        {ad && (
          <View
            style={{ backgroundColor: "rgba(21, 20, 24, 0.92)", borderColor: "rgba(255, 255, 255, 0.12)" }}
            className="p-4 rounded-3xl border shadow-2xl"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <View className="flex-row items-center mb-1">
                  <View
                    style={{ backgroundColor: "rgba(212, 175, 55, 0.2)", borderColor: "rgba(212, 175, 55, 0.4)" }}
                    className="px-2 py-0.5 rounded border mr-2"
                  >
                    <Text className="text-[9px] font-black text-[#D4AF37] uppercase">
                      TÀI TRỢ
                    </Text>
                  </View>
                  <Text className="text-white text-sm font-black" numberOfLines={1}>
                    {ad.title || "Nhà Tài Trợ TaleX"}
                  </Text>
                </View>

                <Text className="text-zinc-400 text-xs" numberOfLines={1}>
                  {ad.targetUrl ? "Nhấn để tìm hiểu thêm chi tiết" : "Xem hết quảng cáo để nhận thưởng xu"}
                </Text>
              </View>

              {ad.targetUrl ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleSponsorPress}
                  style={{ backgroundColor: "#D4AF37" }}
                  className="px-4 py-2 rounded-xl flex-row items-center shadow-md"
                >
                  <Text className="text-black font-black text-xs mr-1">Khám Phá</Text>
                  <Feather name="external-link" size={13} color="#000000" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}
      </View>

      {/* 4. SUCCESS CELEBRATION MODAL OVERLAY */}
      {status === "success" && (
        <View
          style={StyleSheet.absoluteFillObject}
          className="items-center justify-center bg-black/90 p-6 z-50"
        >
          <View
            style={{ backgroundColor: "#161519", borderColor: "rgba(212, 175, 55, 0.45)" }}
            className="w-full max-w-sm rounded-3xl p-6 border items-center shadow-2xl"
          >
            {/* Pulsing Gold Coin Icon */}
            <View
              style={{ backgroundColor: "rgba(212, 175, 55, 0.2)", borderColor: "rgba(212, 175, 55, 0.5)" }}
              className="w-20 h-20 rounded-full border items-center justify-center mb-4 shadow-xl"
            >
              <FontAwesome5 name="gift" size={36} color="#D4AF37" />
            </View>

            <Text className="text-xl font-black text-white text-center">
              Hoàn Thành Xuất Sắc!
            </Text>

            <Text className="text-zinc-400 text-xs text-center mt-1.5 px-3">
              Bạn đã xem hết quảng cáo và nhận được phần thưởng:
            </Text>

            {/* Big Coin Reward Badge */}
            <View
              style={{ backgroundColor: "rgba(212, 175, 55, 0.15)", borderColor: "rgba(212, 175, 55, 0.4)" }}
              className="my-5 flex-row items-center border px-5 py-2.5 rounded-2xl"
            >
              <FontAwesome5 name="coins" size={20} color="#D4AF37" />
              <Text className="text-2xl font-black text-[#D4AF37] ml-3">
                +{rewardAmount.toLocaleString("vi-VN")} XU
              </Text>
            </View>

            {/* Back Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.goBack()}
              style={{ backgroundColor: "#D4AF37" }}
              className="w-full h-12 rounded-2xl items-center justify-center shadow-lg"
            >
              <Text className="text-black font-black text-xs uppercase tracking-wider">
                NHẬN THƯỞNG & TRỞ VỀ
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 5. ERROR STATE MODAL OVERLAY */}
      {status === "error" && (
        <View
          style={StyleSheet.absoluteFillObject}
          className="items-center justify-center bg-black/90 p-6 z-50"
        >
          <View
            style={{ backgroundColor: "#181416", borderColor: "rgba(239, 68, 68, 0.35)" }}
            className="w-full max-w-sm rounded-3xl p-6 border items-center shadow-2xl"
          >
            <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />

            <Text className="text-lg font-black text-white text-center mt-3">
              Không Thể Hoàn Tất
            </Text>

            <Text className="text-red-400 text-xs text-center mt-2 px-2 leading-relaxed">
              {errorMessage || "Có lỗi xảy ra trong quá trình nhận thưởng. Vui lòng thử lại sau."}
            </Text>

            <View className="w-full flex-row space-x-3 mt-6">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.goBack()}
                className="flex-1 h-11 rounded-xl bg-white/10 items-center justify-center"
              >
                <Text className="text-zinc-300 font-bold text-xs">Thoát</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => void loadAdMission()}
                style={{ backgroundColor: "#D4AF37" }}
                className="flex-1 h-11 rounded-xl items-center justify-center"
              >
                <Text className="text-black font-black text-xs">Thử Lại</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
