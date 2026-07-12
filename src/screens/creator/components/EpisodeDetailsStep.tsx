import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Feather, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";

type EpisodeDetailsStepProps = {
  seriesTitle: string;
  seasonTitle: string;
  episodeNumber: string;
  setEpisodeNumber: (num: string) => void;
  episodeTitle: string;
  setEpisodeTitle: (title: string) => void;
  episodeDesc: string;
  setEpisodeDesc: (desc: string) => void;
  releaseType: "free" | "premium" | "coin";
  setReleaseType: (type: "free" | "premium" | "coin") => void;
  coinPrice: string;
  setCoinPrice: (price: string) => void;

  // Customization
  contentType: "VIDEO" | "COMIC";
  heading: string;
  subheading: string;
  numberLabel: string;
  numberPlaceholder: string;
  titleLabel: string;
  titlePlaceholder: string;
  descLabel: string;
  descPlaceholder: string;
  coinLabel: string;
  coinSubLabel: string;
  
  onBack: () => void;
  onNext: () => void;
};

export default function EpisodeDetailsStep({
  seriesTitle,
  seasonTitle,
  episodeNumber,
  setEpisodeNumber,
  episodeTitle,
  setEpisodeTitle,
  episodeDesc,
  setEpisodeDesc,
  releaseType,
  setReleaseType,
  coinPrice,
  setCoinPrice,
  contentType,
  heading,
  subheading,
  numberLabel,
  numberPlaceholder,
  titleLabel,
  titlePlaceholder,
  descLabel,
  descPlaceholder,
  coinLabel,
  coinSubLabel,
  onBack,
  onNext,
}: EpisodeDetailsStepProps) {
  const seriesLabel = contentType === "VIDEO" ? "Bộ phim" : "Bộ truyện";

  return (
    <View>
      {seriesTitle || seasonTitle ? (
        <View className="bg-[#1E1E22] p-4 rounded-2xl border border-zinc-800 mb-6 space-y-2">
          {seriesTitle ? (
            <View className="flex-row">
              <Text className="text-zinc-500 text-xs font-bold w-20">{seriesLabel}:</Text>
              <Text className="text-white text-xs font-semibold flex-1">{seriesTitle}</Text>
            </View>
          ) : null}
          {seasonTitle ? (
            <View className="flex-row">
              <Text className="text-zinc-500 text-xs font-bold w-20">Season:</Text>
              <Text className="text-white text-xs font-semibold flex-1">{seasonTitle}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <Text className="text-white text-base font-black mb-1">{heading}</Text>
      <Text className="text-zinc-500 text-xs mb-5">{subheading}</Text>

      <View className="space-y-4">
        {/* Episode Number */}
        <View>
          <Text className="text-zinc-400 text-xs font-bold mb-1.5">{numberLabel}</Text>
          <TextInput
            placeholder={numberPlaceholder}
            placeholderTextColor="#7C766B"
            keyboardType="number-pad"
            value={episodeNumber}
            onChangeText={setEpisodeNumber}
            className="h-12 bg-[#1E1E22] border border-zinc-800 rounded-xl px-4 text-white text-sm font-semibold"
          />
        </View>

        {/* Episode Title */}
        <View>
          <Text className="text-zinc-400 text-xs font-bold mb-1.5">{titleLabel}</Text>
          <TextInput
            placeholder={titlePlaceholder}
            placeholderTextColor="#7C766B"
            value={episodeTitle}
            onChangeText={setEpisodeTitle}
            className="h-12 bg-[#1E1E22] border border-zinc-800 rounded-xl px-4 text-white text-sm font-semibold"
          />
        </View>

        {/* Episode Desc */}
        <View>
          <Text className="text-zinc-400 text-xs font-bold mb-1.5">{descLabel}</Text>
          <TextInput
            placeholder={descPlaceholder}
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
            {(["free", "coin"] as const).map((type) => {
              let label = "";
              let iconName: any = "";
              switch (type) {
                case "free":
                  label = "Miễn phí";
                  iconName = "eye-outline";
                  break;
                case "coin":
                  label = "Trả phí";
                  iconName = "cash";
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
            <Text className="text-[#D4AF37] text-xs font-bold mb-1.5">{coinLabel}</Text>
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
            <Text className="text-zinc-500 text-[10px] mt-1.5">{coinSubLabel}</Text>
          </View>
        )}
      </View>

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
          <Text className="text-white text-sm font-bold uppercase tracking-wider">
            {contentType === "VIDEO" ? "Tiếp Tục" : "Khởi Tạo"}
          </Text>
          <Feather name="arrow-right" size={16} color="white" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
