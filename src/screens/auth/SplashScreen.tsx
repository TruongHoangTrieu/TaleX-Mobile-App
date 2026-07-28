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

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Smooth Logo appearance & scale animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Fast transition in development mode (__DEV__) to prevent reload delays/black screens,
    // and smooth transition in Production.
    const delayDuration = __DEV__ ? 400 : 1500;

    const timer = setTimeout(() => {
      handleNext();
    }, delayDuration);

    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    // Replace Splash with MainTabs so Splash is cleanly unmounted from memory
    navigation.replace("MainTabs");
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

