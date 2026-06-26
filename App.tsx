import RootNavigator from "./src/navigation/RootNavigator";
import "./global.css";
import { AuthProvider } from "@/context/AuthContext";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/config/toastConfig";

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />

      <Toast config={toastConfig} visibilityTime={2000} />
    </AuthProvider>
  );
}
