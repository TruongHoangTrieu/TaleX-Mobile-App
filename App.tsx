import RootNavigator from "./src/navigation/RootNavigator";
import "./global.css";
import { AuthProvider } from "@/context/AuthContext";
import { RewardProvider } from "@/context/RewardContext";
import { configureReanimatedLogger, ReanimatedLogLevel } from "react-native-reanimated";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});
// import Toast from "react-native-toast-message";

export default function App() {
  return (
    <AuthProvider>
      <RewardProvider>
        <RootNavigator />
      </RewardProvider>
    </AuthProvider>
  );
}
