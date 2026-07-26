import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StatusBar,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 36) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.48;

export interface TopMovieItem {
  id: string;
  title: string;
  rating: string;
  imageUri: string;
  fallbackImage: any;
  category?: string;
}

const top10Movies: TopMovieItem[] = [
  {
    id: "top-1",
    title: "Deadpool & Wolverine",
    rating: "9.8",
    imageUri: "https://image.tmdb.org/t/p/w500/8cdWjvZStA1YIu903sYgGlzHedT.jpg",
    fallbackImage: require("@assets/movie1.jpg"),
    category: "Hành Động / Hài",
  },
  {
    id: "top-2",
    title: "Oppenheimer",
    rating: "9.7",
    imageUri: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGvC4M2q6v5.jpg",
    fallbackImage: require("@assets/movie2.jpg"),
    category: "Tiểu Sử / Drama",
  },
  {
    id: "top-3",
    title: "Captain Marvel",
    rating: "9.6",
    imageUri: "https://image.tmdb.org/t/p/w500/A02WvFWGR2V0FzavVw2E3BMvY4E.jpg",
    fallbackImage: require("@assets/movie3.jpg"),
    category: "Viễn Tưởng / Marvel",
  },
  {
    id: "top-4",
    title: "Vikings",
    rating: "9.5",
    imageUri: "https://image.tmdb.org/t/p/w500/bQLrHIRwqkPdpBhG2zDqkwKVy4B.jpg",
    fallbackImage: require("@assets/movi8.jpg"),
    category: "Hành Động / Lịch Sử",
  },
  {
    id: "top-5",
    title: "Spider-Man: No Way Home",
    rating: "9.4",
    imageUri: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLZ.jpg",
    fallbackImage: require("@assets/movie7.jpg"),
    category: "Hành Động / Marvel",
  },
  {
    id: "top-6",
    title: "Sonic the Hedgehog 2",
    rating: "9.2",
    imageUri: "https://image.tmdb.org/t/p/w500/6DrHO1sgjhqXttiPhf8yud8UtYR.jpg",
    fallbackImage: require("@assets/movie9.png"),
    category: "Hoạt Hình / Phiêu Lưu",
  },
  {
    id: "top-7",
    title: "Avatar: The Way of Water",
    rating: "9.1",
    imageUri: "https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
    fallbackImage: require("@assets/movie5.jpg"),
    category: "Viễn Tưởng / Phiêu Lưu",
  },
  {
    id: "top-8",
    title: "Guardians of the Galaxy Vol. 3",
    rating: "9.0",
    imageUri: "https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1YyE5hY9yU.jpg",
    fallbackImage: require("@assets/movie6.webp"),
    category: "Viễn Tưởng / Marvel",
  },
  {
    id: "top-9",
    title: "Avengers: Endgame",
    rating: "8.9",
    imageUri: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9vKoWRwwoW.jpg",
    fallbackImage: require("@assets/movie4.webp"),
    category: "Hành Động / Marvel",
  },
  {
    id: "top-10",
    title: "The Batman",
    rating: "8.8",
    imageUri: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
    fallbackImage: require("@assets/movie1_bg.webp"),
    category: "Hành Động / Trinh Thám",
  },
];

function MovieCard({
  item,
  onPress,
}: {
  item: TopMovieItem;
  onPress: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={{ width: CARD_WIDTH, marginBottom: 14 }}
    >
      <View
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
        className="rounded-2xl overflow-hidden bg-zinc-900 border border-stone-800/70 relative shadow-lg"
      >
        <Image
          source={imgErr ? item.fallbackImage : { uri: item.imageUri }}
          onError={() => setImgErr(true)}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* Huy hiệu IMDb góc trên bên trái */}
        <View className="absolute top-2.5 left-2.5 flex-row items-center bg-black/60 backdrop-blur-md px-1.5 py-1 rounded-md border border-white/10">
          <View className="bg-[#F5C518] px-1 py-0.5 rounded-sm mr-1.5">
            <Text className="text-black text-[9px] font-black tracking-tight">
              IMDb
            </Text>
          </View>
          <Text className="text-white font-extrabold text-[11px]">
            {item.rating}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function Top10MoviesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleMoviePress = (item: TopMovieItem) => {
    (navigation.navigate as any)("MovieDetailScreen", {
      movieId: item.id,
      movieTitle: item.title,
      movieImage: { uri: item.imageUri },
    });
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      className="flex-1 bg-[#141619]"
      style={{ backgroundColor: "#141619" }}
    >
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Thanh Header Top Bar */}
      <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-stone-800/40">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center rounded-full bg-stone-900/60"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <Text className="text-white text-lg font-bold tracking-tight text-center">
          Top 10 Movies Tuần Này
        </Text>

        <View className="w-10" />
      </View>

      {/* Danh sách Phim Lưới 2 cột */}
      <FlatList
        data={top10Movies}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <MovieCard item={item} onPress={() => handleMoviePress(item)} />
        )}
        columnWrapperStyle={{
          justifyContent: "space-between",
          paddingHorizontal: 12,
        }}
        contentContainerStyle={{
          paddingTop: 14,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
