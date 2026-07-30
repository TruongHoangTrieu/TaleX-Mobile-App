import React from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

type StepItem = {
  num: number;
  label: string;
};

type StepIndicatorProps = {
  currentStep: number;
  steps: StepItem[];
};

export default function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <View className="flex-row items-center justify-between px-6 py-4 bg-[#141210] border-b border-zinc-900">
      {steps.map((s, idx) => {
        const isActive = currentStep === s.num;
        const isCompleted = currentStep > s.num;
        return (
          <React.Fragment key={s.num}>
            <View className="items-center w-12">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  isActive
                    ? "bg-[#FF4E4E] border border-[#FF4E4E]"
                    : isCompleted
                    ? "bg-[#D4AF37]"
                    : "bg-[#252830] border border-zinc-700"
                }`}
              >
                {isCompleted ? (
                  <Feather name="check" size={14} color="#141210" />
                ) : (
                  <Text className={`text-xs font-bold ${isActive ? "text-white" : "text-zinc-500"}`}>
                    {s.num}
                  </Text>
                )}
              </View>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ width: 64, textAlign: "center" }}
                className={`text-[10px] font-bold mt-1.5 ${
                  isActive ? "text-[#FF4E4E]" : isCompleted ? "text-[#D4AF37]" : "text-zinc-500"
                }`}
              >
                {s.label}
              </Text>
            </View>
            {idx < steps.length - 1 && (
              <View className={`h-[2px] flex-1 mx-1 -mt-4 ${currentStep > s.num ? "bg-[#D4AF37]" : "bg-zinc-800"}`} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

