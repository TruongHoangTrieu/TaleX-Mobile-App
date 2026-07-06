import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

export default function BottomNavigation({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const menuAnimation = useSharedValue(0);

  const toggleMenu = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    menuAnimation.value = withTiming(nextState ? 1 : 0, {
      duration: 250,
      easing: Easing.bezier(0.25, 1, 0.5, 1),
    });
  };

  const handleSubMenuPress = (screenName: string) => {
    toggleMenu();
    console.log(`Chuyển hướng đến màn hình: ${screenName}`);
    if (screenName === 'PostMovie') {
      navigation.navigate('UploadMovie');
    } else if (screenName === 'PostComic') {
      navigation.navigate('UploadComic');
    }
  };

  const halfLength = Math.ceil(state.routes.length / 2);
  const leftRoutes = state.routes.slice(0, halfLength);
  const rightRoutes = state.routes.slice(halfLength);

  // Xoay dấu cộng thành chữ X mượt mà
  const animatedMainButtonStyle = useAnimatedStyle(() => {
    const rotate = menuAnimation.value * 135;
    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  const getSubMenuAnimationStyle = (angle: number, radius: number) => {
    return useAnimatedStyle(() => {
      const radian = (angle * Math.PI) / 180;
      const x = Math.cos(radian) * radius * menuAnimation.value;
      const y = -Math.sin(radian) * radius * menuAnimation.value;

      return {
        transform: [
          { translateX: x },
          { translateY: y },
          { scale: menuAnimation.value },
        ],
        opacity: menuAnimation.value,
      };
    });
  };

  const renderTabItem = (route: (typeof state.routes)[0], index: number) => {
    const isFocused = state.index === index;

    const onPress = () => {
      if (isOpen) toggleMenu();
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    const color = isFocused ? "#D4AF37" : "#7C766B";
    const fontStyle = isFocused ? "font-bold" : "font-medium";

    const renderTabContent = () => {
      switch (route.name) {
        case "Home":
          return (
            <>
              <MaterialCommunityIcons
                name={isFocused ? "home" : "home-outline"}
                size={22}
                color={color}
              />
              <Text
                style={{ color }}
                className={`text-[10px] mt-1 ${fontStyle}`}
              >
                Trang Chủ
              </Text>
            </>
          );
        case "Comics":
          return (
            <>
              <MaterialCommunityIcons
                name={
                  isFocused ? "book-open-variant" : "book-open-variant-outline"
                }
                size={22}
                color={color}
              />
              <Text
                style={{ color }}
                className={`text-[10px] mt-1 ${fontStyle}`}
              >
                Truyện
              </Text>
            </>
          );
        case "Movies":
          return (
            <>
              <MaterialCommunityIcons
                name={isFocused ? "movie-roll" : "movie-roll"}
                size={22}
                color={color}
              />
              <Text
                style={{ color }}
                className={`text-[10px] mt-1 ${fontStyle}`}
              >
                Phim
              </Text>
            </>
          );
        case "Profile":
          return (
            <>
              <MaterialCommunityIcons
                name={isFocused ? "account" : "account-outline"}
                size={22}
                color={color}
              />
              <Text
                style={{ color }}
                className={`text-[10px] mt-1 ${fontStyle}`}
              >
                Tài Khoản
              </Text>
            </>
          );
        default:
          return null;
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        activeOpacity={0.6}
        className="items-center justify-center flex-1 h-full z-20"
      >
        <View className="flex-col items-center justify-center w-full h-full">
          {renderTabContent()}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      className="absolute bottom-0 left-0 right-0 bg-[#141210] border-t border-white/5 flex-row items-center justify-between px-4 z-30"
      style={{
        height: 60 + insets.bottom,
        paddingBottom: insets.bottom,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
      }}
    >
      {/* DANH SÁCH TAB NỬA TRÁI */}
      {leftRoutes.map((route, index) => renderTabItem(route, index))}

      {/* KHU VỰC NÚT ĐĂNG BÀI NỔI BẬT & CÁNH QUẠT */}
      <View className="items-center justify-center h-full px-2 z-50" style={{ minWidth: 60, position: 'relative' }}>
        {/* NÚT CON 1: ĐĂNG BÀI (Góc 135 độ) */}
        <Animated.View 
          style={[
            getSubMenuAnimationStyle(135, 110),
            { position: 'absolute', zIndex: 40 }
          ]}
        >
          <TouchableOpacity 
            onPress={() => handleSubMenuPress('PostArticle')}
            className="w-16 h-16 rounded-full items-center justify-center flex-col px-1"
            style={{
              backgroundColor: '#26221F',
              borderWidth: 1.5,
              borderColor: '#D4AF37',
              shadowColor: '#D4AF37',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <MaterialCommunityIcons name="text-box-plus-outline" size={20} color="#D4AF37" />
            <Text style={{ fontSize: 8, color: '#E6C687', letterSpacing: 0.2, lineHeight: 10 }} className="font-bold mt-1 text-center">
              Đăng bài
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* NÚT CON 2: ĐĂNG TRUYỆN (Góc 90 độ) */}
        <Animated.View 
          style={[
            getSubMenuAnimationStyle(90, 115),
            { position: 'absolute', zIndex: 40 }
          ]}
        >
          <TouchableOpacity 
            onPress={() => handleSubMenuPress('PostComic')}
            className="w-16 h-16 rounded-full items-center justify-center flex-col px-1"
            style={{
              backgroundColor: '#26221F',
              borderWidth: 1.5,
              borderColor: '#D4AF37',
              shadowColor: '#D4AF37',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <MaterialCommunityIcons name="book-open-variant" size={20} color="#D4AF37" />
            <Text style={{ fontSize: 8, color: '#E6C687', letterSpacing: 0.2, lineHeight: 10 }} className="font-bold mt-1 text-center">
              Đăng truyện
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* NÚT CON 3: ĐĂNG PHIM (Góc 45 độ) */}
        <Animated.View 
          style={[
            getSubMenuAnimationStyle(45, 110),
            { position: 'absolute', zIndex: 40 }
          ]}
        >
          <TouchableOpacity 
            onPress={() => handleSubMenuPress('PostMovie')}
            className="w-16 h-16 rounded-full items-center justify-center flex-col px-1"
            style={{
              backgroundColor: '#26221F',
              borderWidth: 1.5,
              borderColor: '#D4AF37',
              shadowColor: '#D4AF37',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <MaterialCommunityIcons name="movie-roll" size={20} color="#D4AF37" />
            <Text style={{ fontSize: 8, color: '#E6C687', letterSpacing: 0.2, lineHeight: 10 }} className="font-bold mt-1 text-center">
              Đăng phim
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* NÚT CHÍNH (DẤU CỘNG) */}
        <Animated.View style={[animatedMainButtonStyle, { zIndex: 50 }]}>
          <TouchableOpacity
            onPress={toggleMenu}
            activeOpacity={0.8}
            className="items-center justify-center w-12 h-12 bg-[#D4AF37] rounded-full"
            style={{
              shadowColor: '#D4AF37',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <MaterialCommunityIcons name="plus" size={28} color="#1A1816" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* DANH SÁCH TAB NỬA PHẢI */}
      {rightRoutes.map((route, index) =>
        renderTabItem(route, index + halfLength),
      )}
    </View>
  );
}
