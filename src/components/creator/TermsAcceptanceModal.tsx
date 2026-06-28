import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  acceptNewTerms,
  getActiveCreatorTerms,
  registerCreator,
  type CreatorTermsVersion,
} from "@/services/creator";

type TermsAcceptanceModalProps = {
  visible: boolean;
  mode: "register" | "update";
  termsData?: CreatorTermsVersion | null;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function TermsAcceptanceModal({
  visible,
  mode,
  termsData,
  onSuccess,
  onCancel,
}: TermsAcceptanceModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTerms, setActiveTerms] = useState<CreatorTermsVersion | null>(
    termsData || null,
  );

  useEffect(() => {
    if (!visible) return;

    console.log("[TermsModal] Visible:", { mode, termsData });
    setAgreed(false);
    setSubmitting(false);

    if (mode === "update") {
      console.log("[TermsModal] Dùng termsData từ CreatorGuard:", termsData);
      setActiveTerms(termsData || null);
      return;
    }

    let mounted = true;

    const fetchTerms = async () => {
      console.log("[TermsModal] Fetch active creator terms...");
      setLoadingTerms(true);
      setActiveTerms(null);

      try {
        const terms = await getActiveCreatorTerms();
        console.log("[TermsModal] Fetch active creator terms success:", terms);
        if (mounted) setActiveTerms(terms);
      } catch (error) {
        console.log("[TermsModal] Fetch active creator terms error:", error);
      } finally {
        if (mounted) setLoadingTerms(false);
      }
    };

    fetchTerms();

    return () => {
      mounted = false;
    };
  }, [mode, termsData, visible]);

  const handleToggleAgreed = () => {
    console.log("[TermsModal] Toggle checkbox:", !agreed);
    setAgreed((current) => !current);
  };

  const handleCancel = () => {
    console.log("[TermsModal] Bấm Từ chối");
    onCancel();
  };

  const handleSubmit = async () => {
    console.log("[TermsModal] Bấm Chấp nhận:", {
      mode,
      agreed,
      activeTerms,
      submitting,
    });

    if (!agreed || submitting) {
      console.log("[TermsModal] Chặn submit vì chưa tick hoặc đang submitting");
      return;
    }

    if (!activeTerms?.id) {
      console.log("[TermsModal] Không có activeTerms.id để submit");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "register") {
        console.log("[TermsModal] Gọi registerCreator:", activeTerms.id);
        const response = await registerCreator(activeTerms.id);
        console.log("[TermsModal] registerCreator success:", response);
      } else {
        console.log("[TermsModal] Gọi acceptNewTerms:", activeTerms.id);
        const response = await acceptNewTerms(activeTerms.id);
        console.log("[TermsModal] acceptNewTerms success:", response);
      }

      console.log("[TermsModal] Submit thành công, gọi onSuccess");
      onSuccess();
    } catch (error) {
      console.log("[TermsModal] Submit error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = agreed && !!activeTerms?.id && !submitting && !loadingTerms;

  return (
    <Modal transparent visible={visible} animationType="slide">
      <View className="flex-1 items-center justify-center bg-black/85 px-5">
        <View className="max-h-[80%] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#121214]">
          <View className="border-b border-white/5 bg-[#1a1a1c] px-5 py-4">
            <Text className="text-xl font-black text-[#D4AF37]">
              Điều khoản Nhà Sáng Tạo TaleX
            </Text>
            <Text className="mt-1 text-xs font-semibold text-[#7C766B]">
              {mode === "register"
                ? "Đăng ký trở thành Creator"
                : "Cập nhật điều khoản mới"}
            </Text>
          </View>

          <View className="shrink">
            <ScrollView
              className="px-5 py-4"
              showsVerticalScrollIndicator={false}
            >
              {loadingTerms ? (
                <View className="min-h-[220px] items-center justify-center">
                  <ActivityIndicator color="#D4AF37" />
                  <Text className="mt-3 text-sm font-semibold text-[#D1D1D1]">
                    Đang tải điều khoản...
                  </Text>
                </View>
              ) : (
                <>
                  {!!activeTerms?.title && (
                    <Text className="mb-3 text-base font-bold text-white">
                      {activeTerms.title}
                    </Text>
                  )}
                  <Text className="text-sm leading-6 text-[#D1D1D1]">
                    {activeTerms?.content ||
                      "Chưa có nội dung điều khoản. Vui lòng thử lại sau."}
                  </Text>
                </>
              )}
            </ScrollView>
          </View>

          <View className="border-t border-white/5 bg-[#1a1a1c] px-5 py-5">
            <TouchableOpacity
              className="mb-5 flex-row items-start"
              activeOpacity={0.75}
              onPress={handleToggleAgreed}
              disabled={loadingTerms || submitting}
            >
              <Feather
                name={agreed ? "check-square" : "square"}
                size={23}
                color={agreed ? "#D4AF37" : "#7C766B"}
              />
              <Text className="ml-3 flex-1 text-sm font-semibold leading-5 text-[#D1D1D1]">
                Tôi đã đọc và đồng ý với điều khoản Nhà Sáng Tạo TaleX.
              </Text>
            </TouchableOpacity>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="h-12 flex-1 items-center justify-center rounded-xl border border-white/15 bg-white/5"
                activeOpacity={0.8}
                onPress={handleCancel}
                disabled={submitting}
              >
                <Text className="text-sm font-black text-[#D1D1D1]">
                  Từ chối
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`h-12 flex-1 items-center justify-center rounded-xl ${
                  canSubmit ? "bg-[#D4AF37]" : "bg-[#D4AF37]/35"
                }`}
                activeOpacity={0.85}
                onPress={handleSubmit}
                disabled={!canSubmit}
              >
                {submitting ? (
                  <ActivityIndicator color="#121214" />
                ) : (
                  <Text className="text-sm font-black text-black">
                    Chấp nhận
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
