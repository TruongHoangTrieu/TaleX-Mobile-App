import React from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

const { height, width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  base: {
    backgroundColor: "rgba(20,20,20,0.85)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    maxWidth: "90%",
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginLeft: 6,
  },
});

const renderToast = (type: "success" | "error" | "info", text1: string) => {
  const textColors = {
    success: "#D4AF37",
    error: "#EF4444",
    info: "#60A5FA",
  };

  const borderColors = {
    success: "rgba(212,175,55,0.3)",
    error: "rgba(239,68,68,0.4)",
    info: "rgba(96,165,250,0.4)",
  };

  const iconNames = {
    success: "check-circle",
    error: "alert-circle",
    info: "info",
  } as const;

  return (
    <View style={styles.container}>
      <View style={[styles.base, { borderColor: borderColors[type] }]}>
        <Feather name={iconNames[type]} size={16} color={textColors[type]} />
        <Text style={[styles.text, { color: textColors[type] }]}>{text1}</Text>
      </View>
    </View>
  );
};

export const toastConfig = {
  success: ({ text1 }: any) => renderToast("success", text1),
  error: ({ text1 }: any) => renderToast("error", text1),
  info: ({ text1 }: any) => renderToast("info", text1),
};
