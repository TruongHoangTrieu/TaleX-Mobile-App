import { ImageSourcePropType } from "react-native";

export interface MediaItem {
  id: string;
  title: string;
  image: ImageSourcePropType;
  subtitle?: string;
  category: string; // Thêm thuộc tính thể loại để phục vụ bộ lọc hệ thống
}

// 1. DATA TRUYỆN TRANH XU HƯỚNG 🔥
export const trendingComics: MediaItem[] = [
  { id: "tc1", title: "Ma Tôn Khốn Khổ", image: require("@assets/comic1.webp"), category: "Tiểu Thuyết" },
  { id: "tc2", title: "Vương Gia Thất Sủng Nuôi Vợ Béo", image: require("@assets/comic2.webp"), category: "Tình Cảm" },
  { id: "tc3", title: "Độc Phi Muốn Bỏ Chồng", image: require("@assets/comic3.webp"), category: "Tình Cảm" },
];

// 2. DATA PHIM BỘ HOT TRONG TUẦN 🎬
export const hotMovies: MediaItem[] = [
  { id: "hm1", title: "Ma Tôn Bản Truyền Kỳ", subtitle: "Tập 1120 Vietsub", image: require("@assets/movie1.jpg"), category: "Phim Bộ" },
  { id: "hm2", title: "Võ Thần Chí Tôn", subtitle: "Phần mới · Bản Đẹp", image: require("@assets/movie2.jpg"), category: "Viễn Tưởng" },
  { id: "hm3", title: "Tiểu Thư Ác Độc Đại Chiến", subtitle: "Trọn bộ 105 phút", image: require("@assets/movie3.jpg"), category: "Tình Cảm" },
];

// 3. DATA NỘI DUNG MỚI CẬP NHẬT 📚
export const freshComics: MediaItem[] = [
  { id: "fc1", title: "Đại Đạo Triều Thiên", image: require("@assets/comic2.webp"), category: "Viễn Tưởng" },
  { id: "fc2", title: "Tuyệt Thế Đường Môn", image: require("@assets/comic3.webp"), category: "Viễn Tưởng" },
  { id: "fc3", title: "Nhật Ký Sống Sót Của Nữ Phụ", image: require("@assets/comic1.webp"), category: "Tình Cảm" },
];

// 4. DATA BẢNG XẾP HẠNG SIÊU CẤP 🏆
export const topRankMovies: MediaItem[] = [
  { id: "rm1", title: "Đấu La Đại Lục 3D", subtitle: "Top 1 Thịnh Hành", image: require("@assets/movie3.jpg"), category: "Viễn Tưởng" },
  { id: "rm2", title: "Thế Giới Hoàn Mỹ", subtitle: "Top 2 Lượt Xem", image: require("@assets/movie1.jpg"), category: "Viễn Tưởng" },
  { id: "rm3", title: "Thần Ấn Vương Tọa", subtitle: "Top 3 Đánh Giá", image: require("@assets/movie2.jpg"), category: "Phim Bộ" },
];
