import React, { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";

import {
  listSeriesByCreator,
  createSeries,
  listSeasonsBySeries,
  createSeason,
  updateSeason,
  deleteSeason,
  hideSeason,
  unhideSeason,
  updateSeries,
  deleteSeries,
  listEpisodesBySeason,
  createEpisode,
  uploadImageToS3,
  createComicPageMedia,
  publishEpisode,
  schedulePublishEpisode,
  listMediaByEpisode,
  SeriesItem,
  SeasonItem,
  MediaComicPageRequest,
  getCategories,
  getTags,
  CategoryResponse,
  TagResponse,
} from "@/services/creatorContent";
import { getOwnCreator } from "@/services/creator";
import { useAuth } from "@/context/AuthContext";
import { connectPipelineSSE } from "@/services/pipelineSSE";

// Component imports
import StepIndicator from "./components/StepIndicator";
import SeriesStep from "./components/SeriesStep";
import SeasonStep from "./components/SeasonStep";
import EpisodeDetailsStep from "./components/EpisodeDetailsStep";
import ComicPagesUploadStep from "./components/ComicPagesUploadStep";
import PublishStep from "./components/PublishStep";

type LocalComicPage = {
  id: string;
  uri: string;
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
};

const getImageDimensions = (
  uri: string,
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => {
        resolve({ width, height });
      },
      () => {
        resolve({ width: 0, height: 0 });
      },
    );
  });
};

export default function UploadComicScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Loading & Submitting State
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");

  // --- STEP 1: SERIES STATE ---
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [seriesMode, setSeriesMode] = useState<"select" | "create">("select");
  const [selectedSeriesId, setSelectedSeriesId] = useState("");
  const [newSeriesTitle, setNewSeriesTitle] = useState("");
  const [newSeriesDesc, setNewSeriesDesc] = useState("");
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [seriesCover, setSeriesCover] = useState<{
    uri: string;
    name: string;
    size: number;
    type: string;
    isUrl?: boolean;
  } | null>(null);
  const [seriesBanner, setSeriesBanner] = useState<{
    uri: string;
    name: string;
    size: number;
    type: string;
    isUrl?: boolean;
  } | null>(null);
  const [ageRating, setAgeRating] = useState<string>("EVERYONE");
  const [language, setLanguage] = useState<string>("vi");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);

  // --- STEP 2: SEASON STATE ---
  const [seasonList, setSeasonList] = useState<SeasonItem[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [seasonMode, setSeasonMode] = useState<"select" | "create">("select");
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [newSeasonNumber, setNewSeasonNumber] = useState("");
  const [newSeasonTitle, setNewSeasonTitle] = useState("");
  const [newSeasonDesc, setNewSeasonDesc] = useState("");
  const [editingSeasonId, setEditingSeasonId] = useState<string | null>(null);

  // --- STEP 3: EPISODE/CHAPTER STATE ---
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [episodeDesc, setEpisodeDesc] = useState("");
  const [releaseType, setReleaseType] = useState<"free" | "premium" | "coin">(
    "free",
  );
  const [coinPrice, setCoinPrice] = useState("5");
  const [createdEpisodeId, setCreatedEpisodeId] = useState<string | null>(null);
  const [episodeThumbnail, setEpisodeThumbnail] = useState<{
    uri: string;
    name: string;
    size: number;
    type: string;
  } | null>(null);

  // --- STEP 4: PAGES UPLOAD STATE ---
  const [comicPages, setComicPages] = useState<LocalComicPage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [creatorId, setCreatorId] = useState("");
  const actorId = user?.accountId || "";

  const [moderationStatus, setModerationStatus] = useState<string | null>(null);
  const [isModerationDone, setIsModerationDone] = useState(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sseSessionRef = useRef<{ close: () => void } | null>(null);

  // Fetch Categories & Tags on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [catsRes, tagsRes] = await Promise.all([
          getCategories(),
          getTags(),
        ]);
        setCategories(catsRes?.content || []);
        setTags(tagsRes?.content || []);
      } catch (err) {
        console.error("Lỗi tải thể loại/tag:", err);
      }
    };
    fetchMeta();
  }, []);

  // Clean polling & SSE on unmount
  useEffect(() => {
    return () => {
      if (sseSessionRef.current) {
        sseSessionRef.current.close();
        sseSessionRef.current = null;
      }
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  const checkComicMediaStatus = async (episodeId: string) => {
    try {
      const mediaList = await listMediaByEpisode(episodeId);
      if (mediaList.length > 0) {
        const total = mediaList.length;
        const approvedCount = mediaList.filter(
          (m) => m.approvalStatus === "APPROVED" || m.status === "ACTIVE",
        ).length;
        const rejectedCount = mediaList.filter(
          (m) =>
            m.approvalStatus === "REJECTED" ||
            m.status === "INACTIVE" ||
            m.status === "FAILED",
        ).length;

        if (rejectedCount > 0) {
          setModerationStatus(
            `Từ chối: Phát hiện ${rejectedCount} trang vi phạm chính sách!`,
          );
          setIsModerationDone(false);
          if (sseSessionRef.current) {
            sseSessionRef.current.close();
            sseSessionRef.current = null;
          }
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          Toast.show({
            type: "error",
            text1: "Kiểm duyệt thất bại",
            text2: "Một số trang truyện vi phạm chính sách và bị từ chối.",
          });
        } else if (approvedCount === total) {
          setModerationStatus(
            "Đạt: Toàn bộ ảnh đã được kiểm duyệt và an toàn.",
          );
          setIsModerationDone(true);
          if (sseSessionRef.current) {
            sseSessionRef.current.close();
            sseSessionRef.current = null;
          }
          if (pollTimerRef.current) {
            clearInterval(pollTimerRef.current);
            pollTimerRef.current = null;
          }
          Toast.show({
            type: "success",
            text1: "Kiểm duyệt hoàn tất",
            text2: "Tất cả các trang truyện đã được phê duyệt.",
          });
        } else {
          setModerationStatus(
            `Đang duyệt ảnh bằng AI: ${approvedCount}/${total} trang đã đạt...`,
          );
        }
      }
    } catch (err) {
      console.error("Lỗi kiểm tra trạng thái kiểm duyệt truyện:", err);
    }
  };

  const startPollingPipeline = (episodeId: string) => {
    if (sseSessionRef.current) {
      sseSessionRef.current.close();
      sseSessionRef.current = null;
    }
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    setModerationStatus("Đang kiểm duyệt các trang ảnh bằng AI...");
    setIsModerationDone(false);

    // 1. Connect Real-time SSE Stream (Same as Web)
    connectPipelineSSE({
      onModerationComplete: () => {
        checkComicMediaStatus(episodeId);
      },
      onCopyrightComplete: () => {
        checkComicMediaStatus(episodeId);
      },
      onFailed: (data) => {
        setModerationStatus("Xử lý trang truyện thất bại");
        Toast.show({
          type: "error",
          text1: "Xử lý thất bại",
          text2: data.errorMessage || "Có lỗi trong quá trình xử lý ảnh.",
        });
      },
      onError: (err) => {
        console.warn("[SSE Comic] Connection error", err);
      },
    })
      .then((session) => {
        sseSessionRef.current = session;
      })
      .catch((err) => {
        console.error("Lỗi kết nối SSE cho truyện:", err);
      });

    // 2. Continuous Polling Fallback (Every 3s, matching Web)
    checkComicMediaStatus(episodeId);
    pollTimerRef.current = setInterval(() => {
      checkComicMediaStatus(episodeId);
    }, 3000);
  };

  // Load Creator Profile (creatorId & actorId)
  useEffect(() => {
    const fetchCreatorProfile = async () => {
      try {
        const creatorData = await getOwnCreator();
        if (creatorData) {
          if (creatorData.isAcceptedLatestTerms === false) {
            navigation.navigate("CreatorGuard");
            return;
          }
          const cId = creatorData.creatorId || creatorData.id;
          if (cId) setCreatorId(cId);
        }
      } catch (err: any) {
        console.error("Lỗi tải thông tin creator profile:", err);
        if (Number(err?.code) === 4041) {
          navigation.navigate("CreatorGuard");
        }
      }
    };
    fetchCreatorProfile();
  }, [navigation]);

  // Load Creator Series (filtering ContentType = "COMIC")
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoadingSeries(true);
        const list = await listSeriesByCreator();
        const comicSeries = list.filter((s) => s.contentType === "COMIC");
        setSeriesList(comicSeries);
        if (comicSeries.length > 0) {
          setSelectedSeriesId(comicSeries[0].seriesId);
        }
      } catch (err: any) {
        console.error("Lỗi tải danh sách series truyện:", err);
        Toast.show({
          type: "error",
          text1: "Lỗi kết nối",
          text2: "Không thể tải danh sách bộ truyện của bạn.",
        });
      } finally {
        setLoadingSeries(false);
      }
    };
    fetchSeries();
  }, []);

  // Load Seasons when selectedSeriesId changes
  useEffect(() => {
    if (!selectedSeriesId || seriesMode === "create") {
      setSeasonList([]);
      setSelectedSeasonId("");
      return;
    }

    const fetchSeasons = async () => {
      try {
        setLoadingSeasons(true);
        const list = await listSeasonsBySeries(selectedSeriesId);
        setSeasonList(list);
        if (list.length > 0) {
          setSelectedSeasonId(list[0].seasonId);
        } else {
          setSelectedSeasonId("");
        }
      } catch (err) {
        console.error("Lỗi tải seasons:", err);
      } finally {
        setLoadingSeasons(false);
      }
    };
    fetchSeasons();
  }, [selectedSeriesId, seriesMode]);

  const toggleCategory = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      setSelectedCategoryIds(
        selectedCategoryIds.filter((id) => id !== categoryId),
      );
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, categoryId]);
    }
  };

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId));
    } else {
      setSelectedTagIds([...selectedTagIds, tagId]);
    }
  };

  // Image Picker for Cover Art
  const handleSelectCover = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Cấp quyền",
          "Vui lòng cấp quyền thư viện ảnh để chọn ảnh bìa.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setSeriesCover({
          uri: asset.uri,
          name: asset.fileName || `cover_${Date.now()}.jpg`,
          size: asset.fileSize || 1024 * 150,
          type: asset.mimeType || "image/jpeg",
        });
      }
    } catch (err: any) {
      Alert.alert("Lỗi", "Không thể mở trình chọn ảnh: " + err.message);
    }
  };

  // Image Picker for Banner
  const handleSelectBanner = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Cấp quyền",
          "Vui lòng cấp quyền thư viện ảnh để chọn banner.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setSeriesBanner({
          uri: asset.uri,
          name: asset.fileName || `banner_${Date.now()}.jpg`,
          size: asset.fileSize || 1024 * 200,
          type: asset.mimeType || "image/jpeg",
        });
      }
    } catch (err: any) {
      Alert.alert("Lỗi", "Không thể mở trình chọn ảnh: " + err.message);
    }
  };

  // Image Picker for Episode Thumbnail
  const handleSelectThumbnail = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Cấp quyền",
          "Vui lòng cấp quyền thư viện ảnh để chọn thumbnail tập.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setEpisodeThumbnail({
          uri: asset.uri,
          name: asset.fileName || `thumb_${Date.now()}.jpg`,
          size: asset.fileSize || 1024 * 150,
          type: asset.mimeType || "image/jpeg",
        });
      }
    } catch (err: any) {
      Alert.alert("Lỗi", "Không thể chọn thumbnail: " + err.message);
    }
  };

  // Reordering comic pages handlers
  const handleMovePageUp = (index: number) => {
    if (index <= 0) return;
    setComicPages((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMovePageDown = (index: number) => {
    if (index >= comicPages.length - 1) return;
    setComicPages((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Multiple Image Picker for Comic Pages
  const handleSelectPages = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Cấp quyền",
          "Vui lòng cấp quyền thư viện ảnh để chọn trang truyện.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPages = result.assets.map((asset, index) => ({
          id: `local_${Date.now()}_${index}`,
          uri: asset.uri,
          name: asset.fileName || `page_${Date.now()}_${index}.jpg`,
          size: asset.fileSize || 1024 * 100,
          type: asset.mimeType || "image/jpeg",
          width: asset.width || 0,
          height: asset.height || 0,
        }));
        setComicPages((prev) => [...prev, ...newPages]);
      }
    } catch (err: any) {
      Alert.alert("Lỗi", "Không thể chọn tệp ảnh: " + err.message);
    }
  };

  const handleStartEditSeason = (se: SeasonItem) => {
    setEditingSeasonId(se.seasonId);
    setNewSeasonNumber(String(se.seasonNumber));
    setNewSeasonTitle(se.title);
    setNewSeasonDesc(se.description || "");
    setSeasonMode("create");
  };

  const handleDeleteSeason = (seasonId: string) => {
    const targetSeason = seasonList.find((s) => s.seasonId === seasonId);
    if (!targetSeason) return;

    Alert.alert(
      "Xác nhận xóa Season",
      `Bạn có chắc chắn muốn xóa Season ${targetSeason.seasonNumber} - "${targetSeason.title || ""}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSeason(seasonId);
              setSeasonList((prev) =>
                prev.filter((s) => s.seasonId !== seasonId),
              );
              if (selectedSeasonId === seasonId) {
                setSelectedSeasonId("");
              }
              Toast.show({
                type: "success",
                text1: "Thành công",
                text2: "Đã xóa Season thành công.",
              });
            } catch (err: any) {
              console.error("[DeleteSeason] Error:", err);
              Alert.alert("Lỗi", err.message || "Không thể xóa Season.");
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
        : `Bạn có chắc chắn muốn ẩn Season ${season.seasonNumber}? Season bị ẩn sẽ không hiển thị với người đọc.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: isHidden ? "Công khai" : "Ẩn",
          onPress: async () => {
            try {
              if (isHidden) {
                await unhideSeason(season.seasonId);
                setSeasonList((prev) =>
                  prev.map((s) =>
                    s.seasonId === season.seasonId
                      ? { ...s, status: "PUBLISHED" }
                      : s,
                  ),
                );
                Toast.show({
                  type: "success",
                  text1: "Thành công",
                  text2: "Đã công khai Season thành công.",
                });
              } else {
                await hideSeason(season.seasonId);
                setSeasonList((prev) =>
                  prev.map((s) =>
                    s.seasonId === season.seasonId
                      ? { ...s, status: "HIDDEN" }
                      : s,
                  ),
                );
                Toast.show({
                  type: "success",
                  text1: "Thành công",
                  text2: "Đã ẩn Season thành công.",
                });
              }
            } catch (err: any) {
              console.error("[ToggleHideSeason] Error:", err);
              Alert.alert(
                "Lỗi",
                err.message || "Không thể thực hiện thao tác.",
              );
            }
          },
        },
      ],
    );
  };

  const handleStartEditSeries = (s: SeriesItem) => {
    setEditingSeriesId(s.seriesId);
    setNewSeriesTitle(s.title);
    setNewSeriesDesc(s.description || "");
    setSeriesCover(
      s.coverUrl
        ? {
            uri: s.coverUrl,
            name: s.coverUrl.split("/").pop() || "cover.jpg",
            size: 0,
            type: "image/jpeg",
            isUrl: true,
          }
        : null,
    );
    setSelectedCategoryIds(s.categories?.map((c) => c.categoryId) || []);
    setSelectedTagIds(s.tags?.map((t) => t.tagId) || []);
    setSeriesMode("create");
  };

  const handleDeleteSeries = (seriesId: string) => {
    const targetSeries = seriesList.find((s) => s.seriesId === seriesId);
    if (!targetSeries) return;

    Alert.alert(
      "Xác nhận xóa Series",
      `Bạn có chắc chắn muốn xóa Series "${targetSeries.title}" không? Hành động này sẽ chuyển trạng thái của Series thành DELETED.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSeries(seriesId);
              setSeriesList((prev) =>
                prev.filter((s) => s.seriesId !== seriesId),
              );
              if (selectedSeriesId === seriesId) {
                setSelectedSeriesId("");
                setSeasonList([]);
              }
              Toast.show({
                type: "success",
                text1: "Thành công",
                text2: "Đã xóa Series thành công.",
              });
            } catch (err: any) {
              console.error("[DeleteSeries] Error:", err);
              Alert.alert("Lỗi", err.message || "Không thể xóa Series.");
            }
          },
        },
      ],
    );
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (seriesMode === "create") {
        if (!newSeriesTitle.trim()) {
          Alert.alert("Lỗi", "Vui lòng nhập tên Series.");
          return;
        }

        if (editingSeriesId) {
          setSubmitting(true);
          setSubmitMsg("Đang lưu thay đổi Series...");
          try {
            let coverUrl = "";
            if (seriesCover) {
              if (seriesCover.isUrl) {
                coverUrl = seriesCover.uri;
              } else {
                const uploadRes = await uploadImageToS3(
                  seriesCover.uri,
                  seriesCover.name,
                  seriesCover.size,
                  seriesCover.type,
                  "cover",
                );
                coverUrl = uploadRes.publicUrl;
              }
            }

            let bannerUrl = "";
            if (seriesBanner) {
              if (seriesBanner.isUrl) {
                bannerUrl = seriesBanner.uri;
              } else {
                const uploadBannerRes = await uploadImageToS3(
                  seriesBanner.uri,
                  seriesBanner.name,
                  seriesBanner.size,
                  seriesBanner.type,
                  "banner",
                );
                bannerUrl = uploadBannerRes.publicUrl;
              }
            }

            await updateSeries(editingSeriesId, {
              title: newSeriesTitle,
              description: newSeriesDesc,
              coverUrl,
              bannerUrl: bannerUrl || undefined,
              contentType: "COMIC",
              status: "PUBLISHED",
              visibility,
              ageRating,
              language,
              categoryIds: selectedCategoryIds,
              tagIds: selectedTagIds,
            });

            const seriesData = await listSeriesByCreator();
            if (seriesData) {
              const filtered = seriesData.filter(
                (item) => item.contentType?.toUpperCase() === "COMIC",
              );
              setSeriesList(filtered);
            }

            setEditingSeriesId(null);
            setNewSeriesTitle("");
            setNewSeriesDesc("");
            setSeriesCover(null);
            setSeriesBanner(null);
            setSelectedCategoryIds([]);
            setSelectedTagIds([]);
            setSeriesMode("select");

            Toast.show({
              type: "success",
              text1: "Thành công",
              text2: "Đã cập nhật Series thành công.",
            });
          } catch (err: any) {
            console.error("[UpdateSeries] Error:", err);
            Alert.alert("Lỗi", err.message || "Không thể cập nhật Series.");
            return;
          } finally {
            setSubmitting(false);
          }
          return;
        } else {
          // Creating a new Series immediately in Step 1
          setSubmitting(true);
          setSubmitMsg("Đang tải ảnh bìa lên hệ thống...");
          try {
            let coverUrl = "";
            if (seriesCover) {
              const uploadRes = await uploadImageToS3(
                seriesCover.uri,
                seriesCover.name,
                seriesCover.size,
                seriesCover.type,
                "cover",
              );
              coverUrl = uploadRes.publicUrl;
            }

            let bannerUrl = "";
            if (seriesBanner) {
              const uploadBannerRes = await uploadImageToS3(
                seriesBanner.uri,
                seriesBanner.name,
                seriesBanner.size,
                seriesBanner.type,
                "banner",
              );
              bannerUrl = uploadBannerRes.publicUrl;
            }

            setSubmitMsg("Đang tạo Series mới...");
            const newSeries = await createSeries({
              title: newSeriesTitle,
              description: newSeriesDesc,
              coverUrl,
              bannerUrl: bannerUrl || undefined,
              contentType: "COMIC",
              visibility,
              ageRating,
              language,
              categoryIds: selectedCategoryIds,
              tagIds: selectedTagIds,
            });

            setSeriesList((prev) => [newSeries, ...prev]);
            setSelectedSeriesId(newSeries.seriesId);
            setSeriesMode("select");

            setNewSeriesTitle("");
            setNewSeriesDesc("");
            setSeriesCover(null);
            setSelectedCategoryIds([]);
            setSelectedTagIds([]);

            Toast.show({
              type: "success",
              text1: "Thành công",
              text2: "Đã tạo Series thành công.",
            });

            // Fetch seasons immediately for the newly created series (backend automatically creates Season 1)
            setLoadingSeasons(true);
            const freshSeasons = await listSeasonsBySeries(newSeries.seriesId);
            setSeasonList(freshSeasons || []);
            if (freshSeasons && freshSeasons.length > 0) {
              setSelectedSeasonId(freshSeasons[0].seasonId);
              setSeasonMode("select");
            } else {
              setSelectedSeasonId("");
              setSeasonMode("create");
            }
          } catch (err: any) {
            console.error("[CreateSeries Step 1] Error:", err);
            Alert.alert("Lỗi", err.message || "Không thể tạo Series mới.");
            return;
          } finally {
            setSubmitting(false);
            setLoadingSeasons(false);
          }
        }
      } else {
        if (!selectedSeriesId) {
          Alert.alert("Lỗi", "Vui lòng chọn hoặc tạo Series mới.");
          return;
        }
      }
      setStep(2);
    } else if (step === 2) {
      if (seasonMode === "create") {
        if (!newSeasonNumber.trim()) {
          Alert.alert("Lỗi", "Vui lòng nhập số thứ tự Season.");
          return;
        }
        if (!newSeasonTitle.trim()) {
          Alert.alert("Lỗi", "Vui lòng nhập tiêu đề Season.");
          return;
        }

        if (editingSeasonId) {
          setSubmitting(true);
          setSubmitMsg("Đang lưu thay đổi Season...");
          try {
            const numVal = parseInt(newSeasonNumber, 10) || 1;
            await updateSeason(editingSeasonId, {
              seasonNumber: numVal,
              title: newSeasonTitle,
              description: newSeasonDesc,
              status: "PUBLISHED",
            });

            if (selectedSeriesId) {
              const freshSeasons = await listSeasonsBySeries(selectedSeriesId);
              setSeasonList(freshSeasons || []);
            }

            setEditingSeasonId(null);
            setNewSeasonNumber("");
            setNewSeasonTitle("");
            setNewSeasonDesc("");
            setSeasonMode("select");

            Toast.show({
              type: "success",
              text1: "Thành công",
              text2: "Đã cập nhật Season thành công.",
            });
          } catch (err: any) {
            console.error("[UpdateSeason] Error:", err);
            Alert.alert("Lỗi", err.message || "Không thể cập nhật Season.");
          } finally {
            setSubmitting(false);
          }
          return;
        }
      } else {
        if (seasonList.length === 0) {
          Alert.alert(
            "Lỗi",
            "Bộ truyện này chưa có Season nào. Vui lòng chuyển sang tab 'Tạo Season mới'.",
          );
          return;
        }
        if (!selectedSeasonId) {
          Alert.alert("Lỗi", "Vui lòng chọn Season.");
          return;
        }
      }

      // Tự động gợi ý số tập truyện tiếp theo của Season đã chọn
      if (seasonMode === "create") {
        setEpisodeNumber("1");
      } else if (selectedSeasonId) {
        setSubmitting(true);
        setSubmitMsg("Đang chuẩn bị thông tin tập mới...");
        try {
          const eps = await listEpisodesBySeason(selectedSeasonId);
          const maxEpNumber = eps.reduce(
            (max, ep) => (ep.episodeNumber > max ? ep.episodeNumber : max),
            0,
          );
          setEpisodeNumber(String(maxEpNumber + 1));
        } catch (err) {
          console.error("Lỗi tự động gợi ý số thứ tự tập truyện:", err);
          setEpisodeNumber("1");
        } finally {
          setSubmitting(false);
        }
      } else {
        setEpisodeNumber("1");
      }

      setStep(3);
    } else if (step === 3) {
      if (!episodeNumber.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập số tập truyện.");
        return;
      }
      if (!episodeTitle.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập tiêu đề tập.");
        return;
      }

      // Perform Backend Creation of Series, Season and Episode/Chapter
      setSubmitting(true);
      try {
        let finalSeriesId = selectedSeriesId;
        let finalSeasonId = selectedSeasonId;

        // 2. Create Season
        if (seasonMode === "create" || !finalSeasonId) {
          setSubmitMsg("Đang tạo Season mới...");
          const numVal = parseInt(newSeasonNumber, 10) || 1;
          const newSeason = await createSeason(finalSeriesId, {
            seasonNumber: numVal,
            title: newSeasonTitle,
            description: newSeasonDesc,
            status: "PUBLISHED",
          });
          finalSeasonId = newSeason.seasonId;
          setSeasonList((prev) => [newSeason, ...prev]);
          setSelectedSeasonId(newSeason.seasonId);
          setSeasonMode("select");
        }

        // 3. Create Episode / Chapter
        setSubmitMsg("Đang tạo tập truyện mới...");
        const epNumVal = parseInt(episodeNumber, 10) || 1;
        const priceVal = releaseType === "coin" ? parseInt(coinPrice, 10) : 0;
        const unlockTypeVal = releaseType === "coin" ? "PAID" : "FREE";

        const newEp = await createEpisode(finalSeasonId, {
          episodeNumber: epNumVal,
          title: episodeTitle,
          description: episodeDesc,
          contentType: "COMIC",
          status: "DRAFT",
          unlockType: unlockTypeVal,
          priceVnd: priceVal,
        });

        setCreatedEpisodeId(newEp.episodeId);
        Toast.show({
          type: "success",
          text1: "Thành công",
          text2: "Tập truyện mới đã được khởi tạo thành công.",
        });
        setStep(4);
      } catch (err: any) {
        console.error("Lỗi khởi tạo cấu trúc truyện:", err);
        Alert.alert("Lỗi", "Không thể tạo tập truyện mới: " + err.message);
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Perform sequential uploading of comic pages to S3 and save metadata
  const handleStartUpload = async () => {
    if (comicPages.length === 0 || !createdEpisodeId) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất một trang truyện.");
      return;
    }
    setUploading(true);
    setSubmitMsg("Bắt đầu tải các trang truyện...");

    try {
      const uploadedPages: MediaComicPageRequest[] = [];

      for (let i = 0; i < comicPages.length; i++) {
        const page = comicPages[i];
        setSubmitMsg(`Đang tải ảnh trang ${i + 1}/${comicPages.length}...`);

        let { width, height } = page;
        if (width === 0 || height === 0) {
          const dims = await getImageDimensions(page.uri);
          width = dims.width;
          height = dims.height;
        }

        const uploadRes = await uploadImageToS3(
          page.uri,
          page.name,
          page.size,
          page.type,
          "comic-page",
        );

        uploadedPages.push({
          fileUrl: uploadRes.publicUrl,
          displayOrder: i + 1,
          mimeType: page.type,
          fileSize: page.size,
          externalPublicId: uploadRes.key,
          storageProvider: "AWS",
          width,
          height,
          resolution: width && height ? `${width}x${height}` : undefined,
        });
      }

      setSubmitMsg("Đang liên kết các trang truyện...");
      await createComicPageMedia(
        createdEpisodeId,
        uploadedPages,
        actorId || undefined,
      );

      setIsSuccess(true);
      startPollingPipeline(createdEpisodeId);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã tải lên toàn bộ các trang truyện thành công!",
      });
    } catch (err: any) {
      console.error("Lỗi trong quá trình upload ảnh:", err);
      Alert.alert(
        "Lỗi upload",
        "Không thể tải lên ảnh trang truyện: " + err.message,
      );
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async (scheduledPublishAt?: string) => {
    if (!createdEpisodeId) return;
    try {
      setPublishing(true);
      if (scheduledPublishAt) {
        await schedulePublishEpisode(createdEpisodeId, scheduledPublishAt);
        Toast.show({
          type: "success",
          text1: "Lên lịch thành công!",
          text2: "Tập truyện mới của bạn đã được lên lịch xuất bản.",
        });
      } else {
        await publishEpisode(createdEpisodeId);
        Toast.show({
          type: "success",
          text1: "Đăng truyện thành công!",
          text2: "Tập truyện mới của bạn hiện đã được xuất bản.",
        });
      }
      navigation.goBack();
    } catch (err: any) {
      console.error("Lỗi xuất bản tập truyện:", err);
      Alert.alert(
        "Lỗi xuất bản",
        "Không thể xuất bản tập truyện: " + err.message,
      );
    } finally {
      setPublishing(false);
    }
  };

  const getSeriesTitle = () => {
    if (seriesMode === "select") {
      return (
        seriesList.find((s) => s.seriesId === selectedSeriesId)?.title ||
        "Chưa chọn"
      );
    }
    return newSeriesTitle || "Series mới chưa đặt tên";
  };

  const getSeasonTitle = () => {
    if (seasonMode === "select") {
      const se = seasonList.find((s) => s.seasonId === selectedSeasonId);
      if (!se) return "Chưa chọn";
      const sNumStr = `Season ${se.seasonNumber}`;
      let title = (se.title || "").trim();
      const regex = new RegExp(`^(Season|Mùa)\\s*${se.seasonNumber}\\s*[:\\-]?\\s*`, "gi");
      while (regex.test(title)) {
        title = title.replace(regex, "").trim();
      }
      if (!title) {
        return sNumStr;
      }
      return `${sNumStr}: ${title}`;
    }
    const sNumStr = newSeasonNumber ? `Season ${newSeasonNumber}` : "Season mới";
    let title = (newSeasonTitle || "").trim();
    if (newSeasonNumber) {
      const regex = new RegExp(`^(Season|Mùa)\\s*${newSeasonNumber}\\s*[:\\-]?\\s*`, "gi");
      while (regex.test(title)) {
        title = title.replace(regex, "").trim();
      }
    }
    if (!title) {
      return sNumStr;
    }
    return `${sNumStr}: ${title}`;
  };

  const wizardSteps = [
    { num: 1, label: "Series" },
    { num: 2, label: "Season" },
    { num: 3, label: "Tập" },
    { num: 4, label: "Trang ảnh" },
    { num: 5, label: "Xuất bản" },
  ];

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#0F0F10]">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F10" />

      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-950 bg-[#0F0F10]">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 active:opacity-60"
        >
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text
          className="flex-1 text-center text-white text-base font-black tracking-tight"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          Đăng Truyện Lên TaleX
        </Text>
        <View className="w-10" />
      </View>

      {/* STEP INDICATOR */}
      <StepIndicator currentStep={step} steps={wizardSteps} />

      {/* SUBMITTING / UPLOADING OVERLAY */}
      {(submitting || uploading) && (
        <View className="absolute inset-0 bg-[#0F0F10]/80 items-center justify-center z-50">
          <ActivityIndicator size="large" color="#FF4E4E" />
          <Text className="text-white text-sm font-bold mt-4">{submitMsg}</Text>
        </View>
      )}

      {/* MAIN CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        className="flex-1"
      >
        {/* Step 1: Series Selection / Creation */}
        {step === 1 && (
          <SeriesStep
            seriesList={seriesList}
            loadingSeries={loadingSeries}
            seriesMode={seriesMode}
            setSeriesMode={setSeriesMode}
            selectedSeriesId={selectedSeriesId}
            setSelectedSeriesId={setSelectedSeriesId}
            newSeriesTitle={newSeriesTitle}
            setNewSeriesTitle={setNewSeriesTitle}
            newSeriesDesc={newSeriesDesc}
            setNewSeriesDesc={setNewSeriesDesc}
            categories={categories}
            tags={tags}
            selectedCategoryIds={selectedCategoryIds}
            toggleCategory={toggleCategory}
            selectedTagIds={selectedTagIds}
            toggleTag={toggleTag}
            seriesCover={seriesCover}
            handleSelectCover={handleSelectCover}
            seriesBanner={seriesBanner}
            handleSelectBanner={handleSelectBanner}
            ageRating={ageRating}
            setAgeRating={setAgeRating}
            language={language}
            setLanguage={setLanguage}
            visibility={visibility}
            setVisibility={setVisibility}
            subheading="Mỗi tập truyện phải thuộc về một Series (Bộ truyện)."
            listPlaceholder="Bạn chưa có Series truyện nào. Vui lòng chọn 'Tạo Series Mới' ở trên."
            coverLabel="Cover Art - Tỉ lệ 2:3"
            coverSubLabel="Tỉ lệ 2:3 dọc (VD: Bìa truyện tranh)"
            coverImageStyle="h-28 aspect-[2/3]"
            descriptionPlaceholder="Viết mô tả tóm tắt nội dung truyện..."
            contentTypeIcon="book-open-outline"
            onNext={handleNextStep}
            editingSeriesId={editingSeriesId}
            setEditingSeriesId={setEditingSeriesId}
            onEditSeries={handleStartEditSeries}
            onDeleteSeries={handleDeleteSeries}
          />
        )}

        {/* Step 2: Season Selection / Creation */}
        {step === 2 && (
          <SeasonStep
            seriesTitle={getSeriesTitle()}
            seasonList={seasonList}
            loadingSeasons={loadingSeasons}
            seasonMode={seasonMode}
            setSeasonMode={setSeasonMode}
            selectedSeasonId={selectedSeasonId}
            setSelectedSeasonId={setSelectedSeasonId}
            newSeasonNumber={newSeasonNumber}
            setNewSeasonNumber={setNewSeasonNumber}
            newSeasonTitle={newSeasonTitle}
            setNewSeasonTitle={setNewSeasonTitle}
            newSeasonDesc={newSeasonDesc}
            setNewSeasonDesc={setNewSeasonDesc}
            subheading="Các tập truyện được nhóm theo Season / Phần phát hành."
            listPlaceholder="Chưa có Season nào được tạo cho Series này. Vui lòng chọn 'Tạo Season Mới' ở trên."
            onBack={() => setStep(1)}
            onNext={handleNextStep}
            editingSeasonId={editingSeasonId}
            setEditingSeasonId={setEditingSeasonId}
            onEditSeason={handleStartEditSeason}
            onDeleteSeason={handleDeleteSeason}
            onToggleHideSeason={handleToggleHideSeason}
          />
        )}

        {/* Step 3: Chapter Details */}
        {step === 3 && (
          <EpisodeDetailsStep
            seriesTitle={getSeriesTitle()}
            seasonTitle={getSeasonTitle()}
            episodeNumber={episodeNumber}
            setEpisodeNumber={setEpisodeNumber}
            episodeTitle={episodeTitle}
            setEpisodeTitle={setEpisodeTitle}
            episodeDesc={episodeDesc}
            setEpisodeDesc={setEpisodeDesc}
            releaseType={releaseType}
            setReleaseType={setReleaseType}
            coinPrice={coinPrice}
            setCoinPrice={setCoinPrice}
            contentType="COMIC"
            heading="Bước 3: Nhập thông tin Tập truyện mới"
            subheading="Điền thông tin chi tiết cho tập truyện chuẩn bị tải lên."
            numberLabel="Tập số mấy (VD: 1, 2) *"
            numberPlaceholder="Nhập số tập..."
            titleLabel="Tiêu đề tập *"
            titlePlaceholder="Nhập tên tập..."
            descLabel="Mô tả ngắn"
            descPlaceholder="Tóm tắt nội dung tập truyện..."
            coinLabel="Giá bán (Xu) *"
            coinSubLabel="Nhập số xu cần mua..."
            onBack={() => setStep(2)}
            onNext={handleNextStep}
          />
        )}

        {/* Step 4: Pages Upload */}
        {step === 4 && (
          <ComicPagesUploadStep
            seriesTitle={getSeriesTitle()}
            seasonTitle={getSeasonTitle()}
            episodeNumber={episodeNumber}
            episodeTitle={episodeTitle}
            releaseType={releaseType}
            coinPrice={coinPrice}
            comicPages={comicPages}
            handleSelectPages={handleSelectPages}
            handleDeletePage={(id) => {
              setComicPages((prev) => prev.filter((p) => p.id !== id));
            }}
            handleMovePageUp={handleMovePageUp}
            handleMovePageDown={handleMovePageDown}
            episodeThumbnail={episodeThumbnail}
            handleSelectThumbnail={handleSelectThumbnail}
            handleStartUpload={handleStartUpload}
            uploading={uploading}
            submitMsg={submitMsg}
            isSuccess={isSuccess}
            moderationStatus={moderationStatus}
            isModerationDone={isModerationDone}
            onBack={() => setStep(3)}
            onNext={() => setStep(5)}
          />
        )}

        {/* Step 5: Summary and Publish */}
        {step === 5 && (
          <PublishStep
            seriesTitle={getSeriesTitle()}
            seasonTitle={getSeasonTitle()}
            episodeNumber={episodeNumber}
            episodeTitle={episodeTitle}
            episodeDesc={episodeDesc}
            releaseType={releaseType}
            coinPrice={coinPrice}
            contentType="COMIC"
            comicPagesCount={comicPages.length}
            publishing={publishing}
            onBack={() => setStep(4)}
            onPublish={handlePublish}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
