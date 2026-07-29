import React, { useState } from "react";
import {
  View,
  Text,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { completeGoogleProfile } from "@/services/auth";
import { useAuth } from "@/context/AuthContext";

type RouteParams = {
  verificationToken: string;
};

export default function GoogleCompleteProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { verificationToken } = route.params as RouteParams;
  const { refreshProfile } = useAuth();

  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatDate = (date: Date) =>
    `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

  const handleDateChange = (_: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) setDob(selectedDate);
  };

  const handleSubmit = async () => {
    setError("");

    if (!phone) {
      setError("Vui lòng nhập số điện thoại!");
      return;
    }

    if (!dob) {
      setError("Vui lòng chọn ngày sinh!");
      return;
    }

    setLoading(true);

    try {
      const res = await completeGoogleProfile({
        verificationToken,
        phone,
        dateOfBirth: dob.toISOString().split("T")[0],
      });

      if (!res || !res.success) {
        throw new Error(res?.message || "Hoàn tất hồ sơ thất bại");
      }

      Toast.show({ type: "success", text1: "Đăng nhập thành công" });
      await refreshProfile();
      navigation.reset({
        index: 1,
        routes: [{ name: "MainTabs" }, { name: "OnboardingScreen" }],
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Hoàn tất hồ sơ thất bại!";
      setError(message);
      Toast.show({ type: "error", text1: "Có lỗi xảy ra", text2: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-black">
      <ImageBackground
        source={require("@assets/auth_bg.png")}
        className="flex-1"
        resizeMode="cover"
      >
        <View className="absolute inset-0 bg-black/60" />

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="absolute top-12 left-4 w-10 h-10 items-center justify-center z-50"
        >
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingVertical: 40,
            justifyContent: "center",
          }}
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-white text-[28px] font-black text-center">
            Hoàn tất hồ sơ
          </Text>

          <Text className="text-zinc-300 text-[13px] text-center mt-2">
            Vui lòng cung cấp thêm thông tin để hoàn tất đăng nhập Google
          </Text>

          <View className="mt-6 bg-white/5 border border-white/10 rounded-xl px-4 h-[48px] justify-center">
            <TextInput
              placeholder="Số điện thoại"
              placeholderTextColor="#888"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              className="text-white text-[14px]"
            />
          </View>

          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            className="mt-3 bg-white/5 border border-white/10 rounded-xl px-4 h-[48px] justify-center"
          >
            <Text className="text-white text-[14px]">
              {dob ? formatDate(dob) : "Ngày sinh"}
            </Text>
          </TouchableOpacity>

          {error ? (
            <Text className="text-red-500 text-[13px] mt-2 font-bold">
              {error}
            </Text>
          ) : null}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="mt-5 bg-yellow-500 h-[48px] rounded-lg items-center justify-center"
          >
            {loading ? (
              <ActivityIndicator color="#121212" />
            ) : (
              <Text className="text-black font-black text-[15px]">
                HOÀN TẤT
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        {showPicker && (
          <View
            style={{
              backgroundColor: "#fff",
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 10,
            }}
          >
            <DateTimePicker
              value={dob || new Date(2000, 0, 1)}
              mode="date"
              display="spinner"
              themeVariant="light"
              maximumDate={new Date()}
              style={{ width: 320 }}
              onChange={handleDateChange}
            />

            <TouchableOpacity
              onPress={() => setShowPicker(false)}
              style={{ padding: 12, alignItems: "center" }}
            >
              <Text style={{ fontWeight: "bold" }}>Xong</Text>
            </TouchableOpacity>
          </View>
        )}
      </ImageBackground>
    </SafeAreaView>
  );
}
