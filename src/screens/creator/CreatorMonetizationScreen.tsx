import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  acceptTerms,
  createPaymentProfile,
  getActiveMonetizationTerm,
  getVerificationStatus,
  submitVerification,
  updatePaymentProfile,
  updateTaxIdentity,
  type MonetizationTermVersionDto,
  type PaymentProfileRequestDto,
  type VerificationStatusDto,
} from "@/services/creatorMonetization";

type StepStatusTone = {
  bg: string;
  border: string;
  text: string;
};

type TimelineStepProps = {
  index: number;
  title: string;
  description: string;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  completed: boolean;
  disabled?: boolean;
  badgeLabel?: string;
  badgeTone?: StepStatusTone;
  metaText?: string;
  primaryLabel?: string;
  onPrimaryPress?: () => void;
};

const GOLD = "#D4AF37";
const CARD = "#1E1E22";
const DISABLED = "#3F3F46";

const completedTone: StepStatusTone = {
  bg: "rgba(16, 185, 129, 0.12)",
  border: "rgba(16, 185, 129, 0.28)",
  text: "#34D399",
};

const statusTones: Record<string, StepStatusTone> = {
  APPROVED: completedTone,
  ACTIVE: completedTone,
  COMPLETED: completedTone,
  PENDING: {
    bg: "rgba(212, 175, 55, 0.12)",
    border: "rgba(212, 175, 55, 0.28)",
    text: GOLD,
  },
  PENDING_REVIEW: {
    bg: "rgba(212, 175, 55, 0.12)",
    border: "rgba(212, 175, 55, 0.28)",
    text: GOLD,
  },
  REJECTED: {
    bg: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.28)",
    text: "#F87171",
  },
  SUSPENDED: {
    bg: "rgba(239, 68, 68, 0.12)",
    border: "rgba(239, 68, 68, 0.28)",
    text: "#F87171",
  },
};

function getStatusTone(status?: string | number | null): StepStatusTone {
  const normalized = String(status || "").toUpperCase();
  return (
    statusTones[normalized] || {
      bg: "rgba(63, 63, 70, 0.42)",
      border: "rgba(113, 113, 122, 0.28)",
      text: "#D4D4D8",
    }
  );
}

function formatDate(value?: string) {
  if (!value) return undefined;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return `Cập nhật ${date.toLocaleDateString("vi-VN")}`;
}

function readStringField(source: VerificationStatusDto | null, key: string) {
  const value = source?.[key];
  return typeof value === "string" ? value : "";
}

function readBooleanField(source: VerificationStatusDto | null, key: string) {
  const value = source?.[key];
  return typeof value === "boolean" ? value : false;
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: StepStatusTone;
}) {
  return (
    <View
      className="self-start rounded-full border px-3 py-1"
      style={{ backgroundColor: tone.bg, borderColor: tone.border }}
    >
      <Text className="text-[10px] font-black uppercase" style={{ color: tone.text }}>
        {label}
      </Text>
    </View>
  );
}

function CheckRow({
  checked,
  disabled,
  label,
  onPress,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={disabled}
      onPress={onPress}
      className="flex-row items-start"
    >
      <View
        className="mr-3 h-6 w-6 items-center justify-center rounded-md border"
        style={{
          backgroundColor: checked ? GOLD : "transparent",
          borderColor: checked ? GOLD : "#71717A",
        }}
      >
        {checked && <Feather name="check" size={15} color="#141210" />}
      </View>
      <Text className="flex-1 text-sm font-semibold leading-5 text-zinc-300">
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function TimelineStep({
  index,
  title,
  description,
  iconName,
  completed,
  disabled = false,
  badgeLabel,
  badgeTone,
  metaText,
  primaryLabel,
  onPrimaryPress,
}: TimelineStepProps) {
  return (
    <View className="relative mb-6 pl-6">
      <View
        className="absolute h-6 w-6 items-center justify-center rounded-full border-2"
        style={{
          left: -13,
          top: 22,
          backgroundColor: completed ? GOLD : "#27272A",
          borderColor: completed ? GOLD : DISABLED,
        }}
      >
        {completed ? (
          <Feather name="check" size={13} color="#141210" />
        ) : (
          <Text className="text-[10px] font-black text-zinc-400">{index}</Text>
        )}
      </View>

      <View
        className={`rounded-2xl border border-white/5 p-4 ${
          disabled ? "opacity-50" : "opacity-100"
        }`}
        style={{ backgroundColor: CARD }}
      >
        <View className="mb-3 flex-row items-start">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-[#27272A]">
            <MaterialCommunityIcons
              name={iconName}
              size={22}
              color={disabled ? "#71717A" : GOLD}
            />
          </View>

          <View className="flex-1">
            <Text className="text-base font-black text-white">{title}</Text>
            <Text className="mt-1 text-xs font-semibold leading-5 text-zinc-400">
              {description}
            </Text>
          </View>
        </View>

        {!!badgeLabel && !!badgeTone && (
          <View className="mb-3">
            <StatusBadge label={badgeLabel} tone={badgeTone} />
          </View>
        )}

        {!!metaText && (
          <Text className="mb-3 text-[11px] font-semibold text-zinc-500">
            {metaText}
          </Text>
        )}

        <View className="flex-row flex-wrap gap-2">
          {!!primaryLabel && (
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={disabled}
              onPress={onPrimaryPress}
              className={`h-10 items-center justify-center rounded-xl px-4 ${
                disabled ? "bg-[#3F3F46]" : "bg-[#D4AF37]"
              }`}
            >
              <Text
                className={`text-xs font-black ${
                  disabled ? "text-zinc-500" : "text-[#141210]"
                }`}
              >
                {primaryLabel}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

export default function CreatorMonetizationScreen() {
  const navigation = useNavigation<any>();
  const [verificationStatus, setVerificationStatus] =
    useState<VerificationStatusDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isGatewayModalVisible, setIsGatewayModalVisible] = useState(false);
  const [isTaxModalVisible, setIsTaxModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [gatewayTerm, setGatewayTerm] =
    useState<MonetizationTermVersionDto | null>(null);
  const [step1Term, setStep1Term] =
    useState<MonetizationTermVersionDto | null>(null);
  const [isTermAccepted, setIsTermAccepted] = useState(false);

  const [taxId, setTaxId] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isPrimary, setIsPrimary] = useState(true);

  const loadVerificationStatus = async () => {
    setErrorMessage(null);

    try {
      const data = await getVerificationStatus();
      setVerificationStatus(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Không thể tải trạng thái kiếm tiền.",
      );
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchInitialStatus = async () => {
      setIsLoading(true);

      try {
        const data = await getVerificationStatus();
        if (mounted) setVerificationStatus(data);
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Không thể tải trạng thái kiếm tiền.",
          );
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchInitialStatus();

    return () => {
      mounted = false;
    };
  }, []);

  const isCreatorVerified = verificationStatus?.isCreatorVerified === true;
  const isTermsAccepted = verificationStatus?.isTermsAccepted === true;
  const identityStatus = verificationStatus?.identityStatus;
  const paymentStatus = verificationStatus?.paymentStatus;
  const hasIdentityStatus =
    identityStatus !== undefined && identityStatus !== null && identityStatus !== "";
  const hasPaymentStatus =
    paymentStatus !== undefined && paymentStatus !== null && paymentStatus !== "";
  const identityStatusLabel = hasIdentityStatus
    ? String(identityStatus).toUpperCase()
    : undefined;
  const paymentStatusLabel = hasPaymentStatus
    ? String(paymentStatus).toUpperCase()
    : undefined;
  const activeTerm = isGatewayModalVisible ? gatewayTerm : step1Term;
  const shouldShowTermModal = isGatewayModalVisible || !!step1Term;

  const openGatewayModal = async () => {
    setIsSubmitting(true);
    setIsTermAccepted(false);

    try {
      const term = await getActiveMonetizationTerm("CREATOR_VERIFYING_PROCESS");
      setGatewayTerm(term);
      setIsGatewayModalVisible(true);
    } catch (error) {
      Alert.alert(
        "Không thể mở điều khoản",
        error instanceof Error ? error.message : "Vui lòng thử lại sau.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openStep1Modal = async () => {
    setIsSubmitting(true);
    setIsTermAccepted(false);

    try {
      const term = await getActiveMonetizationTerm("CREATOR_ENABLE_MONETIZATION");
      setStep1Term(term);
    } catch (error) {
      Alert.alert(
        "Không thể mở điều khoản",
        error instanceof Error ? error.message : "Vui lòng thử lại sau.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeTermModal = (force = false) => {
    if (isSubmitting && !force) return;
    setIsGatewayModalVisible(false);
    setGatewayTerm(null);
    setStep1Term(null);
    setIsTermAccepted(false);
  };

  const handleConfirmTerm = async () => {
    if (!activeTerm?.id || !isTermAccepted || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isGatewayModalVisible) {
        await submitVerification(activeTerm.id);
        Alert.alert("Thành công", "Yêu cầu xác thực Creator đã được gửi.");
      } else {
        await acceptTerms(activeTerm.id);
        Alert.alert("Thành công", "Bạn đã đồng ý điều khoản kiếm tiền.");
      }

      closeTermModal(true);
      await loadVerificationStatus();
    } catch (error) {
      Alert.alert(
        "Thao tác thất bại",
        error instanceof Error ? error.message : "Vui lòng thử lại sau.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTaxModal = () => {
    setTaxId(verificationStatus?.taxId || "");
    setIsTaxModalVisible(true);
  };

  const handleSubmitTax = async () => {
    const normalizedTaxId = taxId.trim();
    if (!normalizedTaxId) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập mã số thuế.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTaxIdentity(normalizedTaxId);
      setIsTaxModalVisible(false);
      Alert.alert("Thành công", "Hồ sơ thuế đã được cập nhật.");
      await loadVerificationStatus();
    } catch (error) {
      Alert.alert(
        "Không thể cập nhật",
        error instanceof Error ? error.message : "Vui lòng thử lại sau.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPaymentModal = () => {
    const primaryValue = verificationStatus?.isPrimary;
    setBankCode(readStringField(verificationStatus, "bankCode"));
    setAccountNumber(readStringField(verificationStatus, "accountNumber"));
    setAccountName(readStringField(verificationStatus, "accountName"));
    setIsPrimary(
      typeof primaryValue === "boolean"
        ? primaryValue
        : readBooleanField(verificationStatus, "isPrimary") || true,
    );
    setIsPaymentModalVisible(true);
  };

  const buildPaymentPayload = (): PaymentProfileRequestDto | null => {
    const payload = {
      bankCode: bankCode.trim(),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
      isPrimary,
    };

    if (!payload.bankCode || !payload.accountNumber || !payload.accountName) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng nhập đầy đủ mã ngân hàng, số tài khoản và tên chủ thẻ.",
      );
      return null;
    }

    return payload;
  };

  const handleSubmitPayment = async () => {
    const payload = buildPaymentPayload();
    if (!payload) return;

    setIsSubmitting(true);
    try {
      if (verificationStatus?.paymentProfileId) {
        await updatePaymentProfile(verificationStatus.paymentProfileId, payload);
      } else {
        await createPaymentProfile(payload);
      }

      setIsPaymentModalVisible(false);
      Alert.alert("Thành công", "Tài khoản thanh toán đã được cập nhật.");
      await loadVerificationStatus();
    } catch (error) {
      Alert.alert(
        "Không thể cập nhật",
        error instanceof Error ? error.message : "Vui lòng thử lại sau.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color={GOLD} />
          <Text className="mt-4 text-sm font-semibold text-zinc-400">
            Đang tải trạng thái kiếm tiền...
          </Text>
        </View>
      );
    }

    if (errorMessage) {
      return (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-full rounded-3xl border border-red-500/25 bg-[#1E1E22] p-6">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
              <Feather name="alert-triangle" size={26} color="#F87171" />
            </View>
            <Text className="text-xl font-black text-white">
              Không thể tải dữ liệu
            </Text>
            <Text className="mt-2 text-sm font-semibold leading-6 text-zinc-400">
              {errorMessage}
            </Text>
          </View>
        </View>
      );
    }

    if (!isCreatorVerified) {
      return (
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-full rounded-3xl border border-[#D4AF37]/35 bg-[#1E1E22] p-6 shadow-lg shadow-yellow-500/10">
            <View className="mb-5 h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/15">
              <MaterialCommunityIcons
                name="shield-account"
                size={34}
                color={GOLD}
              />
            </View>
            <Text className="text-xl font-black text-white">
              Xác thực danh tính Creator
            </Text>
            <Text className="mt-3 text-sm font-semibold leading-6 text-zinc-400">
              Vui lòng đọc và đồng ý điều khoản trước khi bắt đầu.
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isSubmitting}
              onPress={openGatewayModal}
              className={`mt-6 h-12 items-center justify-center rounded-xl ${
                isSubmitting ? "bg-[#3F3F46]" : "bg-[#D4AF37]"
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#141210" />
              ) : (
                <Text className="text-sm font-black text-[#141210]">
                  Mở điều khoản
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}
      >
        <View className="px-5 pb-2 pt-5">
          <View className="mb-6 rounded-3xl border border-white/5 bg-[#1E1E22] p-5">
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37]/15">
              <MaterialCommunityIcons
                name="cash-fast"
                size={30}
                color={GOLD}
              />
            </View>
            <Text className="text-2xl font-black text-white">
              Bật kiếm tiền Creator
            </Text>
            <Text className="mt-2 text-sm font-semibold leading-6 text-zinc-400">
              Hoàn tất từng bước để TaleX có thể xác minh hồ sơ và chuyển doanh
              thu về tài khoản của bạn.
            </Text>
          </View>

          <View className="ml-3 border-l-2 border-zinc-800">
            <TimelineStep
              index={1}
              title="Điều khoản cơ sở"
              description="Đọc và đồng ý điều khoản kiếm tiền dành cho Creator."
              iconName="file-document-check-outline"
              completed={isTermsAccepted}
              badgeLabel={isTermsAccepted ? "Đã hoàn thành" : undefined}
              badgeTone={completedTone}
              primaryLabel={isTermsAccepted ? undefined : "Bắt đầu"}
              onPrimaryPress={openStep1Modal}
            />

            <TimelineStep
              index={2}
              title="Cung cấp hồ sơ thuế"
              description="Bổ sung mã số thuế hoặc thông tin định danh để phục vụ quyết toán doanh thu."
              iconName="card-account-details-outline"
              completed={hasIdentityStatus}
              disabled={!isTermsAccepted}
              badgeLabel={identityStatusLabel}
              badgeTone={
                hasIdentityStatus ? getStatusTone(identityStatus) : undefined
              }
              metaText={
                hasIdentityStatus ? formatDate(verificationStatus?.updatedAt) : undefined
              }
              primaryLabel={hasIdentityStatus ? "Cập nhật lại" : "Cập nhật"}
              onPrimaryPress={openTaxModal}
            />

            <TimelineStep
              index={3}
              title="Tài khoản thanh toán"
              description="Thiết lập tài khoản ngân hàng chính để nhận doanh thu từ TaleX."
              iconName="bank-outline"
              completed={hasPaymentStatus}
              disabled={!hasIdentityStatus}
              badgeLabel={paymentStatusLabel}
              badgeTone={
                hasPaymentStatus ? getStatusTone(paymentStatus) : undefined
              }
              metaText={
                verificationStatus?.paymentProfileId
                  ? `Hồ sơ thanh toán: ${verificationStatus.paymentProfileId}`
                  : undefined
              }
              primaryLabel={hasPaymentStatus ? "Cập nhật" : "Thiết lập"}
              onPrimaryPress={openPaymentModal}
            />
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0F0F10]">
      <StatusBar barStyle="light-content" backgroundColor="#0F0F10" />

      <View className="flex-row items-center border-b border-white/5 px-4 py-3">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mr-3 p-2 active:opacity-70"
        >
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-black text-white">
            Trung tâm kiếm tiền
          </Text>
          <Text className="mt-0.5 text-[11px] font-semibold text-zinc-500">
            Creator Monetization
          </Text>
        </View>
      </View>

      <View className="flex-1">{renderContent()}</View>

      <Modal
        transparent
        visible={shouldShowTermModal}
        animationType="slide"
        onRequestClose={() => closeTermModal()}
      >
        <View className="flex-1 justify-end bg-black/80">
          <View className="max-h-[82%] rounded-t-3xl border border-white/10 bg-[#1E1E22] px-5 pb-8 pt-5">
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-lg font-black text-white">
                  {activeTerm?.title || "Điều khoản Creator"}
                </Text>
                <Text className="mt-1 text-xs font-semibold text-zinc-500">
                  Vui lòng đọc kỹ trước khi xác nhận
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => closeTermModal()}
                disabled={isSubmitting}
                className="h-9 w-9 items-center justify-center rounded-full bg-white/5"
              >
                <Feather name="x" size={18} color="#D4D4D8" />
              </TouchableOpacity>
            </View>

            <ScrollView className="mb-5 rounded-2xl bg-[#0F0F10] p-4">
              <Text className="text-sm font-semibold leading-6 text-zinc-300">
                {activeTerm?.content ||
                  "Không có nội dung điều khoản. Vui lòng thử lại sau."}
              </Text>
            </ScrollView>

            <CheckRow
              checked={isTermAccepted}
              disabled={isSubmitting}
              label="Tôi đã đọc và đồng ý với điều khoản của TaleX."
              onPress={() => setIsTermAccepted((current) => !current)}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!isTermAccepted || isSubmitting || !activeTerm?.id}
              onPress={handleConfirmTerm}
              className={`mt-5 h-12 items-center justify-center rounded-xl ${
                isTermAccepted && !isSubmitting && activeTerm?.id
                  ? "bg-[#D4AF37]"
                  : "bg-[#3F3F46]"
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#141210" />
              ) : (
                <Text className="text-sm font-black text-[#141210]">
                  Xác nhận
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={isTaxModalVisible}
        animationType="slide"
        onRequestClose={() => !isSubmitting && setIsTaxModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 justify-center bg-black/80 px-4">
              <ScrollView
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: "center",
                  paddingVertical: 24,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View className="rounded-2xl border border-white/10 bg-[#1E1E22] p-6">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-lg font-black text-white">
                Hồ sơ thuế
              </Text>
              <TouchableOpacity
                onPress={() => setIsTaxModalVisible(false)}
                disabled={isSubmitting}
                className="h-9 w-9 items-center justify-center rounded-full bg-white/5"
              >
                <Feather name="x" size={18} color="#D4D4D8" />
              </TouchableOpacity>
            </View>

            <Text className="mb-2 text-xs font-bold uppercase text-zinc-500">
              Mã số thuế
            </Text>
            <TextInput
              value={taxId}
              onChangeText={setTaxId}
              placeholder="Nhập mã số thuế"
              placeholderTextColor="#71717A"
              autoCapitalize="characters"
              className="rounded-xl border border-zinc-700 bg-[#0F0F10] p-4 text-white"
            />

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isSubmitting}
              onPress={handleSubmitTax}
              className={`mt-5 h-12 items-center justify-center rounded-xl ${
                isSubmitting ? "bg-[#3F3F46]" : "bg-[#D4AF37]"
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#141210" />
              ) : (
                <Text className="text-sm font-black text-[#141210]">
                  Xác nhận
                </Text>
              )}
            </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        transparent
        visible={isPaymentModalVisible}
        animationType="slide"
        onRequestClose={() => !isSubmitting && setIsPaymentModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 justify-center bg-black/80 px-4">
              <ScrollView
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: "center",
                  paddingVertical: 24,
                }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View className="rounded-2xl border border-white/10 bg-[#1E1E22] p-6">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-lg font-black text-white">
                Tài khoản thanh toán
              </Text>
              <TouchableOpacity
                onPress={() => setIsPaymentModalVisible(false)}
                disabled={isSubmitting}
                className="h-9 w-9 items-center justify-center rounded-full bg-white/5"
              >
                <Feather name="x" size={18} color="#D4D4D8" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-xs font-bold uppercase text-zinc-500">
                Mã ngân hàng
              </Text>
              <TextInput
                value={bankCode}
                onChangeText={setBankCode}
                placeholder="VD: VCB, TCB, BIDV"
                placeholderTextColor="#71717A"
                autoCapitalize="characters"
                className="rounded-xl border border-zinc-700 bg-[#0F0F10] p-4 text-white"
              />
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-xs font-bold uppercase text-zinc-500">
                Số tài khoản
              </Text>
              <TextInput
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="Nhập số tài khoản"
                placeholderTextColor="#71717A"
                keyboardType="number-pad"
                className="rounded-xl border border-zinc-700 bg-[#0F0F10] p-4 text-white"
              />
            </View>

            <View className="mb-5">
              <Text className="mb-2 text-xs font-bold uppercase text-zinc-500">
                Tên chủ thẻ
              </Text>
              <TextInput
                value={accountName}
                onChangeText={setAccountName}
                placeholder="Nhập tên chủ thẻ"
                placeholderTextColor="#71717A"
                autoCapitalize="characters"
                className="rounded-xl border border-zinc-700 bg-[#0F0F10] p-4 text-white"
              />
            </View>

            <CheckRow
              checked={isPrimary}
              disabled={isSubmitting}
              label="Đặt làm tài khoản chính"
              onPress={() => setIsPrimary((current) => !current)}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isSubmitting}
              onPress={handleSubmitPayment}
              className={`mt-5 h-12 items-center justify-center rounded-xl ${
                isSubmitting ? "bg-[#3F3F46]" : "bg-[#D4AF37]"
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#141210" />
              ) : (
                <Text className="text-sm font-black text-[#141210]">
                  Xác nhận
                </Text>
              )}
            </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
