import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
  ImageBackground,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { resendOtp, verifyEmail } from "@/services/auth";

type OtpVerifyRouteParams = {
  email?: string;
  verificationToken?: string;
};

export default function OtpVerifyScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { email, verificationToken } = route.params as OtpVerifyRouteParams;
  const targetEmail = email || "email của bạn";

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(30); // Khởi tạo bằng 0
  const [errorMessage, setErrorMessage] = useState("");

  const inputRefs = useRef<TextInput[]>([]);

  // 1. Tự động focus vào ô đầu tiên và KÍCH HOẠT ĐẾM NGƯỢC 30s khi mới vào màn hình
  useEffect(() => {
    
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // 2. Bộ đếm thời gian (Hằng giây giảm đi 1)
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // ================= OTP CHANGE =================
  const handleOtpChange = (value: string, index: number) => {
    const clean = value.replace(/[^0-9]/g, "");
    if (!clean) return;

    const newOtp = [...otp];

    if (clean.length > 1) {
      const arr = clean.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) newOtp[i] = arr[i] || "";
      setOtp(newOtp);

      const next = Math.min(arr.length, 5);
      inputRefs.current[next]?.focus();
      return;
    }

    newOtp[index] = clean;
    setOtp(newOtp);

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Thay đổi ký tự (Backspace)
  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === "Backspace") {
      const newOtp = [...otp];

      if (otp[index]) {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // ================= XÁC THỰC OTP =================
  const handleVerify = async () => {
    const raw = otp.join("");
    const code = raw.replace(/\D/g, "");
    setErrorMessage("");

    if (!verificationToken) {
      setErrorMessage("Không có mã xác thực. Vui lòng thử lại đăng ký.");
      return;
    }

    if (code.length !== 6) {
      setErrorMessage("Vui lòng nhập đủ 6 số OTP");
      return;
    }

    setIsLoading(true);

    try {
      const res = await verifyEmail({
        verificationToken,
        otpCode: code,
      });

      setIsLoading(false);

      if (res && res.success) {
        Toast.show({ type: "success", text1: "Xác thực thành công" });
        navigation.navigate("MainTabs", { screen: "Home" });
      } else {
        setErrorMessage(res.message || "OTP không đúng hoặc hết hạn");
      }
    } catch (error) {
      setIsLoading(false);
      const message =
        error instanceof Error ? error.message : "OTP không đúng hoặc hết hạn";
      setErrorMessage(message);
    }
  };

  // ================= GỬI LẠI MÃ OTP =================
  const handleResend = async () => {
    if (!verificationToken) {
      setErrorMessage("Không có mã xác thực. Vui lòng thử lại đăng ký.");
      return;
    }

    if (countdown > 0) return;

    setErrorMessage("");
    setIsResending(true);

    try {
      const res = await resendOtp(verificationToken);
      setIsResending(false);
      
      if (res && res.success) {
        Toast.show({ type: "success", text1: "OTP đã được gửi lại" });
        setOtp(["", "", "", "", "", ""]);
        setCountdown(30); // Reset đồng hồ quay lại 30 giây
        
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 200);
      } else {
        setErrorMessage(res.message || "Không thể gửi lại OTP.");
      }
    } catch (error) {
      setIsResending(false);
      const message =
        error instanceof Error ? error.message : "Không thể gửi lại OTP.";
      setErrorMessage(message);
    }
  };

  return (
    <ImageBackground
      source={require("@assets/auth_bg.png")}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        {/* overlay tối */}
        <SafeAreaView edges={[]} className="flex-1 bg-black/60 px-6 justify-center">
          <StatusBar barStyle="light-content" />

          {/* NÚT BACK */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="absolute top-14 left-4 w-10 h-10 rounded-full bg-white/10 items-center justify-center"
          >
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>

          {/* CARD NỘI DUNG */}
          <View className="bg-white/5 border border-white/10 rounded-3xl p-6">
            {/* LOGO */}
            <View className="items-center mb-3">
              <Image
                source={require("@assets/icon.png")}
                style={{ width: 80, height: 80, resizeMode: "contain" }}
              />
            </View>

            {/* TIÊU ĐỀ */}
            <Text className="text-white text-2xl font-bold text-center">
              Xác Thực OTP
            </Text>

            <Text className="text-zinc-400 text-center mt-2">
              Nhập mã đã gửi tới email
            </Text>

            <Text className="text-[#D4AF37] text-center font-semibold mt-1">
              {targetEmail}
            </Text>

            {/* Ô NHẬP OTP */}
            <View className="flex-row justify-between mt-8">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el) => {
                    if (el) inputRefs.current[index] = el;
                  }}
                  className={`w-11 h-14 text-center text-xl font-bold rounded-xl border text-white ${
                    focusedIndex === index ? "border-[#D4AF37]" : "border-white/10"
                  }`}
                  keyboardType="number-pad"
                  maxLength={1}
                  value={digit}
                  onChangeText={(v) => handleOtpChange(v, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  onFocus={() => setFocusedIndex(index)}
                  onBlur={() => setFocusedIndex(null)}
                  cursorColor="#D4AF37"
                />
              ))}
            </View>

            {/* THÔNG BÁO LỖI */}
            {errorMessage ? (
              <View className="mt-4 items-center">
                <Text className="text-red-400 text-sm font-medium">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* NÚT XÁC MINH */}
            <TouchableOpacity
              onPress={handleVerify}
              className="mt-6 h-14 rounded-full overflow-hidden"
            >
              <LinearGradient
                colors={["#D4AF37", "#F5D76E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 999,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#0B0B0F" />
                ) : (
                  <Text className="text-black font-bold tracking-widest">
                    XÁC MINH NGAY
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* NÚT GỬI LẠI MÃ (ĐÃ FIX ĐỆM NGƯỢC & HIỆU ỨNG MỜ) */}
            <TouchableOpacity
              onPress={handleResend}
              disabled={isResending || countdown > 0}
              className={`mt-4 h-12 rounded-full items-center justify-center ${
                isResending || countdown > 0 ? "bg-white/5 opacity-50" : "bg-white/10"
              }`}
            >
              {isResending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : countdown > 0 ? (
                <Text className="text-zinc-400 font-semibold">
                  Gửi lại mã sau ({countdown}s)
                </Text>
              ) : (
                <Text className="text-white font-semibold">Gửi lại mã OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </ImageBackground>
  );
}
