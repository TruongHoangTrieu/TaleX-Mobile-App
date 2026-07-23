import React, { useState, useEffect, useMemo } from "react";
import {
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { Feather, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { getComicById } from "./comicMockData";
import {
  getPublicSeriesDetail,
  getSeriesSeasons,
  getSeasonEpisodes,
  getPublicCombos,
  SeasonItem,
  EpisodeItem,
  ComboItem,
} from "@/services/series";
import { useCreatorFollow } from "@/hooks/useCreatorFollow";
import { FollowButton } from "@/components/FollowButton";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ShareButton } from "@/components/ShareButton";
import { FollowersModal } from "@/components/FollowersModal";
import { getEpisodeLikes, getMyLikedEpisodes } from "@/services/like";

type ComicDetailRouteParams = {
  comicId?: string;
};

export default function ComicDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { comicId } = (route.params || {}) as ComicDetailRouteParams;

  const [comic, setComic] = useState<any>(() => {
    if (comicId && comicId.length < 10) {
      return getComicById(comicId);
    }
    return null;
  });

  const [seasons, setSeasons] = useState<SeasonItem[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [episodesMap, setEpisodesMap] = useState<Record<string, EpisodeItem[]>>({});
  const [combos, setCombos] = useState<ComboItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [totalLikes, setTotalLikes] = useState(0);
  const [baseFollowerCount, setBaseFollowerCount] = useState(0);
  const [initialIsFollowing, setInitialIsFollowing] = useState<boolean | null>(null);

  const creatorAccountId = comic?.creatorAccountId || comic?.authorAccountId;
  const {
    isFollowing,
    toggleFollow,
    isMutating: isFollowMutating,
  } = useCreatorFollow(creatorAccountId);

  // Capture trạng thái follow ban đầu (chỉ set 1 lần)
  useEffect(() => {
    if (initialIsFollowing === null && isFollowing !== undefined) {
      setInitialIsFollowing(isFollowing);
    }
  }, [isFollowing, initialIsFollowing]);

  // Tính số người theo dõi hiển thị (giống logic web)
  const displayFollowerCount = useMemo(() => {
    const base = baseFollowerCount;
    if (initialIsFollowing === null) {
      // Chưa biết trạng thái ban đầu — dùng base, đảm bảo >= 1 nếu đang follow
      return isFollowing ? Math.max(1, base) : base;
    }
    if (initialIsFollowing) {
      // Ban đầu đã follow: unfollow thì trừ 1
      return isFollowing ? Math.max(1, base) : Math.max(0, base - 1);
    } else {
      // Ban đầu chưa follow: follow thì cộng 1
      return isFollowing ? Math.max(1, base + 1) : base;
    }
  }, [baseFollowerCount, isFollowing, initialIsFollowing]);

  const sortedSeasons = useMemo(
    () => [...seasons].sort((a, b) => a.seasonNumber - b.seasonNumber),
    [seasons]
  );
  const activeSeasonId =
    selectedSeasonId || (sortedSeasons.length > 0 ? sortedSeasons[0].seasonId : null);
  const currentEpisodes: EpisodeItem[] = activeSeasonId
    ? (episodesMap[activeSeasonId] || []).slice().sort(
        (a, b) => a.episodeNumber - b.episodeNumber
      )
    : [];

  // totalLikes và totalViews từ episodes (fallback)
  const episodeTotalViews = useMemo(() => {
    let total = 0;
    Object.values(episodesMap).forEach((eps) => {
      eps.forEach((ep) => { total += ep.views || 0; });
    });
    return total;
  }, [episodesMap]);

  const totalViews = useMemo(() => {
    if (comic?.views != null && comic.views > 0) return comic.views;
    return episodeTotalViews;
  }, [comic, episodeTotalViews]);

  const seriesCombos = useMemo(() => {
    const seasonIds = new Set(seasons.map((s) => s.seasonId));
    return combos.filter((combo) => {
      if (!combo.episodes || combo.episodes.length === 0) return false;
      return combo.episodes.some(
        (ep) =>
          (ep.seasonId && seasonIds.has(ep.seasonId)) ||
          (comic?.title &&
            ep.seriesTitle?.toLowerCase() === comic.title.toLowerCase())
      );
    });
  }, [combos, seasons, comic]);

  const loadData = React.useCallback(
    async (isSilent = false) => {
      const isMock = !comicId || comicId.length < 10;
      if (isMock) {
        setComic(getComicById(comicId));
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!isSilent) {
        setLoading(true);
      }

      try {
        // 1. Lấy danh sách episode đã thích của user (nếu đã đăng nhập)
        const myLikedEpIds = new Set<string>();
        try {
          const myLikesRes = await getMyLikedEpisodes(0, 200);
          if (myLikesRes && myLikesRes.content) {
            myLikesRes.content.forEach((item) => {
              if (item.episodeId) myLikedEpIds.add(item.episodeId);
            });
          }
        } catch (e) {
          // Chưa đăng nhập hoặc lỗi fetch
        }

        let seriesBaseLikes = 0;

        // 2. Fetch series detail
        const detailRes = await getPublicSeriesDetail(comicId);
        if (detailRes && detailRes.code === 200 && detailRes.data) {
          const detail = detailRes.data;
          if (detail.status === "HIDDEN") {
            Alert.alert("Thông báo", "Tác phẩm này đã bị ẩn bởi tác giả.", [
              { text: "OK", onPress: () => navigation.goBack() },
            ]);
            return;
          }

          seriesBaseLikes = detail.likes ?? detail.totalLikes ?? 0;

          setComic({
            id: detail.seriesId || detail.id,
            title: detail.title,
            contentType: detail.contentType,
            creatorAccountId:
              detail.accountId ||
              detail.creatorAccountId ||
              detail.authorAccountId ||
              detail.creator?.accountId,
            creatorId: detail.creatorId || detail.creator?.creatorId,
            image: detail.coverUrl
              ? { uri: detail.coverUrl }
              : detail.thumbnailUrl
                ? { uri: detail.thumbnailUrl }
                : require("@assets/comic1.webp"),
            coverUrl: detail.coverUrl,
            bannerUrl: detail.bannerUrl,
            author:
              detail.creatorName || detail.creator?.username || detail.author,
            creatorAvatar: detail.creatorAvatar || null,
            totalCreatorFollowers: detail.totalCreatorFollowers || 0,
            status:
              detail.status === "PUBLISHED"
                ? "Đã xuất bản"
                : detail.status === "DRAFT"
                  ? "Bản nháp"
                  : detail.status,
            views: detail.views ?? detail.totalViews ?? 0,
            rating: detail.rating,
            description: detail.description,
            categories: detail.categories || [],
            tags: detail.tags || [],
            ageRating: detail.ageRating,
            language: detail.language,
            tag: detail.tag,
            chapters: [],
          });
          setBaseFollowerCount(detail.totalCreatorFollowers ?? 0);
        }

        // 3. Fetch seasons & episodes
        const seasonsRes = await getSeriesSeasons(comicId);
        if (seasonsRes && seasonsRes.code === 200 && seasonsRes.data && seasonsRes.data.length > 0) {
          const sorted = [...seasonsRes.data].sort(
            (a, b) => a.seasonNumber - b.seasonNumber
          );
          setSeasons(sorted);
          setSelectedSeasonId((prev) => prev || sorted[0].seasonId);

          const newEpisodesMap: Record<string, EpisodeItem[]> = {};
          const allEpisodesList: EpisodeItem[] = [];

          await Promise.all(
            sorted.map(async (se) => {
              try {
                const epRes = await getSeasonEpisodes(se.seasonId);
                if (epRes && epRes.code === 200 && epRes.data) {
                  const eps: EpisodeItem[] = epRes.data;
                  newEpisodesMap[se.seasonId] = eps;
                  allEpisodesList.push(...eps);
                }
              } catch (err) {
                console.error("Lỗi lấy tập của season:", err);
              }
            })
          );

          setEpisodesMap(newEpisodesMap);

          // 4. Fetch số lượng likes thực tế cho TẤT CẢ các tập trong Series (dùng size=100)
          let calculatedTotalLikes = 0;
          await Promise.all(
            allEpisodesList.map(async (ep) => {
              let epLikes = ep.likes || 0;
              try {
                const likesRes = await getEpisodeLikes(ep.episodeId, 0, 100);
                const listLikesCount =
                  likesRes?.totalElements ??
                  likesRes?.numberOfElements ??
                  likesRes?.content?.length ??
                  0;
                epLikes = Math.max(epLikes, listLikesCount);
              } catch (e) {
                // Ignore error for individual episode likes
              }

              if (myLikedEpIds.has(ep.episodeId)) {
                epLikes = Math.max(epLikes, 1);
              }

              calculatedTotalLikes += epLikes;
            })
          );

          // 5. Kết quả = Max của (Base Series Likes, Tổng Likes tính từ từng tập)
          setTotalLikes(Math.max(seriesBaseLikes, calculatedTotalLikes));
        }

        getPublicCombos()
          .then(setCombos)
          .catch(() => setCombos([]));
      } catch (err) {
        console.error("Lỗi lấy dữ liệu bộ truyện:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [comicId, navigation]
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  useFocusEffect(
    React.useCallback(() => {
      // Reload ngầm khi chuyển focus về màn hình này
      loadData(true);
    }, [loadData])
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  if (loading || !comic) {
    return (
      <SafeAreaView className="flex-1 bg-[#0B0B0C] items-center justify-center">
        <ActivityIndicator size="large" color="#D4AF37" />
        <Text className="text-zinc-500 text-xs mt-3">
          Đang tải chi tiết truyện...
        </Text>
      </SafeAreaView>
    );
  }

  const isComic =
    !comic.contentType ||
    String(comic.contentType).toUpperCase() === "COMIC";

  const firstEpisode = currentEpisodes.length > 0 ? currentEpisodes[0] : null;

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#0B0B0C]">
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0C" />

      {/* ── HEADER ── */}
      <View className="h-[56px] px-4 flex-row items-center justify-center relative border-b border-white/5">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute left-4 w-10 h-10 items-center justify-center"
          activeOpacity={0.75}
        >
          <Feather name="arrow-left" size={22} color="#E5E0D8" />
        </TouchableOpacity>
        <Text className="text-[#E5E0D8] text-[16px] font-bold" numberOfLines={1}>
          {comic.title}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D4AF37"
            colors={["#D4AF37"]}
          />
        }
      >
        {/* ── 1. BACKDROP BANNER ── */}
        <View style={{ width: "100%", height: 140, overflow: "hidden" }}>
          {comic.bannerUrl || comic.coverUrl ? (
            <ImageBackground
              source={{ uri: comic.bannerUrl || comic.coverUrl }}
              style={{ width: "100%", height: "100%" }}
              blurRadius={20}
            >
              <View style={{ flex: 1, backgroundColor: "rgba(11,11,12,0.55)" }} />
            </ImageBackground>
          ) : (
            <View style={{ flex: 1, backgroundColor: "#1A1A1F" }} />
          )}
          <LinearGradient
            colors={["transparent", "#0B0B0C"]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80 }}
          />
        </View>

        {/* ── 2. MAIN INFO ── */}
        <View className="px-4" style={{ marginTop: -130 }}>
          <View className="flex-row gap-4">
            {/* Poster */}
            <View
              className={`rounded-2xl overflow-hidden border border-white/10 bg-[#1A1A1F] ${
                isComic ? "w-[110px] h-[160px]" : "w-[165px] h-[100px]"
              }`}
              style={{ elevation: 8 }}
            >
              <Image
                source={comic.image}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
              <View className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70">
                <Text className="text-[9px] font-black text-white uppercase tracking-wide">
                  {isComic ? "Truyện tranh" : "Phim bộ"}
                </Text>
              </View>
            </View>

            {/* Info text */}
            <View className="flex-1" style={{ paddingTop: 60 }}>
              {/* Badges */}
              <View className="flex-row flex-wrap gap-1.5 mb-2">
                {comic.ageRating ? (
                  <View className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20">
                    <Text className="text-[10px] font-black text-red-400">
                      {comic.ageRating}
                    </Text>
                  </View>
                ) : null}
                {comic.language ? (
                  <View className="flex-row items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                    <MaterialIcons name="language" size={10} color="#D4AF37" />
                    <Text className="text-[10px] font-semibold text-gray-300">
                      {comic.language.toUpperCase()}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text className="text-white text-[20px] font-black leading-tight" numberOfLines={3}>
                {comic.title}
              </Text>
              {comic.author ? (
                <Text className="text-gray-400 mt-1 text-[13px]" numberOfLines={1}>
                  Tác giả: {comic.author}
                </Text>
              ) : null}
            </View>
          </View>

          {/* ── 3. STATS BAR ── */}
          <View className="flex-row mt-5 bg-[#17171C] rounded-2xl border border-white/5 p-4">
            <View className="flex-1 items-center">
              <View className="flex-row items-center gap-1">
                <Feather name="eye" size={13} color="#D4AF37" />
                <Text className="text-white font-bold text-[14px]">
                  {totalViews >= 1000
                    ? `${(totalViews / 1000).toFixed(1)}K`
                    : totalViews}
                </Text>
              </View>
              <Text className="text-gray-500 text-[11px] mt-0.5">Lượt xem</Text>
            </View>
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.05)" }} />
            <View className="flex-1 items-center">
              <View className="flex-row items-center gap-1">
                <FontAwesome name="heart" size={13} color="#ef4444" />
                <Text className="text-white font-bold text-[14px]">
                  {totalLikes >= 1000
                    ? `${(totalLikes / 1000).toFixed(1)}K`
                    : totalLikes}
                </Text>
              </View>
              <Text className="text-gray-500 text-[11px] mt-0.5">Lượt thích</Text>
            </View>
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.05)" }} />
            <View className="flex-1 items-center">
              <View className="flex-row items-center gap-1">
                <Feather name="layers" size={13} color="#D4AF37" />
                <Text className="text-white font-bold text-[14px]">
                  {seasons.length || comic.chapters?.length || 0}
                </Text>
              </View>
              <Text className="text-gray-500 text-[11px] mt-0.5">Seasons</Text>
            </View>
          </View>

          {/* ── 4. CATEGORIES & TAGS ── */}
          {((comic.categories && comic.categories.length > 0) ||
            (comic.tags && comic.tags.length > 0)) && (
            <View className="flex-row flex-wrap gap-2 mt-4">
              {(comic.categories || []).map((cat: any) => (
                <View
                  key={cat.categoryId}
                  className="px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25"
                >
                  <Text className="text-[#D4AF37] text-[11px] font-semibold">
                    {cat.categoryName}
                  </Text>
                </View>
              ))}
              {(comic.tags || []).map((tag: any) => (
                <View
                  key={tag.tagId}
                  className="px-3 py-1 rounded-full bg-white/[0.03] border border-white/10"
                >
                  <Text className="text-gray-400 text-[11px] font-medium">
                    #{tag.tagName}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* ── 5. CREATOR CARD ── */}
          {creatorAccountId ? (
            <View className="flex-row items-center justify-between mt-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
              <TouchableOpacity
                onPress={() => setShowFollowersModal(true)}
                className="flex-row items-center gap-3 flex-1 mr-3"
                activeOpacity={0.75}
              >
                <View className="w-10 h-10 rounded-full overflow-hidden bg-[#252830] border border-white/10">
                  {comic.creatorAvatar ? (
                    <Image
                      source={{ uri: comic.creatorAvatar }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Text className="text-[#D4AF37] text-[16px] font-black">
                        {comic.author?.charAt(0)?.toUpperCase() || "?"}
                      </Text>
                    </View>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                    Tác giả
                  </Text>
                  <Text className="text-[13px] font-black text-gray-200" numberOfLines={1}>
                    {comic.author}
                  </Text>
                  <Text className="text-[10px] text-gray-500 mt-0.5">
                    {displayFollowerCount.toLocaleString("vi-VN")} người theo dõi
                  </Text>
                </View>
              </TouchableOpacity>
              <FollowButton
                isFollowing={isFollowing}
                onFollowToggle={toggleFollow}
                isMutating={isFollowMutating}
                size="small"
              />
            </View>
          ) : null}

          {/* ── 6. BOOKMARK & SHARE ── */}
          {(() => {
            const activeEpId = firstEpisode?.episodeId || comicId;
            return (
              <View className="flex-row items-center gap-3 mt-3">
                <BookmarkButton
                  episodeId={activeEpId}
                  contentType="COMIC"
                  size="sm"
                  showLabel
                />
                <ShareButton
                  episodeId={activeEpId}
                  title={comic?.title || "Truyện tranh TaleX"}
                  size="sm"
                  showLabel
                />
              </View>
            );
          })()}

          {creatorAccountId && (
            <FollowersModal
              visible={showFollowersModal}
              creatorAccountId={creatorAccountId}
              onClose={() => setShowFollowersModal(false)}
            />
          )}

          {/* ── 7. MÔ TẢ ── */}
          {comic.description ? (
            <View className="mt-5">
              <Text className="text-[#E5E0D8] text-[15px] font-bold mb-2">
                Giới thiệu nội dung
              </Text>
              <Text
                className="text-gray-400 leading-[22px] text-[13px]"
                numberOfLines={showFullDesc ? undefined : 4}
              >
                {comic.description}
              </Text>
              {comic.description.length > 150 && (
                <TouchableOpacity
                  onPress={() => setShowFullDesc(!showFullDesc)}
                  activeOpacity={0.7}
                  className="mt-1"
                >
                  <Text className="text-[#D4AF37] text-[12px] font-bold">
                    {showFullDesc ? "Thu gọn ▲" : "Xem thêm ▼"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {/* ── 8. COMBO SECTION ── */}
          {seriesCombos.length > 0 && (
            <View className="mt-6">
              <View className="flex-row items-center gap-2 mb-3">
                <View className="flex-row items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                  <FontAwesome name="star" size={10} color="#D4AF37" />
                  <Text className="text-[10px] font-black text-[#D4AF37] uppercase tracking-wider">
                    Combo Ưu Đãi Độc Quyền
                  </Text>
                </View>
              </View>
              <Text className="text-white text-[16px] font-bold mb-1">
                Mua trọn gói — Tiết kiệm đến 40%
              </Text>
              <Text className="text-gray-500 text-[12px] mb-4">
                Mở khóa nhiều tập cùng lúc với mức giá tốt nhất.
              </Text>
              {seriesCombos.map((combo) => {
                const originalPrice = combo.originalPriceVnd ?? combo.priceVnd;
                const discount =
                  originalPrice > combo.priceVnd
                    ? Math.round(
                        ((originalPrice - combo.priceVnd) / originalPrice) * 100
                      )
                    : 0;
                const epCount = combo.episodes?.length ?? 0;
                return (
                  <View
                    key={combo.comboId}
                    className="mb-3 bg-[#17171C] border border-white/10 rounded-2xl p-4"
                  >
                    <View className="flex-row items-start justify-between">
                      <Text className="text-white font-bold text-[14px] flex-1 mr-2">
                        {combo.title}
                      </Text>
                      {discount > 0 && (
                        <View className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                          <Text className="text-[10px] font-black text-red-400">
                            -{discount}%
                          </Text>
                        </View>
                      )}
                    </View>
                    {combo.description ? (
                      <Text className="text-gray-400 text-[12px] mt-1" numberOfLines={2}>
                        {combo.description}
                      </Text>
                    ) : null}
                    <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-white/5">
                      <View>
                        <Text className="text-gray-500 text-[11px]">
                          {epCount} tập bao gồm
                        </Text>
                        {originalPrice > combo.priceVnd ? (
                          <Text className="text-gray-600 text-[11px] line-through">
                            {originalPrice.toLocaleString("vi-VN")} đ
                          </Text>
                        ) : null}
                      </View>
                      <Text className="text-[#D4AF37] text-[18px] font-black">
                        {combo.priceVnd.toLocaleString("vi-VN")} đ
                      </Text>
                    </View>
                    <TouchableOpacity
                      className="mt-3 h-[40px] bg-[#D4AF37] rounded-xl items-center justify-center"
                      activeOpacity={0.8}
                    >
                      <Text className="text-black font-bold text-[13px]">
                        Mua Gói Ngay
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── 9. SEASON TABS + DANH SÁCH TẬP ── */}
          <View className="mt-6">
            <View className="flex-row items-center gap-2 mb-4">
              <FontAwesome name="list" size={14} color="#D4AF37" />
              <Text className="text-[#E5E0D8] text-[16px] font-bold">
                Danh sách tập
              </Text>
            </View>

            {/* Season Tabs ngang */}
            {sortedSeasons.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mb-4"
                contentContainerStyle={{ gap: 8 }}
              >
                {sortedSeasons.map((se) => {
                  const isActive = activeSeasonId === se.seasonId;
                  return (
                    <TouchableOpacity
                      key={se.seasonId}
                      onPress={() => setSelectedSeasonId(se.seasonId)}
                      activeOpacity={0.75}
                      className={`px-4 py-2 rounded-xl border ${
                        isActive
                          ? "bg-[#D4AF37] border-[#D4AF37]"
                          : "bg-white/[0.03] border-white/5"
                      }`}
                    >
                      <Text
                        className={`text-[12px] font-bold ${
                          isActive ? "text-black" : "text-gray-400"
                        }`}
                      >
                        {se.title || `Season ${se.seasonNumber}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Episode Cards */}
            {currentEpisodes.length === 0 ? (
              <View className="items-center py-10">
                <Feather name="inbox" size={36} color="#3f3f46" />
                <Text className="text-gray-600 text-sm mt-2">
                  Chưa có tập nào trong season này.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {currentEpisodes.map((ep, epIndex) => {
                  const isPaid = ep.unlockType === "PAID";
                  const epDate = ep.publishedAt
                    ? new Date(ep.publishedAt).toLocaleDateString("vi-VN")
                    : null;
                  const activeSeason = sortedSeasons.find(
                    (s) => s.seasonId === activeSeasonId
                  );
                  return (
                    <TouchableOpacity
                      key={ep.episodeId}
                      onPress={() =>
                        navigation.navigate("ComicReader", {
                          comicId: comic.id,
                          comicTitle: comic.title,
                          chapterTitle: activeSeason
                            ? `Season ${activeSeason.seasonNumber}`
                            : "",
                          episodeTitle:
                            ep.title || `Chương ${ep.episodeNumber}`,
                          episodeIndex: epIndex,
                          episodeId: ep.episodeId,
                        })
                      }
                      activeOpacity={0.75}
                      className="flex-row bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden"
                    >
                      {/* Thumbnail */}
                      <View
                        style={{ width: 100, height: 72 }}
                        className="bg-[#1A1A1F]"
                      >
                        {ep.thumbnail || comic.coverUrl ? (
                          <Image
                            source={{ uri: ep.thumbnail || comic.coverUrl }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-full h-full items-center justify-center">
                            <Feather name="book-open" size={22} color="#3f3f46" />
                          </View>
                        )}
                        {/* Play overlay */}
                        <View className="absolute inset-0 bg-black/30 items-center justify-center">
                          <View className="w-8 h-8 rounded-full bg-[#D4AF37]/80 items-center justify-center">
                            <Feather name="play" size={13} color="#000" />
                          </View>
                        </View>
                        {/* Lock/Free badge */}
                        <View
                          className={`absolute top-1.5 right-1.5 flex-row items-center gap-0.5 px-1.5 py-0.5 rounded-md ${
                            isPaid
                              ? "bg-amber-500/20 border border-amber-500/30"
                              : "bg-green-500/20 border border-green-500/30"
                          }`}
                        >
                          <Feather
                            name={isPaid ? "lock" : "unlock"}
                            size={8}
                            color={isPaid ? "#fbbf24" : "#4ade80"}
                          />
                          <Text
                            className={`text-[8px] font-black ${
                              isPaid ? "text-amber-400" : "text-green-400"
                            }`}
                          >
                            {isPaid ? "Trả phí" : "Miễn phí"}
                          </Text>
                        </View>
                      </View>

                      {/* Episode info */}
                      <View className="flex-1 p-3 justify-between">
                        <View>
                          <Text
                            className="text-white font-bold text-[13px]"
                            numberOfLines={1}
                          >
                            <Text className="text-gray-500 font-medium">
                              Tập {ep.episodeNumber}:{" "}
                            </Text>
                            {ep.title}
                          </Text>
                          {ep.description ? (
                            <Text
                              className="text-gray-500 text-[11px] mt-0.5"
                              numberOfLines={2}
                            >
                              {ep.description}
                            </Text>
                          ) : null}
                        </View>
                        <View className="flex-row items-center justify-between mt-2">
                          <View className="flex-row items-center gap-3">
                            {epDate ? (
                              <View className="flex-row items-center gap-1">
                                <Feather name="calendar" size={10} color="#71717a" />
                                <Text className="text-[10px] text-gray-500">{epDate}</Text>
                              </View>
                            ) : null}
                            {ep.views != null ? (
                              <View className="flex-row items-center gap-1">
                                <Feather name="eye" size={10} color="#71717a" />
                                <Text className="text-[10px] text-gray-500">
                                  {ep.views >= 1000
                                    ? `${(ep.views / 1000).toFixed(1)}K`
                                    : ep.views}
                                </Text>
                              </View>
                            ) : null}
                            {isPaid && ep.priceVnd && ep.priceVnd > 0 ? (
                              <Text className="text-[10px] text-[#D4AF37] font-bold">
                                {ep.priceVnd.toLocaleString("vi-VN")}đ
                              </Text>
                            ) : null}
                          </View>
                          <BookmarkButton
                            episodeId={ep.episodeId}
                            contentType="COMIC"
                            size="sm"
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ── 10. BOTTOM CTA ── */}
      <View className="h-[70px] bg-[#0F0F12] px-4 justify-center border-t border-white/5">
        <TouchableOpacity
          onPress={() => {
            if (firstEpisode) {
              const activeSeason = sortedSeasons.find(
                (s) => s.seasonId === activeSeasonId
              );
              navigation.navigate("ComicReader", {
                comicId: comic.id,
                comicTitle: comic.title,
                chapterTitle: activeSeason
                  ? `Season ${activeSeason.seasonNumber}`
                  : "",
                episodeTitle:
                  firstEpisode.title ||
                  `Chương ${firstEpisode.episodeNumber}`,
                episodeIndex: 0,
                episodeId: firstEpisode.episodeId,
              });
            } else if (comic.chapters?.[0]?.episodes?.[0]) {
              const fc = comic.chapters[0];
              navigation.navigate("ComicReader", {
                comicId: comic.id,
                chapterTitle: fc.title,
                episodeTitle: fc.episodes[0],
                episodeIndex: 0,
              });
            }
          }}
          className="h-[48px] bg-[#D4AF37] rounded-full items-center justify-center flex-row gap-2"
        >
          <Feather name={isComic ? "book-open" : "play"} size={16} color="#000" />
          <Text className="text-black font-black text-[14px]">
            {isComic ? "ĐỌC NGAY TẬP ĐẦU" : "XEM NGAY TẬP ĐẦU"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}