import React, { useState, useEffect } from "react";
import {
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";

import {
  listSeriesByCreator,
  createSeries,
  listSeasonsBySeries,
  createSeason,
  createEpisode,
  uploadImageToS3,
  createComicPageMedia,
  publishEpisode,
  SeriesItem,
  SeasonItem,
  MediaComicPageRequest,
} from "@/services/creatorContent";

const genresList = ["Hành động", "Viễn tưởng", "Tình cảm", "Hài hước", "Kinh dị", "Trinh thám", "Đời thường"];

type LocalComicPage = {
  id: string;
  uri: string;
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
};

const getImageDimensions = (uri: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => {
        resolve({ width, height });
      },
      () => {
        resolve({ width: 0, height: 0 });
      }
    );
  });
};

export default function UploadComicScreen() {
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

  // --- STEP 3: EPISODE/CHAPTER STATE ---
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [episodeDesc, setEpisodeDesc] = useState("");
  const [releaseType, setReleaseType] = useState<"free" | "premium" | "coin">("free");
  const [coinPrice, setCoinPrice] = useState("5");
  const [createdEpisodeId, setCreatedEpisodeId] = useState<string | null>(null);

  // --- STEP 4: PAGES UPLOAD STATE ---
  const [comicPages, setComicPages] = useState<LocalComicPage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Load Creator Series (filtering ContentType = "COMIC")
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setLoadingSeries(true);
        const list = await listSeriesByCreator();
        // Filter series list to only display COMIC type
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

  // Multiple Image Picker for Comic Pages
  const handleSelectPages = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Cấp quyền", "Vui lòng cấp quyền thư viện ảnh để chọn trang truyện.");
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

  const handleNextStep = async () => {
    if (step === 1) {
      if (seriesMode === "create") {
        if (!newSeriesTitle.trim()) {
          Alert.alert("Lỗi", "Vui lòng nhập tên Series.");
          return;
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
          Alert.alert("Lỗi", "Vui lòng nhập số Season (VD: 1).");
          return;
        }
        if (!newSeasonTitle.trim()) {
          Alert.alert("Lỗi", "Vui lòng nhập tiêu đề Season.");
          return;
        }
      } else {
        if (!selectedSeasonId && seasonList.length > 0) {
          Alert.alert("Lỗi", "Vui lòng chọn Season.");
          return;
        }
      }
      setStep(3);
    } else if (step === 3) {
      if (!episodeNumber.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập số tập / chương.");
        return;
      }
      if (!episodeTitle.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập tiêu đề chương.");
        return;
      }

      // Perform Backend Creation of Series, Season and Episode/Chapter
      setSubmitting(true);
      try {
        let finalSeriesId = selectedSeriesId;

        // 1. Create Series
        if (seriesMode === "create") {
          setSubmitMsg("Đang tải ảnh bìa lên S3...");
          let coverUrl = "";
          if (seriesCover) {
            const uploadRes = await uploadImageToS3(
              seriesCover.uri,
              seriesCover.name,
              seriesCover.size,
              seriesCover.type,
              "cover"
            );
            coverUrl = uploadRes.publicUrl;
          }
          setSubmitMsg("Đang tạo Series...");
          const newSeries = await createSeries({
            title: newSeriesTitle,
            description: newSeriesDesc,
            coverUrl,
            contentType: "COMIC",
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
        setSubmitMsg("Đang tạo chương mới...");
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
          text2: "Chương mới đã được khởi tạo thành công.",
        });
        setStep(4);
      } catch (err: any) {
        console.error("Lỗi khởi tạo cấu trúc truyện:", err);
        Alert.alert("Lỗi", "Không thể tạo chương mới: " + err.message);
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
          "comic-page"
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
      await createComicPageMedia(createdEpisodeId, uploadedPages);

      setIsSuccess(true);
      Toast.show({
        type: "success",
        text1: "Thành công",
        text2: "Đã tải lên toàn bộ các trang truyện thành công!",
      });
    } catch (err: any) {
      console.error("Lỗi trong quá trình upload ảnh:", err);
      Alert.alert("Lỗi upload", "Không thể tải lên ảnh trang truyện: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!createdEpisodeId) return;
    try {
      setPublishing(true);
      await publishEpisode(createdEpisodeId);
      Toast.show({
        type: "success",
        text1: "Đăng truyện thành công!",
        text2: "Tập truyện mới của bạn hiện đã được xuất bản.",
      });
      navigation.goBack();
    } catch (err: any) {
      console.error("Lỗi xuất bản tập truyện:", err);
      Alert.alert("Lỗi xuất bản", "Không thể xuất bản tập truyện: " + err.message);
    } finally {
      setPublishing(false);
    }
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
      { num: 3, label: "Chương" },
      { num: 4, label: "Trang ảnh" },
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
        <Text className="text-white text-lg font-black tracking-tight">Đăng Truyện Lên TaleX</Text>
        <View className="w-10" />
      </View>

      {/* STEP INDICATOR */}
      {renderStepIndicator()}

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
        {/* ================= STEP 1: SERIES ================= */}
        {step === 1 && (
          <View>
            <Text className="text-white text-base font-black mb-1">Bước 1: Chọn hoặc Tạo Series</Text>
            <Text className="text-zinc-500 text-xs mb-4">Mỗi chương truyện phải thuộc về một Series (Bộ truyện).</Text>

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
              <View>
                <Text className="text-zinc-400 text-xs font-bold mb-2">Danh sách Series của bạn:</Text>
                {loadingSeries ? (
                  <View className="py-10 items-center">
                    <ActivityIndicator size="small" color="#FF4E4E" />
                  </View>
                ) : seriesList.length === 0 ? (
                  <View className="bg-[#1E1E22] border border-zinc-800 p-8 rounded-2xl items-center">
                    <Text className="text-zinc-500 text-xs text-center font-medium leading-5">
                      Bạn chưa có Series truyện nào. Vui lòng chọn "Tạo Series Mới" ở trên.
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
                          <MaterialCommunityIcons name="book-open-outline" size={24} color="#D4AF37" />
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
                  <Text className="text-zinc-400 text-xs font-bold mb-1.5">Tên Series truyện mới *</Text>
                  <TextInput
                    placeholder="Nhập tên bộ truyện..."
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
                    placeholder="Viết mô tả tóm tắt nội dung truyện..."
                    placeholderTextColor="#7C766B"
                    value={newSeriesDesc}
                    onChangeText={setNewSeriesDesc}
                    multiline
                    numberOfLines={4}
                    style={{ textAlignVertical: "top" }}
                    className="bg-[#1E1E22] border border-zinc-800 rounded-xl p-4 text-white text-sm font-semibold min-h-[100px]"
                  />
                </View>

                {/* Cover Picker */}
                <View>
                  <Text className="text-zinc-400 text-xs font-bold mb-1.5">Ảnh bìa Series (Cover Art - Tỉ lệ 3:4)</Text>
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
                <Feather name="arrow-right" size={16} color="white" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 2: SEASON ================= */}
        {step === 2 && (
          <View>
            <Text className="text-white text-base font-black mb-1">Bước 2: Chọn hoặc Tạo Season</Text>
            <Text className="text-zinc-500 text-xs mb-4">Các tập truyện được nhóm theo Season / Phần phát hành.</Text>

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
              <View>
                <Text className="text-zinc-400 text-xs font-bold mb-2">Danh sách Season hiện có:</Text>
                {loadingSeasons ? (
                  <View className="py-10 items-center">
                    <ActivityIndicator size="small" color="#FF4E4E" />
                  </View>
                ) : seasonList.length === 0 ? (
                  <View className="bg-[#1E1E22] border border-zinc-800 p-8 rounded-2xl items-center">
                    <Text className="text-zinc-500 text-xs text-center font-medium leading-5">
                      Chưa có Season nào được tạo cho Series này. Vui lòng chọn "Tạo Season Mới" ở trên.
                    </Text>
                  </View>
                ) : (
                  seasonList.map((s) => {
                    const isSelected = selectedSeasonId === s.seasonId;
                    return (
                      <TouchableOpacity
                        key={s.seasonId}
                        onPress={() => {
                          setSelectedSeasonId(s.seasonId);
                        }}
                        className={`flex-row items-center p-4 rounded-2xl border ${
                          isSelected ? "bg-[#FF4E4E]/10 border-[#FF4E4E]" : "bg-[#1E1E22] border-zinc-800"
                        } mb-3`}
                      >
                        <View className="w-10 h-10 rounded-xl bg-zinc-800 items-center justify-center mr-4">
                          <MaterialCommunityIcons name="layers-outline" size={20} color="#D4AF37" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white text-sm font-bold">Season {s.seasonNumber}</Text>
                          <Text className="text-zinc-500 text-xs mt-0.5">{s.title || "Không tiêu đề"}</Text>
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
                <View>
                  <Text className="text-zinc-400 text-xs font-bold mb-1.5">Season số mấy (VD: 1, 2) *</Text>
                  <TextInput
                    placeholder="Nhập số thứ tự Season..."
                    placeholderTextColor="#7C766B"
                    keyboardType="numeric"
                    value={newSeasonNumber}
                    onChangeText={setNewSeasonNumber}
                    className="h-12 bg-[#1E1E22] border border-zinc-800 rounded-xl px-4 text-white text-sm font-semibold"
                  />
                </View>

                <View>
                  <Text className="text-zinc-400 text-xs font-bold mb-1.5">Tiêu đề Season *</Text>
                  <TextInput
                    placeholder="Nhập tiêu đề phần truyện (Ví dụ: Phần mở đầu)..."
                    placeholderTextColor="#7C766B"
                    value={newSeasonTitle}
                    onChangeText={setNewSeasonTitle}
                    className="h-12 bg-[#1E1E22] border border-zinc-800 rounded-xl px-4 text-white text-sm font-semibold"
                  />
                </View>

                <View>
                  <Text className="text-zinc-400 text-xs font-bold mb-1.5">Mô tả Season</Text>
                  <TextInput
                    placeholder="Mô tả nội dung của phần này..."
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
                <Feather name="arrow-left" size={16} color="white" style={{ marginRight: 6 }} />
                <Text className="text-white text-sm font-bold uppercase tracking-wider">Quay lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNextStep}
                className="flex-1 h-12 bg-[#FF4E4E] rounded-xl items-center justify-center flex-row"
              >
                <Text className="text-white text-sm font-bold uppercase tracking-wider">Tiếp Tục</Text>
                <Feather name="arrow-right" size={16} color="white" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 3: CHAPTER DETAILS ================= */}
        {step === 3 && (
          <View className="space-y-4">
            <Text className="text-white text-base font-black mb-1">Bước 3: Nhập thông tin Chương mới</Text>
            <Text className="text-zinc-500 text-xs mb-2">Điền thông tin chi tiết cho tập/chương truyện chuẩn bị tải lên.</Text>

            <View>
              <Text className="text-zinc-400 text-xs font-bold mb-1.5">Chương số mấy (VD: 1, 2) *</Text>
              <TextInput
                placeholder="Nhập số chương..."
                placeholderTextColor="#7C766B"
                keyboardType="numeric"
                value={episodeNumber}
                onChangeText={setEpisodeNumber}
                className="h-12 bg-[#1E1E22] border border-zinc-800 rounded-xl px-4 text-white text-sm font-semibold"
              />
            </View>

            <View>
              <Text className="text-zinc-400 text-xs font-bold mb-1.5">Tiêu đề chương *</Text>
              <TextInput
                placeholder="Nhập tên chương..."
                placeholderTextColor="#7C766B"
                value={episodeTitle}
                onChangeText={setEpisodeTitle}
                className="h-12 bg-[#1E1E22] border border-zinc-800 rounded-xl px-4 text-white text-sm font-semibold"
              />
            </View>

            <View>
              <Text className="text-zinc-400 text-xs font-bold mb-1.5">Mô tả ngắn</Text>
              <TextInput
                placeholder="Tóm tắt nội dung chương..."
                placeholderTextColor="#7C766B"
                value={episodeDesc}
                onChangeText={setEpisodeDesc}
                multiline
                numberOfLines={3}
                style={{ textAlignVertical: "top" }}
                className="bg-[#1E1E22] border border-zinc-800 rounded-xl p-4 text-white text-sm font-semibold min-h-[80px]"
              />
            </View>

            {/* Release Type (Free, Premium, Coin) */}
            <View>
              <Text className="text-zinc-400 text-xs font-bold mb-2">Chế độ xem của chương</Text>
              <View className="flex-row space-x-2">
                {["free", "premium", "coin"].map((type) => {
                  const isSelected = releaseType === type;
                  const label = type === "free" ? "Miễn phí" : type === "premium" ? "Premium" : "Bán xu";
                  return (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setReleaseType(type as any)}
                      className={`flex-1 py-3 rounded-xl border items-center justify-center ${
                        isSelected ? "bg-[#D4AF37]/15 border-[#D4AF37]" : "bg-[#1E1E22] border-zinc-800"
                      }`}
                    >
                      <Text className={`text-xs font-bold ${isSelected ? "text-[#D4AF37]" : "text-zinc-400"}`}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {releaseType === "coin" && (
              <View>
                <Text className="text-zinc-400 text-xs font-bold mb-1.5">Giá bán (Xu) *</Text>
                <TextInput
                  placeholder="Nhập số xu cần mua..."
                  placeholderTextColor="#7C766B"
                  keyboardType="numeric"
                  value={coinPrice}
                  onChangeText={setCoinPrice}
                  className="h-12 bg-[#1E1E22] border border-zinc-800 rounded-xl px-4 text-white text-sm font-semibold"
                />
              </View>
            )}

            {/* Nav Buttons */}
            <View className="flex-row mt-8 space-x-3">
              <TouchableOpacity
                onPress={() => setStep(2)}
                className="flex-1 h-12 bg-[#252830] border border-zinc-800 rounded-xl items-center justify-center flex-row"
              >
                <Feather name="arrow-left" size={16} color="white" style={{ marginRight: 6 }} />
                <Text className="text-white text-sm font-bold uppercase tracking-wider">Quay lại</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleNextStep}
                className="flex-1 h-12 bg-[#FF4E4E] rounded-xl items-center justify-center flex-row"
              >
                <Text className="text-white text-sm font-bold uppercase tracking-wider">Khởi Tạo</Text>
                <Feather name="arrow-right" size={16} color="white" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= STEP 4: PAGES UPLOAD ================= */}
        {step === 4 && (
          <View>
            {/* Episode Brief */}
            <View className="bg-[#1E1E22] border border-zinc-800 rounded-3xl p-4 mb-5 space-y-2">
              <Text className="text-[#D4AF37] text-xs font-black uppercase">ĐÃ KHỞI TẠO CHƯƠNG THÀNH CÔNG:</Text>
              <View className="flex-row">
                <Text className="text-zinc-500 text-xs font-bold w-20">Vị trí:</Text>
                <Text className="text-white text-xs font-semibold flex-1">
                  {getSeasonTitle()} • Tập {episodeNumber}
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-zinc-500 text-xs font-bold w-20">Tên tập:</Text>
                <Text className="text-white text-xs font-semibold flex-1">{episodeTitle}</Text>
              </View>
              <View className="flex-row">
                <Text className="text-zinc-500 text-xs font-bold w-20">Chế độ xem:</Text>
                <Text className="text-[#D4AF37] text-xs font-black uppercase flex-1">
                  {releaseType === "free" ? "Miễn phí" : releaseType === "premium" ? "Premium" : `${coinPrice} Xu`}
                </Text>
              </View>
            </View>

            <Text className="text-white text-base font-black mb-1">Bước 4: Tải lên các trang truyện</Text>
            <Text className="text-zinc-500 text-xs mb-5">Chọn các trang ảnh truyện từ thư viện để tải lên.</Text>

            {comicPages.length === 0 ? (
              <TouchableOpacity
                onPress={handleSelectPages}
                className="border-2 border-dashed border-zinc-700 bg-[#1E1E22] rounded-3xl p-10 items-center justify-center min-h-[200px] mb-5"
              >
                <View className="w-16 h-16 rounded-full bg-[#FF4E4E]/10 items-center justify-center mb-4">
                  <Feather name="image" size={32} color="#FF4E4E" />
                </View>
                <Text className="text-white text-sm font-bold text-center">Bấm vào đây để chọn các trang truyện</Text>
                <Text className="text-zinc-500 text-xs text-center mt-1.5">Hỗ trợ chọn nhiều ảnh cùng lúc</Text>
              </TouchableOpacity>
            ) : (
              <View className="space-y-4 mb-5">
                {/* Pages List */}
                <View className="bg-[#1E1E22] border border-zinc-800 rounded-3xl p-4">
                  <View className="flex-row items-center justify-between border-b border-zinc-800 pb-3 mb-3">
                    <Text className="text-white text-xs font-bold">Danh sách trang ({comicPages.length})</Text>
                    <TouchableOpacity onPress={handleSelectPages} className="flex-row items-center bg-zinc-800 px-3 py-1.5 rounded-lg active:opacity-60">
                      <Feather name="plus" size={14} color="white" />
                      <Text className="text-white text-[10px] font-bold ml-1">Thêm trang</Text>
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ maxHeight: 300 }}>
                    {comicPages.map((page, index) => (
                      <View key={page.id} className="flex-row items-center justify-between py-2 border-b border-zinc-900/50">
                        <View className="flex-row items-center flex-1 mr-3">
                          <Image source={{ uri: page.uri }} className="w-12 h-16 rounded-md mr-3 bg-zinc-900" resizeMode="cover" />
                          <View className="flex-1">
                            <Text className="text-white text-xs font-bold" numberOfLines={1}>Trang {index + 1}</Text>
                            <Text className="text-zinc-500 text-[10px]" numberOfLines={1}>{page.name}</Text>
                            <Text className="text-zinc-500 text-[10px]">{(page.size / 1024).toFixed(0)} KB</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            setComicPages((prev) => prev.filter((p) => p.id !== page.id));
                          }}
                          className="p-2 active:opacity-60"
                        >
                          <Feather name="trash-2" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                {/* Upload action or success indicator */}
                {uploading ? (
                  <View className="bg-[#1E1E22] border border-[#D4AF37]/30 rounded-2xl p-4 items-center">
                    <ActivityIndicator size="small" color="#D4AF37" />
                    <Text className="text-stone-300 text-xs font-medium mt-2">{submitMsg}</Text>
                  </View>
                ) : isSuccess ? (
                  <View className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl p-4 flex-row items-center">
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                    <View className="ml-3 flex-1">
                      <Text className="text-[#10B981] text-sm font-bold">Tải lên hoàn tất!</Text>
                      <Text className="text-emerald-500/80 text-[10px] mt-0.5">
                        Đã lưu {comicPages.length} trang truyện vào chương mới của bạn.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleStartUpload}
                    className="h-12 bg-zinc-800 rounded-xl items-center justify-center flex-row"
                  >
                    <Feather name="upload" size={16} color="white" style={{ marginRight: 6 }} />
                    <Text className="text-white text-xs font-bold">Bắt Đầu Tải Lên Hệ Thống</Text>
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
                <Feather name="arrow-left" size={16} color="white" style={{ marginRight: 6 }} />
                <Text className="text-white text-sm font-bold uppercase tracking-wider">Quay lại</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePublish}
                disabled={!isSuccess || publishing}
                className={`flex-1 h-12 rounded-xl items-center justify-center flex-row ${
                  isSuccess ? "bg-[#D4AF37]" : "bg-zinc-800 opacity-50"
                }`}
              >
                {publishing ? (
                  <ActivityIndicator size="small" color="#141210" />
                ) : (
                  <>
                    <Text
                      className={`text-sm font-black uppercase tracking-wider ${
                        isSuccess ? "text-[#141210]" : "text-zinc-500"
                      }`}
                    >
                      Đăng Truyện
                    </Text>
                    <Feather
                      name="check-circle"
                      size={16}
                      color={isSuccess ? "#141210" : "#71717A"}
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
