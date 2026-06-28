import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import TermsAcceptanceModal from "@/components/creator/TermsAcceptanceModal";
import {
  getOwnCreator,
  type CreatorApiError,
  type CreatorTermsVersion,
} from "@/services/creator";

type ModalConfig = {
  visible: boolean;
  mode: "register" | "update";
  termsData: CreatorTermsVersion | null;
};

const initialModalConfig: ModalConfig = {
  visible: false,
  mode: "register",
  termsData: null,
};

export default function CreatorGuardScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [modalConfig, setModalConfig] =
    useState<ModalConfig>(initialModalConfig);

  const checkCreator = useCallback(async () => {
    console.log("[Guard] Bắt đầu kiểm tra Creator");
    setLoading(true);

    try {
      console.log("[Guard] Gọi getOwnCreator()");
      const creator = await getOwnCreator();
      console.log("[Guard] getOwnCreator success:", creator);

      if (creator.isAcceptedLatestTerms === false) {
        console.log("[Guard] Mở Modal Cập nhật Terms");
        setModalConfig({
          visible: true,
          mode: "update",
          termsData: creator.termsVersion || null,
        });
        return;
      }

      console.log("[Guard] VÀO DASHBOARD THÀNH CÔNG");
      setModalConfig(initialModalConfig);
      navigation.replace("CreatorDashboard");
    } catch (error) {
      console.log("[Guard] getOwnCreator error:", error);

      const creatorError = error as CreatorApiError;
      if (Number(creatorError.code) === 4041) {
        console.log("[Guard] Mở Modal Đăng ký");
        setModalConfig({
          visible: true,
          mode: "register",
          termsData: null,
        });
        return;
      }

      console.log("[Guard] Lỗi ngoài luồng Creator:", error);
    } finally {
      console.log("[Guard] Kết thúc kiểm tra Creator");
      setLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    checkCreator();
  }, [checkCreator]);

  const handleModalSuccess = () => {
    console.log("[Guard] Modal onSuccess, chuyển vào CreatorDashboard");
    setModalConfig((current) => ({
      ...current,
      visible: false,
    }));
    navigation.replace("CreatorDashboard");
  };

  const handleModalCancel = () => {
    console.log("[Guard] Modal onCancel, đóng modal và quay lại");
    setModalConfig((current) => ({
      ...current,
      visible: false,
    }));
    navigation.goBack();
  };

  return (
    <View className="flex-1 items-center justify-center bg-[#121214]">
      {loading && <ActivityIndicator size="large" color="#D4AF37" />}

      <TermsAcceptanceModal
        visible={modalConfig.visible}
        mode={modalConfig.mode}
        termsData={modalConfig.termsData}
        onSuccess={handleModalSuccess}
        onCancel={handleModalCancel}
      />
    </View>
  );
}
