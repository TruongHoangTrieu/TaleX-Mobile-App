import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { SeriesItem, CategoryResponse, TagResponse } from "@/services/creatorContent";

type SeriesStepProps = {
  seriesList: SeriesItem[];
  loadingSeries: boolean;
  seriesMode: "select" | "create";
  setSeriesMode: (mode: "select" | "create") => void;
  selectedSeriesId: string;
  setSelectedSeriesId: (id: string) => void;
  newSeriesTitle: string;
  setNewSeriesTitle: (title: string) => void;
  newSeriesDesc: string;
  setNewSeriesDesc: (desc: string) => void;
  categories: CategoryResponse[];
  tags: TagResponse[];
  selectedCategoryIds: string[];
  toggleCategory: (categoryId: string) => void;
  selectedTagIds: string[];
  toggleTag: (tagId: string) => void;
  seriesCover: {
    uri: string;
    name: string;
    size: number;
    type: string;
    isUrl?: boolean;
  } | null;
  handleSelectCover: () => void;

  seriesBanner?: {
    uri: string;
    name: string;
    size: number;
    type: string;
    isUrl?: boolean;
  } | null;
  handleSelectBanner?: () => void;

  ageRating?: string;
  setAgeRating?: (val: string) => void;
  language?: string;
  setLanguage?: (val: string) => void;
  visibility?: "PUBLIC" | "PRIVATE";
  setVisibility?: (val: "PUBLIC" | "PRIVATE") => void;

  // Customization props for differences between Movie and Comic
  subheading: string;
  listPlaceholder: string;
  coverLabel: string;
  coverSubLabel: string;
  coverImageStyle: string; // e.g. "h-20 aspect-[16/9]" or "h-28 aspect-[2/3]"
  descriptionPlaceholder: string;
  contentTypeIcon: any; // e.g. "folder-play-outline" or "book-open-outline"
  onNext: () => void;

  editingSeriesId?: string | null;
  setEditingSeriesId?: (id: string | null) => void;
  onEditSeries?: (series: SeriesItem) => void;
  onDeleteSeries?: (seriesId: string) => void;
};

export default function SeriesStep({
  seriesList,
  loadingSeries,
  seriesMode,
  setSeriesMode,
  selectedSeriesId,
  setSelectedSeriesId,
  newSeriesTitle,
  setNewSeriesTitle,
  newSeriesDesc,
  setNewSeriesDesc,
  categories,
  tags,
  selectedCategoryIds,
  toggleCategory,
  selectedTagIds,
  toggleTag,
  seriesCover,
  handleSelectCover,
  seriesBanner,
  handleSelectBanner,
  ageRating = "EVERYONE",
  setAgeRating,
  language = "vi",
  setLanguage,
  visibility = "PUBLIC",
  setVisibility,
  subheading,
  listPlaceholder,
  coverLabel,
  coverSubLabel,
  coverImageStyle,
  descriptionPlaceholder,
  contentTypeIcon,
  onNext,
  editingSeriesId,
  setEditingSeriesId,
  onEditSeries,
  onDeleteSeries,
}: SeriesStepProps) {
  return (
    <View>
      <Text className="text-white text-base font-black mb-1">Bước 1: Chọn hoặc Tạo Series</Text>
      <Text className="text-zinc-500 text-xs mb-4">{subheading}</Text>

      {/* Mode Selectors */}
      <View className="flex-row bg-[#1E1E22] rounded-xl p-1 mb-5 border border-zinc-800">
        <TouchableOpacity
          onPress={() => {
            setSeriesMode("select");
            if (setEditingSeriesId) setEditingSeriesId(null);
          }}
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
            {editingSeriesId ? "Chỉnh sửa Series" : "Tạo Series Mới"}
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
                {listPlaceholder}
              </Text>
            </View>
          ) : (
            seriesList.map((s) => {
              const isSelected = selectedSeriesId === s.seriesId;
              return (
                <TouchableOpacity
                  key={s.seriesId}
                  onPress={() => setSelectedSeriesId(s.seriesId)}
                  className={`flex-row items-center p-4 rounded-2xl border ${
                    isSelected ? "bg-[#FF4E4E]/10 border-[#FF4E4E]" : "bg-[#1E1E22] border-zinc-800"
                  } mb-3`}
                >
                  <View className="w-12 h-12 rounded-xl bg-zinc-800 items-center justify-center mr-4">
                    {s.coverUrl ? (
                      <Image source={{ uri: s.coverUrl }} className="w-full h-full rounded-xl" resizeMode="cover" />
                    ) : (
                      <MaterialCommunityIcons name={contentTypeIcon} size={24} color="#D4AF37" />
                    )}
                  </View>
                  <View className="flex-1 mr-2">
                    <Text className="text-white text-sm font-bold" numberOfLines={1}>{s.title}</Text>
                    <Text className="text-zinc-500 text-xs mt-0.5" numberOfLines={1}>
                      {s.description || "Không có mô tả"}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    {onEditSeries && (
                      <TouchableOpacity
                        onPress={() => onEditSeries(s)}
                        className="w-8 h-8 rounded-lg bg-zinc-800 items-center justify-center mr-2 active:opacity-65"
                      >
                        <Feather name="edit-2" size={12} color="#D4AF37" />
                      </TouchableOpacity>
                    )}
                    {onDeleteSeries && (
                      <TouchableOpacity
                        onPress={() => onDeleteSeries(s.seriesId)}
                        className="w-8 h-8 rounded-lg bg-red-500/10 items-center justify-center mr-2 active:opacity-65"
                      >
                        <Feather name="trash-2" size={12} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                    <View
                      className={`w-5 h-5 rounded-full border items-center justify-center ${
                        isSelected ? "border-[#FF4E4E] bg-[#FF4E4E]" : "border-zinc-600"
                      }`}
                    >
                      {isSelected && <Feather name="check" size={12} color="white" />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      ) : (
        <View>
          {/* Title */}
          <View className="mb-6">
            <Text className="text-zinc-400 text-xs font-bold mb-2">Tên Series mới *</Text>
            <TextInput
              placeholder="Nhập tên bộ phim / series..."
              placeholderTextColor="#7C766B"
              value={newSeriesTitle}
              onChangeText={setNewSeriesTitle}
              className="h-12 bg-[#1E1E22] border border-zinc-800 rounded-xl px-4 text-white text-sm font-semibold"
            />
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-zinc-400 text-xs font-bold mb-2">Mô tả Series</Text>
            <TextInput
              placeholder={descriptionPlaceholder}
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
          <View className="mb-6">
            <Text className="text-zinc-400 text-xs font-bold mb-2">Ảnh bìa Series ({coverLabel})</Text>
            {seriesCover ? (
              <View className="flex-row bg-[#1E1E22] border border-zinc-800 rounded-2xl p-3 items-center">
                <Image
                  source={{ uri: seriesCover.uri }}
                  className={`${coverImageStyle} rounded-xl bg-zinc-900`}
                  resizeMode="cover"
                />
                <View className="flex-1 ml-4">
                  <Text className="text-white text-sm font-bold" numberOfLines={1}>
                    {seriesCover.name}
                  </Text>
                  <Text className="text-zinc-500 text-xs mt-1">
                    Dung lượng: {(seriesCover.size / 1024).toFixed(0)} KB
                  </Text>
                  <Text className="text-zinc-500 text-xs">{coverSubLabel}</Text>
                  <TouchableOpacity
                    onPress={handleSelectCover}
                    className="mt-3 bg-zinc-850 px-3 py-1.5 rounded-lg self-start active:opacity-60"
                  >
                    <Text className="text-white text-[11px] font-bold">Thay đổi ảnh bìa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleSelectCover}
                className="w-full h-32 bg-[#1E1E22] border border-dashed border-zinc-700 rounded-2xl items-center justify-center flex-row px-6 overflow-hidden active:opacity-80"
              >
                <View className="w-12 h-12 rounded-full bg-[#FF4E4E]/10 items-center justify-center mr-4">
                  <Feather name="upload-cloud" size={24} color="#FF4E4E" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-xs font-bold">Chọn ảnh bìa từ thư viện</Text>
                  <Text className="text-zinc-500 text-[10px] mt-0.5">{coverSubLabel}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Banner Picker (Widescreen 16:9) */}
          {handleSelectBanner && (
            <View className="mb-6">
              <Text className="text-zinc-400 text-xs font-bold mb-2">Banner ngang Series (Khuyên dùng 16:9)</Text>
              {seriesBanner ? (
                <View className="flex-row bg-[#1E1E22] border border-zinc-800 rounded-2xl p-3 items-center">
                  <Image
                    source={{ uri: seriesBanner.uri }}
                    className="h-20 aspect-[16/9] rounded-xl bg-zinc-900"
                    resizeMode="cover"
                  />
                  <View className="flex-1 ml-4">
                    <Text className="text-white text-sm font-bold" numberOfLines={1}>
                      {seriesBanner.name}
                    </Text>
                    <Text className="text-zinc-500 text-xs mt-1">
                      Dung lượng: {(seriesBanner.size / 1024).toFixed(0)} KB
                    </Text>
                    <TouchableOpacity
                      onPress={handleSelectBanner}
                      className="mt-3 bg-zinc-850 px-3 py-1.5 rounded-lg self-start active:opacity-60"
                    >
                      <Text className="text-white text-[11px] font-bold">Thay đổi Banner</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handleSelectBanner}
                  className="w-full h-24 bg-[#1E1E22] border border-dashed border-zinc-700 rounded-2xl items-center justify-center flex-row px-6 overflow-hidden active:opacity-80"
                >
                  <View className="w-10 h-10 rounded-full bg-[#D4AF37]/10 items-center justify-center mr-4">
                    <Feather name="image" size={20} color="#D4AF37" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white text-xs font-bold">Tải Banner ngang 16:9 lên</Text>
                    <Text className="text-zinc-500 text-[10px] mt-0.5">Dùng hiển thị trên đầu trang Series</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Age Rating & Language */}
          <View className="mb-6 flex-row space-x-3">
            {/* Age Rating */}
            <View className="flex-1">
              <Text className="text-zinc-400 text-xs font-bold mb-2">Độ tuổi (Rating)</Text>
              <View className="flex-row bg-[#1E1E22] border border-zinc-800 rounded-xl p-1">
                {[
                  { key: "EVERYONE", label: "G (Tất cả)" },
                  { key: "TEEN", label: "13+" },
                  { key: "MATURE", label: "18+" },
                ].map((item) => {
                  const isSel = ageRating === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => setAgeRating && setAgeRating(item.key)}
                      className={`flex-1 py-2 items-center rounded-lg ${isSel ? "bg-[#FF4E4E]" : ""}`}
                    >
                      <Text className={`text-[10px] font-bold ${isSel ? "text-white" : "text-zinc-400"}`}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <View className="mb-6 flex-row space-x-3">
            {/* Language */}
            <View className="flex-1">
              <Text className="text-zinc-400 text-xs font-bold mb-2">Ngôn ngữ gốc</Text>
              <View className="flex-row bg-[#1E1E22] border border-zinc-800 rounded-xl p-1">
                {[
                  { key: "vi", label: "Tiếng Việt" },
                  { key: "en", label: "Tiếng Anh" },
                  { key: "jp", label: "Tiếng Nhật" },
                  { key: "kr", label: "Tiếng Hàn" },
                ].map((item) => {
                  const isSel = language === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => setLanguage && setLanguage(item.key)}
                      className={`flex-1 py-2 items-center rounded-lg ${isSel ? "bg-[#D4AF37]" : ""}`}
                    >
                      <Text className={`text-[10px] font-bold ${isSel ? "text-black" : "text-zinc-400"}`}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Visibility */}
          <View className="mb-6">
            <Text className="text-zinc-400 text-xs font-bold mb-2">Chế độ hiển thị</Text>
            <View className="flex-row bg-[#1E1E22] border border-zinc-800 rounded-xl p-1">
              {[
                { key: "PUBLIC", label: "Công khai (Public)", desc: "Mọi người đều có thể tìm thấy tác phẩm" },
                { key: "PRIVATE", label: "Riêng tư (Private)", desc: "Chỉ bạn mới xem được tác phẩm" },
              ].map((item) => {
                const isSel = visibility === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => setVisibility && setVisibility(item.key as any)}
                    className={`flex-1 py-2.5 items-center rounded-lg ${isSel ? "bg-zinc-800 border border-zinc-700" : ""}`}
                  >
                    <Text className={`text-xs font-bold ${isSel ? "text-white" : "text-zinc-400"}`}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Categories */}
          <View className="mb-6">
            <Text className="text-zinc-400 text-xs font-bold mb-2">Thể loại *</Text>
            <View className="flex-row flex-wrap">
              {categories.map((c) => {
                const isSelected = selectedCategoryIds.includes(c.categoryId);
                return (
                  <TouchableOpacity
                    key={c.categoryId}
                    onPress={() => toggleCategory(c.categoryId)}
                    className={`px-3 py-1.5 rounded-full mr-2 mb-2 border ${
                      isSelected ? "bg-[#D4AF37]/15 border-[#D4AF37]" : "bg-[#1E1E22] border-zinc-800"
                    }`}
                  >
                    <Text className={`text-xs font-bold ${isSelected ? "text-[#D4AF37]" : "text-zinc-500"}`}>
                      {c.categoryName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Tags */}
          <View className="mb-6">
            <Text className="text-zinc-400 text-xs font-bold mb-2">Thẻ Tag</Text>
            <View className="flex-row flex-wrap">
              {tags.map((t) => {
                const isSelected = selectedTagIds.includes(t.tagId);
                return (
                  <TouchableOpacity
                    key={t.tagId}
                    onPress={() => toggleTag(t.tagId)}
                    className={`px-3 py-1.5 rounded-full mr-2 mb-2 border ${
                      isSelected ? "bg-blue-500/10 border-blue-500/30" : "bg-[#1E1E22] border-zinc-800"
                    }`}
                  >
                    <Text className={`text-xs font-bold ${isSelected ? "text-blue-400" : "text-zinc-500"}`}>
                      #{t.tagName}
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
          onPress={onNext}
          className="h-12 bg-[#FF4E4E] rounded-xl items-center justify-center flex-row"
        >
          <Text className="text-white text-sm font-bold uppercase tracking-wider">
            {editingSeriesId ? "Lưu thay đổi" : "Tiếp Tục"}
          </Text>
          <Feather 
            name={editingSeriesId ? "check" : "arrow-right"} 
            size={16} 
            color="white" 
            style={{ marginLeft: 6 }} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
