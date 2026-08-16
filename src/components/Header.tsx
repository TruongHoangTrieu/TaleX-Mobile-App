import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { navigate as safeNavigateRef } from "@/navigation/navigationRef";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/context/NotificationContext";

export interface HeaderProps {
  greetingText?: string;
  userName?: string;
  avatarUrl?: any;
  hasUnreadNotification?: boolean;
  searchPlaceholder?: string;
  onBellPress?: () => void;
  onSearchPress?: () => void;
  onAvatarPress?: () => void;
  titleType?: "logo" | "text";
  titleText?: string;
  showCategories?: boolean;
  activeCategory?: string;
  onCategoryChange?: (cat: string) => void;
  transparent?: boolean;
}

export default function Header({
  hasUnreadNotification,
  onBellPress,
  onSearchPress,
}: HeaderProps) {
  const { isAuthenticated } = useAuth();
  const { unreadCount } = useNotifications();
  const showUnreadNotification =
    hasUnreadNotification ?? (isAuthenticated && unreadCount > 0);

  // An toàn khi gọi navigation dù ở bất kỳ vị trí nào
  let navigation: any = null;
  try {
    navigation = useNavigation<any>();
  } catch (_e) {
    navigation = null;
  }

  const navigateTo = (screenName: string, params?: any) => {
    if (navigation && typeof navigation.navigate === "function") {
      navigation.navigate(screenName, params);
    } else {
      safeNavigateRef(screenName, params);
    }
  };

  const handleSearch = () => {
    if (onSearchPress) onSearchPress();
    else navigateTo("Search");
  };

  const handleBell = () => {
    if (onBellPress) {
      onBellPress();
      return;
    }

    if (isAuthenticated) {
      navigateTo("Notifications");
    } else {
      navigateTo("LoginScreen");
    }
  };

  return (
    <SafeAreaView
      edges={["top"]}
      className="bg-[#141619]"
      style={{ backgroundColor: "#141619" }}
    >
      <View className="px-4 py-2.5 bg-[#141619] flex-row items-center justify-between border-b border-white/5">
        {/* BÊN TRÁI: Logo + Chữ TaleX */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigateTo("MainTabs", { screen: "Home" })}
          className="flex-row items-center py-1"
        >
          <Image
            source={require("@assets/icon.png")}
            className="w-10 h-10 rounded-xl"
            resizeMode="contain"
          />
          <Text className="text-2xl font-extrabold text-white tracking-tight ml-2.5">
            Tale<Text className="text-[#D4AF37]">X</Text>
          </Text>
        </TouchableOpacity>

        {/* BÊN PHẢI: Icon Tìm Kiếm & Nút Thông Báo */}
        <View className="flex-row items-center gap-x-2">
          {/* Icon Search */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleSearch}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/5 active:bg-white/10"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="search" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Icon Notification (Bell) */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleBell}
            className="w-10 h-10 items-center justify-center rounded-full bg-white/5 active:bg-white/10 relative"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="bell" size={20} color="#FFFFFF" />
            {showUnreadNotification && (
              <View className="w-2.5 h-2.5 rounded-full bg-[#D4AF37] absolute top-2 right-2 border border-[#141619]" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
