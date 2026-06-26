import React, { useState } from "react";
import {
  View,
  Text,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/context/AuthContext";

interface Props {
  onLogin?: (email: string, password: string) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigation = useNavigation<any>();
  const auth = useAuth();

  // =========================
  // CLOSE LOGIN (BACK SAFE)
  // =========================
  const handleClose = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("MainTabs");
    }
  };

  // =========================
  // LOGIN ACTION
  // =========================
  const handleLogin = async () => {
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await auth.login(email, password);

      // 👉 QUAN TRỌNG: quay lại Profile (không reset)
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate("MainTabs");
      }
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "Tài khoản hoặc mật khẩu không chính xác!";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={[]} className="flex-1 bg-black">
      {/* BACKGROUND */}
      <ImageBackground
        source={require("@assets/auth_bg.png")}
        className="flex-1"
        resizeMode="cover"
      >
        {/* OVERLAY */}
        <View className="absolute inset-0 bg-black/55" />

        {/* ================= CLOSE BUTTON ================= */}
        <TouchableOpacity
          onPress={handleClose}
          className="absolute top-12 left-4 w-10 h-10 items-center justify-center z-50"
        >
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        {/* ================= CONTENT ================= */}
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
            Đăng nhập
          </Text>

          <Text className="text-zinc-300 text-[13px] text-center mt-2">
            Đăng nhập để tiếp tục trải nghiệm TaleX
          </Text>

          {/* EMAIL */}
          <View className="mt-6 bg-white/5 border border-white/10 rounded-xl px-4 h-[48px] justify-center">
            <TextInput
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              className="text-white text-[14px]"
            />
          </View>

          {/* PASSWORD */}
          <View className="mt-3 bg-white/5 border border-white/10 rounded-xl px-4 h-[48px] flex-row items-center justify-between">
            <TextInput
              placeholder="Mật khẩu"
              placeholderTextColor="#888"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              className="text-white text-[14px] flex-1"
            />

            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? "eye" : "eye-off"}
                size={18}
                color="#aaa"
              />
            </TouchableOpacity>
          </View>

          {/* ERROR */}
          {error ? (
            <Text className="text-red-500 text-[13px] mt-2 font-bold">
              {error}
            </Text>
          ) : null}

          {/* LOGIN BUTTON */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="mt-5 bg-yellow-500 h-[48px] rounded-lg items-center justify-center"
          >
            {loading ? (
              <ActivityIndicator color="#121212" />
            ) : (
              <Text className="text-black font-black text-[15px]">
                ĐĂNG NHẬP
              </Text>
            )}
          </TouchableOpacity>

          {/* FORGOT PASSWORD */}
          <TouchableOpacity className="mt-5 items-center">
            <Text className="text-red-400 font-bold text-[14px]">
              Quên mật khẩu
            </Text>
          </TouchableOpacity>

          {/* DIVIDER */}
          <View className="flex-row items-center mt-6">
            <View className="flex-1 h-[1px] bg-white/20" />
            <Text className="text-zinc-400 mx-3 text-[12px]">
              hoặc tiếp tục với
            </Text>
            <View className="flex-1 h-[1px] bg-white/20" />
          </View>

          {/* GOOGLE LOGIN */}
          <TouchableOpacity className="mt-5 h-[48px] bg-white rounded-lg flex-row items-center justify-center">
            <Image
              source={require("@assets/google.avif")}
              className="w-5 h-5"
            />
            <Text className="text-black font-bold ml-3">
              Đăng nhập bằng Google
            </Text>
          </TouchableOpacity>

          {/* TERMS */}
          <Text className="text-zinc-400 text-[12px] text-center mt-6">
            Bằng cách đăng nhập, bạn đồng ý với Điều khoản sử dụng và Chính sách
            riêng tư
          </Text>

          {/* REGISTER */}
          <TouchableOpacity
            className="mt-5 mb-10 items-center"
            onPress={() => navigation.navigate("RegisterScreen")}
          >
            <Text className="text-white font-bold text-[14px]">
              Chưa có tài khoản? Đăng ký
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
}
