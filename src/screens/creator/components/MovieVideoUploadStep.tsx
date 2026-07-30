import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useVideoPlayer, VideoView } from "expo-video";

type MovieVideoUploadStepProps = {
  seriesTitle: string;
  seasonTitle: string;
  episodeNumber: string;
  episodeTitle: string;
  releaseType: "free" | "premium" | "coin";
  coinPrice: string;
  
  videoFile: {
    uri: string;
    name: string;
    size: number;
    type: string;
  } | null;
  handleSelectVideo: () => void;
  handleStartUpload: () => void;
  handleDeleteVideo: () => void;
  uploading: boolean;
  uploadProgress: number;
  isSuccess: boolean;
  
  mediaStatus: string | null;
  copyrightStatus: string | null;
  moderationStatus: string | null;

  episodeThumbnail?: { uri: string; name: string; size: number; type: string } | null;
  handleSelectThumbnail?: () => void;
  onViewViolationDetails?: () => void;
  
  onBack: () => void;
  onNext: () => void;
};

function VideoPreviewPlayer({ videoUri }: { videoUri: string }) {
  const player = useVideoPlayer(videoUri, (p) => {
    p.loop = false;
  });

  return (
    <View className="w-full aspect-video rounded-2xl overflow-hidden bg-black mb-3 border border-zinc-800">
      <VideoView
        player={player}
        style={{ width: "100%", height: "100%" }}
        allowsFullscreen
        allowsPictureInPicture
      />
    </View>
  );
}

export default function MovieVideoUploadStep({
  seriesTitle,
  seasonTitle,
  episodeNumber,
  episodeTitle,
  releaseType,
  coinPrice,
  videoFile,
  handleSelectVideo,
  handleStartUpload,
  handleDeleteVideo,
  uploading,
  uploadProgress,
  isSuccess,
  mediaStatus,
  copyrightStatus,
  moderationStatus,
  episodeThumbnail,
  handleSelectThumbnail,
  onViewViolationDetails,
  onBack,
  onNext,
}: MovieVideoUploadStepProps) {
  return (
    <View>
      <View className="bg-[#1E1E22] p-4 rounded-2xl border border-zinc-800 mb-6 space-y-2">
        <View className="flex-row">
          <Text className="text-zinc-500 text-xs font-bold w-20">Bộ phim:</Text>
          <Text className="text-white text-xs font-semibold flex-1">{seriesTitle}</Text>
        </View>
        <View className="flex-row">
          <Text className="text-zinc-500 text-xs font-bold w-20">Season / Tập:</Text>
          <Text className="text-white text-xs font-semibold flex-1">
            {seasonTitle} • Tập {episodeNumber}
          </Text>
        </View>
        <View className="flex-row">
          <Text className="text-zinc-500 text-xs font-bold w-20">Tên tập:</Text>
          <Text className="text-white text-xs font-semibold flex-1">{episodeTitle}</Text>
        </View>
        <View className="flex-row">
          <Text className="text-zinc-500 text-xs font-bold w-20">Phát hành:</Text>
          <Text className="text-[#D4AF37] text-xs font-black uppercase flex-1">
            {releaseType === "free" ? "Miễn phí" : `Trả phí (${coinPrice} Xu)`}
          </Text>
        </View>
      </View>

      <Text className="text-white text-base font-black mb-1">Bước 4: Tải lên video tập phim</Text>
      <Text className="text-zinc-500 text-xs mb-5">Chọn tệp tin video từ điện thoại của bạn.</Text>

      {/* Episode Thumbnail Section */}
      {handleSelectThumbnail && (
        <View className="bg-[#1E1E22] border border-zinc-800 rounded-3xl p-4 mb-5">
          <Text className="text-zinc-400 text-xs font-bold mb-2">
            Ảnh đại diện tập phim (Thumbnail)
          </Text>
          {episodeThumbnail ? (
            <View className="flex-row items-center">
              <Image
                source={{ uri: episodeThumbnail.uri }}
                className="w-20 aspect-[16/9] rounded-xl bg-zinc-900 mr-3"
                resizeMode="cover"
              />
              <View className="flex-1">
                <Text className="text-white text-xs font-bold" numberOfLines={1}>
                  {episodeThumbnail.name}
                </Text>
                <TouchableOpacity
                  onPress={handleSelectThumbnail}
                  className="mt-2 bg-zinc-800 px-3 py-1.5 rounded-lg self-start active:opacity-60"
                >
                  <Text className="text-white text-[10px] font-bold">Thay ảnh đại diện</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleSelectThumbnail}
              className="border border-dashed border-zinc-700 rounded-2xl p-3 flex-row items-center justify-center active:opacity-60"
            >
              <Feather name="image" size={18} color="#D4AF37" style={{ marginRight: 8 }} />
              <Text className="text-white text-xs font-bold">Tải ảnh đại diện tập phim lên</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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
          {/* Video Preview Player */}
          <VideoPreviewPlayer videoUri={videoFile.uri} />

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
              onPress={handleDeleteVideo}
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
                  <View className="flex-row items-center">
                    {(!copyrightStatus || (!copyrightStatus.includes("Cảnh báo") && !copyrightStatus.includes("Đạt"))) && (
                      <ActivityIndicator size="small" color="#D4AF37" style={{ marginRight: 6 }} />
                    )}
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
                </View>

                {/* Content Moderation result */}
                <View className="flex-row items-center justify-between pb-1">
                  <Text className="text-zinc-400 text-xs font-medium">Kiểm duyệt AI:</Text>
                  <View className="flex-row items-center">
                    {(!moderationStatus || (!moderationStatus.includes("Từ chối") && !moderationStatus.includes("Đạt"))) && (
                      <ActivityIndicator size="small" color="#D4AF37" style={{ marginRight: 6 }} />
                    )}
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
      <View className="flex-row mt-8" style={{ gap: 12 }}>
        <TouchableOpacity
          onPress={onBack}
          className="flex-1 h-12 bg-[#252830] border border-zinc-800 rounded-xl items-center justify-center flex-row"
        >
          <Feather name="arrow-left" size={16} color="white" style={{ marginRight: 6 }} />
          <Text className="text-white text-sm font-bold uppercase tracking-wider">Quay lại</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNext}
          disabled={!isSuccess || (mediaStatus !== "ACTIVE" && mediaStatus !== "HLS_READY")}
          className={`flex-1 h-12 rounded-xl items-center justify-center flex-row ${
            isSuccess && (mediaStatus === "ACTIVE" || mediaStatus === "HLS_READY")
              ? "bg-[#FF4E4E]"
              : "bg-zinc-800 opacity-50"
          }`}
        >
          <Text
            className={`text-sm font-bold uppercase tracking-wider ${
              isSuccess && (mediaStatus === "ACTIVE" || mediaStatus === "HLS_READY")
                ? "text-white"
                : "text-zinc-500"
            }`}
          >
            Tiếp Tục
          </Text>
          <Feather
            name="arrow-right"
            size={16}
            color={
              isSuccess && (mediaStatus === "ACTIVE" || mediaStatus === "HLS_READY")
                ? "white"
                : "#71717A"
            }
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
