import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  ImageBackground,
  Keyboard,
  TouchableWithoutFeedback,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { forgotPassword, resetPassword, resendOtp } from "@/services/auth";

type Step = "request" | "reset";

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [verificationToken, setVerificationToken] = useState("");

  // Step 2 form states
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [countdown, setCountdown] = useState(30);

  const otpInputRefs = useRef<TextInput[]>([]);

  // 30-second countdown for resending OTP in step 2
  useEffect(() => {
    if (step !== "reset" || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [step, countdown]);

  // Focus first OTP box when entering Step 2
  useEffect(() => {
    if (step === "reset") {
      setCountdown(30);
      const timer = setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // ==========================================
  // STEP 1: REQUEST FORGOT PASSWORD (OTP)
  // ==========================================
  const handleRequestOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg("Vui lòng nhập email tài khoản.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg("Email không đúng định dạng.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await forgotPassword({ email: cleanEmail });
      setIsLoading(false);

      // Extract verification token
      let token = "";
      if (typeof res.data === "string") {
        token = res.data;
      } else if (res.data && typeof res.data === "object" && res.data.verificationToken) {
        token = res.data.verificationToken;
      }

      if (token) {
        setVerificationToken(token);
        setStep("reset");
        Toast.show({
          type: "success",
          text1: "Mã OTP đã được gửi tới email của bạn",
        });
      } else {
        setErrorMsg("Không tìm thấy phiên xác thực. Vui lòng thử lại.");
      }
    } catch (error) {
      setIsLoading(false);
      const msg =
        error instanceof Error
          ? error.message
          : "Không thể gửi mã xác thực. Vui lòng kiểm tra lại email.";
      setErrorMsg(msg);
    }
  };

  // ==========================================
  // STEP 2 OTP INPUT HANDLERS
  // ==========================================
  const handleOtpChange = (value: string, index: number) => {
    const clean = value.replace(/[^0-9]/g, "");
    if (!clean) return;

    const newOtp = [...otp];
    if (clean.length > 1) {
      const arr = clean.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) newOtp[i] = arr[i] || "";
      setOtp(newOtp);
      const next = Math.min(arr.length, 5);
      otpInputRefs.current[next]?.focus();
      return;
    }

    newOtp[index] = clean;
    setOtp(newOtp);
    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (
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
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  // ==========================================
  // STEP 2: RESEND OTP
  // ==========================================
  const handleResendOtp = async () => {
    if (!verificationToken) {
      setErrorMsg("Phiên khôi phục đã hết hạn. Vui lòng quay lại bước trước.");
      return;
    }
    if (countdown > 0) return;

    setErrorMsg("");
    setIsResending(true);

    try {
      const res = await resendOtp(verificationToken);
      setIsResending(false);

      if (res && res.success) {
        Toast.show({ type: "success", text1: "Mã OTP đã được gửi lại" });
        setOtp(["", "", "", "", "", ""]);
        setCountdown(30);
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 200);
      } else {
        setErrorMsg(res.message || "Không thể gửi lại OTP.");
      }
    } catch (error) {
      setIsResending(false);
      const msg =
        error instanceof Error ? error.message : "Không thể gửi lại OTP.";
      setErrorMsg(msg);
    }
  };

  // ==========================================
  // STEP 2: RESET PASSWORD
  // ==========================================
  const handleResetPassword = async () => {
    const otpCode = otp.join("").replace(/\D/g, "");
    setErrorMsg("");

    if (!verificationToken) {
      setErrorMsg("Phiên khôi phục đã hết hạn. Vui lòng thử lại.");
      return;
    }

    if (otpCode.length !== 6) {
      setErrorMsg("Mã OTP phải gồm đúng 6 chữ số.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await resetPassword({
        verificationToken,
        otpCode,
        newPassword,
        confirmPassword,
      });

      setIsLoading(false);

      if (res && res.success) {
        Toast.show({
          type: "success",
          text1: "Đặt lại mật khẩu thành công!",
          text2: "Vui lòng đăng nhập bằng mật khẩu mới.",
        });
        navigation.navigate("LoginScreen");
      } else {
        setErrorMsg(res.message || "Đặt lại mật khẩu thất bại.");
      }
    } catch (error) {
      setIsLoading(false);
      const msg =
        error instanceof Error
          ? error.message
          : "Đặt lại mật khẩu thất bại. Vui lòng thử lại.";
      setErrorMsg(msg);
    }
  };

  // Back Navigation Handler
  const handleBack = () => {
    if (step === "reset") {
      setStep("request");
      setErrorMsg("");
    } else {
      navigation.goBack();
    }
  };

  return (
    <ImageBackground
      source={require("@assets/auth_bg.png")}
      className="flex-1"
      resizeMode="cover"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView edges={[]} className="flex-1 bg-black/60">
          <StatusBar barStyle="light-content" />

          {/* BACK BUTTON */}
          <TouchableOpacity
            onPress={handleBack}
            className="absolute top-12 left-4 w-10 h-10 rounded-full bg-white/10 items-center justify-center z-50"
          >
            <Feather name="arrow-left" size={20} color="#fff" />
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
            {/* CONTAINER CARD */}
            <View className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl">
              {step === "request" ? (
                /* ==========================================
                   STEP 1: REQUEST EMAIL FORM
                   ========================================== */
                <>
                  <Text className="text-white text-[24px] font-black text-center">
                    Quên mật khẩu?
                  </Text>
                  <Text className="text-zinc-400 text-[13px] text-center mt-2 leading-relaxed">
                    Nhập email để TaleX gửi mã OTP khôi phục tài khoản.
                  </Text>

                  {/* EMAIL INPUT */}
                  <View className="mt-6 bg-white/5 border border-white/10 rounded-xl px-4 h-[50px] flex-row items-center">
                    <Feather name="mail" size={18} color="#888" />
                    <TextInput
                      placeholder="email@example.com"
                      placeholderTextColor="#666"
                      value={email}
                      onChangeText={(val) => {
                        setEmail(val);
                        if (errorMsg) setErrorMsg("");
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="text-white text-[14px] flex-1 ml-3"
                    />
                  </View>

                  {/* ERROR MESSAGE */}
                  {errorMsg ? (
                    <View className="mt-4 flex-row items-center bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <Feather name="alert-circle" size={16} color="#ef4444" />
                      <Text className="text-red-400 text-[13px] font-medium ml-2 flex-1">
                        {errorMsg}
                      </Text>
                    </View>
                  ) : null}

                  {/* SUBMIT BUTTON */}
                  <TouchableOpacity
                    onPress={handleRequestOtp}
                    disabled={isLoading}
                    className="mt-6 bg-yellow-500 h-[48px] rounded-xl items-center justify-center flex-row"
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#121212" />
                    ) : (
                      <>
                        <Text className="text-black font-black text-[15px] tracking-wider uppercase">
                          TIẾP TỤC
                        </Text>
                        <Feather
                          name="arrow-right"
                          size={18}
                          color="#000"
                          style={{ marginLeft: 6 }}
                        />
                      </>
                    )}
                  </TouchableOpacity>

                  {/* RETURN TO LOGIN */}
                  <TouchableOpacity
                    onPress={() => navigation.navigate("LoginScreen")}
                    className="mt-6 items-center"
                  >
                    <Text className="text-zinc-400 text-[13px]">
                      Đã nhớ mật khẩu?{" "}
                      <Text className="text-yellow-500 font-bold">
                        Đăng nhập
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* ==========================================
                   STEP 2: RESET PASSWORD FORM (OTP + NEW PASS)
                   ========================================== */
                <>
                  <Text className="text-white text-[24px] font-black text-center">
                    Đặt lại mật khẩu
                  </Text>
                  <Text className="text-zinc-400 text-[13px] text-center mt-2 leading-relaxed">
                    Nhập OTP đã gửi tới email và tạo mật khẩu mới.
                  </Text>

                  {/* TARGET EMAIL BADGE */}
                  <View className="mt-4 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex-row items-center justify-center">
                    <Feather name="mail" size={14} color="#D4AF37" />
                    <Text className="text-[#D4AF37] text-[13px] font-semibold ml-2">
                      {email}
                    </Text>
                  </View>

                  {/* 6-DIGIT OTP INPUTS */}
                  <Text className="text-zinc-400 text-[12px] font-medium mt-6 mb-2">
                    Mã OTP (6 chữ số)
                  </Text>
                  <View className="flex-row justify-between">
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(el) => {
                          if (el) otpInputRefs.current[index] = el;
                        }}
                        className={`w-11 h-13 text-center text-xl font-bold rounded-xl border text-white ${
                          focusedOtpIndex === index
                            ? "border-yellow-500 bg-white/10"
                            : "border-white/10 bg-white/5"
                        }`}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={digit}
                        onChangeText={(v) => handleOtpChange(v, index)}
                        onKeyPress={(e) => handleOtpKeyPress(e, index)}
                        onFocus={() => setFocusedOtpIndex(index)}
                        onBlur={() => setFocusedOtpIndex(null)}
                        cursorColor="#D4AF37"
                      />
                    ))}
                  </View>

                  {/* NEW PASSWORD INPUT */}
                  <Text className="text-zinc-400 text-[12px] font-medium mt-4 mb-1">
                    Mật khẩu mới
                  </Text>
                  <View className="bg-white/5 border border-white/10 rounded-xl px-4 h-[48px] flex-row items-center">
                    <Feather name="lock" size={16} color="#888" />
                    <TextInput
                      placeholder="Ít nhất 8 ký tự"
                      placeholderTextColor="#666"
                      secureTextEntry={!showNewPassword}
                      value={newPassword}
                      onChangeText={(val) => {
                        setNewPassword(val);
                        if (errorMsg) setErrorMsg("");
                      }}
                      className="text-white text-[14px] flex-1 ml-3"
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                    >
                      <Feather
                        name={showNewPassword ? "eye" : "eye-off"}
                        size={18}
                        color="#aaa"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* CONFIRM PASSWORD INPUT */}
                  <Text className="text-zinc-400 text-[12px] font-medium mt-3 mb-1">
                    Xác nhận mật khẩu mới
                  </Text>
                  <View className="bg-white/5 border border-white/10 rounded-xl px-4 h-[48px] flex-row items-center">
                    <Feather name="shield" size={16} color="#888" />
                    <TextInput
                      placeholder="Nhập lại mật khẩu mới"
                      placeholderTextColor="#666"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={(val) => {
                        setConfirmPassword(val);
                        if (errorMsg) setErrorMsg("");
                      }}
                      className="text-white text-[14px] flex-1 ml-3"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      <Feather
                        name={showConfirmPassword ? "eye" : "eye-off"}
                        size={18}
                        color="#aaa"
                      />
                    </TouchableOpacity>
                  </View>

                  {/* ERROR MESSAGE */}
                  {errorMsg ? (
                    <View className="mt-4 flex-row items-center bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <Feather name="alert-circle" size={16} color="#ef4444" />
                      <Text className="text-red-400 text-[13px] font-medium ml-2 flex-1">
                        {errorMsg}
                      </Text>
                    </View>
                  ) : null}

                  {/* RESET BUTTON */}
                  <TouchableOpacity
                    onPress={handleResetPassword}
                    disabled={isLoading}
                    className="mt-6 bg-yellow-500 h-[48px] rounded-xl items-center justify-center flex-row"
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#121212" />
                    ) : (
                      <>
                        <Text className="text-black font-black text-[15px] tracking-wider uppercase">
                          XÁC NHẬN
                        </Text>
                        <Feather
                          name="check-circle"
                          size={18}
                          color="#000"
                          style={{ marginLeft: 6 }}
                        />
                      </>
                    )}
                  </TouchableOpacity>

                  {/* RESEND OTP BUTTON */}
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    disabled={isResending || countdown > 0}
                    className={`mt-4 h-[44px] rounded-xl items-center justify-center ${
                      isResending || countdown > 0
                        ? "bg-white/5 opacity-50"
                        : "bg-white/10"
                    }`}
                  >
                    {isResending ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : countdown > 0 ? (
                      <Text className="text-zinc-400 text-[13px] font-medium">
                        Gửi lại mã OTP sau ({countdown}s)
                      </Text>
                    ) : (
                      <Text className="text-white text-[13px] font-semibold">
                        Gửi lại mã OTP
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </ImageBackground>
  );
}
