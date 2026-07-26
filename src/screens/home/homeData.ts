import { ImageSourcePropType } from "react-native";

export interface MediaItem {
  id: string;
  title: string;
  image: ImageSourcePropType;
  subtitle?: string;
  category: string;
  typeBadge?: string;
  duration?: string;
  rating?: string;
  type?: "comic" | "movie";
  timeAgo?: string;
}

export interface ContinueItem {
  id: string;
  title: string;
  episodeText: string;
  progressPercentage: number;
  image: ImageSourcePropType;
  type: "comic" | "movie";
}

export interface CreatorItem {
  id: string;
  name: string;
  avatar: ImageSourcePropType;
  followerCount: string;
  topWorkTitle: string;
  isVerified: boolean;
}

export interface RankedItem {
  id: string;
  rankNumber: number;
  title: string;
  category: string;
  image: ImageSourcePropType;
  viewCount: string;
  type: "comic" | "movie";
}

// 1. DỮ LIỆU ĐANG XEM / ĐỌC DỞ (CONTINUE WATCHING & READING)
export const continueItems: ContinueItem[] = [
  {
    id: "cont-1",
    title: "Đấu La Đại Lục 3D",
    episodeText: "Tập 259 / 260",
    progressPercentage: 85,
    image: require("@assets/movie3.jpg"),
    type: "movie",
  },
  {
    id: "cont-2",
    title: "Ma Tôn Khốn Khổ",
    episodeText: "Chap 119 / 120",
    progressPercentage: 60,
    image: require("@assets/comic1.webp"),
    type: "comic",
  },
  {
    id: "cont-3",
    title: "Vân Tú Hành",
    episodeText: "Tập 13 / 14",
    progressPercentage: 40,
    image: require("@assets/movie1.jpg"),
    type: "movie",
  },
];

// 2. DỮ LIỆU TRUYỆN TRANH XU HƯỚNG 🔥
export const trendingComics: MediaItem[] = [
  { id: "tc1", title: "Ma Tôn Khốn Khổ", subtitle: "Chap 120 · Hot", image: require("@assets/comic1.webp"), category: "Tiểu Thuyết", type: "comic", rating: "9.9" },
  { id: "tc2", title: "Vương Gia Thất Sủng Nuôi Vợ Béo", subtitle: "Chap 85 · Mới", image: require("@assets/comic2.webp"), category: "Tình Cảm", type: "comic", rating: "9.8" },
  { id: "tc3", title: "Độc Phi Muốn Bỏ Chồng", subtitle: "Chap 110 · Trọn bộ", image: require("@assets/comic3.webp"), category: "Tình Cảm", type: "comic", rating: "9.7" },
  { id: "tc4", title: "Đại Đạo Triều Thiên", subtitle: "Chap 95 · Siêu Cấp", image: require("@assets/comic4.webp"), category: "Viễn Tưởng", type: "comic", rating: "9.6" },
];

// 3. DỮ LIỆU PHIM BỘ HOT TRONG TUẦN 🎬
export const hotMovies: MediaItem[] = [
  { id: "hm1", title: "Ma Tôn Bản Truyền Kỳ", subtitle: "Tập 1120 Vietsub", image: require("@assets/movie1.jpg"), category: "Phim Bộ", type: "movie", duration: "105 phút", typeBadge: "Full HD" },
  { id: "hm2", title: "Võ Thần Chí Tôn", subtitle: "Phần mới · Bản Đẹp", image: require("@assets/movie2.jpg"), category: "Viễn Tưởng", type: "movie", duration: "98 phút", typeBadge: "Vietsub" },
  { id: "hm3", title: "Tiểu Thư Ác Độc Đại Chiến", subtitle: "Trọn bộ 105 phút", image: require("@assets/movie3.jpg"), category: "Tình Cảm", type: "movie", duration: "105 phút", typeBadge: "Thuyết Minh" },
  { id: "hm4", title: "Thế Giới Hoàn Mỹ", subtitle: "Tập 150 · 4K", image: require("@assets/movie1_bg.webp"), category: "Viễn Tưởng", type: "movie", duration: "24 phút", typeBadge: "4K UHD" },
];

// 4. DỮ LIỆU TOP 10 BẢNG XẾP HẠNG SIÊU CẤP 🏆
export const topRankedItems: RankedItem[] = [
  {
    id: "rank-1",
    rankNumber: 1,
    title: "Đấu La Đại Lục 3D",
    category: "Huyền Huyễn",
    image: require("@assets/movie3.jpg"),
    viewCount: "2.4M",
    type: "movie",
  },
  {
    id: "rank-2",
    rankNumber: 2,
    title: "Ma Tôn Khốn Khổ",
    category: "Tiên Hiệp",
    image: require("@assets/comic1.webp"),
    viewCount: "1.8M",
    type: "comic",
  },
  {
    id: "rank-3",
    rankNumber: 3,
    title: "Vân Tú Hành",
    category: "Cổ Trang",
    image: require("@assets/movie1.jpg"),
    viewCount: "1.5M",
    type: "movie",
  },
  {
    id: "rank-4",
    rankNumber: 4,
    title: "Mùa Hè Nồng Nhiệt",
    category: "Tình Cảm",
    image: require("@assets/movie2.jpg"),
    viewCount: "1.2M",
    type: "movie",
  },
];

// 5. GÓC TÁC GIẢ NỔI BẬT 🌟
export const spotlightCreators: CreatorItem[] = [
  {
    id: "cr1",
    name: "Phong Thanh Dương",
    avatar: require("@assets/comic4.webp"),
    followerCount: "125.4K",
    topWorkTitle: "Ma Tôn Khốn Khổ",
    isVerified: true,
  },
  {
    id: "cr2",
    name: "Đường Gia Tam Thiếu",
    avatar: require("@assets/movie1_char.webp"),
    followerCount: "450.2K",
    topWorkTitle: "Đấu La Đại Lục",
    isVerified: true,
  },
  {
    id: "cr3",
    name: "Mặc Hương Đồng Khứu",
    avatar: require("@assets/comic5.webp"),
    followerCount: "210.8K",
    topWorkTitle: "Ma Đạo Tổ Sư",
    isVerified: true,
  },
];

// 6. DỮ LIỆU MỚI CẬP NHẬT TRONG NGÀY ⚡
export const dailyFreshItems: MediaItem[] = [
  { id: "df1", title: "Thần Ấn Vương Tọa", subtitle: "Tập 112 Mới Ra", timeAgo: "15 phút trước", image: require("@assets/movie2.jpg"), category: "Viễn Tưởng", type: "movie" },
  { id: "df2", title: "Nhật Ký Sống Sót Của Nữ Phụ", subtitle: "Chap 89 Mới Ra", timeAgo: "30 phút trước", image: require("@assets/comic2.webp"), category: "Tình Cảm", type: "comic" },
  { id: "df3", title: "Tuyệt Thế Đường Môn", subtitle: "Chap 205 Mới Ra", timeAgo: "1 giờ trước", image: require("@assets/comic3.webp"), category: "Viễn Tưởng", type: "comic" },
  { id: "df4", title: "Tẩy Tủy Kinh", subtitle: "Tập 45 Mới Ra", timeAgo: "2 giờ trước", image: require("@assets/movie1.jpg"), category: "Phim Bộ", type: "movie" },
];
