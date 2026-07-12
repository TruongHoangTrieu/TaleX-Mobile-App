import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SeasonItem } from "@/services/creatorContent";

type SeasonStepProps = {
  seriesTitle?: string;
  seasonList: SeasonItem[];
  loadingSeasons: boolean;
  seasonMode: "select" | "create";
  setSeasonMode: (mode: "select" | "create") => void;
  selectedSeasonId: string;
  setSelectedSeasonId: (id: string) => void;
  newSeasonNumber: string;
  setNewSeasonNumber: (num: string) => void;
  newSeasonTitle: string;
  setNewSeasonTitle: (title: string) => void;
  newSeasonDesc: string;
  setNewSeasonDesc: (desc: string) => void;
  
  // Customization props
  subheading: string;
  listPlaceholder: string;
  onBack: () => void;
  onNext: () => void;
  editingSeasonId?: string | null;
  setEditingSeasonId?: (id: string | null) => void;
  onEditSeason?: (season: SeasonItem) => void;
  onDeleteSeason?: (seasonId: string) => void;
  onToggleHideSeason?: (season: SeasonItem) => void;
};

export default function SeasonStep({
  seriesTitle,
  seasonList,
  loadingSeasons,
  seasonMode,
  setSeasonMode,
  selectedSeasonId,
  setSelectedSeasonId,
  newSeasonNumber,
  setNewSeasonNumber,
  newSeasonTitle,
  setNewSeasonTitle,
  newSeasonDesc,
  setNewSeasonDesc,
  subheading,
  listPlaceholder,
  onBack,
  onNext,
  editingSeasonId,
  setEditingSeasonId,
  onEditSeason,
  onDeleteSeason,
  onToggleHideSeason,
}: SeasonStepProps) {
  return (
    <View>
      {seriesTitle ? (
        <View className="flex-row items-center mb-4 bg-zinc-900/50 p-3 rounded-xl">
          <Text className="text-[#D4AF37] text-xs font-black uppercase tracking-wider mr-2">Series:</Text>
          <Text className="text-white text-xs font-bold flex-1" numberOfLines={1}>
            {seriesTitle}
          </Text>
        </View>
      ) : null}

      <Text className="text-white text-base font-black mb-1">Bước 2: Chọn hoặc Tạo Season</Text>
      <Text className="text-zinc-500 text-xs mb-4">{subheading}</Text>

      {/* Mode Selectors */}
      <View className="flex-row bg-[#1E1E22] rounded-xl p-1 mb-5 border border-zinc-800">
        <TouchableOpacity
          onPress={() => {
            setSeasonMode("select");
            if (setEditingSeasonId) setEditingSeasonId(null);
          }}
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
            {editingSeasonId ? "Chỉnh sửa Season" : "Tạo Season Mới"}
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
          ) : seasonList.length === 0 ? (
            <View className="bg-[#1E1E22] border border-zinc-800 p-8 rounded-2xl items-center justify-center mb-3">
              <Feather name="info" size={24} color="#7C766B" />
              <Text className="text-zinc-500 text-xs font-semibold text-center mt-2 px-4 leading-5">
                {listPlaceholder}
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
                    <View className="flex-row items-center flex-wrap">
                      <Text className="text-white text-sm font-bold">Mùa {se.seasonNumber}</Text>
                      {se.status && (
                        <View 
                          className={`px-2 py-0.5 rounded-full ml-2 border ${
                            se.status === "PUBLISHED" 
                              ? "bg-green-500/10 border-green-500/30" 
                              : se.status === "HIDDEN"
                              ? "bg-amber-500/10 border-amber-500/30"
                              : "bg-zinc-500/10 border-zinc-500/30"
                          }`}
                        >
                          <Text 
                            className={`text-[8px] font-black uppercase ${
                              se.status === "PUBLISHED" ? "text-green-400" : se.status === "HIDDEN" ? "text-amber-400" : "text-zinc-400"
                            }`}
                          >
                            {se.status === "PUBLISHED" ? "Công khai" : se.status === "HIDDEN" ? "Bị ẩn" : se.status}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-zinc-500 text-xs mt-0.5">{se.title || "Không có tiêu đề riêng"}</Text>
                  </View>
                  <View className="flex-row items-center">
                    {onToggleHideSeason && (
                      <TouchableOpacity
                        onPress={() => onToggleHideSeason(se)}
                        className={`w-8 h-8 rounded-lg items-center justify-center mr-2 active:opacity-65 ${
                          se.status === "HIDDEN" ? "bg-green-500/10" : "bg-amber-500/10"
                        }`}
                      >
                        <Feather 
                          name={se.status === "HIDDEN" ? "eye" : "eye-off"} 
                          size={12} 
                          color={se.status === "HIDDEN" ? "#10B981" : "#F59E0B"} 
                        />
                      </TouchableOpacity>
                    )}
                    {onEditSeason && (
                      <TouchableOpacity
                        onPress={() => onEditSeason(se)}
                        className="w-8 h-8 rounded-lg bg-zinc-800 items-center justify-center mr-2 active:opacity-65"
                      >
                        <Feather name="edit-2" size={12} color="#D4AF37" />
                      </TouchableOpacity>
                    )}
                    {onDeleteSeason && (
                      <TouchableOpacity
                        onPress={() => onDeleteSeason(se.seasonId)}
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
          className="flex-1 h-12 bg-[#FF4E4E] rounded-xl items-center justify-center flex-row"
        >
          <Text className="text-white text-sm font-bold uppercase tracking-wider">Tiếp Tục</Text>
          <Feather name="arrow-right" size={16} color="white" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
