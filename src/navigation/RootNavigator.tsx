import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";
import SearchScreen from "@screens/SearchScreen";
import LoginScreen from "@screens/auth/LoginScreen";
import RegisterScreen from "@screens/auth/RegisterScreen";
import OtpVerifyScreen from "@/screens/auth/OtpVerifyScreen";
import GoogleCompleteProfileScreen from "@/screens/auth/GoogleCompleteProfileScreen";
import EditProfileScreen from "@/screens/profile/EditProfileScreen";
import ComicDetailScreen from "@/screens/comics/ComicDetailScreen";
import ComicReaderScreen from "@/screens/comics/ComicReaderScreen";
import MovieDetailScreen from "@/screens/movies/MovieDetailScreen";
import CreatorGuardScreen from "@/screens/creator/CreatorGuardScreen";
import CreatorDashboardScreen from "@/screens/creator/CreatorDashboardScreen";
import CreatorChannelScreen from "@/screens/creator/CreatorChannelScreen";
import SubscriptionPlansScreen from "@/screens/subscription/SubscriptionPlansScreen";
import UploadMovieScreen from "@/screens/creator/UploadMovieScreen";
import UploadComicScreen from "@/screens/creator/UploadComicScreen";
import { navigationRef } from "./navigationRef";
import type { SeriesItem } from "@/services/series";

export type RootStackParamList = {
  MainTabs: { screen?: "Home" | "Comics" | "Movies" | "Profile" } | undefined;
  Search: undefined;
  LoginScreen: undefined;
  RegisterScreen: undefined;
  OtpVerify:
    | {
        email?: string;
        verificationToken?: string;
      }
    | undefined;
  GoogleCompleteProfile: {
    verificationToken: string;
  };
  EditProfileScreen: undefined;
  ComicDetailScreen: { comicId?: string } | undefined;
  ComicReader:
    | {
        comicId?: string;
        chapterTitle?: string;
        episodeTitle?: string;
        episodeIndex?: number;
      }
    | undefined;
  MovieDetailScreen:
    | {
        movieId?: string;
        seriesItem?: SeriesItem;
      }
    | undefined;
  CreatorGuard: undefined;
  CreatorDashboard: undefined;
  CreatorChannel: undefined;
  SubscriptionPlans: undefined;
  UploadMovie: undefined;
  UploadComic: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
        <Stack.Screen
          name="GoogleCompleteProfile"
          component={GoogleCompleteProfileScreen}
        />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
        <Stack.Screen name="ComicDetailScreen" component={ComicDetailScreen} />
        <Stack.Screen name="MovieDetailScreen" component={MovieDetailScreen} />
        <Stack.Screen
          name="CreatorGuard"
          component={CreatorGuardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreatorDashboard"
          component={CreatorDashboardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SubscriptionPlans"
          component={SubscriptionPlansScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="UploadMovie"
          component={UploadMovieScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="UploadComic"
          component={UploadComicScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreatorChannel"
          component={CreatorChannelScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ComicReader"
          component={ComicReaderScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
