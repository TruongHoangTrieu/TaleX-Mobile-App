import BottomNavigation from "@/components/BottomNavigation";
import ComicsScreen from "@/screens/comics/ComicsScreen";
import HomeScreen from "@/screens/home/HomeScreen";
import MoviesScreen from "@/screens/movies/MoviesScreen";
import ProfileScreen from "@/screens/profile/ProfileScreen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <BottomNavigation {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Comics" component={ComicsScreen} />
      <Tab.Screen name="Movies" component={MoviesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}