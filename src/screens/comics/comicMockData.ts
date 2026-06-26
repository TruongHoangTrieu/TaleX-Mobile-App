import { ImageSourcePropType } from "react-native";

export type ComicChapter = {
  title: string;
  episodes: string[];
};

export type ComicItem = {
  id: string;
  title: string;
  image: ImageSourcePropType;
  tag?: string;
  category: string;
  author: string;
  status: string;
  views: string;
  rating: string;
  chapters: ComicChapter[];
  description: string;
};

const makeChapters = (titles: string[]): ComicChapter[] =>
  titles.map((title, index) => ({
    title,
    episodes: [
      `Tập ${index * 3 + 1}`,
      `Tập ${index * 3 + 2}`,
      `Tập ${index * 3 + 3}`,
    ],
  }));

export const comicCategories = [
  "Tất cả",
  "Shounen",
  "Romance",
  "Manga",
  "Manhua",
  "Manhwa",
  "Kinh dị",
  "Hài hước",
];

export const newComics: ComicItem[] = [
  {
    id: "nc1",
    title: "One Piece - Wano Arc",
    image: require("@assets/comic8.jpg"),
    tag: "Ch.1100",
    category: "Shounen",
    author: "Eiichiro Oda",
    status: "Đang tiến hành",
    views: "980K",
    rating: "4.9",
    chapters: makeChapters(["Chương 1098", "Chương 1099", "Chương 1100"]),
    description:
      "Cuộc phiêu lưu tại Wano bước vào giai đoạn cao trào khi băng Mũ Rơm đối mặt những thử thách lớn nhất.",
  },
  {
    id: "nc2",
    title: "Thám Tử Lừng Danh Conan",
    image: require("@assets/comic7.webp"),
    tag: "Ch.1125",
    category: "Manga",
    author: "Gosho Aoyama",
    status: "Đang tiến hành",
    views: "760K",
    rating: "4.8",
    chapters: makeChapters(["Chương 1123", "Chương 1124", "Chương 1125"]),
    description:
      "Những vụ án bí ẩn tiếp tục được Conan phá giải bằng suy luận sắc bén và các manh mối tưởng chừng nhỏ nhặt.",
  },
  {
    id: "nc3",
    title: "Chú Thuật Hồi Chiến",
    image: require("@assets/comic9.jpg"),
    tag: "Ch.260",
    category: "Shounen",
    author: "Gege Akutami",
    status: "Đang tiến hành",
    views: "650K",
    rating: "4.7",
    chapters: makeChapters(["Chương 258", "Chương 259", "Chương 260"]),
    description:
      "Cuộc chiến giữa các chú thuật sư và lời nguyền ngày càng khốc liệt, kéo theo những lựa chọn không thể quay đầu.",
  },
];

export const recommendedComics: ComicItem[] = [
  {
    id: "rc1",
    title: "Pokémon TCG Special",
    image: require("@assets/comic1.webp"),
    tag: "Hot",
    category: "Hài hước",
    author: "TaleX Studio",
    status: "Hoàn thành",
    views: "210K",
    rating: "4.5",
    chapters: makeChapters(["Chương 1", "Chương 2", "Chương 3"]),
    description:
      "Một câu chuyện vui nhộn xoay quanh những trận đấu thẻ bài, tình bạn và các khoảnh khắc bất ngờ.",
  },
  {
    id: "rc2",
    title: "Thanh Gươm Diệt Quỷ",
    image: require("@assets/comic2.webp"),
    tag: "Top 1",
    category: "Shounen",
    author: "Koyoharu Gotouge",
    status: "Hoàn thành",
    views: "1.2M",
    rating: "4.9",
    chapters: makeChapters(["Chương 203", "Chương 204", "Chương 205"]),
    description:
      "Hành trình của Tanjiro và những người bạn trong cuộc chiến chống lại quỷ dữ đầy cảm xúc.",
  },
  {
    id: "rc3",
    title: "Câu Chuyện Tình Cảm",
    image: require("@assets/comic3.webp"),
    tag: "Độc Quyền",
    category: "Romance",
    author: "TaleX Original",
    status: "Đang tiến hành",
    views: "180K",
    rating: "4.6",
    chapters: makeChapters(["Chương 12", "Chương 13", "Chương 14"]),
    description:
      "Một chuyện tình nhẹ nhàng với những hiểu lầm, rung động đầu đời và sự trưởng thành của hai nhân vật chính.",
  },
];

export const comboComics: ComicItem[] = [
  {
    id: "cb1",
    title: "Combo Trọn Bộ Pokémon",
    image: require("@assets/comic4.webp"),
    tag: "-30%",
    category: "Hài hước",
    author: "TaleX Studio",
    status: "Hoàn thành",
    views: "320K",
    rating: "4.4",
    chapters: makeChapters(["Tập 1", "Tập 2", "Tập 3"]),
    description:
      "Bộ sưu tập trọn gói dành cho độc giả yêu thích thế giới Pokémon vui nhộn và giàu màu sắc.",
  },
  {
    id: "cb2",
    title: "Combo One Piece Tập 1-50",
    image: require("@assets/comic5.webp"),
    tag: "Combo",
    category: "Shounen",
    author: "Eiichiro Oda",
    status: "Hoàn thành",
    views: "890K",
    rating: "4.9",
    chapters: makeChapters(["Tập 1", "Tập 25", "Tập 50"]),
    description:
      "Khởi đầu huyền thoại của băng Mũ Rơm, từ những người bạn đầu tiên tới các cuộc phiêu lưu trên đại hải trình.",
  },
  {
    id: "cb3",
    title: "Combo Yu-Gi-Oh! Hoài Niệm",
    image: require("@assets/comic6.webp"),
    tag: "-20%",
    category: "Manga",
    author: "Kazuki Takahashi",
    status: "Hoàn thành",
    views: "410K",
    rating: "4.7",
    chapters: makeChapters(["Tập 1", "Tập 10", "Tập 20"]),
    description:
      "Những trận đấu bài kịch tính và ký ức tuổi thơ trở lại qua bộ truyện kinh điển về tình bạn và chiến thuật.",
  },
];

export const allComics = [...newComics, ...recommendedComics, ...comboComics];

export const getComicById = (id?: string) =>
  allComics.find((comic) => comic.id === id) || allComics[0];
