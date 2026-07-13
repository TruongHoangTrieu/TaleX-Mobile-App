import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

type PublishStepProps = {
  seriesTitle: string;
  seasonTitle: string;
  episodeNumber: string;
  episodeTitle: string;
  episodeDesc: string;
  releaseType: "free" | "premium" | "coin";
  coinPrice: string;
  contentType: "VIDEO" | "COMIC";
  comicPagesCount?: number; // Only for Comic
  publishing: boolean;
  onBack: () => void;
  onPublish: (scheduledPublishAt?: string) => void;
};

export default function PublishStep({
  seriesTitle,
  seasonTitle,
  episodeNumber,
  episodeTitle,
  episodeDesc,
  releaseType,
  coinPrice,
  contentType,
  comicPagesCount,
  publishing,
  onBack,
  onPublish,
}: PublishStepProps) {
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date>(() => new Date(Date.now() + 10 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handlePublishPress = () => {
    if (isScheduled) {
      if (scheduleDate.getTime() <= Date.now()) {
        Alert.alert("Lỗi thời gian", "Thời gian lên lịch phải ở trong tương lai.");
        return;
      }
      onPublish(scheduleDate.toISOString());
    } else {
      onPublish();
    }
  };

  const isVideo = contentType === "VIDEO";
  const seriesLabel = isVideo ? "Tên Bộ Phim / Series" : "Tên Bộ Truyện / Series";
  const episodeNumberLabel = isVideo ? `Tên tập phim (Tập ${episodeNumber})` : `Tên chương (Chương ${episodeNumber})`;
  const descLabel = isVideo ? "Mô tả tập phim" : "Mô tả chương truyện";
  const publishButtonLabel = isVideo ? "Xuất Bản Phim" : "Xuất Bản Truyện";
  const confirmText = isVideo
    ? "Xem lại toàn bộ thông tin tập phim của bạn trước khi nhấn nút xuất bản trực tuyến."
    : "Xem lại toàn bộ thông tin chương truyện của bạn trước khi nhấn nút xuất bản trực tuyến.";

  return (
    <View>
      <View className="bg-[#1E1E22] p-5 rounded-3xl border border-zinc-800 space-y-4 mb-6">
        <View className="border-b border-zinc-850 pb-3">
          <Text className="text-zinc-500 text-[10px] font-black uppercase">{seriesLabel}</Text>
          <Text className="text-white text-sm font-bold mt-1">{seriesTitle || "Chưa chọn"}</Text>
        </View>

        <View className="border-b border-zinc-850 pb-3">
          <Text className="text-zinc-500 text-[10px] font-black uppercase">Season</Text>
          <Text className="text-white text-sm font-bold mt-1">{seasonTitle || "Chưa chọn"}</Text>
        </View>

        <View className="border-b border-zinc-850 pb-3">
          <Text className="text-zinc-500 text-[10px] font-black uppercase">{episodeNumberLabel}</Text>
          <Text className="text-white text-sm font-bold mt-1">{episodeTitle || "Không có tiêu đề"}</Text>
        </View>

        {episodeDesc ? (
          <View className="border-b border-zinc-850 pb-3">
            <Text className="text-zinc-500 text-[10px] font-black uppercase">{descLabel}</Text>
            <Text className="text-[#A19E95] text-xs font-semibold mt-1 leading-5">{episodeDesc}</Text>
          </View>
        ) : null}

        <View className="border-b border-zinc-850 pb-3">
          <Text className="text-zinc-500 text-[10px] font-black uppercase">Chế độ phát hành</Text>
          <Text className="text-[#D4AF37] text-sm font-black uppercase mt-1">
            {releaseType === "free" ? "Miễn phí" : `Trả phí (${coinPrice} Xu)`}
          </Text>
        </View>

        {isVideo ? (
          <View className="pb-1">
            <Text className="text-zinc-500 text-[10px] font-black uppercase">Trạng thái tệp tin</Text>
            <View className="flex-row items-center mt-1.5">
              <View className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />
              <Text className="text-emerald-400 text-xs font-bold">Video đã sẵn sàng phát hành</Text>
            </View>
          </View>
        ) : (
          <View className="pb-1">
            <Text className="text-zinc-500 text-[10px] font-black uppercase">Số lượng trang ảnh</Text>
            <Text className="text-white text-sm font-bold mt-1">
              {comicPagesCount || 0} trang
            </Text>
          </View>
        )}
      </View>

      <Text className="text-white text-base font-black mb-1.5">Hình thức xuất bản</Text>
      <Text className="text-zinc-500 text-xs mb-4">Chọn thời gian công khai tác phẩm của bạn.</Text>

      {/* Mode selection buttons */}
      <View className="flex-row bg-[#1E1E22] rounded-xl p-1 mb-5 border border-zinc-800" style={{ gap: 4 }}>
        <TouchableOpacity
          onPress={() => setIsScheduled(false)}
          className={`flex-1 py-3 rounded-lg flex-row items-center justify-center ${!isScheduled ? "bg-[#D4AF37]" : ""}`}
        >
          <Feather name="zap" size={14} color={!isScheduled ? "#141210" : "#7C766B"} style={{ marginRight: 6 }} />
          <Text className={`text-xs font-bold ${!isScheduled ? "text-[#141210]" : "text-zinc-400"}`}>
            Xuất bản ngay
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setIsScheduled(true)}
          className={`flex-1 py-3 rounded-lg flex-row items-center justify-center ${isScheduled ? "bg-[#D4AF37]" : ""}`}
        >
          <Feather name="calendar" size={14} color={isScheduled ? "#141210" : "#7C766B"} style={{ marginRight: 6 }} />
          <Text className={`text-xs font-bold ${isScheduled ? "text-[#141210]" : "text-zinc-400"}`}>
            Lên lịch phát hành
          </Text>
        </TouchableOpacity>
      </View>

      {/* Schedule Picker Card */}
      {isScheduled && (
        <View className="bg-[#1E1E22] border border-zinc-800 p-4 rounded-2xl mb-6 space-y-3">
          <Text className="text-zinc-400 text-xs font-bold mb-1">Thời gian tự động xuất bản:</Text>
          <View className="space-y-3">
            {/* Date Button */}
            <TouchableOpacity
              onPress={() => {
                setShowDatePicker(!showDatePicker);
                setShowTimePicker(false);
              }}
              className="flex-row items-center justify-between p-3.5 bg-[#141416] border border-zinc-855 rounded-xl"
            >
              <View className="flex-row items-center">
                <Feather name="calendar" size={14} color="#D4AF37" style={{ marginRight: 8 }} />
                <Text className="text-white text-xs font-bold">
                  {scheduleDate.toLocaleDateString("vi-VN")}
                </Text>
              </View>
              <Feather name={showDatePicker ? "chevron-up" : "chevron-down"} size={12} color="#7C766B" />
            </TouchableOpacity>

            {showDatePicker && Platform.OS === "ios" && (
              <View className="bg-[#141416] border border-zinc-855 rounded-xl p-2 items-center">
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
              className="flex-row items-center justify-between p-3.5 bg-[#141416] border border-zinc-855 rounded-xl"
            >
              <View className="flex-row items-center">
                <Feather name="clock" size={14} color="#D4AF37" style={{ marginRight: 8 }} />
                <Text className="text-white text-xs font-bold">
                  {scheduleDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
              <Feather name={showTimePicker ? "chevron-up" : "chevron-down"} size={12} color="#7C766B" />
            </TouchableOpacity>

            {showTimePicker && Platform.OS === "ios" && (
              <View className="bg-[#141416] border border-zinc-855 rounded-xl p-2 items-center">
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
        </View>
      )}

      <Text className="text-white text-base font-black mb-1">Bước 5: Xác nhận & Xuất bản</Text>
      <Text className="text-zinc-500 text-xs mb-5">{confirmText}</Text>

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
          onPress={handlePublishPress}
          disabled={publishing}
          className="flex-1 h-12 bg-[#D4AF37] rounded-xl items-center justify-center flex-row"
        >
          {publishing ? (
            <ActivityIndicator size="small" color="#141210" />
          ) : (
            <>
              <Text className="text-[#141210] text-sm font-black uppercase tracking-wider">
                {isScheduled ? "Đặt lịch" : publishButtonLabel}
              </Text>
              <Feather name={isScheduled ? "clock" : "check-circle"} size={16} color="#141210" style={{ marginLeft: 6 }} />
            </>
          )}
        </TouchableOpacity>
      </View>

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
  );
}
