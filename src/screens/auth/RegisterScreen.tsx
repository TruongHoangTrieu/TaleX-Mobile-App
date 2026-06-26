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
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { register } from "@/services/auth";

export default function RegisterScreen() {
  const navigation = useNavigation<any>();

  // ================= FORM STATE =================
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [dob, setDob] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleDateChange = (_: any, selectedDate?: Date) => {
    setShowPicker(false);

    if (selectedDate) {
      setDob(selectedDate);
    }
  };
  // ================= FORMAT DATE =================
  const formatDate = (date: Date) => {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  // ================= REGISTER =================
  const handleRegister = async () => {
    setError("");

    if (!fullName || !username || !email || !password) {
      setError("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }

    if (!dob) {
      setError("Vui lòng chọn ngày sinh!");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username,
        email,
        password,
        fullName,
        dateOfBirth: dob.toISOString().split("T")[0],
        phone,
      };

      const res = await register(payload);
      if (res && res.success) {
        Toast.show({
          type: "success",
          text1: "Đăng ký thành công",
          text2: res.message,
        });
        if (res.data) {
          Toast.show({
            type: "info",
            text1: "Mã xác thực đã được gửi",
            text2: "Vui lòng kiểm tra email hoặc SMS.",
          });
        }

        navigation.navigate("OtpVerify", {
          email,
          verificationToken: res.data,
        });
        return;
      }

      navigation.navigate("LoginScreen");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Đăng ký thất bại!";
      setError(message);
      Toast.show({ type: "error", text1: "Đăng ký thất bại", text2: message });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-black">
      <ImageBackground
        source={require("@assets/auth_bg.png")}
        className="flex-1"
        resizeMode="cover"
      >
        {/* OVERLAY */}
        <View className="absolute inset-0 bg-black/60" />

        {/* BACK BUTTON */}
        <TouchableOpacity
          onPress={handleBack}
          className="absolute top-12 left-4 w-10 h-10 items-center justify-center z-50"
        >
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        {/* CONTENT */}
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
          {/* TITLE */}
          <Text className="text-white text-[32px] font-black text-center">
            Đăng ký
          </Text>

          <Text className="text-zinc-400 text-center mt-2 text-[13px]">
            Tạo tài khoản để trải nghiệm TaleX
          </Text>

          {/* INPUTS */}
          <Input
            placeholder="Họ và tên"
            value={fullName}
            setValue={setFullName}
          />
          <Input
            placeholder="Username"
            value={username}
            setValue={setUsername}
          />
          <Input placeholder="Email" value={email} setValue={setEmail} />
          <Input
            placeholder="Số điện thoại"
            value={phone}
            setValue={setPhone}
          />

          {/* DOB */}
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            className="mt-3 bg-white/5 border border-white/10 rounded-xl px-4 h-[48px] justify-center"
          >
            <Text className="text-white text-[14px]">
              {dob ? formatDate(dob) : "Ngày sinh"}
            </Text>
          </TouchableOpacity>

          {/* PASSWORD */}
          <PasswordInput
            placeholder="Mật khẩu"
            value={password}
            setValue={setPassword}
            show={showPass}
            toggle={() => setShowPass(!showPass)}
          />

          <PasswordInput
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            setValue={setConfirmPassword}
            show={showConfirm}
            toggle={() => setShowConfirm(!showConfirm)}
          />

          {/* ERROR */}
          {!!error && (
            <Text className="text-red-500 text-[13px] mt-2 font-bold">
              {error}
            </Text>
          )}

          {/* BUTTON */}
          <TouchableOpacity
            onPress={handleRegister}
            className="mt-5 bg-yellow-500 h-[48px] rounded-lg items-center justify-center"
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-black font-black">ĐĂNG KÝ</Text>
            )}
          </TouchableOpacity>

          {/* LOGIN LINK */}
          <TouchableOpacity
            onPress={() => navigation.navigate("LoginScreen")}
            className="mt-6 items-center"
          >
            <Text className="text-white font-semibold">
              Đã có tài khoản? Đăng nhập
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* DATE PICKER (OUTSIDE SCROLLVIEW) */}
        {showPicker && (
          <View
            style={{
              backgroundColor: "#fff",
              alignItems: "center", // 👈 quan trọng
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
              style={{
                width: 320, // 👈 quan trọng (fix lệch trái)
              }}
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

/* ================= INPUT ================= */
function Input({ placeholder, value, setValue }: any) {
  return (
    <View className="mt-3 bg-white/5 border border-white/10 rounded-xl px-4 h-[48px] justify-center">
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={value}
        onChangeText={setValue}
        className="text-white text-[14px]"
      />
    </View>
  );
}

/* ================= PASSWORD INPUT ================= */
function PasswordInput({ placeholder, value, setValue, show, toggle }: any) {
  return (
    <View className="mt-3 bg-white/5 border border-white/10 rounded-xl px-4 h-[48px] flex-row items-center justify-between">
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#888"
        secureTextEntry={!show}
        value={value}
        onChangeText={setValue}
        className="text-white text-[14px] flex-1"
      />

      <TouchableOpacity onPress={toggle}>
        <Feather name={show ? "eye" : "eye-off"} size={18} color="#aaa" />
      </TouchableOpacity>
    </View>
  );
}
