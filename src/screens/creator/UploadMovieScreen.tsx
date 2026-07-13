import React, { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
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
  createVideoUploadSession,
  updateVideoUploadProgress,
  completeVideoUpload,
  pauseVideoUpload,
  failVideoUpload,
  cancelVideoUpload,
  approveMedia,
  fetchMediaViolations,
  listMediaByEpisode,
  publishEpisode,
  schedulePublishEpisode,
  SeriesItem,
  SeasonItem,
  getCategories,
  getTags,
  CategoryResponse,
  TagResponse,
} from "@/services/creatorContent";
import { getOwnCreator } from "@/services/creator";
import { useAuth } from "@/context/AuthContext";

// Component imports
import StepIndicator from "./components/StepIndicator";
import SeriesStep from "./components/SeriesStep";
import SeasonStep from "./components/SeasonStep";
import EpisodeDetailsStep from "./components/EpisodeDetailsStep";
import MovieVideoUploadStep from "./components/MovieVideoUploadStep";
import PublishStep from "./components/PublishStep";

export default function UploadMovieScreen() {
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

  // --- STEP 3: EPISODE STATE ---
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [episodeDesc, setEpisodeDesc] = useState("");
  const [releaseType, setReleaseType] = useState<"free" | "premium" | "coin">(
    "free",
  );
  const [coinPrice, setCoinPrice] = useState("5");
  const [createdEpisodeId, setCreatedEpisodeId] = useState<string | null>(null);

  // --- STEP 4: VIDEO & POLL STATE ---
  const [videoFile, setVideoFile] = useState<{
    uri: string;
    name: string;
    size: number;
    type: string;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Moderation / Copyright checking states
  const [mediaStatus, setMediaStatus] = useState<string | null>(null);
  const [copyrightStatus, setCopyrightStatus] = useState<string | null>(null);
  const [moderationStatus, setModerationStatus] = useState<string | null>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const activeUploadSessionIdRef = useRef<string | null>(null);
  const actorId = user?.accountId || "";

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
      if (xhrRef.current) {
        xhrRef.current.abort();
      }
      if (activeUploadSessionIdRef.current) {
        cancelVideoUpload(
          activeUploadSessionIdRef.current,
          actorId || undefined,
        ).catch(() => {});
      }
    };
  }, [actorId]);

  const [creatorId, setCreatorId] = useState("");

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

  // Load Creator Series
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoadingSeries(true);
        const list = await listSeriesByCreator();
        const videoSeries = list.filter((s) => s.contentType === "VIDEO");
        setSeriesList(videoSeries);
        if (videoSeries.length > 0) {
          setSelectedSeriesId(videoSeries[0].seriesId);
        }
      } catch (err: any) {
        console.error("Lỗi tải danh sách series:", err);
        Toast.show({
          type: "error",
          text1: "Lỗi kết nối",
          text2: "Không thể tải danh sách bộ phim của bạn.",
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

  // Clean polling on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

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
        aspect: [16, 9],
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

  // Document Picker for Video File
  const handleSelectVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setVideoFile({
          uri: asset.uri,
          name: asset.name || `video_${Date.now()}.mp4`,
          size: asset.size || 1024 * 1024 * 5,
          type: asset.mimeType || "video/mp4",
        });

        // Reset status
        setUploadProgress(0);
        setIsSuccess(false);
        setMediaStatus(null);
        setCopyrightStatus(null);
        setModerationStatus(null);
      }
    } catch (err: any) {
      Alert.alert("Lỗi", "Không thể chọn tệp video: " + err.message);
    }
  };

  // Start video upload flow
  const handleStartUpload = async () => {
    if (!videoFile || !createdEpisodeId) return;
    setUploading(true);
    setUploadProgress(0);
    setMediaStatus(null);
    setCopyrightStatus(null);
    setModerationStatus(null);

    try {
      // 1. Create upload session
      const session = await createVideoUploadSession(createdEpisodeId, {
        fileName: videoFile.name,
        fileSize: videoFile.size,
        mimeType: videoFile.type,
        creatorId: creatorId || undefined,
        actorId: actorId || undefined,
      });

      activeUploadSessionIdRef.current = session.uploadSessionId;

      // 2. Fetch the file binary from local URI
      const localRes = await fetch(videoFile.uri);
      const blob = await localRes.blob();

      // 3. Upload to AWS S3 using XMLHttpRequest
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.open("PUT", session.uploadUrl);
      xhr.setRequestHeader("Content-Type", videoFile.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
          updateVideoUploadProgress(
            session.uploadSessionId,
            e.loaded,
            "UPLOADING",
            actorId || undefined,
          ).catch(() => {});
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          try {
            // Confirm complete on backend
            const completedMedia = await completeVideoUpload(
              session.uploadSessionId,
              {
                publicId: session.publicId,
                secureUrl: session.publicId,
                bytes: videoFile.size,
                actorId: actorId || undefined,
              },
            );

            setIsSuccess(true);
            setUploading(false);
            activeUploadSessionIdRef.current = null;
            xhrRef.current = null;
            Toast.show({
              type: "success",
              text1: "Tải lên thành công!",
              text2: "Hệ thống đang tiến hành kiểm duyệt & quét bản quyền.",
            });

            // Start Polling pipeline
            startPollingPipeline(completedMedia.mediaId);
          } catch (completeErr: any) {
            Alert.alert(
              "Lỗi",
              "Không thể cập nhật trạng thái tệp: " + completeErr.message,
            );
            setUploading(false);
            failVideoUpload(session.uploadSessionId, {
              errorMessage:
                completeErr.message || "Không thể cập nhật trạng thái tệp",
              actorId: actorId || undefined,
            }).catch(() => {});
            activeUploadSessionIdRef.current = null;
            xhrRef.current = null;
          }
        } else {
          Alert.alert("Lỗi tải lên S3", `Thất bại với mã HTTP ${xhr.status}`);
          setUploading(false);
          failVideoUpload(session.uploadSessionId, {
            errorMessage: `Lỗi tải lên S3 với mã HTTP ${xhr.status}`,
            actorId: actorId || undefined,
          }).catch(() => {});
          activeUploadSessionIdRef.current = null;
          xhrRef.current = null;
        }
      };

      xhr.onerror = () => {
        Alert.alert(
          "Lỗi kết nối",
          "Quá trình tải video lên S3 gặp sự cố mạng.",
        );
        setUploading(false);
        failVideoUpload(session.uploadSessionId, {
          errorMessage: "Quá trình tải video lên S3 gặp sự cố mạng.",
          actorId: actorId || undefined,
        }).catch(() => {});
        activeUploadSessionIdRef.current = null;
        xhrRef.current = null;
      };

      xhr.send(blob);
    } catch (err: any) {
      Alert.alert(
        "Lỗi khởi tạo",
        "Không thể bắt đầu phiên tải lên: " + err.message,
      );
      setUploading(false);
      activeUploadSessionIdRef.current = null;
      xhrRef.current = null;
    }
  };

  // Poll Backend to show live copyright check & content moderation
  const startPollingPipeline = (mediaId: string) => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }

    setMediaStatus("PROCESSING");
    setCopyrightStatus("Đang kiểm tra trùng lặp bản quyền...");
    setModerationStatus("Đang quét nội dung nhạy cảm...");

    pollTimerRef.current = setInterval(async () => {
      try {
        const violationsRes = await fetchMediaViolations(mediaId);

        const mediaList = await listMediaByEpisode(createdEpisodeId!);
        const currentMedia = mediaList.find((m) => m.mediaId === mediaId);

        if (currentMedia) {
          setMediaStatus(currentMedia.status);

          // Copyright checking update
          if (violationsRes.copyrightViolations.length > 0) {
            setCopyrightStatus(
              `Cảnh báo: Phát hiện trùng lặp bản quyền (${violationsRes.copyrightViolations.length} đoạn)!`,
            );
          } else if (
            currentMedia.status === "ACTIVE" ||
            currentMedia.status === "HLS_READY"
          ) {
            setCopyrightStatus("Đạt: Không phát hiện vi phạm bản quyền.");
          }

          // Content moderation update
          const activeCensorships = violationsRes.censorshipResults.filter(
            (r) => r.status !== "APPROVED" && r.status !== "approve",
          );

          if (activeCensorships.length > 0) {
            const labels = activeCensorships
              .map((r) => r.primaryViolationLabel)
              .filter(Boolean);
            setModerationStatus(
              `Từ chối: Phát hiện nhãn vi phạm [${labels.join(", ")}].`,
            );
          } else if (
            currentMedia.status === "ACTIVE" ||
            currentMedia.status === "HLS_READY" ||
            currentMedia.approvalStatus === "APPROVED"
          ) {
            setModerationStatus("Đạt: Nội dung sạch và an toàn.");
          }

          // Complete conditions
          if (
            ["ACTIVE", "HLS_READY", "FAILED", "DELETED"].includes(
              currentMedia.status,
            )
          ) {
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }

            if (
              currentMedia.status === "FAILED" ||
              currentMedia.status === "DELETED"
            ) {
              Toast.show({
                type: "error",
                text1: "Kiểm duyệt thất bại",
                text2:
                  currentMedia.errorMessage ||
                  "Nội dung vi phạm chính sách nghiêm trọng.",
              });
            } else {
              Toast.show({
                type: "success",
                text1: "Đăng tải hoàn tất",
                text2: "Kiểm duyệt thành công! Nội dung đã sẵn sàng xuất bản.",
              });
            }
          }
        }
      } catch (err) {
        console.error("Lỗi đồng bộ hóa pipeline:", err);
      }
    }, 4000);
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
        : `Bạn có chắc chắn muốn ẩn Season ${season.seasonNumber}? Season bị ẩn sẽ không hiển thị với người xem.`,
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

  // Submit and Next Step logic
  const handleNextStep = async () => {
    if (step === 1) {
      if (seriesMode === "create") {
        if (!newSeriesTitle.trim()) {
          Alert.alert("Thiếu thông tin", "Vui lòng nhập tên Series mới.");
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

            await updateSeries(editingSeriesId, {
              title: newSeriesTitle,
              description: newSeriesDesc,
              coverUrl,
              contentType: "VIDEO",
              status: "PUBLISHED",
              categoryIds: selectedCategoryIds,
              tagIds: selectedTagIds,
            });

            const seriesData = await listSeriesByCreator();
            if (seriesData) {
              const filtered = seriesData.filter(
                (item) => item.contentType?.toUpperCase() === "VIDEO",
              );
              setSeriesList(filtered);
            }

            setEditingSeriesId(null);
            setNewSeriesTitle("");
            setNewSeriesDesc("");
            setSeriesCover(null);
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
          setSubmitMsg("Đang tải ảnh bìa lên S3...");
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
            setSubmitMsg("Đang tạo Series mới...");
            const newSeries = await createSeries({
              title: newSeriesTitle,
              description: newSeriesDesc,
              coverUrl,
              contentType: "VIDEO",
              visibility: "PUBLIC",
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
          Alert.alert(
            "Thiếu thông tin",
            "Vui lòng chọn một Series trong danh sách.",
          );
          return;
        }
      }
      setStep(2);
    } else if (step === 2) {
      if (seasonMode === "create") {
        if (!newSeasonNumber.trim()) {
          Alert.alert("Thiếu thông tin", "Vui lòng điền số Season mới.");
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
      }
      if (seasonMode === "select") {
        if (seasonList.length === 0) {
          Alert.alert(
            "Thiếu thông tin",
            "Bộ phim này chưa có Season nào. Vui lòng chuyển sang tab 'Tạo Season mới'.",
          );
          return;
        }
        if (!selectedSeasonId) {
          Alert.alert(
            "Thiếu thông tin",
            "Vui lòng chọn một Season trong danh sách.",
          );
          return;
        }
      }

      // Tự động gợi ý số tập phim tiếp theo của Season đã chọn
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
          console.error("Lỗi tự động gợi ý số thứ tự tập phim:", err);
          setEpisodeNumber("1");
        } finally {
          setSubmitting(false);
        }
      } else {
        setEpisodeNumber("1");
      }

      setStep(3);
    } else if (step === 3) {
      if (!episodeNumber.trim() || !episodeTitle.trim()) {
        Alert.alert(
          "Thiếu thông tin",
          "Vui lòng nhập đầy đủ Số tập và Tên tập phim.",
        );
        return;
      }

      // Perform Backend Creation of Series, Season and Episode
      setSubmitting(true);
      try {
        let finalSeriesId = selectedSeriesId;
        let finalSeasonId = selectedSeasonId;

        // 2. Create Season
        if (seasonMode === "create" || !finalSeasonId) {
          setSubmitMsg("Đang tạo Season mới...");
          const newSeason = await createSeason(finalSeriesId, {
            seasonNumber: parseInt(newSeasonNumber) || 1,
            title: newSeasonTitle,
            description: newSeasonDesc,
            status: "PUBLISHED",
          });
          finalSeasonId = newSeason.seasonId;
          setSeasonList((prev) => [newSeason, ...prev]);
          setSelectedSeasonId(newSeason.seasonId);
          setSeasonMode("select");
        }

        // 3. Create Episode (Draft)
        setSubmitMsg("Đang tạo Episode...");
        const unlockType = releaseType === "free" ? "FREE" : "PAID";
        const priceVnd =
          releaseType === "coin" ? parseInt(coinPrice) * 1000 : 0;

        const newEpisode = await createEpisode(finalSeasonId, {
          episodeNumber: parseInt(episodeNumber) || 1,
          title: episodeTitle,
          description: episodeDesc,
          contentType: "VIDEO",
          unlockType,
          priceVnd,
        });

        setCreatedEpisodeId(newEpisode.episodeId);
        setStep(4);
      } catch (err: any) {
        Alert.alert(
          "Lỗi quy trình",
          err.message || "Không thể khởi tạo tập phim.",
        );
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handlePublish = async (scheduledPublishAt?: string) => {
    if (!createdEpisodeId || !isSuccess) {
      Alert.alert("Lỗi", "Vui lòng tải lên video tập phim trước khi xuất bản.");
      return;
    }

    if (mediaStatus === "FAILED" || mediaStatus === "DELETED") {
      Alert.alert(
        "Không thể đăng",
        "Nội dung này vi phạm chính sách nghiêm trọng và đã bị hệ thống từ chối.",
      );
      return;
    }

    setPublishing(true);
    try {
      if (scheduledPublishAt) {
        await schedulePublishEpisode(createdEpisodeId, scheduledPublishAt);
        Alert.alert(
          "Thành công",
          "Bộ phim đã được lên lịch xuất bản thành công!",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        await publishEpisode(createdEpisodeId);
        Alert.alert(
          "Thành công",
          "Bộ phim đã được xuất bản và hiển thị trực tuyến!",
          [
            {
              text: "OK",
              onPress: () => navigation.goBack(),
            },
          ],
        );
      }
    } catch (err: any) {
      Alert.alert(
        "Lỗi xuất bản",
        err.message || "Không thể thay đổi trạng thái tập phim.",
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
      return se
        ? `Season ${se.seasonNumber}: ${se.title || "Không có tiêu đề"}`
        : "Chưa chọn";
    }
    return newSeasonNumber
      ? `Season ${newSeasonNumber}: ${newSeasonTitle || "Không tiêu đề"}`
      : "Season mới";
  };

  const wizardSteps = [
    { num: 1, label: "Series" },
    { num: 2, label: "Season" },
    { num: 3, label: "Tập phim" },
    { num: 4, label: "Video" },
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
        <Text className="text-white text-lg font-black tracking-tight">
          Đăng Phim Lên TaleX
        </Text>
        <View className="w-10" />
      </View>

      {/* STEP INDICATOR */}
      <StepIndicator currentStep={step} steps={wizardSteps} />

      {/* SUBMITTING OVERLAY */}
      {submitting && (
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
            subheading="Mỗi tập phim phải thuộc về một Series (Bộ phim)."
            listPlaceholder="Bạn chưa tạo Series nào. Vui lòng chọn 'Tạo Series Mới' ở trên."
            coverLabel="Cover Art - Tỉ lệ 16:9"
            coverSubLabel="Tỉ lệ 16:9 ngang (VD: Banner phim)"
            coverImageStyle="h-20 aspect-[16/9]"
            descriptionPlaceholder="Viết mô tả tóm tắt nội dung cốt truyện..."
            contentTypeIcon="folder-play-outline"
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
            subheading="Các tập phim cần được sắp xếp theo từng Season (Mùa phim)."
            listPlaceholder="Bộ phim chưa có Season nào. Vui lòng chọn 'Tạo Season Mới' ở trên."
            onBack={() => setStep(1)}
            onNext={handleNextStep}
            editingSeasonId={editingSeasonId}
            setEditingSeasonId={setEditingSeasonId}
            onEditSeason={handleStartEditSeason}
            onDeleteSeason={handleDeleteSeason}
            onToggleHideSeason={handleToggleHideSeason}
          />
        )}

        {/* Step 3: Episode Details */}
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
            contentType="VIDEO"
            heading="Bước 3: Nhập thông tin tập phim"
            subheading="Thiết lập thứ tự tập phim, tên tập và cấu hình thanh toán."
            numberLabel="Số tập * (Ví dụ: 1, 2...)"
            numberPlaceholder="Ví dụ: 5"
            titleLabel="Tên tập phim *"
            titlePlaceholder="Nhập tên tập phim..."
            descLabel="Mô tả tập phim (Tóm tắt tập)"
            descPlaceholder="Viết nội dung giới thiệu ngắn cho tập này..."
            coinLabel="Giá bán (Số Xu yêu cầu):"
            coinSubLabel="Người xem phải trả số xu này để mở khóa vĩnh viễn tập phim."
            onBack={() => setStep(2)}
            onNext={handleNextStep}
          />
        )}

        {/* Step 4: Video Upload */}
        {step === 4 && (
          <MovieVideoUploadStep
            seriesTitle={getSeriesTitle()}
            seasonTitle={getSeasonTitle()}
            episodeNumber={episodeNumber}
            episodeTitle={episodeTitle}
            releaseType={releaseType}
            coinPrice={coinPrice}
            videoFile={videoFile}
            handleSelectVideo={handleSelectVideo}
            handleStartUpload={handleStartUpload}
            handleDeleteVideo={() => {
              if (uploading && activeUploadSessionIdRef.current) {
                xhrRef.current?.abort();
                cancelVideoUpload(
                  activeUploadSessionIdRef.current,
                  actorId || undefined,
                ).catch(() => {});
                activeUploadSessionIdRef.current = null;
              }
              setVideoFile(null);
              setUploadProgress(0);
              setUploading(false);
              setIsSuccess(false);
              setMediaStatus(null);
              setCopyrightStatus(null);
              setModerationStatus(null);
              if (pollTimerRef.current) {
                clearInterval(pollTimerRef.current);
              }
            }}
            uploading={uploading}
            uploadProgress={uploadProgress}
            isSuccess={isSuccess}
            mediaStatus={mediaStatus}
            copyrightStatus={copyrightStatus}
            moderationStatus={moderationStatus}
            onBack={() => {
              if (uploading && activeUploadSessionIdRef.current) {
                xhrRef.current?.abort();
                cancelVideoUpload(
                  activeUploadSessionIdRef.current,
                  actorId || undefined,
                ).catch(() => {});
                activeUploadSessionIdRef.current = null;
              }
              setUploading(false);
              setStep(3);
            }}
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
            contentType="VIDEO"
            publishing={publishing}
            onBack={() => setStep(4)}
            onPublish={handlePublish}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
