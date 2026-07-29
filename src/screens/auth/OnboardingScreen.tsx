import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Alert,
  Dimensions,
  TextInput,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootNavigator";
import { useUserFeature } from "@/hooks/useUserFeature";
import {
  getPublicCategories,
  getPublicTags,
  PublicOption,
} from "@/services/userFeature";
import { OnboardingGender } from "@/types/userFeature";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 52) / 2;

const GENDER_OPTIONS: Array<{
  value: OnboardingGender;
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
}> = [
  { value: "MALE", label: "Nam", iconName: "male" },
  { value: "FEMALE", label: "Nữ", iconName: "female" },
  { value: "UNKNOWN", label: "Riêng tư", iconName: "shield-checkmark" },
];

const CATEGORY_ICONS: Array<keyof typeof MaterialCommunityIcons.glyphMap> = [
  "filmstrip",
  "book-open-page-variant",
  "sword-cross",
  "heart-flash",
  "ghost",
  "rocket-launch",
  "emoticon-happy-outline",
  "shield-star",
  "magnify-expand",
  "theater",
];

export default function OnboardingScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { saveProfile, profile } = useUserFeature();

  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Step 1: Gender & Age
  const [selectedGender, setSelectedGender] = useState<OnboardingGender>(
    profile?.gender || "MALE",
  );
  const [selectedAge, setSelectedAge] = useState<number>(profile?.age || 20);

  // Step 2: Categories
  const [categories, setCategories] = useState<PublicOption[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    profile?.onboardingGenres || [],
  );

  // Step 3: Tags
  const [tags, setTags] = useState<PublicOption[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState<boolean>(true);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    profile?.onboardingTags || [],
  );

  useEffect(() => {
    getPublicCategories()
      .then((res) => setCategories(res))
      .catch(() => {})
      .finally(() => setIsLoadingCategories(false));

    getPublicTags()
      .then((res) => setTags(res))
      .catch(() => {})
      .finally(() => setIsLoadingTags(false));
  }, []);

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleNextStep = () => {
    if (step < 3) {
      setStep((prev) => prev + 1);
    } else if (step === 3) {
      handleSubmit();
    } else {
      handleFinish();
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await saveProfile({
        gender: selectedGender,
        age: selectedAge,
        onboardingGenres: selectedCategoryIds,
        onboardingTags: selectedTagIds,
        onboardingMovieGenres: selectedCategoryIds,
        onboardingComicGenres: selectedCategoryIds,
      });

      setStep(4);
    } catch (err: any) {
      Alert.alert(
        "Lỗi",
        err.message || "Không thể lưu thông tin đặc điểm. Vui lòng thử lại!",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    Toast.show({
      type: "success",
      text1: "Đã cá nhân hoá bảng gợi ý!",
      text2: "TaleX sẵn sàng đề xuất nội dung chuẩn gu cho bạn.",
    });

    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace("MainTabs");
    }
  };

  const progressPercent = Math.min(100, (step / 3) * 100);

  return (
    <ImageBackground
      source={require("@assets/auth_bg.png")}
      className="flex-1"
      resizeMode="cover"
    >
      <View className="flex-1 bg-black/85">
        <SafeAreaView edges={["top", "bottom"]} className="flex-1">
          <StatusBar
            barStyle="light-content"
            backgroundColor="transparent"
            translucent
          />

          {/* Top Thin Glowing Progress Line Bar */}
          <View className="w-full h-[3px] bg-zinc-800/80 relative overflow-hidden">
            <View
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-[#D4AF37]"
            />
          </View>

          {/* Header Bar */}
          <View className="flex-row items-center justify-between px-5 py-3.5">
            {step < 4 ? (
              <TouchableOpacity
                onPress={handlePrevStep}
                className="w-10 h-10 rounded-2xl bg-[#161618]/90 border border-zinc-800 items-center justify-center"
              >
                <Feather name="arrow-left" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <View className="w-10 h-10" />
            )}

            <Text className="text-[#D4AF37] text-xs font-bold uppercase tracking-widest">
              {step <= 3 ? `Bước ${step} / 3` : "Hoàn Tất"}
            </Text>

            {step < 4 ? (
              <TouchableOpacity
                onPress={handleFinish}
                className="px-3.5 py-1.5 rounded-full bg-[#161618]/90 border border-zinc-800"
              >
                <Text className="text-zinc-400 text-xs font-medium">
                  Bỏ qua
                </Text>
              </TouchableOpacity>
            ) : (
              <View className="w-10 h-10" />
            )}
          </View>

          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 20,
              paddingBottom: 120,
              justifyContent: step === 4 ? "center" : "flex-start",
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* STEP 1: RELAXED, UN-TRUNCATED & SPACIOUS LAYOUT */}
            {step === 1 && (
              <View className="mt-4 space-y-10 pb-6">
                {/* Hero Sparkles Icon Badge */}
                <View className="items-center justify-center mb-1">
                  <View className="w-20 h-20 rounded-3xl bg-[#D4AF37]/15 items-center justify-center border border-[#D4AF37]/30 shadow-xl shadow-yellow-500/20">
                    <Ionicons name="sparkles" size={34} color="#D4AF37" />
                  </View>
                </View>

                {/* Header Title & Subtitle */}
                <View className="items-center text-center space-y-3 mb-2">
                  <Text className="text-white text-3xl font-black text-center tracking-wide leading-relaxed">
                    Cá Nhân Hóa Bảng Gợi Ý
                  </Text>
                  <Text className="text-zinc-300 text-sm font-medium text-center leading-7 max-w-xs px-2">
                    Hãy cung cấp thông tin cơ bản để TaleX kiến tạo nguồn cấp
                    nội dung phù hợp nhất
                  </Text>
                </View>

                {/* Section 1: Gender (Icon on top, full text on bottom to avoid truncation) */}
                <View className="space-y-4">
                  <Text className="text-[#D4AF37] font-extrabold text-sm uppercase tracking-widest mb-1">
                    1. Giới tính của bạn
                  </Text>
                  <View className="flex-row gap-5">
                    {GENDER_OPTIONS.map((item) => {
                      const isSelected = selectedGender === item.value;
                      return (
                        <TouchableOpacity
                          key={item.value}
                          onPress={() => setSelectedGender(item.value)}
                          activeOpacity={0.85}
                          style={{ height: 84 }}
                          className={`flex-1 rounded-2xl border flex-col items-center justify-center py-2.5 px-1 relative ${
                            isSelected
                              ? "border-[#D4AF37] bg-[#D4AF37]/15"
                              : "border-zinc-800 bg-[#161618]/90"
                          }`}
                        >
                          <Ionicons
                            name={item.iconName}
                            size={22}
                            color={isSelected ? "#D4AF37" : "#9CA3AF"}
                          />
                          <Text
                            className={`font-black text-xs mt-1.5 text-center ${
                              isSelected ? "text-[#D4AF37]" : "text-white"
                            }`}
                            numberOfLines={1}
                          >
                            {item.label}
                          </Text>

                          {isSelected && (
                            <Ionicons
                              name="checkmark-circle"
                              size={15}
                              color="#D4AF37"
                              style={{ position: "absolute", top: 6, right: 6 }}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Section 2: Age Stepper */}
                <View className="space-y-4 pt-6">
                  <Text className="text-[#D4AF37] font-extrabold text-sm uppercase tracking-widest mb-1">
                    2. Độ tuổi của bạn
                  </Text>

                  <View className="flex-row items-center justify-between py-6 w-full">
                    {/* Left Minus Column */}
                    <View className="flex-1 items-center justify-center">
                      <TouchableOpacity
                        onPress={() =>
                          setSelectedAge((prev) => Math.max(8, prev - 1))
                        }
                        activeOpacity={0.7}
                        className="w-13 h-13 rounded-2xl bg-[#161618]/90 items-center justify-center border border-zinc-800 active:bg-zinc-800"
                      >
                        <Feather name="minus" size={22} color="#D4AF37" />
                      </TouchableOpacity>
                    </View>

                    {/* Middle Age Input Column */}
                    <View className="flex-1 items-center justify-center">
                      <TextInput
                        keyboardType="number-pad"
                        value={selectedAge.toString()}
                        onChangeText={(val) => {
                          const num = parseInt(val, 10);
                          if (!isNaN(num))
                            setSelectedAge(Math.min(99, Math.max(1, num)));
                          else if (val === "") setSelectedAge(18);
                        }}
                        className="text-[#D4AF37] text-4xl font-black text-center w-full"
                        maxLength={2}
                      />
                      <Text className="text-zinc-400 text-xs font-black uppercase tracking-widest mt-1 text-center">
                        Tuổi
                      </Text>
                    </View>

                    {/* Right Plus Column */}
                    <View className="flex-1 items-center justify-center">
                      <TouchableOpacity
                        onPress={() =>
                          setSelectedAge((prev) => Math.min(99, prev + 1))
                        }
                        activeOpacity={0.7}
                        className="w-13 h-13 rounded-2xl bg-[#161618]/90 items-center justify-center border border-zinc-800 active:bg-zinc-800"
                      >
                        <Feather name="plus" size={22} color="#D4AF37" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* STEP 2: CATEGORIES UNIFORM GRID */}
            {step === 2 && (
              <View className="mt-4 space-y-6">
                <View className="items-center text-center space-y-3 mb-2">
                  <Text className="text-white text-3xl font-black text-center tracking-wide leading-relaxed">
                    Thể Loại Ưu Tiên
                  </Text>
                  <Text className="text-zinc-300 text-sm font-medium text-center leading-7">
                    Chọn ít nhất 3 thể loại để tối ưu hóa gợi ý nội dung
                  </Text>
                </View>

                {isLoadingCategories ? (
                  <View className="py-16 items-center">
                    <ActivityIndicator size="large" color="#D4AF37" />
                    <Text className="text-zinc-500 text-xs mt-3">
                      Đang tải thể loại...
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row flex-wrap justify-between gap-y-3.5">
                    {categories.map((cat, idx) => {
                      const isSelected = selectedCategoryIds.includes(cat.id);
                      const iconName =
                        CATEGORY_ICONS[idx % CATEGORY_ICONS.length];

                      return (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() => toggleCategory(cat.id)}
                          activeOpacity={0.85}
                          style={{ width: CARD_WIDTH, height: 96 }}
                          className={`p-3.5 rounded-2xl border flex-col justify-between relative ${
                            isSelected
                              ? "border-[#D4AF37] bg-[#D4AF37]/15"
                              : "border-zinc-800 bg-[#161618]/90"
                          }`}
                        >
                          <View className="flex-row justify-between items-center">
                            <View
                              className={`w-8 h-8 rounded-xl items-center justify-center ${
                                isSelected ? "bg-[#D4AF37]" : "bg-zinc-800/80"
                              }`}
                            >
                              <MaterialCommunityIcons
                                name={iconName}
                                size={16}
                                color={isSelected ? "#000000" : "#9CA3AF"}
                              />
                            </View>

                            {isSelected && (
                              <Ionicons
                                name="checkmark-circle"
                                size={20}
                                color="#D4AF37"
                              />
                            )}
                          </View>

                          <Text
                            className={`font-bold text-sm ${
                              isSelected ? "text-[#D4AF37]" : "text-white"
                            }`}
                            numberOfLines={1}
                          >
                            {cat.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* STEP 3: TAGS UNIFIED INLINE FLOWING ROW CLOUD */}
            {step === 3 && (
              <View className="mt-4 space-y-6">
                <View className="items-center text-center space-y-3 mb-2">
                  <Text className="text-white text-3xl font-black text-center tracking-wide leading-relaxed">
                    Chủ Đề Quan Tâm
                  </Text>
                  <Text className="text-zinc-300 text-sm font-medium text-center leading-7">
                    Chọn các từ khóa phù hợp với sở thích đọc & xem của bạn
                  </Text>
                </View>

                {isLoadingTags ? (
                  <View className="py-16 items-center">
                    <ActivityIndicator size="large" color="#D4AF37" />
                    <Text className="text-zinc-500 text-xs mt-3">
                      Đang tải chủ đề...
                    </Text>
                  </View>
                ) : (
                  <View className="flex-row flex-wrap gap-3 mt-2">
                    {tags.map((t) => {
                      const isSelected = selectedTagIds.includes(t.id);
                      return (
                        <TouchableOpacity
                          key={t.id}
                          onPress={() => toggleTag(t.id)}
                          activeOpacity={0.85}
                          className={`flex-row items-center px-4 py-3 rounded-2xl border ${
                            isSelected
                              ? "border-[#D4AF37] bg-[#D4AF37]/15"
                              : "border-zinc-800 bg-[#161618]/90"
                          }`}
                        >
                          <FontAwesome5
                            name="hashtag"
                            size={12}
                            color={isSelected ? "#D4AF37" : "#9CA3AF"}
                          />
                          <Text
                            numberOfLines={1}
                            style={{ includeFontPadding: false }}
                            className={`ml-2 text-sm font-extrabold ${
                              isSelected ? "text-[#D4AF37]" : "text-white"
                            }`}
                          >
                            {t.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* STEP 4: COMPLETION / CONGRATULATIONS */}
            {step === 4 && (
              <View className="items-center text-center space-y-5 py-4 w-full my-auto px-4">
                {/* Hero Thumbs-Up Icon */}
                <View className="w-24 h-24 rounded-full bg-[#D4AF37]/15 items-center justify-center border border-[#D4AF37]/30 my-2 shadow-xl shadow-yellow-500/20">
                  <View className="w-16 h-16 rounded-full bg-[#D4AF37] items-center justify-center shadow-lg shadow-yellow-500/50">
                    <Ionicons name="thumbs-up" size={32} color="#000000" />
                  </View>
                </View>

                {/* Header Title & Subtitle */}
                <View className="items-center space-y-3 px-2">
                  <Text className="text-white text-3xl font-black text-center tracking-wide">
                    Chúc Mừng!
                  </Text>
                  <Text className="text-zinc-300 text-sm font-medium text-center max-w-xs leading-6">
                    Cài đặt đặc điểm sở thích thành công. TaleX đã sẵn sàng gợi
                    ý những bộ phim và câu chuyện dành riêng cho bạn!
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Sticky Bottom Action Bar */}
          <View className="absolute bottom-0 left-0 right-0 p-5 bg-[#0F0F14]/95 border-t border-zinc-800/80 items-center">
            <TouchableOpacity
              onPress={handleNextStep}
              disabled={isSubmitting}
              activeOpacity={0.88}
              className="w-full"
            >
              <LinearGradient
                colors={["#E5A93C", "#D4AF37"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.pillButton}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text className="text-black font-black text-base tracking-wide">
                    {step === 3
                      ? "Hoàn tất"
                      : step === 4
                        ? "Khám phá ngay"
                        : "Tiếp tục"}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  pillButton: {
    height: 54, // Standard uniform button height
    borderRadius: 27, // Pixel-perfect pill shape
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
