import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

export default function BottomNavigation({ state, descriptors, navigation }: BottomTabBarProps) {
  const [tabsLayout, setTabsLayout] = useState<{ x: number; width: number }[]>([]);

  const translateX = useSharedValue(0);
  const pillWidth = useSharedValue(0);

  useEffect(() => {
    if (tabsLayout[state.index]) {
      const { x, width } = tabsLayout[state.index];

      const animationConfig = {
        duration: 300,
        easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      };

      // ĐỘ GIÃN RỘNG CỦA VIÊN THUỐC (Bạn có thể tăng số này nếu muốn rộng nữa nhé)
      const paddingExtension = 8;

      // Dịch vị trí X lùi về một nửa khoảng giãn để viên thuốc nằm đúng trung tâm
      translateX.value = withTiming(x - (paddingExtension / 2), animationConfig);

      // Cộng thêm độ rộng giúp viên thuốc nở to, thoải mái hơn rất nhiều
      pillWidth.value = withTiming(width + paddingExtension, animationConfig);
    }
  }, [state.index, tabsLayout]);

  const animatedPillStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: pillWidth.value,
    };
  });

  const handlePostPress = () => {
    navigation.navigate('Post');
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

  const renderTabItem = (route: typeof state.routes[0], index: number) => {
    const isFocused = state.index === index;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
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
        case 'Home':
          return (
            <>
              <Octicons name="home" size={20} color={color} />
              <Text style={{ color }} className={`text-[10px] mt-1 ${fontStyle}`}>Trang Chủ</Text>
            </>
          );
        case 'Comics':
          return (
            <>
              <MaterialCommunityIcons name="book-open-variant" size={20} color={color} />
              <Text style={{ color }} className={`text-[10px] mt-1 ${fontStyle}`}>Truyện Tranh</Text>
            </>
          );
        case 'Movies':
          return (
            <>
              <MaterialCommunityIcons name="movie-roll" size={20} color={color} />
              <Text style={{ color }} className={`text-[10px] mt-1 ${fontStyle}`}>Phim</Text>
            </>
          );
        case 'Profile':
          return (
            <>
              <FontAwesome5 name="user" size={17} color={color} />
              <Text style={{ color }} className={`text-[10px] mt-1 ${fontStyle}`}>Tài Khoản</Text>
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
      className="absolute bottom-6 left-4 right-4 h-20 bg-[#1A1816]/75 border border-white/10 flex-row items-center justify-between rounded-full shadow-lg shadow-black/40 px-3"
      style={{
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      {/* VIÊN THUỐC TRONG SUỐT ĐÃ ĐƯỢC GIÃN RỘNG RÃI */}
      {tabsLayout[state.index] && (
        <Animated.View
          style={[
            animatedPillStyle,
            {
              position: 'absolute',
              height: 58, // Tăng nhẹ lên 62px để bo bao quát thoải mái theo chiều dọc
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderColor: 'rgba(255, 255, 255, 0.08)',
              borderWidth: 1,
              borderRadius: 9999,
              zIndex: 10,
            }
          ]}
        />
      )}

      {/* DANH SÁCH TAB NỬA TRÁI */}
      {leftRoutes.map((route, index) => renderTabItem(route, index))}

      {/* NÚT ĐĂNG BÀI NỔI BẬT */}
      <View className="items-center justify-center h-full px-2 z-20" style={{ minWidth: 50 }}>
        <TouchableOpacity
          onPress={handlePostPress}
          activeOpacity={0.6}
          className="items-center justify-center w-full h-full"
          style={{
            shadowColor: '#D4AF37',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.6,
            shadowRadius: 8,
          }}
        >
          <Octicons name="plus-circle" size={32} color="#D4AF37" />
        </TouchableOpacity>
      </View>

      {/* DANH SÁCH TAB NỬA PHẢI */}
      {rightRoutes.map((route, index) => renderTabItem(route, index + halfLength))}
    </View>
  );
}
