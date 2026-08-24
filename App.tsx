import RootNavigator from "./src/navigation/RootNavigator";
import "./global.css";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { RewardProvider } from "@/context/RewardContext";
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});
import Toast from "react-native-toast-message";
import { toastConfig } from "@/components/toastConfig";

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RewardProvider>
          <RootNavigator />
          <Toast config={toastConfig} />
        </RewardProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
