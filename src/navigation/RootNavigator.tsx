import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";
import SearchScreen from "@screens/SearchScreen";
import LoginScreen from "@screens/auth/LoginScreen";
import RegisterScreen from "@screens/auth/RegisterScreen";
import ForgotPasswordScreen from "@/screens/auth/ForgotPasswordScreen";
import OtpVerifyScreen from "@/screens/auth/OtpVerifyScreen";
import GoogleCompleteProfileScreen from "@/screens/auth/GoogleCompleteProfileScreen";
import OnboardingScreen from "@/screens/auth/OnboardingScreen";
import SplashScreen from "@/screens/auth/SplashScreen";
import EditProfileScreen from "@/screens/profile/EditProfileScreen";
import ComicDetailScreen from "@/screens/comics/ComicDetailScreen";
import ComicReaderScreen from "@/screens/comics/ComicReaderScreen";
import MovieDetailScreen from "@/screens/movies/MovieDetailScreen";
import MoviePlayerScreen from "@/screens/movies/MoviePlayerScreen";
import Top10MoviesScreen from "@/screens/movies/Top10MoviesScreen";
import CreatorGuardScreen from "@/screens/creator/CreatorGuardScreen";
import CreatorDashboardScreen from "@/screens/creator/CreatorDashboardScreen";
import CreatorChannelScreen from "@/screens/creator/CreatorChannelScreen";
import PublicChannelScreen from "@/screens/channel/PublicChannelScreen";
import CreatorMonetizationScreen from "@/screens/creator/CreatorMonetizationScreen";
import SubscriptionPlansScreen from "@/screens/subscription/SubscriptionPlansScreen";
import CheckoutScreen from "@/screens/checkout/CheckoutScreen";
import UploadMovieScreen from "@/screens/creator/UploadMovieScreen";
import UploadComicScreen from "@/screens/creator/UploadComicScreen";
import CoinCenterScreen from "@/screens/rewards/CoinCenterScreen";
import LikedScreen from "@/screens/profile/LikedScreen";
import SubscriptionsScreen from "@/screens/profile/SubscriptionsScreen";
import BookmarkedScreen from "@/screens/profile/BookmarkedScreen";
import HistoryScreen from "@/screens/profile/HistoryScreen";
import { navigationRef } from "./navigationRef";
import type { SeriesItem } from "@/services/series";

export type RootStackParamList = {
  Splash: undefined;
  MainTabs: { screen?: "Home" | "Comics" | "Movies" | "Profile" } | undefined;
  Search: undefined;
  LoginScreen: undefined;
  RegisterScreen: undefined;
  ForgotPasswordScreen: undefined;
  OtpVerify:
    | {
        email?: string;
        verificationToken?: string;
      }
    | undefined;
  GoogleCompleteProfile: {
    verificationToken: string;
  };
  OnboardingScreen: undefined;
  EditProfileScreen: undefined;
  LikedScreen: undefined;
  SubscriptionsScreen: undefined;
  BookmarkedScreen: undefined;
  HistoryScreen: undefined;
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
        movieTitle?: string;
        movieImage?: any;
      }
    | undefined;
  MoviePlayer:
    | {
        movieId?: string;
        movieTitle?: string;
        seasonId?: string;
        episodeId?: string;
        episodeTitle?: string;
        episodeIndex?: number;
        episodesList?: any[];
      }
    | undefined;
  Top10Movies: undefined;
  CreatorGuard: undefined;
  CreatorDashboard: undefined;
  CreatorChannel: { creatorId?: string } | undefined;
  PublicChannel: { creatorId?: string } | undefined;
  CreatorMonetization: undefined;
  SubscriptionPlans: undefined;
  CoinCenter: undefined;
  UploadMovie: undefined;
  UploadComic: undefined;
  /** Coin-only checkout for Episode/Combo. Premium and fiat purchases redirect to the website instead. */
  Checkout: {
    itemId: string;
    itemType: "EPISODE" | "COMBO";
    title?: string;
    returnScreen?: keyof RootStackParamList;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        <Stack.Screen
          name="ForgotPasswordScreen"
          component={ForgotPasswordScreen}
        />
        <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
        <Stack.Screen
          name="GoogleCompleteProfile"
          component={GoogleCompleteProfileScreen}
        />
        <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
        <Stack.Screen name="LikedScreen" component={LikedScreen} />
        <Stack.Screen
          name="SubscriptionsScreen"
          component={SubscriptionsScreen}
        />
        <Stack.Screen name="BookmarkedScreen" component={BookmarkedScreen} />
        <Stack.Screen name="HistoryScreen" component={HistoryScreen} />
        <Stack.Screen name="ComicDetailScreen" component={ComicDetailScreen} />
        <Stack.Screen name="MovieDetailScreen" component={MovieDetailScreen} />
        <Stack.Screen name="Top10Movies" component={Top10MoviesScreen} />
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
          name="CoinCenter"
          component={CoinCenterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
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
          name="PublicChannel"
          component={PublicChannelScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreatorMonetization"
          component={CreatorMonetizationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ComicReader"
          component={ComicReaderScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MoviePlayer"
          component={MoviePlayerScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
