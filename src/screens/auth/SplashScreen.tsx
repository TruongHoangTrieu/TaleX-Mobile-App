import React, { useEffect, useRef } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StatusBar,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootNavigator";

export default function SplashScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Hoạt họa chuyển động
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Phóng to & Hiện Logo mượt mà
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Tự động chuyển thẳng sang HomeScreen sau 2.2 giây
    const timer = setTimeout(() => {
      handleNext();
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    navigation.navigate("MainTabs");
  };

  return (
    <SafeAreaView
      edges={[]}
      className="flex-1 bg-[#141619]"
      style={{ backgroundColor: "#141619" }}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <TouchableOpacity
        activeOpacity={1}
        onPress={handleNext}
        className="flex-1 w-full items-center justify-center"
      >
        {/* LOGO TALEX CHÍNH GIỮA TUYỆT ĐỐI KHÔNG CÓ KHUNG BAO VÀ KHÔNG CÓ THANH TIẾN TRÌNH */}
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }}
          className="items-center justify-center"
        >
          <Image
            source={require("@assets/icon.png")}
            className="w-52 h-52"
            resizeMode="contain"
          />
        </Animated.View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
