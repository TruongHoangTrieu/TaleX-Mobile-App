import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMovieById, allMovies } from "./movieMockData";

type MovieDetailRouteParams = {
  movieId?: string;
};

function MoviePlayer({ videoUrl }: { videoUrl: string }) {
  const player = useVideoPlayer(videoUrl, (playerInstance) => {
    playerInstance.play();
  });

  return (
    <VideoView
      player={player}
      style={{ width: "100%", height: "100%" }}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
}

export default function MovieDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { movieId } = (route.params || {}) as MovieDetailRouteParams;
  const movie = getMovieById(movieId);

  const [tab, setTab] = useState<"episodes" | "recommend">("episodes");
  const [activeEpisodeIndex, setActiveEpisodeIndex] = useState(0);

  // Reset active episode when movieId changes
  useEffect(() => {
    setActiveEpisodeIndex(0);
  }, [movieId]);

  const currentEpisode = movie.episodes[activeEpisodeIndex] || movie.episodes[0];
  const videoUrl = currentEpisode?.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4";

  const recommendations = allMovies.filter((m) => m.id !== movie.id).slice(0, 4);

  return (
    <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-[#141210]">
      <StatusBar barStyle="light-content" />

      {/* ================= HEADER WITH BACK BUTTON ================= */}
      <View className="h-[56px] px-4 flex-row items-center justify-between border-b border-white/5 bg-[#141210]">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center rounded-full bg-[#252830]"
          activeOpacity={0.75}
        >
          <Feather name="arrow-left" size={22} color="#E5E0D8" />
        </TouchableOpacity>
        <Text className="text-[#E5E0D8] text-[16px] font-bold max-w-[70%]" numberOfLines={1}>
          {movie.title}
        </Text>
        <View className="w-10" />
      </View>

      {/* ================= VIDEO PLAYER ================= */}
      <View className="w-full h-[220px] bg-black">
        <MoviePlayer key={videoUrl} videoUrl={videoUrl} />
      </View>

      {/* ================= BODY ================= */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

        {/* ===== VIP BANNER ===== */}
        <View className="flex-row justify-between items-center bg-[#D4AF37]/10 border-y border-[#D4AF37]/20 px-4 py-2">
          <View className="flex-row items-center">
            <View className="bg-[#D4AF37] px-2 py-0.5 rounded mr-2">
              <Text className="text-[#141210] text-[10px] font-bold">
                Đăng Ký Ngay
              </Text>
            </View>
            <Text className="text-[#D4AF37] font-bold text-sm">
              đ 199.000/Năm
            </Text>
          </View>

          <Text className="text-white font-bold text-xs">
            Ưu Đãi Có Hạn
          </Text>
        </View>

        {/* ===== TITLE ===== */}
        <View className="px-4 pt-4">
          <Text className="text-white text-[22px] font-bold">
            {movie.title}
          </Text>

          {/* META INFO */}
          <View className="flex-row flex-wrap items-center mt-2">
            <Text className="text-[#D4AF37] font-bold mr-3">⭐ {movie.rating}</Text>

            <View className="bg-[#252830] px-2 py-1 rounded mr-2">
              <Text className="text-[#7C766B] text-xs">{movie.year}</Text>
            </View>

            <View className="bg-[#252830] px-2 py-1 rounded mr-2">
              <Text className="text-[#7C766B] text-xs">{movie.ageRating}</Text>
            </View>

            <View className="bg-[#252830] px-2 py-1 rounded mr-2">
              <Text className="text-[#7C766B] text-xs">{movie.translation}</Text>
            </View>

            <Text className="text-[#B5AFA5] text-xs">
              {movie.regionAndGenre}
            </Text>
          </View>

          {/* ===== DESCRIPTION ===== */}
          <View className="mt-3">
            <Text className="text-[#7C766B] text-sm leading-5">
              {movie.description}
            </Text>
          </View>

          {/* ===== ACTION ICONS ===== */}
          <View className="flex-row mt-4">
            <TouchableOpacity className="flex-row items-center mr-6">
              <Feather name="download" size={20} color="#E5E0D8" />
              <Text className="text-[#E5E0D8] text-xs ml-2">Tải về</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center mr-6">
              <Feather name="plus" size={20} color="#E5E0D8" />
              <Text className="text-[#E5E0D8] text-xs ml-2">Danh sách</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center">
              <Feather name="share-2" size={20} color="#E5E0D8" />
              <Text className="text-[#E5E0D8] text-xs ml-2">Chia sẻ</Text>
            </TouchableOpacity>
          </View>

          <View className="h-[1px] bg-[#252830] mt-4" />
        </View>

        {/* ================= ACTORS ================= */}
        <View className="mt-4 px-4">
          <Text className="text-white font-bold mb-2">Diễn viên</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {movie.actors.map((actor, i) => (
              <View key={i} className="mr-4 items-center">
                <View className="w-14 h-14 bg-[#252830] rounded-full items-center justify-center border border-white/5">
                  <Feather name="user" size={24} color="#7C766B" />
                </View>
                <Text className="text-[#7C766B] text-xs mt-1.5 font-medium text-center w-16" numberOfLines={1}>
                  {actor.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ================= TABS ================= */}
        <View className="flex-row px-4 mt-5">
          <TouchableOpacity
            onPress={() => setTab("episodes")}
            className="mr-6"
            activeOpacity={0.7}
          >
            <Text
              className={`font-bold ${
                tab === "episodes" ? "text-white" : "text-[#7C766B]"
              }`}
            >
              Chọn tập ({movie.episodes.length})
            </Text>
            {tab === "episodes" && (
              <View className="h-[2px] w-8 bg-[#D4AF37] mt-1" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTab("recommend")}
            activeOpacity={0.7}
          >
            <Text
              className={`font-bold ${
                tab === "recommend" ? "text-white" : "text-[#7C766B]"
              }`}
            >
              Đề xuất cho bạn
            </Text>
            {tab === "recommend" && (
              <View className="h-[2px] w-8 bg-[#D4AF37] mt-1" />
            )}
          </TouchableOpacity>
        </View>

        {/* ================= TAB CONTENT ================= */}
        <View className="px-4 mt-4 pb-20">

          {/* ===== EPISODES ===== */}
          {tab === "episodes" ? (
            <>
              <Text className="text-[#7C766B] text-xs">
                Cập nhật đầy đủ · VIP cập nhật nhanh hơn
              </Text>

              <View className="mt-4">
                {movie.episodes.map((ep, i) => {
                  const isActive = activeEpisodeIndex === i;
                  return (
                    <TouchableOpacity
                      key={ep.title}
                      onPress={() => setActiveEpisodeIndex(i)}
                      className={`p-3.5 rounded-xl mb-2 flex-row justify-between items-center border border-white/5 ${
                        isActive ? "bg-[#D4AF37]" : "bg-[#252830]"
                      }`}
                      activeOpacity={0.8}
                    >
                      <Text className={isActive ? "text-[#141210] font-bold" : "text-white"}>
                        {ep.title}
                      </Text>
                      {isActive ? (
                        <Feather name="pause" size={14} color="#141210" />
                      ) : (
                        <Feather name="play" size={14} color="#7C766B" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : (
            <>
              {/* ===== RECOMMENDATIONS ===== */}
              {recommendations.map((rec) => (
                <TouchableOpacity
                  key={rec.id}
                  onPress={() => {
                    navigation.replace("MovieDetailScreen", { movieId: rec.id });
                  }}
                  className="bg-[#252830] p-3 rounded-xl mb-3 flex-row items-center border border-white/5"
                  activeOpacity={0.85}
                >
                  <Image
                    source={rec.image}
                    className="w-[100px] h-[60px] rounded-lg mr-3 bg-zinc-800"
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <Text className="text-white font-bold" numberOfLines={1}>
                      {rec.title}
                    </Text>
                    <Text className="text-[#7C766B] text-xs mt-1">
                      ⭐ {rec.rating} · {rec.category}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color="#7C766B" />
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}