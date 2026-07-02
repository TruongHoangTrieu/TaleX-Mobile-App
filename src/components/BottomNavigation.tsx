import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, LayoutChangeEvent } from "react-native";
// Chỉ import duy nhất MaterialCommunityIcons để đồng bộ phong cách thiết kế
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
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
  const [tabsLayout, setTabsLayout] = useState<{ x: number; width: number }[]>(
    [],
  );

  const [isOpen, setIsOpen] = useState(false);
  const menuAnimation = useSharedValue(0);

  const translateX = useSharedValue(0);
  const pillWidth = useSharedValue(0);

  useEffect(() => {
    if (tabsLayout[state.index]) {
      const { x, width } = tabsLayout[state.index];

      const animationConfig = {
        duration: 300,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      };

      const paddingExtension = 8;
      translateX.value = withTiming(x - paddingExtension / 2, animationConfig);
      pillWidth.value = withTiming(width + paddingExtension, animationConfig);
    }
  }, [state.index, tabsLayout]);

  const animatedPillStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: pillWidth.value,
    };
  });

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
    }
  };

  const onTabLayout = (event: LayoutChangeEvent, index: number) => {
    const { x, width } = event.nativeEvent.layout;
    setTabsLayout((prev) => {
      const updated = [...prev];
      updated[index] = { x, width };
      return updated;
    });
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
              {/* Đồng bộ sang dùng bản outline của MaterialCommunityIcons */}
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
        onLayout={(e) => onTabLayout(e, index)}
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
      className="absolute bottom-6 left-4 right-4 h-20 bg-[#1A1816]/75 border border-white/10 flex-row items-center justify-between rounded-full shadow-lg shadow-black/40 px-3 z-30"
      style={{
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      {/* VIÊN THUỐC TRONG SUỐT NỀN TAB */}
      {tabsLayout[state.index] && (
        <Animated.View
          style={[
            animatedPillStyle,
            {
              position: "absolute",
              height: 58,
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              borderColor: "rgba(255, 255, 255, 0.08)",
              borderWidth: 1,
              borderRadius: 9999,
              zIndex: 10,
            },
          ]}
        />
      )}

      {/* DANH SÁCH TAB NỬA TRÁI */}
      {leftRoutes.map((route, index) => renderTabItem(route, index))}

      {/* KHU VỰC NÚT ĐĂNG BÀI NỔI BẬT & CÁNH QUẠT */}
<View className="items-center justify-center h-full px-2 z-50" style={{ minWidth: 60, position: 'relative' }}>
  
  {/* NÚT CON 1: ĐĂNG BÀI (Góc 135 độ) */}
  <Animated.View 
    style={[
      getSubMenuAnimationStyle(135, 110), // Tăng nhẹ bán kính lên 110 để không gian hiển thị chữ rộng rãi hơn
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
