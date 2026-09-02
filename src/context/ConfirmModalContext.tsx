import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export type ConfirmType = "gold" | "danger" | "warning" | "success" | "info";

export interface ConfirmOptions {
  title: string;
  message: string;
  type?: ConfirmType;
  icon?: string;
  iconFamily?: "FontAwesome5" | "Feather" | "MaterialCommunityIcons" | "Ionicons";
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmModalContextValue {
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmModalContext = createContext<ConfirmModalContextValue | undefined>(undefined);

export function ConfirmModalProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const showConfirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsLoading(false);
    setVisible(true);

    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleCancel = useCallback(() => {
    if (isLoading) return;
    setVisible(false);
    options?.onCancel?.();
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  }, [isLoading, options]);

  const handleConfirm = useCallback(async () => {
    if (isLoading) return;

    if (options?.onConfirm) {
      try {
        setIsLoading(true);
        await options.onConfirm();
      } catch {
        // error handling inside caller
      } finally {
        setIsLoading(false);
      }
    }

    setVisible(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  }, [isLoading, options]);

  const type = options?.type || "gold";
  const showCancel = options?.showCancel !== false;
  const confirmText = options?.confirmText || (showCancel ? "Xác Nhận" : "Đã Hiểu");
  const cancelText = options?.cancelText || "Hủy Bỏ";

  // Preset styles by type
  const theme = {
    gold: {
      border: "rgba(212, 175, 55, 0.4)",
      badgeBg: "rgba(212, 175, 55, 0.15)",
      badgeBorder: "rgba(212, 175, 55, 0.4)",
      iconColor: "#D4AF37",
      defaultIcon: "coins",
      defaultFamily: "FontAwesome5" as const,
      btnBg: "#D4AF37",
      btnText: "#141210",
    },
    danger: {
      border: "rgba(239, 68, 68, 0.4)",
      badgeBg: "rgba(239, 68, 68, 0.15)",
      badgeBorder: "rgba(239, 68, 68, 0.4)",
      iconColor: "#EF4444",
      defaultIcon: "trash-alt",
      defaultFamily: "FontAwesome5" as const,
      btnBg: "#EF4444",
      btnText: "#FFFFFF",
    },
    warning: {
      border: "rgba(251, 146, 60, 0.4)",
      badgeBg: "rgba(251, 146, 60, 0.15)",
      badgeBorder: "rgba(251, 146, 60, 0.4)",
      iconColor: "#FB923C",
      defaultIcon: "exclamation-triangle",
      defaultFamily: "FontAwesome5" as const,
      btnBg: "#F59E0B",
      btnText: "#141210",
    },
    success: {
      border: "rgba(16, 185, 129, 0.4)",
      badgeBg: "rgba(16, 185, 129, 0.15)",
      badgeBorder: "rgba(16, 185, 129, 0.4)",
      iconColor: "#10B981",
      defaultIcon: "check-circle",
      defaultFamily: "FontAwesome5" as const,
      btnBg: "#10B981",
      btnText: "#FFFFFF",
    },
    info: {
      border: "rgba(59, 130, 246, 0.4)",
      badgeBg: "rgba(59, 130, 246, 0.15)",
      badgeBorder: "rgba(59, 130, 246, 0.4)",
      iconColor: "#3B82F6",
      defaultIcon: "info-circle",
      defaultFamily: "FontAwesome5" as const,
      btnBg: "#3B82F6",
      btnText: "#FFFFFF",
    },
  }[type];

  const iconName = options?.icon || theme.defaultIcon;
  const iconFamily = options?.iconFamily || theme.defaultFamily;

  const renderIcon = () => {
    if (iconFamily === "Feather") {
      return <Feather name={iconName as any} size={26} color={theme.iconColor} />;
    }
    if (iconFamily === "MaterialCommunityIcons") {
      return <MaterialCommunityIcons name={iconName as any} size={28} color={theme.iconColor} />;
    }
    if (iconFamily === "Ionicons") {
      return <Ionicons name={iconName as any} size={26} color={theme.iconColor} />;
    }
    return <FontAwesome5 name={iconName as any} size={24} color={theme.iconColor} />;
  };

  return (
    <ConfirmModalContext.Provider value={{ showConfirm }}>
      {children}

      <Modal
        transparent
        animationType="fade"
        visible={visible}
        statusBarTranslucent
        onRequestClose={handleCancel}
      >
        <View
          style={StyleSheet.absoluteFillObject}
          className="items-center justify-center bg-black/85 p-6 z-50"
        >
          <View
            style={{
              backgroundColor: "#161519",
              borderColor: theme.border,
            }}
            className="w-full max-w-sm rounded-3xl p-6 border items-center shadow-2xl"
          >
            {/* Top Icon Badge */}
            <View
              style={{
                backgroundColor: theme.badgeBg,
                borderColor: theme.badgeBorder,
              }}
              className="w-16 h-16 rounded-2xl border items-center justify-center mb-4 shadow-md"
            >
              {renderIcon()}
            </View>

            {/* Title */}
            <Text className="text-xl font-black text-white text-center">
              {options?.title}
            </Text>

            {/* Message Body */}
            <Text className="text-zinc-300 text-xs text-center mt-2.5 px-2 leading-relaxed">
              {options?.message}
            </Text>

            {/* Action Buttons Group */}
            <View className="w-full mt-6">
              {/* Confirm Primary Action */}
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isLoading}
                onPress={handleConfirm}
                style={{ backgroundColor: theme.btnBg }}
                className="w-full h-12 rounded-2xl items-center justify-center shadow-lg"
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.btnText} />
                ) : (
                  <Text
                    style={{ color: theme.btnText }}
                    className="font-black text-xs uppercase tracking-wider"
                  >
                    {confirmText}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Cancel Secondary Action */}
              {showCancel && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isLoading}
                  onPress={handleCancel}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    borderColor: "rgba(255, 255, 255, 0.12)",
                  }}
                  className="w-full h-11 rounded-2xl border items-center justify-center mt-2.5"
                >
                  <Text className="text-zinc-400 font-bold text-xs uppercase">
                    {cancelText}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </ConfirmModalContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmModalContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmModalProvider");
  }
  return context;
}
