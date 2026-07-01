import React from "react";
import { TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type FloatingPremiumButtonProps = {
  onPress: () => void;
};

export default function FloatingPremiumButton({
  onPress,
}: FloatingPremiumButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="absolute bottom-28 right-4 z-50 h-14 w-14 items-center justify-center rounded-full bg-[#D4AF37]"
      style={{
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <MaterialCommunityIcons name="crown" size={28} color="#141210" />
    </TouchableOpacity>
  );
}
