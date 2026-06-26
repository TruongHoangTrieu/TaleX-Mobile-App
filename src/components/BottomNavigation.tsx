import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

// Truyền props của thư viện vào component
export default function BottomNavigation({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View 
      className="absolute bottom-6 left-4 right-4 h-16 bg-[#1A1816]/75 border border-white/10 flex-row justify-around items-center rounded-full shadow-lg shadow-black/40"
      style={{
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        // Xử lý sự kiện khi bấm vào Tab
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

        // Hàm trả về đúng Icon và Chữ tương ứng với từng Màn hình
        const renderTabContent = () => {
          const color = isFocused ? "#D4AF37" : "#7C766B";
          const fontStyle = isFocused ? "font-bold" : "font-medium";

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
            className="items-center justify-center flex-1 h-full rounded-full"
          >
            {renderTabContent()}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}