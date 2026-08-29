import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  Feather,
  MaterialCommunityIcons,
  FontAwesome5,
  Ionicons,
} from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { navigationRef } from "@/navigation/navigationRef";
import { useAuth } from "@/context/AuthContext";
import { useUserFeature } from "@/hooks/useUserFeature";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getOwnCreator, type OwnCreatorResponse } from "@/services/creator";
import { getFollowers, type AccountFollowInfoDto } from "@/services/follow";
import { FollowButton } from "@/components/FollowButton";
import { CreatorTierModal } from "@/components/CreatorTierModal";
import {
  listSeriesByCreator,
  updateSeries,
  deleteSeries,
  hideSeries,
  unhideSeries,
  hideSeason,
  unhideSeason,
  updateSeason,
  deleteSeason,
  getCategories,
  getTags,
  uploadImageToS3,
  listSeasonsBySeries,
  listEpisodesBySeason,
  updateEpisode,
  deleteEpisode,
  hideEpisode,
  unhideEpisode,
  schedulePublishEpisode,
  cancelSchedulePublishEpisode,
  listMediaByEpisode,
  deleteMedia,
  reorderEpisodeMedia,
  updateMedia,
  updateMediaUrl,
  type SeriesItem,
  type SeasonItem,
  type EpisodeItem,
  type MediaResponse,
} from "@/services/creatorContent";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const formatAgeRating = (rating?: string) => {
  if (!rating || typeof rating !== "string" || !rating.trim()) return null;
  return rating.trim();
};

const getAgeRatingStyle = (ratingStr?: string | null) => {
  if (!ratingStr) return { bg: "bg-zinc-800", text: "text-white", border: "border-zinc-700" };
  const r = ratingStr.toUpperCase();
  if (r.includes("18")) return { bg: "bg-red-600", text: "text-white", border: "border-red-500" };
  if (r.includes("16")) return { bg: "bg-amber-600", text: "text-white", border: "border-amber-500" };
  if (r.includes("13")) return { bg: "bg-blue-600", text: "text-white", border: "border-blue-500" };
  return { bg: "bg-amber-500/90", text: "text-black", border: "border-amber-400" };
};

export default function CreatorChannelScreen({ navigation: propNav }: any) {
  const navigation = propNav || navigationRef;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile: userFeatureProfile } = useUserFeature();

  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState<OwnCreatorResponse | null>(null);
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [activeTab, setActiveTab] = useState<
    "home" | "comics" | "movies" | "followers" | "about"
  >("home");
  const [followersList, setFollowersList] = useState<AccountFollowInfoDto[]>(
    [],
  );
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [loadingFollowers, setLoadingFollowers] = useState(false);
  const [isNotCreator, setIsNotCreator] = useState(false);
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "PUBLIC" | "PRIVATE"
  >("ALL");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "oldest">(
    "latest",
  );
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showTierModal, setShowTierModal] = useState(false);

  const currentTierLevel =
    creator?.creatorTier?.tierLevel ??
    (creator as any)?.tierLevel ??
    (creator as any)?.tier?.tierLevel ??
    0;
  const currentTierName =
    creator?.creatorTier?.tierName ??
    (creator as any)?.tierName ??
    (creator as any)?.tier?.tierName ??
    "Creator Khởi Đầu";

  const totalViewsSum = React.useMemo(() => {
    if (creator?.analyticData?.views != null) {
      return creator.analyticData.views;
    }
    return series.reduce(
      (acc, item) =>
        acc +
        ((item as any).totalViews ??
          item.analyticData?.views ??
          (item as any).views ??
          0),
      0
    );
  }, [creator?.analyticData?.views, series]);

  const totalWatchTimeSum = React.useMemo(() => {
    if (creator?.analyticData?.watchTime != null) {
      return creator.analyticData.watchTime;
    }
    return series.reduce(
      (acc, item) => acc + (item.analyticData?.watchTime || 0),
      0
    );
  }, [creator?.analyticData?.watchTime, series]);

  // Categories & Tags list for editing
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [tagsList, setTagsList] = useState<any[]>([]);

  // --- EDIT SERIES STATE ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState<SeriesItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStatus, setEditStatus] = useState<any>("DRAFT");
  const [editCover, setEditCover] = useState<any>(null); // { uri, name, size, type, isUrl }
  const [editCategoryIds, setEditCategoryIds] = useState<string[]>([]);
  const [editTagIds, setEditTagIds] = useState<string[]>([]);
  const [savingSeries, setSavingSeries] = useState(false);

  // --- MANAGE EPISODES STATE ---
  const [showEpisodesModal, setShowEpisodesModal] = useState(false);
  const [manageSeries, setManageSeries] = useState<SeriesItem | null>(null);
  const [manageSeasons, setManageSeasons] = useState<SeasonItem[]>([]);
  const [loadingEpisodesData, setLoadingEpisodesData] = useState(false);
  const [episodesMap, setEpisodesMap] = useState<Record<string, EpisodeItem[]>>(
    {},
  );

  // For Edit Episode Form
  const [editingEpisode, setEditingEpisode] = useState<EpisodeItem | null>(
    null,
  );
  const [editEpNumber, setEditEpNumber] = useState("");
  const [editEpTitle, setEditEpTitle] = useState("");
  const [editEpDesc, setEditEpDesc] = useState("");
  const [editEpUnlockType, setEditEpUnlockType] = useState<any>("FREE");
  const [editEpPriceVnd, setEditEpPriceVnd] = useState("0");
  const [savingEpisode, setSavingEpisode] = useState(false);

  // For Edit Season Form
  const [editingSeason, setEditingSeason] = useState<SeasonItem | null>(null);
  const [editSeasonNumber, setEditSeasonNumber] = useState("");
  const [editSeasonTitle, setEditSeasonTitle] = useState("");
  const [editSeasonDesc, setEditSeasonDesc] = useState("");
  const [savingSeason, setSavingSeason] = useState(false);

  // For Media Manager inside Episode
  const [managingMediaEpisode, setManagingMediaEpisode] =
    useState<EpisodeItem | null>(null);
  const [mediaList, setMediaList] = useState<MediaResponse[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // --- EPISODE SCHEDULE STATE ---
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledEpisode, setScheduledEpisode] = useState<EpisodeItem | null>(
    null,
  );
  const [scheduleDate, setScheduleDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    // Load metadata only on mount
    getCategories()
      .then((res) => setCategoriesList(res?.content || []))
      .catch((err) => console.log("Lỗi tải thể loại:", err));
    getTags()
      .then((res) => setTagsList(res?.content || []))
      .catch((err) => console.log("Lỗi tải nhãn:", err));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchChannelData();
    }, []),
  );

  const fetchChannelData = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);
    setIsNotCreator(false);
    try {
      // 1. Lấy thông tin Creator
      const creatorData = await getOwnCreator();
      setCreator(creatorData);

      // 2. Lấy danh sách series của Creator này
      const seriesList = await listSeriesByCreator();
      setSeries(seriesList || []);

      // 3. Lấy danh sách người theo dõi
      try {
        const followersRes = await getFollowers(0, 100);
        setFollowersList(followersRes.content || []);
        setFollowersCount(
          typeof followersRes.totalElements === "number"
            ? followersRes.totalElements
            : followersRes.content?.length || 0
        );
      } catch (e) {
        setFollowersList([]);
        setFollowersCount(0);
      }
    } catch (err: any) {
      console.log("[Channel] Fetch error:", err);
      if (err.code === 4041) {
        setIsNotCreator(true);
      }
    } finally {
      if (!isRefreshing) setLoading(false);
    }
  };

  const getSortedAndFilteredList = (list: SeriesItem[]) => {
    let result = [...list];

    // 1. Lọc theo trạng thái
    if (filterStatus === "PUBLIC") {
      result = result.filter((item) => item.status === "PUBLISHED");
    } else if (filterStatus === "PRIVATE") {
      // Bản nháp = tất cả trạng thái không phải PUBLISHED (DRAFT, HIDDEN, SCHEDULED...)
      result = result.filter((item) => item.status !== "PUBLISHED");
    }

    // 2. Sắp xếp
    result.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (sortBy === "latest") {
        return dateB - dateA;
      } else if (sortBy === "oldest") {
        return dateA - dateB;
      } else if (sortBy === "popular") {
        return b.title.localeCompare(a.title);
      }
      return 0;
    });

    return result;
  };

  const comicsList = getSortedAndFilteredList(
    series.filter((item) => item.contentType?.toUpperCase() === "COMIC"),
  );
  const moviesList = getSortedAndFilteredList(
    series.filter((item) => item.contentType?.toUpperCase() === "VIDEO"),
  );
  const selectedItem = series.find((s) => s.seriesId === activeMenuId);

  // Điều hướng tới trang chi tiết tác phẩm tương ứng
  const handleItemPress = (item: SeriesItem) => {
    if (item.contentType?.toUpperCase() === "COMIC") {
      navigation.navigate("ComicDetailScreen", { comicId: item.seriesId });
    } else {
      navigation.navigate("MovieDetailScreen", {
        movieId: item.seriesId,
        seriesItem: item,
      });
    }
  };

  // --- HANDLERS FOR EDIT & DELETE SERIES ---
  const handleOpenEditSeries = (item: SeriesItem) => {
    setEditingSeries(item);
    setEditTitle(item.title);
    setEditDesc(item.description || "");
    setEditStatus(item.status || "DRAFT");
    setEditCover(item.coverUrl ? { uri: item.coverUrl, isUrl: true } : null);
    setEditCategoryIds(item.categories?.map((c) => c.categoryId) || []);
    setEditTagIds(item.tags?.map((t) => t.tagId) || []);
    setShowEditModal(true);
  };

  const handlePickEditCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Quyền truy cập",
        "Bạn cần cấp quyền truy cập thư viện ảnh để thay đổi ảnh bìa.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const name = uri.split("/").pop() || "cover.jpg";
      const type = asset.mimeType || "image/jpeg";
      const size = asset.fileSize || 1024 * 100; // fallback size

      setEditCover({
        uri,
        name,
        type,
        size,
        isUrl: false,
      });
    }
  };

  const handleSaveSeries = async () => {
    if (!editingSeries) return;
    if (!editTitle.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên tác phẩm.");
      return;
    }

    setSavingSeries(true);
    try {
      let coverUrl = editingSeries.coverUrl || "";

      if (editCover && !editCover.isUrl) {
        const uploadRes = await uploadImageToS3(
          editCover.uri,
          editCover.name,
          editCover.size,
          editCover.type,
          "cover",
        );
        coverUrl = uploadRes.publicUrl;
      }

      await updateSeries(editingSeries.seriesId, {
        title: editTitle,
        description: editDesc,
        coverUrl,
        contentType: editingSeries.contentType,
        status: editStatus,
        categoryIds: editCategoryIds,
        tagIds: editTagIds,
      });

      await fetchChannelData();
      Alert.alert("Thành công", "Cập nhật thông tin tác phẩm thành công.");
      setShowEditModal(false);
      setEditingSeries(null);
    } catch (err: any) {
      console.error("[UpdateSeries] Error:", err);
      Alert.alert(
        "Lỗi",
        err.message || "Không thể cập nhật thông tin tác phẩm.",
      );
    } finally {
      setSavingSeries(false);
    }
  };

  const handleDeleteSeries = (item: SeriesItem) => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa tác phẩm "${item.title}" không? Hành động này không thể hoàn tác.`,
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deleteSeries(item.seriesId);
              await fetchChannelData();
              Alert.alert("Thành công", "Đã xóa tác phẩm thành công.");
            } catch (err: any) {
              console.error("[DeleteSeries] Error:", err);
              Alert.alert(
                "Lỗi",
                err.message || "Không thể xóa tác phẩm vào lúc này.",
              );
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleToggleHideSeries = (item: SeriesItem) => {
    const isHidden = item.status === "HIDDEN";
    Alert.alert(
      isHidden ? "Xác nhận công khai" : "Xác nhận ẩn tác phẩm",
      isHidden
        ? `Bạn có chắc chắn muốn bỏ ẩn và công khai tác phẩm "${item.title}" không?`
        : `Bạn có chắc chắn muốn ẩn tác phẩm "${item.title}"? Tác phẩm sẽ không hiển thị công khai trên ứng dụng.`,
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: isHidden ? "Công khai" : "Ẩn",
          onPress: async () => {
            setLoading(true);
            try {
              if (isHidden) {
                await unhideSeries(item.seriesId);
                Alert.alert("Thành công", "Đã công khai tác phẩm thành công.");
              } else {
                await hideSeries(item.seriesId);
                Alert.alert("Thành công", "Đã ẩn tác phẩm thành công.");
              }
              await fetchChannelData();
            } catch (err: any) {
              console.error("[ToggleHideSeries] Error:", err);
              Alert.alert("Lỗi", err.message || "Không thể thực hiện yêu cầu.");
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleToggleHideSeason = (season: SeasonItem) => {
    const isHidden = season.status === "HIDDEN";
    Alert.alert(
      isHidden ? "Xác nhận công khai Season" : "Xác nhận ẩn Season",
      isHidden
        ? `Bạn có chắc chắn muốn bỏ ẩn và công khai Season ${season.seasonNumber} không?`
        : `Bạn có chắc chắn muốn ẩn Season ${season.seasonNumber}? Season bị ẩn sẽ không hiển thị công khai trên ứng dụng.`,
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: isHidden ? "Công khai" : "Ẩn",
          onPress: async () => {
            try {
              if (isHidden) {
                await unhideSeason(season.seasonId);
                Alert.alert("Thành công", "Đã công khai Season thành công.");
                setManageSeasons((prev) =>
                  prev.map((s) =>
                    s.seasonId === season.seasonId
                      ? { ...s, status: "PUBLISHED" }
                      : s,
                  ),
                );
              } else {
                await hideSeason(season.seasonId);
                Alert.alert("Thành công", "Đã ẩn Season thành công.");
                setManageSeasons((prev) =>
                  prev.map((s) =>
                    s.seasonId === season.seasonId
                      ? { ...s, status: "HIDDEN" }
                      : s,
                  ),
                );
              }
            } catch (err: any) {
              console.error("[ToggleHideSeason] Error:", err);
              Alert.alert("Lỗi", err.message || "Không thể thực hiện yêu cầu.");
            }
          },
        },
      ],
    );
  };

  const handleToggleHideEpisode = (episode: EpisodeItem) => {
    const isHidden = episode.status === "HIDDEN";
    Alert.alert(
      isHidden ? "Xác nhận công khai tập" : "Xác nhận ẩn tập",
      isHidden
        ? `Bạn có chắc chắn muốn bỏ ẩn và công khai tập ${episode.episodeNumber} không?`
        : `Bạn có chắc chắn muốn ẩn tập ${episode.episodeNumber}? Tập sẽ không hiển thị trên ứng dụng.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: isHidden ? "Công khai" : "Ẩn",
          onPress: async () => {
            try {
              if (isHidden) {
                await unhideEpisode(episode.episodeId);
                Alert.alert("Thành công", "Đã công khai tập thành công.");
                setEpisodesMap((prev) => {
                  const list = prev[episode.seasonId] || [];
                  return {
                    ...prev,
                    [episode.seasonId]: list.map((ep) =>
                      ep.episodeId === episode.episodeId
                        ? { ...ep, status: "PUBLISHED" }
                        : ep,
                    ),
                  };
                });
              } else {
                await hideEpisode(episode.episodeId);
                Alert.alert("Thành công", "Đã ẩn tập thành công.");
                setEpisodesMap((prev) => {
                  const list = prev[episode.seasonId] || [];
                  return {
                    ...prev,
                    [episode.seasonId]: list.map((ep) =>
                      ep.episodeId === episode.episodeId
                        ? { ...ep, status: "HIDDEN" }
                        : ep,
                    ),
                  };
                });
              }
            } catch (err: any) {
              console.error("[ToggleHideEpisode] Error:", err);
              Alert.alert("Lỗi", err.message || "Không thể thực hiện yêu cầu.");
            }
          },
        },
      ],
    );
  };

  const handleCancelSchedule = (episode: EpisodeItem) => {
    Alert.alert(
      "Xác nhận hủy lịch",
      `Bạn có chắc chắn muốn hủy lịch xuất bản cho tập ${episode.episodeNumber} và đưa về bản nháp không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xác nhận hủy",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelSchedulePublishEpisode(episode.episodeId);
              Alert.alert("Thành công", "Đã hủy lịch xuất bản tập thành công.");
              setEpisodesMap((prev) => {
                const list = prev[episode.seasonId] || [];
                return {
                  ...prev,
                  [episode.seasonId]: list.map((ep) =>
                    ep.episodeId === episode.episodeId
                      ? { ...ep, status: "DRAFT" }
                      : ep,
                  ),
                };
              });
            } catch (err: any) {
              console.error("[CancelScheduleEpisode] Error:", err);
              Alert.alert("Lỗi", err.message || "Không thể hủy lịch xuất bản.");
            }
          },
        },
      ],
    );
  };

  const handleConfirmSchedule = async () => {
    if (!scheduledEpisode) return;

    if (scheduleDate.getTime() <= Date.now()) {
      Alert.alert("Lỗi", "Thời gian lên lịch phải ở trong tương lai.");
      return;
    }

    try {
      const utcIso = scheduleDate.toISOString();
      await schedulePublishEpisode(scheduledEpisode.episodeId, utcIso);

      Alert.alert("Thành công", "Đã lên lịch xuất bản tập thành công.");

      setEpisodesMap((prev) => {
        const list = prev[scheduledEpisode.seasonId] || [];
        return {
          ...prev,
          [scheduledEpisode.seasonId]: list.map((ep) =>
            ep.episodeId === scheduledEpisode.episodeId
              ? { ...ep, status: "SCHEDULED" }
              : ep,
          ),
        };
      });

      setShowScheduleModal(false);
      setScheduledEpisode(null);
    } catch (err: any) {
      console.error("[ScheduleEpisode] Error:", err);
      Alert.alert("Lỗi", err.message || "Không thể lên lịch xuất bản tập.");
    }
  };

  // --- EPISODE MANAGEMENT HANDLERS ---
  const handleOpenManageEpisodes = async (item: SeriesItem) => {
    setManageSeries(item);
    setShowEpisodesModal(true);
    setLoadingEpisodesData(true);
    try {
      const seasonsData = await listSeasonsBySeries(item.seriesId);
      setManageSeasons(seasonsData || []);
      const map: Record<string, EpisodeItem[]> = {};
      for (const s of seasonsData) {
        const eps = await listEpisodesBySeason(s.seasonId);
        map[s.seasonId] = eps || [];
      }
      setEpisodesMap(map);
    } catch (err: any) {
      console.error("[ManageEpisodes] Error:", err);
      Alert.alert("Lỗi", "Không thể tải danh sách tập.");
    } finally {
      setLoadingEpisodesData(false);
    }
  };

  const reloadEpisodesData = async (seriesId: string) => {
    setLoadingEpisodesData(true);
    try {
      const seasonsData = await listSeasonsBySeries(seriesId);
      setManageSeasons(seasonsData || []);
      const map: Record<string, EpisodeItem[]> = {};
      for (const s of seasonsData) {
        const eps = await listEpisodesBySeason(s.seasonId);
        map[s.seasonId] = eps || [];
      }
      setEpisodesMap(map);
    } catch (err) {
      console.error("[ReloadEpisodes] Error:", err);
    } finally {
      setLoadingEpisodesData(false);
    }
  };

  const handleDeleteEpisode = (ep: EpisodeItem) => {
    Alert.alert(
      "Xác nhận xóa tập",
      `Bạn có chắc chắn muốn xóa Tập ${ep.episodeNumber} - "${ep.title}" không? Hành động này sẽ chuyển trạng thái của tập thành DELETED.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteEpisode(ep.episodeId);
              if (manageSeries) {
                await reloadEpisodesData(manageSeries.seriesId);
              }
              Alert.alert("Thành công", "Đã xóa tập thành công.");
            } catch (err: any) {
              console.error("[DeleteEpisode] Error:", err);
              Alert.alert("Lỗi", err.message || "Không thể xóa tập.");
            }
          },
        },
      ],
    );
  };

  const handleStartEditEpisode = (ep: EpisodeItem) => {
    setEditingEpisode(ep);
    setEditEpNumber(String(ep.episodeNumber));
    setEditEpTitle(ep.title);
    setEditEpDesc(ep.description || "");
    setEditEpUnlockType(ep.unlockType === "PAID" ? "COIN" : "FREE");
    setEditEpPriceVnd(String(ep.priceVnd || 0));
  };

  const handleSaveEpisode = async () => {
    if (!editingEpisode) return;
    if (!editEpTitle.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên tập.");
      return;
    }

    setSavingEpisode(true);
    try {
      const numVal = parseInt(editEpNumber, 10) || 1;
      const priceVal = parseInt(editEpPriceVnd, 10) || 0;

      await updateEpisode(editingEpisode.episodeId, {
        episodeNumber: numVal,
        title: editEpTitle,
        description: editEpDesc,
        unlockType: editEpUnlockType === "COIN" ? "PAID" : "FREE",
        priceVnd: priceVal,
        status: editingEpisode.status,
      });

      Alert.alert("Thành công", "Đã cập nhật thông tin tập thành công.");
      setEditingEpisode(null);
      if (manageSeries) {
        await reloadEpisodesData(manageSeries.seriesId);
      }
    } catch (err: any) {
      console.error("[UpdateEpisode] Error:", err);
      Alert.alert("Lỗi", err.message || "Không thể cập nhật tập.");
    } finally {
      setSavingEpisode(false);
    }
  };

  const handleStartEditSeason = (se: SeasonItem) => {
    setEditingSeason(se);
    setEditSeasonNumber(String(se.seasonNumber));
    setEditSeasonTitle(se.title || "");
    setEditSeasonDesc(se.description || "");
  };

  const handleSaveSeason = async () => {
    if (!editingSeason || !manageSeries) return;
    if (!editSeasonNumber.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số thứ tự Season.");
      return;
    }

    setSavingSeason(true);
    try {
      const numVal = parseInt(editSeasonNumber, 10) || 1;
      await updateSeason(editingSeason.seasonId, {
        seasonNumber: numVal,
        title: editSeasonTitle,
        description: editSeasonDesc,
        status: editingSeason.status || "PUBLISHED",
      });

      Alert.alert("Thành công", "Đã lưu thay đổi Season thành công.");
      setEditingSeason(null);
      await reloadEpisodesData(manageSeries.seriesId);
    } catch (err: any) {
      console.error("[SaveSeason] Error:", err);
      Alert.alert("Lỗi", err.message || "Không thể lưu thay đổi Season.");
    } finally {
      setSavingSeason(false);
    }
  };

  const handleDeleteSeason = (seasonId: string) => {
    const targetSeason = manageSeasons.find((s) => s.seasonId === seasonId);
    if (!targetSeason || !manageSeries) return;

    Alert.alert(
      "Xác nhận xóa Season",
      `Bạn có chắc chắn muốn xóa Season ${targetSeason.seasonNumber} - "${targetSeason.title || ""}" không? Hành động này sẽ chuyển trạng thái của season thành DELETED.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSeason(seasonId);
              Alert.alert("Thành công", "Đã xóa Season thành công.");
              await reloadEpisodesData(manageSeries.seriesId);
            } catch (err: any) {
              console.error("[DeleteSeason] Error:", err);
              Alert.alert("Lỗi", err.message || "Không thể xóa Season.");
            }
          },
        },
      ],
    );
  };

  const handleOpenMediaManager = async (ep: EpisodeItem) => {
    setManagingMediaEpisode(ep);
    setLoadingMedia(true);
    try {
      const list = await listMediaByEpisode(ep.episodeId);
      setMediaList(list || []);
    } catch (err) {
      console.error("[GetMedia] Error:", err);
      Alert.alert("Lỗi", "Không thể tải danh sách tệp đính kèm.");
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleDeleteMedia = (mediaId: string) => {
    if (!managingMediaEpisode) return;
    Alert.alert(
      "Xác nhận xóa tệp",
      "Bạn có chắc chắn muốn xóa tệp này không?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMedia(mediaId);
              const list = await listMediaByEpisode(
                managingMediaEpisode.episodeId,
              );
              setMediaList(list || []);
              Alert.alert("Thành công", "Đã xóa tệp thành công.");
            } catch (err: any) {
              console.error("[DeleteMedia] Error:", err);
              Alert.alert("Lỗi", err.message || "Không thể xóa tệp.");
            }
          },
        },
      ],
    );
  };

  const handleMoveMedia = async (index: number, direction: "up" | "down") => {
    if (!managingMediaEpisode) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= mediaList.length) return;

    const listCopy = [...mediaList];
    const temp = listCopy[index];
    listCopy[index] = listCopy[newIndex];
    listCopy[newIndex] = temp;

    setMediaList(listCopy);

    try {
      const items = listCopy.map((m, idx) => ({
        mediaId: m.mediaId,
        displayOrder: idx + 1,
      }));
      await reorderEpisodeMedia(managingMediaEpisode.episodeId, { items });
    } catch (err: any) {
      console.error("[ReorderMedia] Error:", err);
      Alert.alert("Lỗi", err.message || "Không thể thay đổi thứ tự.");
      const original = await listMediaByEpisode(managingMediaEpisode.episodeId);
      setMediaList(original || []);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0F0F0F]">
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  // Trường hợp chưa đăng ký làm Creator
  if (isNotCreator) {
    return (
      <SafeAreaView className="flex-1 bg-[#0F0F0F] justify-center items-center px-6">
        <StatusBar barStyle="light-content" />
        <View className="items-center">
          <View className="w-20 h-20 bg-zinc-800 rounded-full items-center justify-center mb-6">
            <MaterialCommunityIcons
              name="youtube-studio"
              size={44}
              color="#D4AF37"
            />
          </View>
          <Text className="text-white text-xl font-bold tracking-wide mb-2 text-center">
            Bạn chưa đăng ký Kênh Sáng Tạo
          </Text>
          <Text className="text-zinc-500 text-sm text-center mb-8 leading-5">
            Hãy tham gia chương trình sáng tạo nội dung của TaleX để đăng tải
            truyện tranh, phim ảnh và bắt đầu kiếm tiền ngay hôm nay!
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.replace("CreatorGuard")}
            className="w-full max-w-[240px]"
          >
            <LinearGradient
              colors={["#D4AF37", "#E6B800"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 48,
                borderRadius: 999,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#141210", fontWeight: "900", fontSize: 15 }}
              >
                Đăng ký kênh ngay
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderContentGrid = (list: SeriesItem[], typeLabel: string) => {
    if (list.length === 0) {
      return (
        <View className="py-16 items-center justify-center">
          <MaterialCommunityIcons
            name="folder-open-outline"
            size={48}
            color="#3F3F46"
          />
          <Text className="text-zinc-500 text-sm mt-3 italic">
            Chưa có {typeLabel} nào được tải lên
          </Text>
        </View>
      );
    }

    return (
      <View className="px-4 py-3 flex-row flex-wrap justify-between">
        {list.map((item) => {
          const isComic = item.contentType?.toUpperCase() === "COMIC";
          const isPublic = item.status === "PUBLISHED";

          return (
            <TouchableOpacity
              key={item.seriesId}
              activeOpacity={0.85}
              onPress={() => handleItemPress(item)}
              style={{ width: (width - 44) / 2 }}
              className="mb-4 aspect-[2/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 relative shadow-xl"
            >
              {item.coverUrl ? (
                <Image
                  source={{ uri: item.coverUrl }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <Feather name={isComic ? "book-open" : "video"} size={28} color="#71717A" />
                </View>
              )}

              {/* Badge trạng thái góc trên trái */}
              <View className="absolute top-2 left-2 z-30">
                <View
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: isPublic
                      ? "rgba(34,197,94,0.85)"
                      : "rgba(113,113,122,0.85)",
                  }}
                >
                  <Text
                    style={{ fontSize: 10, fontWeight: "700", color: "#fff" }}
                  >
                    {isPublic ? "Công khai" : "Riêng tư"}
                  </Text>
                </View>
              </View>

              {/* Nút 3 chấm quản lý ở góc trên phải */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setActiveMenuId(
                    activeMenuId === item.seriesId ? null : item.seriesId,
                  );
                }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 items-center justify-center border border-white/10 z-30"
              >
                <Feather name="more-vertical" size={14} color="#D4AF37" />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#0F0F0F]">
      <StatusBar barStyle="light-content" />

      {/* NÚT BACK FLOATING */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
        className="absolute left-4 z-50 w-9 h-9 rounded-full bg-black/40 border border-white/20 items-center justify-center shadow-lg"
        style={{ top: Math.max(insets.top, 16) }}
      >
        <Feather name="arrow-left" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView
        className="flex-1"
        alwaysBounceVertical={true}
        showsVerticalScrollIndicator={false}
      >
        {/* BANNER KÊNH */}
        {(() => {
          const anyCreator = creator as any;
          const anyProfile = userFeatureProfile as any;
          const effectiveAvatarUrl =
            anyCreator?.avatarUrl ||
            user?.avatarUrl ||
            anyProfile?.avatarUrl ||
            anyProfile?.avatar ||
            (series.length > 0 ? (series[0] as any).creatorAvatar : null);
          // Background phía sau luôn luôn lấy trực tiếp ảnh của Avatar:
          const effectiveBannerUrl = effectiveAvatarUrl;
          const effectiveDisplayName =
            anyCreator?.displayName ||
            anyCreator?.channelName ||
            user?.fullName ||
            user?.username ||
            anyProfile?.fullName ||
            "Kênh sáng tạo";
          const effectiveBio =
            anyCreator?.bio ||
            anyCreator?.description ||
            anyProfile?.bio ||
            "Chưa có tiểu sử giới thiệu. Hãy thêm tiểu sử trong Studio sáng tạo.";

          return (
            <>
              <View className="w-full h-[220px] bg-zinc-800 relative">
                {effectiveBannerUrl ? (
                  <Image
                    source={{ uri: effectiveBannerUrl }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={require("@assets/background.webp")}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                )}
              </View>

              {/* THÔNG TIN KÊNH */}
              <View className="px-4 -mt-10 mb-6">
                <View className="flex-row items-end justify-between">
                  {/* Avatar */}
                  <View className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#0F0F0F] bg-zinc-900">
                    {effectiveAvatarUrl ? (
                      <Image
                        source={{ uri: effectiveAvatarUrl }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <Image
                        source={require("@assets/icon.png")}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    )}
                  </View>

                  {/* Nút chỉnh sửa / studio */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("CreatorDashboard")}
                    className="bg-[#262628] border border-white/5 px-4 py-1.5 rounded-full flex-row items-center mb-1"
                  >
                    <MaterialCommunityIcons
                      name="view-dashboard-outline"
                      size={14}
                      color="#D4AF37"
                    />
                    <Text className="text-stone-300 text-xs font-bold ml-1.5">
                      Quản lý kênh
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Name & Prominent LV Badge Row */}
                <View className="flex-row items-center mt-3 gap-2 flex-wrap">
                  <Text className="text-white text-2xl font-black tracking-wide">
                    {effectiveDisplayName}
                  </Text>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowTierModal(true)}
                    className="flex-row items-center bg-[#D4AF37] border border-[#FFE58F] px-2.5 py-0.5 rounded-full shadow-md active:scale-95"
                  >
                    <FontAwesome5 name="award" size={10} color="#141210" />
                    <Text className="text-[#141210] text-[11px] font-black ml-1 uppercase tracking-wider">
                      LV.{currentTierLevel}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text className="text-zinc-400 text-xs font-bold mt-1.5">
                  @{user?.username || "creator"} • {followersCount} người đăng ký • {series.length} tác phẩm
                </Text>

                <Text className="text-stone-200 text-[13px] font-semibold mt-3 leading-5">
                  {effectiveBio}
                </Text>
              </View>
            </>
          );
        })()}

        {/* TAB BAR STYLE YOUTUBE (ON TOP OF CONTENT) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="border-b border-white/5 px-2"
        >
          <TouchableOpacity
            onPress={() => setActiveTab("home")}
            className={`py-3 px-4 border-b-2 ${activeTab === "home" ? "border-[#D4AF37]" : "border-transparent"}`}
          >
            <Text
              className={`text-xs font-bold ${activeTab === "home" ? "text-[#D4AF37]" : "text-zinc-500"}`}
            >
              TRANG CHỦ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("comics")}
            className={`py-3 px-4 border-b-2 ${activeTab === "comics" ? "border-[#D4AF37]" : "border-transparent"}`}
          >
            <Text
              className={`text-xs font-bold ${activeTab === "comics" ? "text-[#D4AF37]" : "text-zinc-500"}`}
            >
              TRUYỆN TRANH ({comicsList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("movies")}
            className={`py-3 px-4 border-b-2 ${activeTab === "movies" ? "border-[#D4AF37]" : "border-transparent"}`}
          >
            <Text
              className={`text-xs font-bold ${activeTab === "movies" ? "text-[#D4AF37]" : "text-zinc-500"}`}
            >
              PHIM ẢNH ({moviesList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("followers")}
            className={`py-3 px-4 border-b-2 ${activeTab === "followers" ? "border-[#D4AF37]" : "border-transparent"}`}
          >
            <Text
              className={`text-xs font-bold ${activeTab === "followers" ? "text-[#D4AF37]" : "text-zinc-500"}`}
            >
              NGƯỜI THEO DÕI ({followersList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab("about")}
            className={`py-3 px-4 border-b-2 ${activeTab === "about" ? "border-[#D4AF37]" : "border-transparent"}`}
          >
            <Text
              className={`text-xs font-bold ${activeTab === "about" ? "text-[#D4AF37]" : "text-zinc-500"}`}
            >
              GIỚI THIỆU
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* SPOTLIGHT HERO BANNER CARD (ONLY ON HOME TAB) */}
        {activeTab === "home" && series.length > 0 && (
          <View className="px-4 pt-4">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleItemPress(series[0])}
              className="relative rounded-3xl overflow-hidden border border-white/15 bg-zinc-900 shadow-2xl"
            >
              {series[0].coverUrl ? (
                <Image
                  source={{ uri: series[0].coverUrl }}
                  className="w-full h-[180px]"
                  resizeMode="cover"
                />
              ) : (
                <Image
                  source={require("@assets/background.webp")}
                  className="w-full h-[180px]"
                  resizeMode="cover"
                />
              )}
              <LinearGradient
                colors={["transparent", "rgba(18,18,20,0.45)", "rgba(18,18,20,0.95)"]}
                className="absolute inset-0 p-4 justify-end"
              >
                <View className="bg-[#D4AF37] self-start px-2.5 py-1 rounded-lg mb-2 flex-row items-center shadow-md">
                  <Ionicons name="flame" size={13} color="#141210" />
                  <Text className="text-[#141210] text-[10px] font-black uppercase tracking-wider ml-1">
                    SIÊU PHẨM NỔI BẬT
                  </Text>
                </View>
                <Text className="text-white font-extrabold text-xl leading-tight" numberOfLines={1}>
                  {series[0].title}
                </Text>
                <Text className="text-[#D1D5DB] text-xs mt-1 leading-snug" numberOfLines={2}>
                  {series[0].description || "Tác phẩm xuất sắc hàng đầu của kênh sáng tạo trên hệ thống TaleX."}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* TIÊU ĐỀ DANH SÁCH TÁC PHẨM (HOME TAB) */}
        {activeTab === "home" && (
          <Text className="text-white text-sm font-black mb-3 px-4 pt-4">
            Danh sách tác phẩm ({series.length})
          </Text>
        )}

        {/* BỘ LỌC VÀ SẮP XẾP */}
        {(activeTab === "comics" || activeTab === "movies") && (
          <View className="flex-row items-center justify-between px-4 py-3 bg-[#161618]/30 border-b border-white/5 z-50">
            {/* Category Bar: Công khai / Riêng tư */}
            <View className="flex-row items-center">
              {(["ALL", "PUBLIC", "PRIVATE"] as const).map((status) => {
                const label =
                  status === "ALL"
                    ? "Tất cả"
                    : status === "PUBLIC"
                      ? "Công khai"
                      : "Bản nháp";
                const isActive = filterStatus === status;
                return (
                  <TouchableOpacity
                    key={status}
                    onPress={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 rounded-full mr-2 ${
                      isActive ? "bg-[#D4AF37]" : "bg-zinc-800"
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        isActive ? "text-[#141210]" : "text-zinc-400"
                      }`}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Dropdown Sắp xếp */}
            <View className="relative">
              <TouchableOpacity
                onPress={() => setShowSortMenu(!showSortMenu)}
                activeOpacity={0.8}
                className="flex-row items-center bg-[#262628] border border-white/5 rounded-lg px-2.5 py-1.5"
              >
                <Text className="text-stone-300 text-[11px] font-semibold mr-1">
                  {sortBy === "latest"
                    ? "Mới nhất"
                    : sortBy === "popular"
                      ? "Phổ biến"
                      : "Cũ nhất"}
                </Text>
                <Feather name="chevron-down" size={12} color="#A19E95" />
              </TouchableOpacity>

              {showSortMenu && (
                <View
                  className="absolute right-0 top-8 bg-[#1A1A1C] border border-white/10 rounded-lg w-28 py-1 z-50 shadow-lg"
                  style={{ zIndex: 999 }}
                >
                  {(["latest", "popular", "oldest"] as const).map((option) => {
                    const optionLabel =
                      option === "latest"
                        ? "Mới nhất"
                        : option === "popular"
                          ? "Phổ biến"
                          : "Cũ nhất";
                    const isOptionActive = sortBy === option;
                    return (
                      <TouchableOpacity
                        key={option}
                        onPress={() => {
                          setSortBy(option);
                          setShowSortMenu(false);
                        }}
                        className="px-3 py-2 active:bg-zinc-800"
                      >
                        <Text
                          className={`text-[11px] ${
                            isOptionActive
                              ? "text-[#D4AF37] font-bold"
                              : "text-stone-300"
                          }`}
                        >
                          {optionLabel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}

        {/* TAB CONTENTS */}
        {activeTab === "home" &&
          renderContentGrid(getSortedAndFilteredList(series), "tác phẩm")}
        {activeTab === "comics" &&
          renderContentGrid(comicsList, "truyện tranh")}
        {activeTab === "movies" && renderContentGrid(moviesList, "phim ảnh")}
        {activeTab === "followers" && (
          <View className="px-4 py-3">
            {followersList.length === 0 ? (
              <View className="py-16 items-center justify-center">
                <Feather name="users" size={48} color="#3F3F46" />
                <Text className="text-zinc-500 text-sm mt-3 italic">
                  Chưa có người dùng nào theo dõi kênh của bạn
                </Text>
              </View>
            ) : (
              followersList.map((item, index) => (
                <View
                  key={item.accountId || index}
                  className="flex-row items-center justify-between py-3 border-b border-white/5"
                >
                  <View className="flex-row items-center flex-1 mr-3">
                    <View className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden border border-white/10 mr-3">
                      {item.avatarUrl ? (
                        <Image
                          source={{ uri: item.avatarUrl }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <Image
                          source={require("@assets/icon.png")}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text
                        className="text-white font-bold text-sm"
                        numberOfLines={1}
                      >
                        {item.username || item.fullName || "Người dùng TaleX"}
                      </Text>
                      {item.followedAt && (
                        <Text className="text-zinc-500 text-[11px] mt-0.5">
                          Theo dõi từ:{" "}
                          {new Date(item.followedAt).toLocaleDateString(
                            "vi-VN",
                          )}
                        </Text>
                      )}
                    </View>
                  </View>
                  <FollowButton
                    isFollowing={true}
                    onFollowToggle={() => {}}
                    size="small"
                  />
                </View>
              ))
            )}
          </View>
        )}
        {activeTab === "about" && (
          <View className="p-5">
            <Text className="text-white font-bold text-sm mb-2">Tiểu sử</Text>
            <Text className="text-zinc-400 text-xs leading-5 mb-6">
              {creator?.bio || "Kênh chưa cập nhật tiểu sử."}
            </Text>

            <Text className="text-white font-bold text-sm mb-2">
              Thông tin kênh
            </Text>
            <View className="flex-row items-center mb-3">
              <Feather name="mail" size={14} color="#71717A" />
              <Text className="text-zinc-400 text-xs ml-3">
                {user?.email || "Không có email công khai"}
              </Text>
            </View>
            <View className="flex-row items-center mb-3">
              <Feather name="calendar" size={14} color="#71717A" />
              <Text className="text-zinc-400 text-xs ml-3">
                Tham gia ngày{" "}
                {creator?.createdAt
                  ? new Date(creator.createdAt).toLocaleDateString("vi-VN")
                  : "không xác định"}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Feather name="info" size={14} color="#71717A" />
              <Text className="text-zinc-400 text-xs ml-3">
                Trạng thái:{" "}
                {creator?.status === "ACTIVE" ? "Hoạt động" : "Đang kiểm duyệt"}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* BOTTOM SHEET CHO MENU BA CHẤM DỌC */}
      <Modal
        visible={activeMenuId !== null}
        animationType="slide"
        transparent={true}
        statusBarTranslucent
        onRequestClose={() => setActiveMenuId(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            justifyContent: "flex-end",
            margin: 0,
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setActiveMenuId(null)}
            style={{ flex: 1 }}
          />
          <View
            style={{
              backgroundColor: "#161618",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: Math.max(insets.bottom, 24) + 12,
              borderTopWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.08)",
            }}
          >
            {/* Grab Bar */}
            <View className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-5" />

            {/* Title / Header */}
            {selectedItem && (
              <View className="mb-4">
                <Text className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                  Tác phẩm
                </Text>
                <Text
                  className="text-white text-base font-extrabold mt-0.5"
                  numberOfLines={1}
                >
                  {selectedItem.title}
                </Text>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (selectedItem) {
                  setEditingSeries(selectedItem);
                  setActiveMenuId(null);
                  handleOpenEditSeries(selectedItem);
                }
              }}
              className="py-3.5 flex-row items-center border-b border-white/5 active:opacity-70"
            >
              <View className="w-8 h-8 rounded-full bg-[#D4AF37]/10 items-center justify-center mr-3">
                <Feather name="edit-2" size={14} color="#D4AF37" />
              </View>
              <Text className="text-stone-300 text-sm font-semibold flex-1">
                Chỉnh sửa tác phẩm
              </Text>
              <Feather name="chevron-right" size={16} color="#444446" />
            </TouchableOpacity>

            {/* Option 2: Quản lý tập/chương */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (selectedItem) {
                  setActiveMenuId(null);
                  handleOpenManageEpisodes(selectedItem);
                }
              }}
              className="py-3.5 flex-row items-center border-b border-white/5 active:opacity-70"
            >
              <View className="w-8 h-8 rounded-full bg-blue-500/10 items-center justify-center mr-3">
                <Feather name="layers" size={14} color="#3B82F6" />
              </View>
              <Text className="text-stone-300 text-sm font-semibold flex-1">
                {selectedItem?.contentType?.toUpperCase() === "COMIC"
                  ? "Quản lý tập truyện"
                  : "Quản lý tập phim"}
              </Text>
              <Feather name="chevron-right" size={16} color="#444446" />
            </TouchableOpacity>

            {/* Option 2.5: Ẩn / Bỏ ẩn tác phẩm */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (selectedItem) {
                  setActiveMenuId(null);
                  handleToggleHideSeries(selectedItem);
                }
              }}
              className="py-3.5 flex-row items-center border-b border-white/5 active:opacity-70"
            >
              <View
                className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
                  selectedItem?.status === "HIDDEN"
                    ? "bg-green-500/10"
                    : "bg-amber-500/10"
                }`}
              >
                <Feather
                  name={selectedItem?.status === "HIDDEN" ? "eye" : "eye-off"}
                  size={14}
                  color={
                    selectedItem?.status === "HIDDEN" ? "#10B981" : "#F59E0B"
                  }
                />
              </View>
              <Text
                className={`text-sm font-semibold flex-1 ${
                  selectedItem?.status === "HIDDEN"
                    ? "text-green-400"
                    : "text-amber-500"
                }`}
              >
                {selectedItem?.status === "HIDDEN"
                  ? "Bỏ ẩn tác phẩm (Công khai)"
                  : "Ẩn tác phẩm"}
              </Text>
              <Feather name="chevron-right" size={16} color="#444446" />
            </TouchableOpacity>

            {/* Option 3: Xóa */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (selectedItem) {
                  setActiveMenuId(null);
                  handleDeleteSeries(selectedItem);
                }
              }}
              className="py-3.5 flex-row items-center border-b border-white/5 active:opacity-70"
            >
              <View className="w-8 h-8 rounded-full bg-red-500/10 items-center justify-center mr-3">
                <Feather name="trash-2" size={14} color="#EF4444" />
              </View>
              <Text className="text-red-400 text-sm font-semibold flex-1">
                Xóa tác phẩm
              </Text>
              <Feather name="chevron-right" size={16} color="#444446" />
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveMenuId(null)}
              className="mt-4 py-3 bg-zinc-800 rounded-xl items-center justify-center active:bg-zinc-700"
            >
              <Text className="text-stone-300 text-sm font-bold">Hủy bỏ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* EDIT SERIES MODAL */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowEditModal(false)}
      >
        <View className="flex-1 bg-[#0F0F0F]">
          <StatusBar barStyle="light-content" />

          {/* Header */}
          <View
            className="flex-row items-center justify-between px-4 border-b border-white/5 bg-[#141416]"
            style={{ paddingTop: insets.top, height: 56 + insets.top }}
          >
            <TouchableOpacity
              onPress={() => {
                setShowEditModal(false);
                setEditingSeries(null);
              }}
              className="py-2 px-3"
            >
              <Text className="text-zinc-400 text-sm font-bold">Hủy</Text>
            </TouchableOpacity>
            <Text className="text-white text-base font-bold">
              Chỉnh sửa tác phẩm
            </Text>
            <TouchableOpacity
              onPress={handleSaveSeries}
              disabled={savingSeries}
              className="py-2 px-3 bg-[#D4AF37] rounded-lg"
            >
              {savingSeries ? (
                <ActivityIndicator size="small" color="#141210" />
              ) : (
                <Text className="text-[#141210] text-xs font-black uppercase">
                  Lưu
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            className="flex-1 px-4 py-6"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title input */}
            <View className="mb-5">
              <Text className="text-zinc-400 text-xs font-bold mb-2">
                Tên tác phẩm *
              </Text>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Nhập tên tác phẩm..."
                placeholderTextColor="#7C766B"
                className="h-12 bg-[#1E1E22] border border-zinc-800 rounded-xl px-4 text-white text-sm font-semibold"
              />
            </View>

            {/* Description input */}
            <View className="mb-5">
              <Text className="text-zinc-400 text-xs font-bold mb-2">
                Mô tả chi tiết
              </Text>
              <TextInput
                value={editDesc}
                onChangeText={setEditDesc}
                placeholder="Nhập mô tả tác phẩm..."
                placeholderTextColor="#7C766B"
                multiline
                numberOfLines={4}
                style={{ textAlignVertical: "top" }}
                className="bg-[#1E1E22] border border-zinc-800 rounded-xl p-4 text-white text-sm font-semibold min-h-[100px]"
              />
            </View>

            {/* Cover photo */}
            <View className="mb-5">
              <Text className="text-zinc-400 text-xs font-bold mb-2">
                Ảnh bìa tác phẩm
              </Text>
              <TouchableOpacity
                onPress={handlePickEditCover}
                className="w-28 h-40 rounded-2xl overflow-hidden bg-zinc-800 items-center justify-center border border-zinc-700 relative"
              >
                {editCover?.uri ? (
                  <>
                    <Image
                      source={{ uri: editCover.uri }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    <View className="absolute inset-0 bg-black/40 items-center justify-center">
                      <Feather name="camera" size={20} color="white" />
                    </View>
                  </>
                ) : (
                  <View className="items-center">
                    <Feather name="image" size={28} color="#D4AF37" />
                    <Text className="text-zinc-500 text-[10px] font-bold mt-2">
                      Chọn ảnh
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Status (DRAFT, PUBLISHED) */}
            <View className="mb-5">
              <Text className="text-zinc-400 text-xs font-bold mb-2">
                Trạng thái phát hành
              </Text>
              <View className="flex-row" style={{ gap: 8 }}>
                {["DRAFT", "PUBLISHED"].map((st) => {
                  const isSel = editStatus === st;
                  const label = st === "DRAFT" ? "Bản nháp" : "Công khai";
                  return (
                    <TouchableOpacity
                      key={st}
                      onPress={() => setEditStatus(st)}
                      className={`flex-1 py-2.5 rounded-xl items-center border ${
                        isSel
                          ? "bg-[#FF4E4E]/10 border-[#FF4E4E]"
                          : "bg-[#1E1E22] border-zinc-800"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${isSel ? "text-[#FF4E4E]" : "text-zinc-400"}`}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Categories */}
            <View className="mb-5">
              <Text className="text-zinc-400 text-xs font-bold mb-2">
                Thể loại
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {categoriesList.map((cat) => {
                  const isSel = editCategoryIds.includes(cat.categoryId);
                  return (
                    <TouchableOpacity
                      key={cat.categoryId}
                      onPress={() => {
                        if (isSel) {
                          setEditCategoryIds(
                            editCategoryIds.filter(
                              (id) => id !== cat.categoryId,
                            ),
                          );
                        } else {
                          setEditCategoryIds([
                            ...editCategoryIds,
                            cat.categoryId,
                          ]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full border ${
                        isSel
                          ? "bg-[#D4AF37]/10 border-[#D4AF37]"
                          : "bg-[#1E1E22] border-zinc-800"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${isSel ? "text-[#D4AF37]" : "text-zinc-400"}`}
                      >
                        {cat.categoryName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Tags */}
            <View className="mb-10">
              <Text className="text-zinc-400 text-xs font-bold mb-2">
                Nhãn (Tags)
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {tagsList.map((t) => {
                  const isSel = editTagIds.includes(t.tagId);
                  return (
                    <TouchableOpacity
                      key={t.tagId}
                      onPress={() => {
                        if (isSel) {
                          setEditTagIds(
                            editTagIds.filter((id) => id !== t.tagId),
                          );
                        } else {
                          setEditTagIds([...editTagIds, t.tagId]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full border ${
                        isSel
                          ? "bg-[#D4AF37]/10 border-[#D4AF37]"
                          : "bg-[#1E1E22] border-zinc-800"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${isSel ? "text-[#D4AF37]" : "text-zinc-400"}`}
                      >
                        #{t.tagName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* MANAGE EPISODES MODAL */}
      <Modal
        visible={showEpisodesModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowEpisodesModal(false)}
      >
        <View className="flex-1 bg-[#0F0F0F]">
          <StatusBar barStyle="light-content" />

          {/* Header */}
          <View
            className="flex-row items-center justify-between px-4 border-b border-white/5 bg-[#141416]"
            style={{ paddingTop: insets.top, height: 56 + insets.top }}
          >
            {managingMediaEpisode ? (
              <TouchableOpacity
                onPress={() => setManagingMediaEpisode(null)}
                className="py-2 px-3"
              >
                <Text className="text-[#D4AF37] text-sm font-bold">
                  ← Quay lại
                </Text>
              </TouchableOpacity>
            ) : editingEpisode ? (
              <TouchableOpacity
                onPress={() => setEditingEpisode(null)}
                className="py-2 px-3"
              >
                <Text className="text-zinc-400 text-sm font-bold">Hủy</Text>
              </TouchableOpacity>
            ) : editingSeason ? (
              <TouchableOpacity
                onPress={() => setEditingSeason(null)}
                className="py-2 px-3"
              >
                <Text className="text-zinc-400 text-sm font-bold">Hủy</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setShowEpisodesModal(false)}
                className="py-2 px-3"
              >
                <Text className="text-zinc-400 text-sm font-bold">Đóng</Text>
              </TouchableOpacity>
            )}
            <Text
              className="text-white text-base font-bold flex-1 text-center"
              numberOfLines={1}
            >
              {managingMediaEpisode
                ? manageSeries?.contentType?.toUpperCase() === "COMIC"
                  ? "Quản lý trang truyện"
                  : "Quản lý video"
                : editingEpisode
                  ? manageSeries?.contentType?.toUpperCase() === "COMIC"
                    ? "Sửa tập truyện"
                    : "Sửa tập phim"
                  : editingSeason
                    ? "Sửa Season"
                    : manageSeries
                      ? manageSeries.contentType?.toUpperCase() === "COMIC"
                        ? `Mục lục: ${manageSeries.title}`
                        : `Tập phim: ${manageSeries.title}`
                      : "Quản lý các tập"}
            </Text>
            {editingEpisode ? (
              <TouchableOpacity
                onPress={handleSaveEpisode}
                disabled={savingEpisode}
                className="py-2 px-3 bg-[#D4AF37] rounded-lg"
              >
                {savingEpisode ? (
                  <ActivityIndicator size="small" color="#141210" />
                ) : (
                  <Text className="text-[#141210] text-xs font-black uppercase">
                    Lưu
                  </Text>
                )}
              </TouchableOpacity>
            ) : editingSeason ? (
              <TouchableOpacity
                onPress={handleSaveSeason}
                disabled={savingSeason}
                className="py-2 px-3 bg-[#D4AF37] rounded-lg"
              >
                {savingSeason ? (
                  <ActivityIndicator size="small" color="#141210" />
                ) : (
                  <Text className="text-[#141210] text-xs font-black uppercase">
                    Lưu
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <View className="w-10" />
            )}
          </View>

          {managingMediaEpisode ? (
            <View className="flex-1">
              {loadingMedia ? (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator size="large" color="#FF4E4E" />
                  <Text className="text-zinc-500 text-xs mt-3 font-semibold">
                    Đang tải tệp tin...
                  </Text>
                </View>
              ) : mediaList.length === 0 ? (
                <View className="flex-1 items-center justify-center p-8">
                  <Feather
                    name="image"
                    size={32}
                    color="#7C766B"
                    style={{ marginBottom: 12 }}
                  />
                  <Text className="text-zinc-500 text-sm font-bold text-center">
                    Chưa có tệp tin nào
                  </Text>
                  <Text className="text-zinc-600 text-xs text-center mt-1 leading-5">
                    Tập truyện này chưa có trang ảnh hoặc video nào được tải
                    lên.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  className="flex-1 p-4"
                  showsVerticalScrollIndicator={false}
                >
                  {mediaList.map((m, index) => (
                    <View
                      key={m.mediaId}
                      className="bg-[#18181C] border border-white/5 rounded-2xl p-4 mb-4 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center flex-1 mr-3">
                        {m.mediaType === "IMAGE" ||
                        manageSeries?.contentType?.toUpperCase() === "COMIC" ? (
                          <Image
                            source={{
                              uri:
                                m.fileUrl || "https://placehold.co/150x225/png",
                            }}
                            style={{ width: 48, height: 72 }}
                            className="rounded-lg bg-zinc-800 mr-3"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-12 h-12 rounded-lg bg-zinc-800 items-center justify-center mr-3">
                            <Feather name="video" size={20} color="#D4AF37" />
                          </View>
                        )}
                        <View className="flex-1">
                          <Text className="text-white text-xs font-bold">
                            {m.mediaType === "IMAGE" ||
                            manageSeries?.contentType?.toUpperCase() === "COMIC"
                              ? `Trang ${index + 1}`
                              : `Video Tập`}
                          </Text>
                          <Text
                            className="text-zinc-500 text-[10px] mt-1"
                            numberOfLines={1}
                          >
                            ID: {m.mediaId}
                          </Text>
                          {m.status ? (
                            <View
                              className={`px-1.5 py-0.5 rounded-full mt-1.5 self-start ${
                                m.status === "ACTIVE" ||
                                m.status === "HLS_READY"
                                  ? "bg-green-500/10 border border-green-500/20"
                                  : m.status === "FAILED"
                                    ? "bg-red-500/10 border border-red-500/20"
                                    : "bg-amber-500/10 border border-amber-500/20"
                              }`}
                            >
                              <Text
                                className={`text-[7px] font-black uppercase ${
                                  m.status === "ACTIVE" ||
                                  m.status === "HLS_READY"
                                    ? "text-green-400"
                                    : m.status === "FAILED"
                                      ? "text-red-400"
                                      : "text-amber-400"
                                }`}
                              >
                                {m.status}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      <View className="flex-row items-center">
                        {index > 0 &&
                          (m.mediaType === "IMAGE" ||
                            manageSeries?.contentType?.toUpperCase() ===
                              "COMIC") && (
                            <TouchableOpacity
                              onPress={() => handleMoveMedia(index, "up")}
                              className="w-8 h-8 rounded-lg bg-zinc-800 items-center justify-center mr-1.5 active:opacity-70"
                            >
                              <Feather
                                name="arrow-up"
                                size={12}
                                color="#D4AF37"
                              />
                            </TouchableOpacity>
                          )}
                        {index < mediaList.length - 1 &&
                          (m.mediaType === "IMAGE" ||
                            manageSeries?.contentType?.toUpperCase() ===
                              "COMIC") && (
                            <TouchableOpacity
                              onPress={() => handleMoveMedia(index, "down")}
                              className="w-8 h-8 rounded-lg bg-zinc-800 items-center justify-center mr-1.5 active:opacity-70"
                            >
                              <Feather
                                name="arrow-down"
                                size={12}
                                color="#D4AF37"
                              />
                            </TouchableOpacity>
                          )}
                        <TouchableOpacity
                          onPress={() => handleDeleteMedia(m.mediaId)}
                          className="w-8 h-8 rounded-lg bg-red-500/10 items-center justify-center active:opacity-70"
                        >
                          <Feather name="trash-2" size={12} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : editingEpisode ? (
            <View className="flex-1">
              <ScrollView
                className="flex-1 px-4 py-6"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Episode Number */}
                <View className="mb-4">
                  <Text className="text-zinc-400 text-xs font-bold mb-2">
                    {manageSeries?.contentType?.toUpperCase() === "COMIC"
                      ? "Số thứ tự tập truyện *"
                      : "Số thứ tự tập phim *"}
                  </Text>
                  <TextInput
                    value={editEpNumber}
                    onChangeText={setEditEpNumber}
                    keyboardType="number-pad"
                    placeholder="Ví dụ: 1, 2..."
                    placeholderTextColor="#7C766B"
                    className="h-12 bg-[#18181C] border border-white/5 rounded-xl px-4 text-white text-sm font-semibold"
                  />
                </View>

                {/* Episode Title */}
                <View className="mb-4">
                  <Text className="text-zinc-400 text-xs font-bold mb-2">
                    {manageSeries?.contentType?.toUpperCase() === "COMIC"
                      ? "Tiêu đề tập truyện *"
                      : "Tiêu đề tập phim *"}
                  </Text>
                  <TextInput
                    value={editEpTitle}
                    onChangeText={setEditEpTitle}
                    placeholder={
                      manageSeries?.contentType?.toUpperCase() === "COMIC"
                        ? "Nhập tiêu đề tập truyện..."
                        : "Nhập tiêu đề tập phim..."
                    }
                    placeholderTextColor="#7C766B"
                    className="h-12 bg-[#18181C] border border-white/5 rounded-xl px-4 text-white text-sm font-semibold"
                  />
                </View>

                {/* Episode Description */}
                <View className="mb-4">
                  <Text className="text-zinc-400 text-xs font-bold mb-2">
                    Mô tả ngắn
                  </Text>
                  <TextInput
                    value={editEpDesc}
                    onChangeText={setEditEpDesc}
                    placeholder="Tóm tắt ngắn nội dung của phần này..."
                    placeholderTextColor="#7C766B"
                    multiline
                    numberOfLines={4}
                    style={{ textAlignVertical: "top" }}
                    className="bg-[#18181C] border border-white/5 rounded-xl p-4 text-white text-sm font-semibold min-h-[100px]"
                  />
                </View>

                {/* Unlock Type Selector */}
                <View className="mb-4">
                  <Text className="text-zinc-400 text-xs font-bold mb-2.5">
                    Hình thức phát hành
                  </Text>
                  <View className="flex-row" style={{ gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditEpUnlockType("FREE");
                        setEditEpPriceVnd("0");
                      }}
                      className={`flex-1 py-3 border rounded-xl items-center ${
                        editEpUnlockType === "FREE"
                          ? "bg-[#FF4E4E]/10 border-[#FF4E4E]"
                          : "bg-[#18181C] border-white/5"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${editEpUnlockType === "FREE" ? "text-[#FF4E4E]" : "text-zinc-400"}`}
                      >
                        Miễn Phí
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        setEditEpUnlockType("COIN");
                      }}
                      className={`flex-1 py-3 border rounded-xl items-center ${
                        editEpUnlockType === "COIN"
                          ? "bg-[#FF4E4E]/10 border-[#FF4E4E]"
                          : "bg-[#18181C] border-white/5"
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${editEpUnlockType === "COIN" ? "text-[#FF4E4E]" : "text-zinc-400"}`}
                      >
                        Bán Xu (Trả Phí)
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Price input if COIN */}
                {editEpUnlockType === "COIN" && (
                  <View className="mb-6">
                    <Text className="text-zinc-400 text-xs font-bold mb-2">
                      Giá bán (Xu) *
                    </Text>
                    <TextInput
                      value={editEpPriceVnd}
                      onChangeText={setEditEpPriceVnd}
                      keyboardType="number-pad"
                      placeholder="Nhập số xu cần mua..."
                      placeholderTextColor="#7C766B"
                      className="h-12 bg-[#18181C] border border-white/5 rounded-xl px-4 text-white text-sm font-semibold"
                    />
                  </View>
                )}
              </ScrollView>
            </View>
          ) : editingSeason ? (
            <View className="flex-1">
              <ScrollView
                className="flex-1 px-4 py-6"
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Season Number */}
                <View className="mb-4">
                  <Text className="text-zinc-400 text-xs font-bold mb-2">
                    Số thứ tự Season *
                  </Text>
                  <TextInput
                    value={editSeasonNumber}
                    onChangeText={setEditSeasonNumber}
                    keyboardType="number-pad"
                    placeholder="Ví dụ: 1, 2..."
                    placeholderTextColor="#7C766B"
                    className="h-12 bg-[#18181C] border border-white/5 rounded-xl px-4 text-white text-sm font-semibold"
                  />
                </View>

                {/* Season Title */}
                <View className="mb-4">
                  <Text className="text-zinc-400 text-xs font-bold mb-2">
                    Tiêu đề Season
                  </Text>
                  <TextInput
                    value={editSeasonTitle}
                    onChangeText={setEditSeasonTitle}
                    placeholder="Nhập tiêu đề Season..."
                    placeholderTextColor="#7C766B"
                    className="h-12 bg-[#18181C] border border-white/5 rounded-xl px-4 text-white text-sm font-semibold"
                  />
                </View>

                {/* Season Description */}
                <View className="mb-4">
                  <Text className="text-zinc-400 text-xs font-bold mb-2">
                    Mô tả Season
                  </Text>
                  <TextInput
                    value={editSeasonDesc}
                    onChangeText={setEditSeasonDesc}
                    placeholder="Nhập mô tả Season..."
                    placeholderTextColor="#7C766B"
                    multiline
                    numberOfLines={4}
                    style={{ textAlignVertical: "top" }}
                    className="bg-[#18181C] border border-white/5 rounded-xl p-4 text-white text-sm font-semibold min-h-[100px]"
                  />
                </View>
              </ScrollView>
            </View>
          ) : loadingEpisodesData ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#FF4E4E" />
              <Text className="text-zinc-500 text-xs mt-3 font-semibold">
                Đang tải danh sách tập phim...
              </Text>
            </View>
          ) : manageSeasons.length === 0 ? (
            <View className="flex-1 items-center justify-center p-8">
              <Feather name="info" size={32} color="#7C766B" />
              <Text className="text-zinc-500 text-sm font-bold text-center mt-3">
                Chưa có Season nào
              </Text>
              <Text className="text-zinc-600 text-xs text-center mt-1 leading-5">
                Vui lòng tạo Season mới trong quy trình Đăng tải để bắt đầu thêm
                các tập.
              </Text>
            </View>
          ) : (
            <ScrollView
              className="flex-1 p-4"
              showsVerticalScrollIndicator={false}
            >
              {manageSeasons.map((s) => {
                const eps = episodesMap[s.seasonId] || [];
                return (
                  <View
                    key={s.seasonId}
                    className="mb-6 bg-[#18181C] border border-white/5 rounded-2xl p-4"
                  >
                    <View className="flex-row items-center justify-between mb-3 border-b border-white/5 pb-2">
                      <View className="flex-row items-center flex-1 mr-2">
                        <Feather
                          name="folder"
                          size={16}
                          color="#D4AF37"
                          style={{ marginRight: 6 }}
                        />
                        <Text className="text-white text-sm font-black">
                          Mùa {s.seasonNumber}
                        </Text>
                        {s.title ? (
                          <Text
                            className="text-zinc-400 text-xs font-semibold ml-2 flex-1"
                            numberOfLines={1}
                          >
                            - {s.title}
                          </Text>
                        ) : null}
                        {s.status && (
                          <View
                            className={`px-2 py-0.5 rounded-full ml-2 border ${
                              s.status === "PUBLISHED"
                                ? "bg-green-500/10 border-green-500/30"
                                : s.status === "HIDDEN"
                                  ? "bg-amber-500/10 border-amber-500/30"
                                  : "bg-zinc-500/10 border-zinc-500/30"
                            }`}
                          >
                            <Text
                              className={`text-[8px] font-black uppercase ${
                                s.status === "PUBLISHED"
                                  ? "text-green-400"
                                  : s.status === "HIDDEN"
                                    ? "text-amber-400"
                                    : "text-zinc-400"
                              }`}
                            >
                              {s.status === "PUBLISHED"
                                ? "Công khai"
                                : s.status === "HIDDEN"
                                  ? "Bị ẩn"
                                  : s.status}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View className="flex-row items-center">
                        <TouchableOpacity
                          onPress={() => handleToggleHideSeason(s)}
                          className={`w-7 h-7 rounded-lg items-center justify-center mr-2 active:opacity-65 ${
                            s.status === "HIDDEN"
                              ? "bg-green-500/10"
                              : "bg-amber-500/10"
                          }`}
                        >
                          <Feather
                            name={s.status === "HIDDEN" ? "eye" : "eye-off"}
                            size={12}
                            color={
                              s.status === "HIDDEN" ? "#10B981" : "#F59E0B"
                            }
                          />
                        </TouchableOpacity>

                        {/* Edit Season Button */}
                        <TouchableOpacity
                          onPress={() => handleStartEditSeason(s)}
                          className="w-7 h-7 rounded-lg bg-zinc-800 items-center justify-center mr-2 active:opacity-65"
                        >
                          <Feather name="edit-2" size={11} color="#D4AF37" />
                        </TouchableOpacity>

                        {/* Delete Season Button */}
                        <TouchableOpacity
                          onPress={() => handleDeleteSeason(s.seasonId)}
                          className="w-7 h-7 rounded-lg bg-red-500/10 items-center justify-center mr-2 active:opacity-65"
                        >
                          <Feather name="trash-2" size={11} color="#EF4444" />
                        </TouchableOpacity>

                        <Text className="text-zinc-500 text-[10px] font-black uppercase">
                          {eps.length} tập
                        </Text>
                      </View>
                    </View>

                    {eps.length === 0 ? (
                      <Text className="text-zinc-600 text-xs italic py-2">
                        Mùa này chưa có tập nào.
                      </Text>
                    ) : (
                      eps.map((ep) => (
                        <View
                          key={ep.episodeId}
                          className="flex-row items-center justify-between py-3 border-b border-white/5 last:border-b-0"
                        >
                          <View className="flex-1 mr-3">
                            <View className="flex-row items-center flex-wrap">
                              <Text className="text-white text-sm font-bold">
                                Tập {ep.episodeNumber}: {ep.title}
                              </Text>
                              {(() => {
                                let bgClass =
                                  "bg-zinc-500/10 border-zinc-500/30";
                                let textClass = "text-zinc-400";
                                let statusText = "Nháp";
                                if (ep.status === "PUBLISHED") {
                                  bgClass =
                                    "bg-green-500/10 border-green-500/30";
                                  textClass = "text-green-400";
                                  statusText = "Công khai";
                                } else if (ep.status === "HIDDEN") {
                                  bgClass =
                                    "bg-amber-500/10 border-amber-500/30";
                                  textClass = "text-amber-400";
                                  statusText = "Bị ẩn";
                                } else if (ep.status === "SCHEDULED") {
                                  bgClass = "bg-blue-500/10 border-blue-500/30";
                                  textClass = "text-blue-400";
                                  statusText = "Lên lịch";
                                }
                                return (
                                  <View
                                    className={`px-2 py-0.5 rounded-full ml-2 border ${bgClass}`}
                                  >
                                    <Text
                                      className={`text-[8px] font-black uppercase ${textClass}`}
                                    >
                                      {statusText}
                                    </Text>
                                  </View>
                                );
                              })()}
                              {ep.unlockType === "PAID" ? (
                                <View className="bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded-full ml-1">
                                  <Text className="text-yellow-400 text-[8px] font-black">
                                    {ep.priceVnd} Xu
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                            {ep.description ? (
                              <Text
                                className="text-zinc-500 text-xs mt-1"
                                numberOfLines={1}
                              >
                                {ep.description}
                              </Text>
                            ) : null}
                          </View>

                          <View className="flex-row items-center">
                            {/* Hide / Unhide Toggle */}
                            {(ep.status === "PUBLISHED" ||
                              ep.status === "HIDDEN") && (
                              <TouchableOpacity
                                onPress={() => handleToggleHideEpisode(ep)}
                                className={`w-8 h-8 rounded-lg items-center justify-center mr-2 active:opacity-70 ${
                                  ep.status === "HIDDEN"
                                    ? "bg-green-500/10"
                                    : "bg-amber-500/10"
                                }`}
                              >
                                <Feather
                                  name={
                                    ep.status === "HIDDEN" ? "eye" : "eye-off"
                                  }
                                  size={12}
                                  color={
                                    ep.status === "HIDDEN"
                                      ? "#10B981"
                                      : "#F59E0B"
                                  }
                                />
                              </TouchableOpacity>
                            )}

                            {/* Schedule / Cancel Schedule Toggle */}
                            {ep.status === "SCHEDULED" ? (
                              <TouchableOpacity
                                onPress={() => handleCancelSchedule(ep)}
                                className="w-8 h-8 rounded-lg bg-red-500/10 items-center justify-center mr-2 active:opacity-70"
                              >
                                <Feather
                                  name="clock"
                                  size={12}
                                  color="#EF4444"
                                />
                              </TouchableOpacity>
                            ) : ep.status === "DRAFT" ? (
                              <TouchableOpacity
                                onPress={() => {
                                  setScheduledEpisode(ep);
                                  setScheduleDate(
                                    new Date(Date.now() + 10 * 60 * 1000),
                                  );
                                  setShowScheduleModal(true);
                                }}
                                className="w-8 h-8 rounded-lg bg-blue-500/10 items-center justify-center mr-2 active:opacity-70"
                              >
                                <Feather
                                  name="calendar"
                                  size={12}
                                  color="#3B82F6"
                                />
                              </TouchableOpacity>
                            ) : null}

                            <TouchableOpacity
                              onPress={() => handleOpenMediaManager(ep)}
                              className="w-8 h-8 rounded-lg bg-zinc-800 items-center justify-center mr-2 active:opacity-70"
                            >
                              <Feather
                                name={
                                  manageSeries?.contentType?.toUpperCase() ===
                                  "COMIC"
                                    ? "image"
                                    : "film"
                                }
                                size={12}
                                color="#D4AF37"
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleStartEditEpisode(ep)}
                              className="w-8 h-8 rounded-lg bg-zinc-800 items-center justify-center mr-2 active:opacity-70"
                            >
                              <Feather
                                name="edit-2"
                                size={12}
                                color="#D4AF37"
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleDeleteEpisode(ep)}
                              className="w-8 h-8 rounded-lg bg-red-500/10 items-center justify-center active:opacity-70"
                            >
                              <Feather
                                name="trash-2"
                                size={12}
                                color="#EF4444"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* EPISODE SCHEDULE MODAL */}
          <Modal visible={showScheduleModal} transparent animationType="fade">
            <View className="flex-1 bg-black/60 items-center justify-center p-4">
              <View className="bg-[#141416] border border-white/10 w-full max-w-[340px] rounded-3xl p-6 shadow-2xl">
                <Text className="text-white text-base font-black mb-1">
                  Lên lịch xuất bản tập
                </Text>
                <Text className="text-zinc-500 text-xs mb-5">
                  Chọn ngày và giờ trong tương lai để tự động công khai tập này.
                </Text>

                <View className="space-y-4 mb-6">
                  {/* Date Button */}
                  <TouchableOpacity
                    onPress={() => {
                      setShowDatePicker(!showDatePicker);
                      setShowTimePicker(false);
                    }}
                    className="flex-row items-center justify-between p-3.5 bg-[#18181C] border border-white/5 rounded-xl"
                  >
                    <View className="flex-row items-center">
                      <Feather
                        name="calendar"
                        size={14}
                        color="#D4AF37"
                        style={{ marginRight: 8 }}
                      />
                      <Text className="text-zinc-400 text-[11px] font-bold mr-1.5">
                        Ngày:
                      </Text>
                      <Text className="text-white text-xs font-semibold">
                        {scheduleDate.toLocaleDateString("vi-VN")}
                      </Text>
                    </View>
                    <Feather
                      name={showDatePicker ? "chevron-up" : "chevron-down"}
                      size={14}
                      color="#7C766B"
                    />
                  </TouchableOpacity>

                  {showDatePicker && Platform.OS === "ios" && (
                    <View className="bg-[#18181C] border border-white/5 rounded-xl p-2 items-center">
                      <DateTimePicker
                        value={scheduleDate}
                        mode="date"
                        display="spinner"
                        minimumDate={new Date()}
                        themeVariant="dark"
                        onChange={(event, selectedDate) => {
                          if (selectedDate) {
                            const newDate = new Date(scheduleDate);
                            newDate.setFullYear(selectedDate.getFullYear());
                            newDate.setMonth(selectedDate.getMonth());
                            newDate.setDate(selectedDate.getDate());
                            setScheduleDate(newDate);
                          }
                        }}
                        style={{ width: 280, height: 120 }}
                      />
                    </View>
                  )}

                  {/* Time Button */}
                  <TouchableOpacity
                    onPress={() => {
                      setShowTimePicker(!showTimePicker);
                      setShowDatePicker(false);
                    }}
                    className="flex-row items-center justify-between p-3.5 bg-[#18181C] border border-white/5 rounded-xl"
                  >
                    <View className="flex-row items-center">
                      <Feather
                        name="clock"
                        size={14}
                        color="#D4AF37"
                        style={{ marginRight: 8 }}
                      />
                      <Text className="text-zinc-400 text-[11px] font-bold mr-1.5">
                        Giờ:
                      </Text>
                      <Text className="text-white text-xs font-semibold">
                        {scheduleDate.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                    <Feather
                      name={showTimePicker ? "chevron-up" : "chevron-down"}
                      size={14}
                      color="#7C766B"
                    />
                  </TouchableOpacity>

                  {showTimePicker && Platform.OS === "ios" && (
                    <View className="bg-[#18181C] border border-white/5 rounded-xl p-2 items-center">
                      <DateTimePicker
                        value={scheduleDate}
                        mode="time"
                        display="spinner"
                        themeVariant="dark"
                        onChange={(event, selectedTime) => {
                          if (selectedTime) {
                            const newDate = new Date(scheduleDate);
                            newDate.setHours(selectedTime.getHours());
                            newDate.setMinutes(selectedTime.getMinutes());
                            newDate.setSeconds(0);
                            setScheduleDate(newDate);
                          }
                        }}
                        style={{ width: 280, height: 120 }}
                      />
                    </View>
                  )}
                </View>

                {/* Buttons */}
                <View className="flex-row justify-between" style={{ gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowScheduleModal(false);
                      setScheduledEpisode(null);
                      setShowDatePicker(false);
                      setShowTimePicker(false);
                    }}
                    className="flex-1 py-3 bg-zinc-800 border border-zinc-700 rounded-xl items-center justify-center"
                  >
                    <Text className="text-zinc-300 text-xs font-bold uppercase">
                      Hủy
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmSchedule}
                    className="flex-1 py-3 bg-[#FF4E4E] rounded-xl items-center justify-center"
                  >
                    <Text className="text-white text-xs font-bold uppercase">
                      Lên lịch
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Android-only native dialog popups */}
          {Platform.OS !== "ios" && showDatePicker && (
            <DateTimePicker
              value={scheduleDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  const newDate = new Date(scheduleDate);
                  newDate.setFullYear(selectedDate.getFullYear());
                  newDate.setMonth(selectedDate.getMonth());
                  newDate.setDate(selectedDate.getDate());
                  setScheduleDate(newDate);
                }
              }}
            />
          )}
          {Platform.OS !== "ios" && showTimePicker && (
            <DateTimePicker
              value={scheduleDate}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) {
                  const newDate = new Date(scheduleDate);
                  newDate.setHours(selectedTime.getHours());
                  newDate.setMinutes(selectedTime.getMinutes());
                  newDate.setSeconds(0);
                  setScheduleDate(newDate);
                }
              }}
            />
          )}
        </View>
      </Modal>
      <CreatorTierModal
        visible={showTierModal}
        onClose={() => setShowTierModal(false)}
        currentTierLevel={currentTierLevel}
        currentFollowers={followersCount}
        currentViews={totalViewsSum}
        currentWatchTime={totalWatchTimeSum}
      />
    </View>
  );
}
