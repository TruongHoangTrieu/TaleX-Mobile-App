import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, SimpleLineIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { changePassword } from "@/services/auth";
import { useAuth } from "@/context/AuthContext";

export default function ChangePasswordScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();

  // Đăng ký bằng Google (hasPassword = false) => Không cần nhập mật khẩu cũ
  const requiresCurrentPassword = user?.hasPassword !== false;

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (requiresCurrentPassword && !currentPassword.trim()) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập mật khẩu hiện tại.",
      });
      return;
    }

    if (!newPassword.trim()) {
      Toast.show({
        type: "error",
        text1: "Thiếu thông tin",
        text2: "Vui lòng nhập mật khẩu mới.",
      });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({
        type: "error",
        text1: "Mật khẩu yếu",
        text2: "Mật khẩu mới phải có tối thiểu 6 ký tự.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Mật khẩu không khớp",
        text2: "Mật khẩu mới và xác nhận mật khẩu không trùng khớp.",
      });
      return;
    }

    if (requiresCurrentPassword && currentPassword === newPassword) {
      Toast.show({
        type: "error",
        text1: "Trùng mật khẩu",
        text2: "Mật khẩu mới không được trùng với mật khẩu hiện tại.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword({
        currentPassword: requiresCurrentPassword ? currentPassword : undefined,
        newPassword,
        confirmPassword,
      });

      Toast.show({
        type: "success",
        text1: requiresCurrentPassword
          ? "Đổi mật khẩu thành công"
          : "Thiết lập mật khẩu thành công",
        text2: "Vui lòng đăng nhập lại bằng mật khẩu mới của bạn.",
      });

      // Tự động Đăng xuất tài khoản để bảo mật theo chuẩn an toàn
      await logout();

      // Reset luồng điều hướng về màn hình Đăng nhập
      navigation.reset({
        index: 0,
        routes: [{ name: "LoginScreen" }],
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Cập nhật thất bại",
        text2: err?.message || "Vui lòng kiểm tra lại thông tin.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#141210]" edges={["top", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#141210" />

      {/* Header */}
      <View className="h-14 flex-row items-center justify-between px-4 border-b border-white/5">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#262628]"
        >
          <Feather name="chevron-left" size={22} color="#E5E0D8" />
        </TouchableOpacity>

        <Text className="text-lg font-black text-white">
          {requiresCurrentPassword ? "Đổi Mật Khẩu" : "Thiết Lập Mật Khẩu"}
        </Text>

        <View className="w-10" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 24,
            flexGrow: 1,
          }}
        >
          <View className="max-w-md w-full self-center">
            {/* Header Icon Graphic */}
            <View className="items-center justify-center my-4">
              <View className="w-16 h-16 rounded-3xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 items-center justify-center shadow-lg">
                <SimpleLineIcons name="lock" size={28} color="#D4AF37" />
              </View>
              <Text className="text-white text-xl font-black mt-3 text-center">
                {requiresCurrentPassword ? "Đổi Mật Khẩu" : "Thiết Lập Mật Khẩu"}
              </Text>
              <Text className="text-zinc-400 text-xs text-center mt-1 px-4 leading-5">
                {requiresCurrentPassword
                  ? "Vui lòng nhập mật khẩu hiện tại và thiết lập mật khẩu mới để bảo mật tài khoản TaleX của bạn."
                  : "Tài khoản của bạn chưa tạo mật khẩu (đăng nhập qua Google). Vui lòng đặt mật khẩu mới để có thể sử dụng email đăng nhập."}
              </Text>
            </View>

            {/* Form Card Container */}
            <View className="bg-[#1C1A18] border border-white/10 rounded-3xl p-5 shadow-xl mt-2">
              {/* Current Password Input (Only for accounts with existing password) */}
              {requiresCurrentPassword && (
                <View className="mb-4">
                  <Text className="text-zinc-300 text-xs font-bold mb-2">
                    Mật khẩu hiện tại <Text className="text-red-500">*</Text>
                  </Text>
                  <View className="flex-row items-center h-12 px-3.5 bg-[#242220] border border-white/10 rounded-xl">
                    <SimpleLineIcons name="lock-open" size={15} color="#7C766B" />
                    <TextInput
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      secureTextEntry={!showCurrent}
                      placeholder="Nhập mật khẩu đang dùng"
                      placeholderTextColor="#52525B"
                      className="flex-1 ml-3 text-white text-sm font-medium"
                    />
                    <TouchableOpacity
                      onPress={() => setShowCurrent(!showCurrent)}
                      className="p-1.5"
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showCurrent ? "eye-off-outline" : "eye-outline"}
                        size={18}
                        color="#A19E95"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* New Password Input */}
              <View className="mb-4">
                <Text className="text-zinc-300 text-xs font-bold mb-2">
                  Mật khẩu mới <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row items-center h-12 px-3.5 bg-[#242220] border border-white/10 rounded-xl">
                  <SimpleLineIcons name="key" size={15} color="#7C766B" />
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNew}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    placeholderTextColor="#52525B"
                    className="flex-1 ml-3 text-white text-sm font-medium"
                  />
                  <TouchableOpacity
                    onPress={() => setShowNew(!showNew)}
                    className="p-1.5"
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showNew ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#A19E95"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm New Password Input */}
              <View className="mb-2">
                <Text className="text-zinc-300 text-xs font-bold mb-2">
                  Xác nhận mật khẩu mới <Text className="text-red-500">*</Text>
                </Text>
                <View className="flex-row items-center h-12 px-3.5 bg-[#242220] border border-white/10 rounded-xl">
                  <Ionicons name="checkmark-circle-outline" size={17} color="#7C766B" />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                    placeholder="Nhập lại mật khẩu mới"
                    placeholderTextColor="#52525B"
                    className="flex-1 ml-3 text-white text-sm font-medium"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirm(!showConfirm)}
                    className="p-1.5"
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showConfirm ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#A19E95"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Security Tip Box */}
            <View className="mt-4 p-3.5 rounded-2xl bg-[#1C1A18]/80 border border-white/5 flex-row items-center">
              <Ionicons name="shield-checkmark-outline" size={18} color="#10B981" />
              <Text className="text-zinc-400 text-xs ml-2 flex-1 leading-4 font-medium">
                Mật khẩu mới cần dài ít nhất 6 ký tự. Hãy sử dụng mật khẩu mạnh để bảo vệ tài khoản.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isSubmitting}
              onPress={handleSubmit}
              className={`mt-6 h-12 flex-row items-center justify-center rounded-2xl shadow-xl ${
                isSubmitting
                  ? "bg-[#262628]"
                  : "bg-[#D4AF37] border border-[#FFE58F] active:scale-98"
              }`}
            >
              {isSubmitting ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#D4AF37" />
                  <Text className="text-[#D4AF37] font-black text-xs uppercase tracking-wide">
                    Đang lưu thay đổi...
                  </Text>
                </View>
              ) : (
                <View className="flex-row items-center gap-2">
                  <SimpleLineIcons name="lock" size={14} color="#141210" />
                  <Text className="text-[#141210] font-black text-xs uppercase tracking-wider">
                    {requiresCurrentPassword ? "Lưu Mật Khẩu Mới" : "Thiết Lập Mật Khẩu"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
