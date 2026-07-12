import RootNavigator from "./src/navigation/RootNavigator";
import "./global.css";
import { AuthProvider } from "@/context/AuthContext";
import { RewardProvider } from "@/context/RewardContext";
import Toast from "react-native-toast-message";

export default function App() {
  return (
    <AuthProvider>
      <RewardProvider>
        <RootNavigator />
        <Toast />
      </RewardProvider>
    </AuthProvider>
  );
}
