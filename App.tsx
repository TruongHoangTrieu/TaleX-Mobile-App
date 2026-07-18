import RootNavigator from "./src/navigation/RootNavigator";
import "./global.css";
import { AuthProvider } from "@/context/AuthContext";
import { RewardProvider } from "@/context/RewardContext";
import { useEffect } from "react";
import mobileAds from "react-native-google-mobile-ads";
import Toast from "react-native-toast-message";

export default function App() {
  useEffect(() => {
    mobileAds()
      .initialize()
      .then(() => {
        console.log("[AdMob] SDK Initialized Successfully");
      })
      .catch((error) => {
        console.error("[AdMob] SDK Initialization Error:", error);
      });
  }, []);

  return (
    <AuthProvider>
      <RewardProvider>
        <RootNavigator />
        <Toast />
      </RewardProvider>
    </AuthProvider>
  );
}
