import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  PanResponder,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

type LocalComicPage = {
  id: string;
  uri: string;
  name: string;
  size: number;
  type: string;
  width: number;
  height: number;
};

type ComicPagesUploadStepProps = {
  seriesTitle: string;
  seasonTitle: string;
  episodeNumber: string;
  episodeTitle: string;
  releaseType: "free" | "premium" | "coin";
  coinPrice: string;

  comicPages: LocalComicPage[];
  handleSelectPages: () => void;
  handleDeletePage: (id: string) => void;
  handleMovePageUp?: (index: number) => void;
  handleMovePageDown?: (index: number) => void;

  episodeThumbnail?: { uri: string; name: string; size: number; type: string } | null;
  handleSelectThumbnail?: () => void;

  handleStartUpload: () => void;
  uploading: boolean;
  submitMsg: string;
  isSuccess: boolean;

  moderationStatus: string | null;
  isModerationDone: boolean;

  onBack: () => void;
  onNext: () => void;
};

// Component hàng trang truyện hỗ trợ cả Drag & Drop (kéo thả) lẫn nút mũi tên
function DraggablePageItem({
  page,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  page: LocalComicPage;
  index: number;
  total: number;
  onMoveUp?: (idx: number) => void;
  onMoveDown?: (idx: number) => void;
  onDelete: (id: string) => void;
}) {
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        const { dy } = gestureState;
        if (dy > 35 && index < total - 1 && onMoveDown) {
          onMoveDown(index);
          gestureState.dy = 0;
        } else if (dy < -35 && index > 0 && onMoveUp) {
          onMoveUp(index);
          gestureState.dy = 0;
        }
      },
    }),
  ).current;

  return (
    <View className="flex-row items-center justify-between py-2 border-b border-zinc-900/50">
      {/* Drag handle button */}
      <View
        {...panResponder.panHandlers}
        className="w-8 h-10 items-center justify-center bg-zinc-800/80 rounded-lg mr-2 active:bg-[#D4AF37]/30"
      >
        <MaterialCommunityIcons name="drag-vertical" size={20} color="#D4AF37" />
      </View>

      <View className="flex-row items-center flex-1 mr-2">
        <Image
          source={{ uri: page.uri }}
          className="w-12 h-16 rounded-md mr-3 bg-zinc-900"
          resizeMode="cover"
        />
        <View className="flex-1">
          <Text className="text-white text-xs font-bold" numberOfLines={1}>
            Trang {index + 1}
          </Text>
          <Text className="text-zinc-500 text-[10px]" numberOfLines={1}>
            {page.name}
          </Text>
          <Text className="text-zinc-500 text-[10px]">
            {(page.size / 1024).toFixed(0)} KB
          </Text>
        </View>
      </View>

      <View className="flex-row items-center space-x-1">
        {/* Up arrow */}
        {onMoveUp && index > 0 && (
          <TouchableOpacity
            onPress={() => onMoveUp(index)}
            className="w-7 h-7 bg-zinc-800 rounded-lg items-center justify-center mr-1"
          >
            <Feather name="arrow-up" size={14} color="white" />
          </TouchableOpacity>
        )}
        {/* Down arrow */}
        {onMoveDown && index < total - 1 && (
          <TouchableOpacity
            onPress={() => onMoveDown(index)}
            className="w-7 h-7 bg-zinc-800 rounded-lg items-center justify-center mr-1"
          >
            <Feather name="arrow-down" size={14} color="white" />
          </TouchableOpacity>
        )}
        {/* Delete button */}
        <TouchableOpacity
          onPress={() => onDelete(page.id)}
          className="p-1.5 active:opacity-60"
        >
          <Feather name="trash-2" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ComicPagesUploadStep({
  seriesTitle,
  seasonTitle,
  episodeNumber,
  episodeTitle,
  releaseType,
  coinPrice,
  comicPages,
  handleSelectPages,
  handleDeletePage,
  handleMovePageUp,
  handleMovePageDown,
  episodeThumbnail,
  handleSelectThumbnail,
  handleStartUpload,
  uploading,
  submitMsg,
  isSuccess,
  moderationStatus,
  isModerationDone,
  onBack,
  onNext,
}: ComicPagesUploadStepProps) {
  return (
    <View>
      {/* Episode Brief */}
      <View className="bg-[#1E1E22] border border-zinc-800 rounded-3xl p-4 mb-5 space-y-2">
        <Text className="text-[#D4AF37] text-xs font-black uppercase">
          ĐÃ KHỞI TẠO TẬP TRUYỆN THÀNH CÔNG:
        </Text>
        <View className="flex-row">
          <Text className="text-zinc-500 text-xs font-bold w-20">Vị trí:</Text>
          <Text className="text-white text-xs font-semibold flex-1">
            {seasonTitle} • Tập {episodeNumber}
          </Text>
        </View>
        <View className="flex-row">
          <Text className="text-zinc-500 text-xs font-bold w-20">Tên tập:</Text>
          <Text className="text-white text-xs font-semibold flex-1">
            {episodeTitle}
          </Text>
        </View>
        <View className="flex-row">
          <Text className="text-zinc-500 text-xs font-bold w-20">Chế độ xem:</Text>
          <Text className="text-[#D4AF37] text-xs font-black uppercase flex-1">
            {releaseType === "free" ? "Miễn phí" : `Trả phí (${coinPrice} Xu)`}
          </Text>
        </View>
      </View>

      {/* Episode Thumbnail Section */}
      {handleSelectThumbnail && (
        <View className="bg-[#1E1E22] border border-zinc-800 rounded-3xl p-4 mb-5">
          <Text className="text-zinc-400 text-xs font-bold mb-2">
            Ảnh đại diện tập truyện (Thumbnail)
          </Text>
          {episodeThumbnail ? (
            <View className="flex-row items-center">
              <Image
                source={{ uri: episodeThumbnail.uri }}
                className="w-16 h-20 rounded-xl bg-zinc-900 mr-3"
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
              <Text className="text-white text-xs font-bold">Tải ảnh đại diện tập lên</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Text className="text-white text-base font-black mb-1">
        Bước 4: Tải lên các trang truyện
      </Text>
      <Text className="text-zinc-500 text-xs mb-5">
        Chọn các trang ảnh truyện từ thư viện để tải lên và di chuyển thứ tự hiển thị.
      </Text>

      {comicPages.length === 0 ? (
        <TouchableOpacity
          onPress={handleSelectPages}
          className="border-2 border-dashed border-zinc-700 bg-[#1E1E22] rounded-3xl p-10 items-center justify-center min-h-[200px] mb-5"
        >
          <View className="w-16 h-16 rounded-full bg-[#FF4E4E]/10 items-center justify-center mb-4">
            <Feather name="image" size={32} color="#FF4E4E" />
          </View>
          <Text className="text-white text-sm font-bold text-center">
            Bấm vào đây để chọn các trang truyện
          </Text>
          <Text className="text-zinc-500 text-xs text-center mt-1.5">
            Hỗ trợ chọn nhiều ảnh cùng lúc
          </Text>
        </TouchableOpacity>
      ) : (
        <View className="space-y-4 mb-5">
          {/* Pages List */}
          <View className="bg-[#1E1E22] border border-zinc-800 rounded-3xl p-4">
            <View className="flex-row items-center justify-between border-b border-zinc-800 pb-3 mb-3">
              <Text className="text-white text-xs font-bold">
                Danh sách trang ({comicPages.length})
              </Text>
              <TouchableOpacity
                onPress={handleSelectPages}
                className="flex-row items-center bg-zinc-800 px-3 py-1.5 rounded-lg active:opacity-60"
              >
                <Feather name="plus" size={14} color="white" />
                <Text className="text-white text-[10px] font-bold ml-1">
                  Thêm trang
                </Text>
              </TouchableOpacity>
            </View>

            <View className="border-b border-zinc-900 pb-2 mb-2 flex-row items-center">
              <MaterialCommunityIcons name="drag-vertical" size={14} color="#D4AF37" style={{ marginRight: 4 }} />
              <Text className="text-[#D4AF37]/90 text-[10px] font-semibold">
                Giữ biểu tượng vàng để kéo thả thứ tự hoặc dùng các nút ▲ ▼.
              </Text>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {comicPages.map((page, index) => (
                <DraggablePageItem
                  key={page.id}
                  page={page}
                  index={index}
                  total={comicPages.length}
                  onMoveUp={handleMovePageUp}
                  onMoveDown={handleMovePageDown}
                  onDelete={handleDeletePage}
                />
              ))}
            </ScrollView>
          </View>

          {/* Upload action or success indicator */}
          {uploading ? (
            <View className="bg-[#1E1E22] border border-[#D4AF37]/30 rounded-2xl p-4 items-center">
              <ActivityIndicator size="small" color="#D4AF37" />
              <Text className="text-stone-300 text-xs font-medium mt-2">
                {submitMsg}
              </Text>
            </View>
          ) : isSuccess ? (
            <View className="space-y-3">
              <View className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl p-4 flex-row items-center">
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="#10B981"
                />
                <View className="ml-3 flex-1">
                  <Text className="text-[#10B981] text-sm font-bold">
                    Tải lên hoàn tất!
                  </Text>
                  <Text className="text-emerald-500/80 text-[10px] mt-0.5">
                    Đã lưu {comicPages.length} trang truyện vào tập mới của bạn.
                  </Text>
                </View>
              </View>

              {/* AI Moderation Progress Panel */}
              <View className="bg-[#1E1E22] border border-zinc-800 rounded-2xl p-4">
                <Text className="text-[#D4AF37] text-xs font-bold mb-2">
                  TIẾN TRÌNH KIỂM DUYỆT ẢNH AI:
                </Text>
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-zinc-400 text-xs font-semibold">
                    Trạng thái:
                  </Text>
                  <View className="flex-row items-center">
                    {(!moderationStatus || (!moderationStatus.includes("Từ chối") && !moderationStatus.includes("Đạt"))) && (
                      <ActivityIndicator size="small" color="#D4AF37" style={{ marginRight: 6 }} />
                    )}
                    <Text
                      className={`text-xs font-bold ${
                        moderationStatus?.includes("Từ chối")
                          ? "text-red-500"
                          : moderationStatus?.includes("Đạt")
                            ? "text-green-400"
                            : "text-amber-400"
                      }`}
                    >
                      {moderationStatus || "Đang kết nối..."}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleStartUpload}
              className="h-12 bg-zinc-800 rounded-xl items-center justify-center flex-row"
            >
              <Feather
                name="upload"
                size={16}
                color="white"
                style={{ marginRight: 6 }}
              />
              <Text className="text-white text-xs font-bold">
                Bắt Đầu Tải Lên Hệ Thống
              </Text>
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
          <Feather
            name="arrow-left"
            size={16}
            color="white"
            style={{ marginRight: 6 }}
          />
          <Text className="text-white text-sm font-bold uppercase tracking-wider">
            Quay lại
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onNext}
          disabled={!isSuccess || !isModerationDone}
          className={`flex-1 h-12 rounded-xl items-center justify-center flex-row ${
            isSuccess && isModerationDone
              ? "bg-[#FF4E4E]"
              : "bg-zinc-800 opacity-50"
          }`}
        >
          <Text
            className={`text-sm font-bold uppercase tracking-wider ${
              isSuccess && isModerationDone
                ? "text-white"
                : "text-zinc-500"
            }`}
          >
            Tiếp Tục
          </Text>
          <Feather
            name="arrow-right"
            size={16}
            color={isSuccess && isModerationDone ? "white" : "#71717A"}
            style={{ marginLeft: 6 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
