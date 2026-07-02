import React, { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import Toast from "react-native-toast-message";

import {
  listSeriesByCreator,
  createSeries,
  listSeasonsBySeries,
  createSeason,
  createEpisode,
  uploadImageToS3,
  createVideoUploadSession,
  getVideoUploadSession,
  updateVideoUploadProgress,
  completeVideoUpload,
  fetchMediaViolations,
  listMediaByEpisode,
  publishEpisode,
  SeriesItem,
  SeasonItem,
} from "@/services/creatorContent";

const genresList = ["Hành động", "Viễn tưởng", "Tình cảm", "Hài hước", "Kinh dị", "Trinh thám", "Đời thường"];

export default function UploadMovieScreen() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

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
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [seriesCover, setSeriesCover] = useState<{
    uri: string;
    name: string;
    size: number;
    type: string;
  } | null>(null);

  // --- STEP 2: SEASON STATE ---
  const [seasonList, setSeasonList] = useState<SeasonItem[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(false);
  const [seasonMode, setSeasonMode] = useState<"select" | "create">("select");
  const [selectedSeasonId, setSelectedSeasonId] = useState("");
  const [newSeasonNumber, setNewSeasonNumber] = useState("");
  const [newSeasonTitle, setNewSeasonTitle] = useState("");
  const [newSeasonDesc, setNewSeasonDesc] = useState("");

  // --- STEP 3: EPISODE STATE ---
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [episodeDesc, setEpisodeDesc] = useState("");
  const [releaseType, setReleaseType] = useState<"free" | "premium" | "coin">("free");
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
  const [mediaStatus, setMediaStatus] = useState<string | null>(null); // PENDING, PROCESSING, ACTIVE, FAILED
  const [copyrightStatus, setCopyrightStatus] = useState<string | null>(null);
  const [moderationStatus, setModerationStatus] = useState<string | null>(null);

  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Creator Series
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoadingSeries(true);
        const list = await listSeriesByCreator();
        setSeriesList(list);
        if (list.length > 0) {
          setSelectedSeriesId(list[0].seriesId);
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

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  // Image Picker for Cover Art
  const handleSelectCover = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Cấp quyền", "Vui lòng cấp quyền thư viện ảnh để chọn ảnh bìa.");
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
          size: asset.fileSize || 1024 * 150, // default to 150kb
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
          size: asset.size || 1024 * 1024 * 5, // default to 5MB
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
      });

      // 2. Fetch the file binary from local URI
      const localRes = await fetch(videoFile.uri);
      const blob = await localRes.blob();

      // 3. Upload to AWS S3 using XMLHttpRequest
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", session.uploadUrl);
      xhr.setRequestHeader("Content-Type", videoFile.type);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
          updateVideoUploadProgress(session.uploadSessionId, e.loaded, "UPLOADING").catch(() => {});
        }
      };

      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          try {
            // Confirm complete on backend
            const completedMedia = await completeVideoUpload(session.uploadSessionId, {
              publicId: session.publicId,
              secureUrl: session.publicId,
              bytes: videoFile.size,
            });

            setIsSuccess(true);
            setUploading(false);
            Toast.show({
              type: "success",
              text1: "Tải lên thành công!",
              text2: "Hệ thống đang tiến hành kiểm duyệt & quét bản quyền.",
            });

            // Start Polling pipeline
            startPollingPipeline(completedMedia.mediaId, session.uploadSessionId);
          } catch (completeErr: any) {
            Alert.alert("Lỗi", "Không thể cập nhật trạng thái tệp: " + completeErr.message);
            setUploading(false);
          }
        } else {
          Alert.alert("Lỗi tải lên S3", `Thất bại với mã HTTP ${xhr.status}`);
          setUploading(false);
        }
      };

      xhr.onerror = () => {
        Alert.alert("Lỗi kết nối", "Quá trình tải video lên S3 gặp sự cố mạng.");
        setUploading(false);
      };

      xhr.send(blob);
    } catch (err: any) {
      Alert.alert("Lỗi khởi tạo", "Không thể bắt đầu phiên tải lên: " + err.message);
      setUploading(false);
    }
  };

  // Poll Backend to show live copyright check & content moderation
  const startPollingPipeline = (mediaId: string, uploadSessionId: string) => {
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
            console.log("[Pipeline Copyright] Phát hiện trùng lặp bản quyền:", violationsRes.copyrightViolations);
            setCopyrightStatus(`Cảnh báo: Phát hiện trùng lặp bản quyền (${violationsRes.copyrightViolations.length} đoạn)!`);
          } else if (currentMedia.status === "ACTIVE" || currentMedia.status === "HLS_READY") {
            setCopyrightStatus("Đạt: Không phát hiện vi phạm bản quyền.");
          }

          // Content moderation update
          const activeCensorships = violationsRes.censorshipResults.filter(
            (r) => r.status !== "APPROVED" && r.status !== "approve"
          );

          if (activeCensorships.length > 0) {
            const labels = activeCensorships.map((r) => r.primaryViolationLabel).filter(Boolean);
            console.log("[Pipeline Moderation] Phát hiện nhãn vi phạm AI:", labels, activeCensorships);
            setModerationStatus(`Từ chối: Phát hiện nhãn vi phạm [${labels.join(", ")}].`);
          } else if (currentMedia.status === "ACTIVE" || currentMedia.status === "HLS_READY" || currentMedia.approvalStatus === "APPROVED") {
            setModerationStatus("Đạt: Nội dung sạch và an toàn.");
          }

          // Complete conditions
          if (["ACTIVE", "HLS_READY", "FAILED", "DELETED"].includes(currentMedia.status)) {
            if (pollTimerRef.current) {
              clearInterval(pollTimerRef.current);
              pollTimerRef.current = null;
            }

            if (currentMedia.status === "FAILED" || currentMedia.status === "DELETED") {
              Toast.show({
                type: "error",
                text1: "Kiểm duyệt thất bại",
                text2: currentMedia.errorMessage || "Nội dung vi phạm chính sách nghiêm trọng.",
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

  // Submit and Next Step logic
  const handleNextStep = async () => {
    if (step === 1) {
      if (seriesMode === "create" && !newSeriesTitle.trim()) {
        Alert.alert("Thiếu thông tin", "Vui lòng nhập tên Series mới.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (seasonMode === "create" && !newSeasonNumber.trim()) {
        Alert.alert("Thiếu thông tin", "Vui lòng điền số Season mới.");
        return;
      }
      if (seasonMode === "select" && seriesMode !== "create" && seasonList.length > 0 && !selectedSeasonId) {
        Alert.alert("Thiếu thông tin", "Vui lòng chọn một Season trong danh sách.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!episodeNumber.trim() || !episodeTitle.trim()) {
        Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ Số tập và Tên tập phim.");
        return;
      }

      // Perform Backend Creation of Series, Season and Episode
      setSubmitting(true);
      try {
        let finalSeriesId = selectedSeriesId;

        // 1. Create Series
        if (seriesMode === "create") {
          setSubmitMsg("Đang tải ảnh bìa lên S3...");
          let coverUrl = "";
          if (seriesCover) {
            coverUrl = await uploadImageToS3(
              seriesCover.uri,
              seriesCover.name,
              seriesCover.size,
              seriesCover.type,
              "cover"
            );
          }
          setSubmitMsg("Đang tạo Series...");
          const newSeries = await createSeries({
            title: newSeriesTitle,
            description: newSeriesDesc,
            coverUrl,
            contentType: "VIDEO",
            visibility: "PUBLIC",
          });
          finalSeriesId = newSeries.seriesId;
          setSeriesList((prev) => [newSeries, ...prev]);
          setSelectedSeriesId(newSeries.seriesId);
          setSeriesMode("select");
        }

        // 2. Create Season
        let finalSeasonId = selectedSeasonId;
        if (seasonMode === "create" || !finalSeasonId) {
          setSubmitMsg("Đang tạo Season mới...");
          const newSeason = await createSeason(finalSeriesId, {
            seasonNumber: parseInt(newSeasonNumber) || 1,
            title: newSeasonTitle,
            description: newSeasonDesc,
          });
          finalSeasonId = newSeason.seasonId;
          setSeasonList((prev) => [newSeason, ...prev]);
          setSelectedSeasonId(newSeason.seasonId);
          setSeasonMode("select");
        }

        // 3. Create Episode (Draft)
        setSubmitMsg("Đang tạo Episode...");
        const unlockType = releaseType === "free" ? "FREE" : "PAID";
        const priceVnd = releaseType === "coin" ? parseInt(coinPrice) * 1000 : 0;

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
        Alert.alert("Lỗi quy trình", err.message || "Không thể khởi tạo tập phim.");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handlePublish = async () => {
    if (!createdEpisodeId || !isSuccess) {
      Alert.alert("Lỗi", "Vui lòng tải lên video tập phim trước khi xuất bản.");
      return;
    }

    if (mediaStatus === "FAILED" || mediaStatus === "DELETED") {
      Alert.alert("Không thể đăng", "Nội dung này vi phạm chính sách nghiêm trọng và đã bị hệ thống từ chối.");
      return;
    }

    setPublishing(true);
    try {
      await publishEpisode(createdEpisodeId);
      Alert.alert("Thành công", "Bộ phim đã được xuất bản và hiển thị trực tuyến!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      Alert.alert("Lỗi xuất bản", err.message || "Không thể thay đổi trạng thái tập phim.");
    } finally {
      setPublishing(false);
    }
  };

  const getSeriesTitle = () => {
    if (seriesMode === "select") {
      return seriesList.find((s) => s.seriesId === selectedSeriesId)?.title || "Chưa chọn";
    }
    return newSeriesTitle || "Series mới chưa đặt tên";
  };

  const getSeasonTitle = () => {
    if (seasonMode === "select") {
      const se = seasonList.find((s) => s.seasonId === selectedSeasonId);
      return se ? `Season ${se.seasonNumber}: ${se.title || "Không có tiêu đề"}` : "Chưa chọn";
    }
    return newSeasonNumber ? `Season ${newSeasonNumber}: ${newSeasonTitle || "Không tiêu đề"}` : "Season mới";
  };

  const renderStepIndicator = () => {
    const steps = [
      { num: 1, label: "Series" },
      { num: 2, label: "Season" },
      { num: 3, label: "Tập phim" },
      { num: 4, label: "Video" },
    ];

    return (
      <View className="flex-row items-center justify-between px-6 py-4 bg-[#141210] border-b border-zinc-900">
        {steps.map((s, idx) => {
          const isActive = step === s.num;
          const isCompleted = step > s.num;
          return (
            <React.Fragment key={s.num}>
              <View className="items-center flex-1">
                <View
                  className={`w-8 h-8 rounded-full items-center justify-center ${
                    isActive
                      ? "bg-[#FF4E4E] border border-[#FF4E4E]"
                      : isCompleted
                      ? "bg-[#D4AF37]"
                      : "bg-[#252830] border border-zinc-700"
                  }`}
                >
                  {isCompleted ? (
                    <Feather name="check" size={14} color="#141210" />
                  ) : (
                    <Text className={`text-xs font-bold ${isActive ? "text-white" : "text-zinc-500"}`}>
                      {s.num}
                    </Text>
                  )}
                </View>
                <Text
                  className={`text-[10px] font-bold mt-1.5 ${
                    isActive ? "text-[#FF4E4E]" : isCompleted ? "text-[#D4AF37]" : "text-zinc-500"
                  }`}
                >
                  {s.label}
                </Text>
              </View>
              {idx < steps.length - 1 && (
                <View className={`h-[2px] flex-1 mx-2 -mt-4 ${step > s.num ? "bg-[#D4AF37]" : "bg-zinc-800"}`} />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#0F0F10]">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F10" />

      {/* HEADER */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-zinc-950 bg-[#0F0F10]">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 active:opacity-60">
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-black tracking-tight">Đăng Phim Lên TaleX</Text>
        <View className="w-10" />
      </View>

      {/* STEP INDICATOR */}
      {renderStepIndicator()}

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
        {/* ================= STEP 1: SERIES ================= */}
        {step === 1 && (
          <View>
            <Text className="text-white text-base font-black mb-1">Bước 1: Chọn hoặc Tạo Series</Text>
            <Text className="text-zinc-500 text-xs mb-4">Mỗi tập phim phải thuộc về một Series (Bộ phim).</Text>

            {/* Mode Selectors */}
            <View className="flex-row bg-[#1E1E22] rounded-xl p-1 mb-5 border border-zinc-800">
              <TouchableOpacity
                onPress={() => setSeriesMode("select")}
                className={`flex-1 py-2.5 rounded-lg items-center ${seriesMode === "select" ? "bg-[#FF4E4E]" : ""}`}
              >
                <Text className={`text-xs font-bold ${seriesMode === "select" ? "text-white" : "text-zinc-400"}`}>
                  Chọn Series Có Sẵn
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSeriesMode("create")}
                className={`flex-1 py-2.5 rounded-lg items-center ${seriesMode === "create" ? "bg-[#FF4E4E]" : ""}`}
              >
                <Text className={`text-xs font-bold ${seriesMode === "create" ? "text-white" : "text-zinc-400"}`}>
                  Tạo Series Mới
                </Text>
              </TouchableOpacity>
            </View>

            {seriesMode === "select" ? (
              <View className="space-y-3">
                <Text className="text-zinc-400 text-xs font-bold mb-2">Danh sách Series của bạn:</Text>
                {loadingSeries ? (
                  <View className="py-10 items-center">
                    <ActivityIndicator size="small" color="#FF4E4E" />
                  </View>
                ) : seriesList.length === 0 ? (
                  <View className="bg-[#1E1E22] border border-zinc-800 p-8 rounded-2xl items-center">
                    <Text className="text-zinc-500 text-xs text-center font-medium leading-5">
                      Bạn chưa tạo Series nào. Vui lòng chọn "Tạo Series Mới" ở trên.
                    </Text>
                  </View>
                ) : (
                  seriesList.map((s) => {
                    const isSelected = selectedSeriesId === s.seriesId;
                    return (
                      <TouchableOpacity
                        key={s.seriesId}
                        onPress={() => {
                          setSelectedSeriesId(s.seriesId);
                        }}
                        className={`flex-row items-center p-4 rounded-2xl border ${
                          isSelected ? "bg-[#FF4E4E]/10 border-[#FF4E4E]" : "bg-[#1E1E22] border-zinc-800"
                        } mb-3`}
                      >
                        <View className="w-12 h-12 rounded-xl bg-zinc-800 items-center justify-center mr-4">
                          <MaterialCommunityIcons name="folder-play-outline" size={24} color="#D4AF37" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white text-sm font-bold">{s.title}</Text>
                          <Text className="text-zinc-500 text-xs mt-0.5" numberOfLines={1}>
                            {s.description || "Không có mô tả"}
                          </Text>
                        </View>
                        <View
                          className={`w-5 h-5 rounded-full border items-center justify-center ${
                            isSelected ? "border-[#FF4E4E] bg-[#FF4E4E]" : "border-zinc-600"
                          }`}
                        >
                          {isSelected && <Feather name="check" size={12} color="white" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            ) : (
              <View className="space-y-4">
                {/* Title */}
                <View>
                  <Text className="text-zinc-400 text-xs font-bold mb-1.5">Tên Series mới *</Text>
                  <TextInput
                    placeholder="Nhập tên bộ phim / series..."
                    placeholderTextColor="#7C766B"
                    value={newSeriesTitle}
                    onChangeText={setNewSeriesTitle}
                    className="h-12 bg-[#1E1E22] border border-zinc-800 rounded-xl px-4 text-white text-sm font-semibold"
                  />
                </View>

                {/* Description */}
                <View>
                  <Text className="text-zinc-400 text-xs font-bold mb-1.5">Mô tả Series</Text>
                  <TextInput
                    placeholder="Viết mô tả tóm tắt nội dung cốt truyện..."
                    placeholderTextColor="#7C766B"
                    value={newSeriesDesc}
                    onChangeText={setNewSeriesDesc}
                    multiline
                    numberOfLines={4}
                    style={{ textAlignVertical: "top" }}
                    className="bg-[#1E1E22] border border-zinc-800 rounded-xl p-4 text-white text-sm font-semibold min-h-[100px]"
                  />
                </View>

                {/* Cover Picker Real */}
                <View>
                  <Text className="text-zinc-400 text-xs font-bold mb-1.5">Ảnh bìa Series (Cover Art)</Text>
                  <TouchableOpacity
                    onPress={handleSelectCover}
                    className="h-28 bg-[#1E1E22] border border-dashed border-zinc-700 rounded-xl items-center justify-center overflow-hidden"
                  >
                    {seriesCover ? (
                      <View className="items-center px-4">
                        <Feather name="image" size={24} color="#D4AF37" />
                        <Text className="text-emerald-400 text-xs font-bold mt-1 text-center" numberOfLines={1}>
                          {seriesCover.name}
                        </Text>
                      </View>
                    ) : (
                      <View className="items-center">
                        <Feather name="upload-cloud" size={24} color="#7C766B" />
                        <Text className="text-zinc-500 text-xs font-bold mt-1">Chọn ảnh bìa từ thư viện</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Genres */}
                <View>
                  <Text className="text-zinc-400 text-xs font-bold mb-2">Thể loại</Text>
                  <View className="flex-row flex-wrap">
                    {genresList.map((g) => {
                      const isSelected = selectedGenres.includes(g);
                      return (
                        <TouchableOpacity
                          key={g}
                          onPress={() => toggleGenre(g)}
                          className={`px-3 py-1.5 rounded-full mr-2 mb-2 border ${
                            isSelected ? "bg-[#D4AF37]/15 border-[#D4AF37]" : "bg-[#1E1E22] border-zinc-800"
                          }`}
                        >
                          <Text className={`text-xs font-bold ${isSelected ? "text-[#D4AF37]" : "text-zinc-500"}`}>
                            {g}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* Nav Buttons */}
            <View className="mt-8">
              <TouchableOpacity
                onPress={handleNextStep}
                className="h-12 bg-[#FF4E4E] rounded-xl items-center justify-center flex-row"
              >
                <Text className="text-white text-sm font-bold uppercase tracking-wider">Tiếp Tục</Text>
                <Feather name="arrow-right" size={16} color="white" className="ml-2" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 2: SEASON ================= */}
        {step === 2 && (
          <View>
            <View className="flex-row items-center mb-4 bg-zinc-900/50 p-3 rounded-xl">
              <Text className="text-[#D4AF37] text-xs font-black uppercase tracking-wider mr-2">Series:</Text>
              <Text className="text-white text-xs font-bold flex-1" numberOfLines={1}>
                {getSeriesTitle()}
              </Text>
            </View>
            <Text className="text-white text-base font-black mb-1">Bước 2: Chọn hoặc Tạo Season</Text>
            <Text className="text-zinc-500 text-xs mb-4">Các tập phim cần được sắp xếp theo từng Season (Mùa phim).</Text>

            {/* Mode Selectors */}
            <View className="flex-row bg-[#1E1E22] rounded-xl p-1 mb-5 border border-zinc-800">
              <TouchableOpacity
                onPress={() => setSeasonMode("select")}
                className={`flex-1 py-2.5 rounded-lg items-center ${seasonMode === "select" ? "bg-[#FF4E4E]" : ""}`}
              >
                <Text className={`text-xs font-bold ${seasonMode === "select" ? "text-white" : "text-zinc-400"}`}>
                  Chọn Season Có Sẵn
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSeasonMode("create")}
                className={`flex-1 py-2.5 rounded-lg items-center ${seasonMode === "create" ? "bg-[#FF4E4E]" : ""}`}
              >
                <Text className={`text-xs font-bold ${seasonMode === "create" ? "text-white" : "text-zinc-400"}`}>
                  Tạo Season Mới
                </Text>
              </TouchableOpacity>
            </View>

            {seasonMode === "select" ? (
              <View className="space-y-3">
                <Text className="text-zinc-400 text-xs font-bold mb-2">Danh sách Season hiện có:</Text>
                {loadingSeasons ? (
                  <View className="py-10 items-center">
                    <ActivityIndicator size="small" color="#FF4E4E" />
                  </View>
                ) : seriesMode === "create" || seasonList.length === 0 ? (
                  <View className="bg-[#1E1E22] border border-zinc-800 p-8 rounded-2xl items-center justify-center mb-3">
                    <Feather name="info" size={24} color="#7C766B" />
                    <Text className="text-zinc-500 text-xs font-semibold text-center mt-2 px-4 leading-5">
                      Bộ phim chưa có Season nào. Vui lòng chọn "Tạo Season Mới" ở trên.
                    </Text>
                  </View>
                ) : (
                  seasonList.map((se) => {
                    const isSelected = selectedSeasonId === se.seasonId;
                    return (
                      <TouchableOpacity
                        key={se.seasonId}
                        onPress={() => setSelectedSeasonId(se.seasonId)}
                        className={`flex-row items-center p-4 rounded-2xl border ${
                          isSelected ? "bg-[#FF4E4E]/10 border-[#FF4E4E]" : "bg-[#1E1E22] border-zinc-800"
                        } mb-3`}
                      >
                        <View className="w-10 h-10 rounded-xl bg-zinc-800 items-center justify-center mr-4">
                          <Ionicons name="albums-outline" size={20} color="#D4AF37" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white text-sm font-bold">Mùa {se.seasonNumber}</Text>
                          <Text className="text-zinc-500 text-xs mt-0.5">{se.title || "Không có tiêu đề riêng"}</Text>
                        </View>
                        <View
                          className={`w-5 h-5 rounded-full border items-center justify-center ${
                            isSelected ? "border-[#FF4E4E] bg-[#FF4E4E]" : "border-zinc-600"
                          }`}
                        >
                          {isSelected && <Feather name="check" size={12} color="white" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            ) : (
              <View className="space-y-4">
                {/* Season Number */}
                <View>
                  <Text className="text-zinc-400 text-xs font-bold mb-1.5">Số Season * (Ví dụ: 1, 2...)</Text>
                  <TextInput
                    placeholder="Ví dụ: 1"
                    placeholderTextColor="#7C766B"
                    keyboardType="number-pad"
                    value={newSeasonNumber}
                    onChangeText={setNewSeasonNumber}
                    className="h-12 bg-[#1E1E22] border border-zinc-800 rounded-xl px-4 text-white text-sm font-semibold"
                  />
                </View>

                {/* Season Title */}
                <View>
                  <Text className="text-zinc-400 text-xs font-bold mb-1.5">Tên Season (Không bắt buộc)</Text>
                  <TextInput
                    placeholder="Ví dụ: Cuộc Chiến Bắt Đầu"
                    placeholderTextColor="#7C766B"
                    value={newSeasonTitle}
                    onChangeText={setNewSeasonTitle}
                    className="h-12 bg-[#1E1E22] border border-zinc-800 rounded-xl px-4 text-white text-sm font-semibold"
                  />
                </View>

                {/* Season Description */}
                <View>
                  <Text className="text-zinc-400 text-xs font-bold mb-1.5">Mô tả Season</Text>
                  <TextInput
                    placeholder="Viết giới thiệu ngắn về mùa phim này..."
                    placeholderTextColor="#7C766B"
                    value={newSeasonDesc}
                    onChangeText={setNewSeasonDesc}
                    multiline
                    numberOfLines={3}
                    style={{ textAlignVertical: "top" }}
                    className="bg-[#1E1E22] border border-zinc-800 rounded-xl p-4 text-white text-sm font-semibold min-h-[80px]"
                  />
                </View>
              </View>
            )}

            {/* Nav Buttons */}
            <View className="flex-row mt-8 space-x-3">
              <TouchableOpacity
                onPress={() => setStep(1)}
                className="flex-1 h-12 bg-[#252830] border border-zinc-800 rounded-xl items-center justify-center flex-row"
              >
                <Feather name="arrow-left" size={16} color="white" className="mr-2" />
                <Text className="text-white text-sm font-bold uppercase tracking-wider">Quay lại</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextStep}
                className="flex-1 h-12 bg-[#FF4E4E] rounded-xl items-center justify-center flex-row"
              >
                <Text className="text-white text-sm font-bold uppercase tracking-wider">Tiếp Tục</Text>
                <Feather name="arrow-right" size={16} color="white" className="ml-2" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 3: EPISODE ================= */}
        {step === 3 && (
          <View>
            <View className="bg-[#1E1E22] p-4 rounded-2xl border border-zinc-800 mb-6 space-y-2">
              <View className="flex-row">
                <Text className="text-zinc-500 text-xs font-bold w-16">Bộ phim:</Text>
                <Text className="text-white text-xs font-semibold flex-1">{getSeriesTitle()}</Text>
              </View>
              <View className="flex-row">
                <Text className="text-zinc-500 text-xs font-bold w-16">Season:</Text>
                <Text className="text-white text-xs font-semibold flex-1">{getSeasonTitle()}</Text>
              </View>
            </View>

            <Text className="text-white text-base font-black mb-1">Bước 3: Nhập thông tin tập phim</Text>
            <Text className="text-zinc-500 text-xs mb-5">Thiết lập thứ tự tập phim, tên tập và cấu hình thanh toán.</Text>

            <View className="space-y-4">
              {/* Episode Number */}
              <View>
                <Text className="text-zinc-400 text-xs font-bold mb-1.5">Số tập * (Ví dụ: 1, 2...)</Text>
                <TextInput
                  placeholder="Ví dụ: 5"
                  placeholderTextColor="#7C766B"
                  keyboardType="number-pad"
                  value={episodeNumber}
                  onChangeText={setEpisodeNumber}
                  className="h-12 bg-[#1E1E22] border border-zinc-800 rounded-xl px-4 text-white text-sm font-semibold"
                />
              </View>

              {/* Episode Title */}
              <View>
                <Text className="text-zinc-400 text-xs font-bold mb-1.5">Tên tập phim *</Text>
                <TextInput
                  placeholder="Nhập tên tập phim..."
                  placeholderTextColor="#7C766B"
                  value={episodeTitle}
                  onChangeText={setEpisodeTitle}
                  className="h-12 bg-[#1E1E22] border border-zinc-800 rounded-xl px-4 text-white text-sm font-semibold"
                />
              </View>

              {/* Episode Desc */}
              <View>
                <Text className="text-zinc-400 text-xs font-bold mb-1.5">Mô tả tập phim (Tóm tắt tập)</Text>
                <TextInput
                  placeholder="Viết nội dung giới thiệu ngắn cho tập này..."
                  placeholderTextColor="#7C766B"
                  value={episodeDesc}
                  onChangeText={setEpisodeDesc}
                  multiline
                  numberOfLines={3}
                  style={{ textAlignVertical: "top" }}
                  className="bg-[#1E1E22] border border-zinc-800 rounded-xl p-4 text-white text-sm font-semibold min-h-[80px]"
                />
              </View>

              {/* Pricing release options */}
              <View>
                <Text className="text-zinc-400 text-xs font-bold mb-2.5">Hình thức phát hành</Text>
                <View className="flex-row space-x-2">
                  {(["free", "premium", "coin"] as const).map((type) => {
                    let label = "";
                    let iconName: any = "";
                    switch (type) {
                      case "free":
                        label = "Miễn phí";
                        iconName = "eye-outline";
                        break;
                      case "premium":
                        label = "Premium";
                        iconName = "crown-outline";
                        break;
                      case "coin":
                        label = "Mua Xu";
                        iconName = "cash-outline";
                        break;
                    }
                    const isSelected = releaseType === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setReleaseType(type)}
                        className={`flex-1 py-3 rounded-xl border items-center justify-center flex-row ${
                          isSelected ? "bg-[#D4AF37]/15 border-[#D4AF37]" : "bg-[#1E1E22] border-zinc-800"
                        }`}
                      >
                        <MaterialCommunityIcons
                          name={iconName}
                          size={14}
                          color={isSelected ? "#D4AF37" : "#7C766B"}
                          style={{ marginRight: 4 }}
                        />
                        <Text className={`text-xs font-bold ${isSelected ? "text-[#D4AF37]" : "text-zinc-500"}`}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Coin Input */}
              {releaseType === "coin" && (
                <View className="bg-[#1E1E22] p-4 rounded-xl border border-[#D4AF37]/20 mt-2">
                  <Text className="text-[#D4AF37] text-xs font-bold mb-1.5">Giá bán (Số Xu yêu cầu):</Text>
                  <View className="flex-row items-center bg-[#0F0F10] border border-zinc-800 rounded-lg px-3">
                    <TextInput
                      placeholder="Số xu..."
                      placeholderTextColor="#7C766B"
                      keyboardType="number-pad"
                      value={coinPrice}
                      onChangeText={setCoinPrice}
                      className="flex-1 h-10 text-white font-bold text-sm"
                    />
                    <FontAwesome5 name="coins" size={12} color="#D4AF37" style={{ marginLeft: 8 }} />
                  </View>
                  <Text className="text-zinc-500 text-[10px] mt-1.5">
                    Người xem phải trả số xu này để mở khóa vĩnh viễn tập phim.
                  </Text>
                </View>
              )}
            </View>

            {/* Nav Buttons */}
            <View className="flex-row mt-8 space-x-3">
              <TouchableOpacity
                onPress={() => setStep(2)}
                className="flex-1 h-12 bg-[#252830] border border-zinc-800 rounded-xl items-center justify-center flex-row"
              >
                <Feather name="arrow-left" size={16} color="white" className="mr-2" />
                <Text className="text-white text-sm font-bold uppercase tracking-wider">Quay lại</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextStep}
                className="flex-1 h-12 bg-[#FF4E4E] rounded-xl items-center justify-center flex-row"
              >
                <Text className="text-white text-sm font-bold uppercase tracking-wider">Tiếp Tục</Text>
                <Feather name="arrow-right" size={16} color="white" className="ml-2" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 4: VIDEO UPLOAD ================= */}
        {step === 4 && (
          <View>
            <View className="bg-[#1E1E22] p-4 rounded-2xl border border-zinc-800 mb-6 space-y-2">
              <View className="flex-row">
                <Text className="text-zinc-500 text-xs font-bold w-20">Bộ phim:</Text>
                <Text className="text-white text-xs font-semibold flex-1">{getSeriesTitle()}</Text>
              </View>
              <View className="flex-row">
                <Text className="text-zinc-500 text-xs font-bold w-20">Season / Tập:</Text>
                <Text className="text-white text-xs font-semibold flex-1">
                  {getSeasonTitle()} • Tập {episodeNumber}
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-zinc-500 text-xs font-bold w-20">Tên tập:</Text>
                <Text className="text-white text-xs font-semibold flex-1">{episodeTitle}</Text>
              </View>
              <View className="flex-row">
                <Text className="text-zinc-500 text-xs font-bold w-20">Phát hành:</Text>
                <Text className="text-[#D4AF37] text-xs font-black uppercase flex-1">
                  {releaseType === "free" ? "Miễn phí" : releaseType === "premium" ? "Premium" : `${coinPrice} Xu`}
                </Text>
              </View>
            </View>

            <Text className="text-white text-base font-black mb-1">Bước 4: Tải lên video tập phim</Text>
            <Text className="text-zinc-500 text-xs mb-5">Chọn tệp tin video từ điện thoại của bạn.</Text>

            {/* Video File Area */}
            {!videoFile ? (
              <TouchableOpacity
                onPress={handleSelectVideo}
                className="border-2 border-dashed border-zinc-700 bg-[#1E1E22] rounded-3xl p-10 items-center justify-center min-h-[200px]"
              >
                <View className="w-16 h-16 rounded-full bg-[#FF4E4E]/10 items-center justify-center mb-4">
                  <Feather name="video" size={32} color="#FF4E4E" />
                </View>
                <Text className="text-white text-sm font-bold text-center">Bấm vào đây để chọn video từ thiết bị</Text>
                <Text className="text-zinc-500 text-xs text-center mt-1.5">Hỗ trợ định dạng MP4, MOV, v.v.</Text>
              </TouchableOpacity>
            ) : (
              <View className="bg-[#1E1E22] border border-zinc-800 rounded-3xl p-5 space-y-4">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-zinc-800 items-center justify-center mr-3">
                    <MaterialCommunityIcons name="movie-play" size={22} color="#FF4E4E" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-xs font-bold" numberOfLines={1}>
                      {videoFile.name}
                    </Text>
                    <Text className="text-zinc-500 text-[10px] mt-0.5">
                      {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setVideoFile(null);
                      setUploadProgress(0);
                      setIsSuccess(false);
                      setMediaStatus(null);
                      setCopyrightStatus(null);
                      setModerationStatus(null);
                      if (pollTimerRef.current) {
                        clearInterval(pollTimerRef.current);
                      }
                    }}
                    className="p-1 active:opacity-60"
                  >
                    <Feather name="trash-2" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* Upload Status / Bar */}
                {uploading ? (
                  <View className="space-y-2">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-stone-300 text-xs font-medium">Đang tải tệp lên S3...</Text>
                      <Text className="text-[#FF4E4E] text-xs font-black">{uploadProgress}%</Text>
                    </View>
                    <View className="h-2 bg-zinc-850 rounded-full overflow-hidden">
                      <View style={{ width: `${uploadProgress}%` }} className="h-full bg-[#FF4E4E] rounded-full" />
                    </View>
                  </View>
                ) : isSuccess ? (
                  <View className="space-y-3">
                    <View className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl p-3 flex-row items-center">
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <Text className="text-[#10B981] text-xs font-bold ml-2">Đã hoàn thành truyền tải video!</Text>
                    </View>

                    {/* Pipelines (Copyright & AI Moderation status) */}
                    <View className="bg-[#0F0F10] border border-zinc-800 rounded-2xl p-4 space-y-3">
                      <Text className="text-[#D4AF37] text-xs font-bold">KẾT QUẢ KIỂM DUYỆT HỆ THỐNG:</Text>

                      {/* Copyright result */}
                      <View className="flex-row items-center justify-between border-b border-zinc-900 pb-2">
                        <Text className="text-zinc-400 text-xs font-medium">Bản quyền video:</Text>
                        <Text
                          className={`text-xs font-bold ${
                            copyrightStatus?.includes("Cảnh báo")
                              ? "text-red-500"
                              : copyrightStatus?.includes("Đạt")
                              ? "text-green-500"
                              : "text-amber-500"
                          }`}
                        >
                          {copyrightStatus || "Đang xử lý..."}
                        </Text>
                      </View>

                      {/* Content Moderation result */}
                      <View className="flex-row items-center justify-between pb-1">
                        <Text className="text-zinc-400 text-xs font-medium">Kiểm duyệt AI:</Text>
                        <Text
                          className={`text-xs font-bold ${
                            moderationStatus?.includes("Từ chối")
                              ? "text-red-500"
                              : moderationStatus?.includes("Đạt")
                              ? "text-green-500"
                              : "text-amber-500"
                          }`}
                        >
                          {moderationStatus || "Đang xử lý..."}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleStartUpload}
                    className="h-11 bg-zinc-800 rounded-xl items-center justify-center flex-row"
                  >
                    <Feather name="upload" size={16} color="white" style={{ marginRight: 6 }} />
                    <Text className="text-white text-xs font-bold">Bắt Đầu Tải Lên S3</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Nav Buttons */}
            <View className="flex-row mt-8 space-x-3">
              <TouchableOpacity
                onPress={() => setStep(3)}
                className="flex-1 h-12 bg-[#252830] border border-zinc-800 rounded-xl items-center justify-center flex-row"
              >
                <Feather name="arrow-left" size={16} color="white" className="mr-2" />
                <Text className="text-white text-sm font-bold uppercase tracking-wider">Quay lại</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePublish}
                disabled={!isSuccess || publishing || mediaStatus === "PROCESSING" || mediaStatus === "PENDING"}
                className={`flex-1 h-12 rounded-xl items-center justify-center flex-row ${
                  isSuccess && mediaStatus !== "PROCESSING" && mediaStatus !== "PENDING"
                    ? "bg-[#D4AF37]"
                    : "bg-zinc-800 opacity-50"
                }`}
              >
                {publishing ? (
                  <ActivityIndicator size="small" color="#141210" />
                ) : (
                  <>
                    <Text
                      className={`text-sm font-black uppercase tracking-wider ${
                        isSuccess && mediaStatus !== "PROCESSING" && mediaStatus !== "PENDING"
                          ? "text-[#141210]"
                          : "text-zinc-500"
                      }`}
                    >
                      Đăng Phim
                    </Text>
                    <Feather
                      name="check-circle"
                      size={16}
                      color={
                        isSuccess && mediaStatus !== "PROCESSING" && mediaStatus !== "PENDING"
                          ? "#141210"
                          : "#71717A"
                      }
                      style={{ marginLeft: 6 }}
                    />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
