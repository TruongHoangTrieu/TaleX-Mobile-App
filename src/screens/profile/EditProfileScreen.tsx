import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/services/auth";
import Toast from "react-native-toast-message";

const formatDateForApi = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (value?: string) => {
  const date = parseApiDate(value);
  if (!date) return "";

  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const year = `${date.getFullYear()}`;
  return `${day}/${month}/${year}`;
};

const parseApiDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default function EditProfileScreen({ navigation }: any) {
  const { user, refreshProfile } = useAuth();

  const [username, setUsername] = useState(user?.username || "");
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const email = user?.email || "N/A";
  const googleStatus = user?.googleLinked ? "Đã liên kết" : "Chưa liên kết";
  const displayDateOfBirth = formatDateForDisplay(dateOfBirth);
  const selectedDate = useMemo(
    () => parseApiDate(dateOfBirth) || new Date(2000, 0, 1),
    [dateOfBirth],
  );

  useEffect(() => {
    if (!user) return;

    setUsername(user.username || "");
    setFullName(user.fullName || "");
    setPhone(user.phone || "");
    setDateOfBirth(user.dateOfBirth || "");
    setAvatarUrl(user.avatarUrl || "");
  }, [user]);

  const handleSave = async () => {
    if (!username.trim()) {
      Toast.show({
        type: "info",
        text1: "Không tìm thấy tên tài khoản.",
      });
      return;
    }

    if (!fullName.trim()) {
      Toast.show({
        type: "info",
        text1: "Họ và tên không được để trống.",
      });
      return;
    }

    if (!dateOfBirth) {
      Toast.show({
        type: "info",
        text1: "Vui lòng chọn ngày sinh.",
      });
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        username: username.trim(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        dateOfBirth,
        avatarUrl: avatarUrl.trim(),
      });

      await refreshProfile();
      Toast.show({
        type: "success",
        text1: "Đã cập nhật thông tin hồ sơ!",
      });
      navigation.goBack();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể lưu thông tin lúc này.";
      Toast.show({
        type: "error",
        text1: message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <LinearGradient
      colors={["#0F0F0F", "#1A1A1A", "#0F0F0F"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        <StatusBar
          barStyle="light-content"
          translucent
          backgroundColor="transparent"
        />

        <View className="h-14 flex-row items-center justify-between px-4 bg-[#0F0F0F]">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              className="w-9 h-9 justify-center items-center active:opacity-70"
              onPress={() => navigation.goBack()}
            >
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-bold ml-3 tracking-wide">
              Hồ sơ cá nhân
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="min-w-[56px] h-9 items-center justify-center active:opacity-70"
          >
            {saving ? (
              <ActivityIndicator size="small" color="#D4AF37" />
            ) : (
              <Text className="text-[#D4AF37] text-[15px] font-black tracking-wide">
                LƯU
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 16,
            paddingTop: 28,
            paddingBottom: 40,
          }}
        >
          <View className="flex-1 justify-center">
            <View className="items-center justify-center w-full mb-9">
              <TouchableOpacity className="w-[88px] h-[88px] relative active:opacity-90">
                <View className="w-full h-full rounded-full overflow-hidden items-center justify-center border-2 border-yellow-500/50 bg-[#161618]">
                  <Image
                    source={
                      avatarUrl
                        ? { uri: avatarUrl }
                        : require("@assets/icon.png")
                    }
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
                <View className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#161618] border border-white/10 justify-center items-center">
                  <Feather name="camera" size={12} color="#D4AF37" />
                </View>
              </TouchableOpacity>

              <Text className="text-white text-base font-bold mt-3 tracking-wide">
                {username || "Người dùng"}
              </Text>
              <Text className="text-zinc-500 text-xs mt-1">{email}</Text>
            </View>

            <View className="w-full bg-[#161618]/40 border border-white/5 rounded-2xl overflow-hidden">
              <ProfileInputRow
                icon={<Feather name="user" size={16} color="#A19E95" />}
                label="Họ và tên"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nhập họ tên"
              />

              <ProfileInputRow
                icon={<Feather name="user-check" size={16} color="#A19E95" />}
                label="Tên tài khoản"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholder="Nhập username"
              />

              <ProfileTextRow
                icon={<Feather name="mail" size={16} color="#A19E95" />}
                label="Email"
                value={email}
                dimmed
              />

              <ProfileInputRow
                icon={<Feather name="phone" size={16} color="#A19E95" />}
                label="Số điện thoại"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="Chưa cập nhật"
              />

              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row min-h-[62px] items-center px-4 justify-between border-b border-zinc-800/40 active:bg-zinc-800/20"
              >
                <View className="flex-row items-center flex-1">
                  <View className="w-6 items-center justify-center mr-3">
                    <Feather name="calendar" size={16} color="#A19E95" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
                      Ngày sinh
                    </Text>
                    <Text className="text-stone-300 text-[14px] font-medium mt-1">
                      {displayDateOfBirth || "Chưa cập nhật"}
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color="#444446" />
              </TouchableOpacity>

              <ProfileInputRow
                icon={<Feather name="image" size={16} color="#A19E95" />}
                label="Avatar URL"
                value={avatarUrl}
                onChangeText={setAvatarUrl}
                autoCapitalize="none"
                keyboardType="url"
                placeholder="Nhập link ảnh đại diện"
              />

              <ProfileTextRow
                icon={<FontAwesome5 name="google" size={14} color="#D4AF37" />}
                label="Google"
                value={googleStatus}
                accent
                last
              />
            </View>
          </View>
        </ScrollView>

        {showDatePicker && (
          <View className="bg-white items-center justify-center py-2">
            <View className="w-[320px] items-center justify-center">
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                style={{ width: 320, alignSelf: "center" }}
                onChange={(_, date) => {
                  if (Platform.OS !== "ios") setShowDatePicker(false);
                  if (date) setDateOfBirth(formatDateForApi(date));
                }}
              />
            </View>

            {Platform.OS === "ios" && (
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                className="h-11 w-[320px] items-center justify-center"
              >
                <Text className="text-black font-bold">Xong</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

function ProfileInputRow({
  icon,
  label,
  dimmed,
  ...inputProps
}: React.ComponentProps<typeof TextInput> & {
  icon: React.ReactNode;
  label: string;
  dimmed?: boolean;
}) {
  return (
    <View
      className={`flex-row min-h-[62px] items-center px-4 justify-between border-b border-zinc-800/40 ${
        dimmed ? "opacity-50" : ""
      }`}
    >
      <View className="flex-row items-center flex-1">
        <View className="w-6 items-center justify-center mr-3">{icon}</View>
        <View className="flex-1">
          <Text className="text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
            {label}
          </Text>
          <TextInput
            {...inputProps}
            className="text-stone-300 text-[14px] font-medium p-0 m-0 mt-1"
            placeholderTextColor="#444446"
          />
        </View>
      </View>
    </View>
  );
}

function ProfileTextRow({
  icon,
  label,
  value,
  dimmed,
  accent,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dimmed?: boolean;
  accent?: boolean;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row min-h-[62px] items-center px-4 justify-between ${
        last ? "" : "border-b border-zinc-800/40"
      } ${dimmed ? "opacity-50" : ""}`}
    >
      <View className="flex-row items-center flex-1">
        <View className="w-6 items-center justify-center mr-3">{icon}</View>
        <View className="flex-1">
          <Text className="text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
            {label}
          </Text>
          <Text
            className={`text-[14px] mt-1 ${
              accent ? "text-[#D4AF37] font-black" : "text-stone-300 font-medium"
            }`}
            numberOfLines={1}
          >
            {value}
          </Text>
        </View>
      </View>
    </View>
  );
}
