import { ImageSourcePropType } from "react-native";

export type MovieActor = {
  name: string;
  avatar?: ImageSourcePropType;
};

export type MovieEpisode = {
  title: string;
  videoUrl: string;
};

export type MovieItem = {
  id: string;
  title: string;
  image: ImageSourcePropType;
  subtitle?: string;
  category: string;
  rating: string;
  year: string;
  ageRating: string;
  translation: string;
  regionAndGenre: string;
  description: string;
  actors: MovieActor[];
  episodes: MovieEpisode[];
};

export const movieCategories = ["Đề xuất", "Phim Bộ", "Viễn Tưởng", "Tình Cảm", "Tiểu Thuyết"];

const defaultActors: MovieActor[] = [
  { name: "Tiêu Chiến" },
  { name: "Vương Nhất Bác" },
  { name: "Triệu Lệ Dĩnh" },
  { name: "Dương Tử" },
  { name: "Địch Lệ Nhiệt Ba" },
];

const makeEpisodes = (count: number): MovieEpisode[] =>
  Array.from({ length: count }).map((_, i) => ({
    title: `Tập ${i + 1}`,
    videoUrl: "https://vjs.zencdn.net/v/oceans.mp4",
  }));

export const trendingMovies: MovieItem[] = [
  {
    id: "tm1",
    title: "Ma Tôn Bản Truyền Kỳ",
    subtitle: "Tập 12 Vietsub",
    image: require("@assets/comic4.webp"),
    category: "Phim Bộ",
    rating: "9.8",
    year: "2026",
    ageRating: "T16",
    translation: "Vietsub",
    regionAndGenre: "Trung Quốc · Tiên Hiệp",
    description: "Câu chuyện xoay quanh Ma Tôn sau khi trùng sinh quyết tâm tìm lại chính nghĩa và bảo vệ tam giới trước những âm mưu tàn độc.",
    actors: defaultActors,
    episodes: makeEpisodes(12),
  },
  {
    id: "tm2",
    title: "Võ Thần Chí Tôn",
    subtitle: "Phần mới · Bản Đẹp",
    image: require("@assets/movie2.jpg"),
    category: "Viễn Tưởng",
    rating: "9.5",
    year: "2025",
    ageRating: "T13",
    translation: "Thuyết minh",
    regionAndGenre: "Trung Quốc · Huyền Huyễn",
    description: "Hành trình tu luyện đầy gian khổ của Diệp Thần để bước lên đỉnh cao võ học, trở thành vị Võ Thần tối cao cứu rỗi thế giới.",
    actors: defaultActors,
    episodes: makeEpisodes(24),
  },
  {
    id: "tm3",
    title: "Tiểu Thư Ác Độc Đại Chiến",
    subtitle: "Trọn bộ 105 phút",
    image: require("@assets/movie3.jpg"),
    category: "Tình Cảm",
    rating: "9.2",
    year: "2026",
    ageRating: "T13",
    translation: "Phụ đề",
    regionAndGenre: "Hàn Quốc · Lãng Mạn",
    description: "Một câu chuyện tình yêu đầy gây cấn và hài hước giữa một tiểu thư thông minh và chàng tổng tài lạnh lùng.",
    actors: defaultActors,
    episodes: makeEpisodes(1),
  },
];

export const animeHotMovies: MovieItem[] = [
  {
    id: "am1",
    title: "Thanh Gươm Diệt Quỷ",
    subtitle: "Movie · Bản Đẹp",
    image: require("@assets/movie1.jpg"),
    category: "Phim Bộ",
    rating: "9.9",
    year: "2024",
    ageRating: "T16",
    translation: "Phụ đề",
    regionAndGenre: "Nhật Bản · Kỳ Ảo",
    description: "Tanjiro cùng các Trụ cột bước vào trận chiến sinh tử chống lại chúa quỷ Muzan trong Vô Hạn Thành.",
    actors: [
      { name: "Natsuki Hanae" },
      { name: "Akari Kito" },
      { name: "Yoshitsugu Matsuoka" },
      { name: "Hiro Shimono" },
    ],
    episodes: makeEpisodes(5),
  },
  {
    id: "am2",
    title: "Chú Thuật Hồi Chiến 0",
    subtitle: "Vietsub Full",
    image: require("@assets/movi8.jpg"),
    category: "Viễn Tưởng",
    rating: "9.7",
    year: "2023",
    ageRating: "T16",
    translation: "Vietsub",
    regionAndGenre: "Nhật Bản · Hành Động",
    description: "Câu chuyện về Yuta Okkotsu và lời nguyền cấp đặc biệt của người bạn thuở nhỏ Rika.",
    actors: [
      { name: "Megumi Ogata" },
      { name: "Kana Hanazawa" },
      { name: "Mikitaka Kobayashi" },
    ],
    episodes: makeEpisodes(1),
  },
  {
    id: "am3",
    title: "Đại Chiến Titan Final",
    subtitle: "Tập Cuối HD",
    image: require("@assets/movie7.jpg"),
    category: "Viễn Tưởng",
    rating: "9.9",
    year: "2024",
    ageRating: "T18",
    translation: "Vietsub",
    regionAndGenre: "Nhật Bản · Hành Động",
    description: "Hành trình đen tối của Eren Yeager đi đến hồi kết, quyết định vận mệnh của toàn bộ nhân loại.",
    actors: [
      { name: "Yuki Kaji" },
      { name: "Yui Ishikawa" },
      { name: "Marina Inoue" },
    ],
    episodes: makeEpisodes(2),
  },
];

export const newSeriesMovies: MovieItem[] = [
  {
    id: "nm1",
    title: "Trường Ca Hành",
    subtitle: "40/40",
    image: require("@assets/movie3.jpg"),
    category: "Tiểu Thuyết",
    rating: "9.3",
    year: "2021",
    ageRating: "T13",
    translation: "Thuyết minh",
    regionAndGenre: "Trung Quốc · Cổ Trang",
    description: "Công chúa Lý Trường Ca lưu lạc giang hồ sau biến cố gia đình, tìm cách phục thù và bảo vệ đất nước.",
    actors: defaultActors,
    episodes: makeEpisodes(40),
  },
  {
    id: "nm2",
    title: "Cú Đấm Saphire Xanh",
    subtitle: "Tập 24",
    image: require("@assets/movie9.png"),
    category: "Viễn Tưởng",
    rating: "9.4",
    year: "2019",
    ageRating: "T13",
    translation: "Lồng tiếng",
    regionAndGenre: "Nhật Bản · Trinh Thám",
    description: "Vụ án mạng bí ẩn tại Singapore liên quan đến viên đá quý Sapphire Xanh huyền thoại cùng sự đối đầu giữa Conan và Siêu trộm Kid.",
    actors: [
      { name: "Minami Takayama" },
      { name: "Kappei Yamaguchi" },
    ],
    episodes: makeEpisodes(1),
  },
  {
    id: "nm3",
    title: "Trầm Vụn Hương Phai",
    subtitle: "Vietsub",
    image: require("@assets/movie2.jpg"),
    category: "Tình Cảm",
    rating: "9.6",
    year: "2022",
    ageRating: "T13",
    translation: "Vietsub",
    regionAndGenre: "Trung Quốc · Cổ Trang",
    description: "Mối tình khắc cốt ghi tâm đầy bi thương nhưng không kém phần ngọt ngào giữa Nhan Đàm và Ứng Uyên Đế Quân.",
    actors: defaultActors,
    episodes: makeEpisodes(38),
  },
];

export const allMovies = [...trendingMovies, ...animeHotMovies, ...newSeriesMovies];

export const getMovieById = (id?: string): MovieItem =>
  allMovies.find((m) => m.id === id) || trendingMovies[0];
