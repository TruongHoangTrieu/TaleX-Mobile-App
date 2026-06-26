import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, FlatList, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface SearchResultItem {
  id: string;
  title: string;
  type: 'comic' | 'movie'; // Phân loại rõ ràng nội dung
  image: any;
  info: string;
}

// Bảng dữ liệu mẫu để giả lập bộ lọc từ khóa "Conan"
const mockSearchDatabase: SearchResultItem[] = [
  { id: 'sc1', title: 'Thám Tử Lừng Danh Conan', type: 'comic', image: require('@assets/comic4.webp'), info: 'Truyện tranh · Chương 1125' },
  { id: 'sc2', title: 'Conan: Tàu Ngầm Sắt Màu Đen', type: 'movie', image: require('@assets/comic5.webp'), info: 'Phim điện ảnh · 110 phút' },
  { id: 'sc3', title: 'Conan Đặc Biệt: Lịch Sử Lục Địa', type: 'comic', image: require('@assets/comic6.webp'), info: 'Truyện tranh · Hoàn thành' },
  { id: 'sc4', title: 'Conan Tập Dài: Hoa Hướng Dương Bực Tức', type: 'movie', image: require('@assets/comic3.webp'), info: 'Phim bộ · Tập 5 Vietsub' },
];

const hotKeywords = ['Conan', 'One Piece', 'Thanh Gươm Diệt Quỷ', 'Vân Tú Hành', 'Mùa Hè'];

export default function SearchScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);

  // Hàm xử lý tìm kiếm thời gian thực khi gõ chữ
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setResults([]);
      return;
    }
    // Lọc không phân biệt chữ hoa chữ thường
    const filtered = mockSearchDatabase.filter(item => 
      item.title.toLowerCase().includes(text.toLowerCase())
    );
    setResults(filtered);
  };

  // Hàm render giao diện kết quả động
// Hàm render giao diện kết quả động
  const renderResultItem = ({ item }: { item: SearchResultItem }) => {
    if (item.type === 'comic') {
      // 1. KẾT QUẢ TRUYỆN TRANH: Hiển thị dạng Card đứng (Tỷ lệ ảnh dọc)
      return (
        <TouchableOpacity className="flex-row bg-zinc-900/50 p-3 mb-3 rounded-2xl border border-white/5 items-center">
          <Image source={item.image} className="w-[70px] h-[95px] rounded-xl bg-zinc-800" resizeMode="cover" />
          <View className="flex-1 ml-4 justify-center">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="book-open-blank-variant" size={13} color="#D4AF37" />
              <Text className="text-[#D4AF37] text-[10px] font-bold ml-1 tracking-wider uppercase">Truyện tranh</Text>
            </View>
            <Text className="text-white text-sm font-semibold mt-1" numberOfLines={1}>{item.title}</Text>
            <Text className="text-[#7C766B] text-xs mt-1">{item.info}</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#7C766B" className="mr-1" />
        </TouchableOpacity>
      );
    } else {
      // 2. KẾT QUẢ PHIM ẢNH: Hiển thị dạng Card Ngang (Tỷ lệ ảnh 16:9 điện ảnh)
      return (
        <TouchableOpacity className="flex-row bg-zinc-900/50 p-3 mb-3 rounded-2xl border border-white/5 items-center">
          <View className="w-[115px] h-[70px] rounded-xl overflow-hidden bg-zinc-800 relative">
            <Image source={item.image} className="w-full h-full" resizeMode="cover" />
            <View className="absolute inset-0 bg-black/10 items-center justify-center">
              <View className="w-6 h-6 bg-[#D4AF37]/90 rounded-full items-center justify-center">
                <FontAwesome5 name="play" size={8} color="#141210" style={{ marginLeft: 1 }} />
              </View>
            </View>
          </View>
          <View className="flex-1 ml-4 justify-center">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="movie-roll" size={13} color="#D4AF37" />
              <Text className="text-[#D4AF37] text-[10px] font-bold ml-1 tracking-wider uppercase">Phim ảnh</Text>
            </View>
            <Text className="text-white text-sm font-semibold mt-1" numberOfLines={1}>{item.title}</Text>
            <Text className="text-[#7C766B] text-xs mt-1">{item.info}</Text>
          </View>
          <Feather name="chevron-right" size={18} color="#7C766B" className="mr-1" />
        </TouchableOpacity>
      );
    }
  };
  
  return (
    <View className="flex-1 bg-[#141210]">
      <StatusBar barStyle="light-content" />
      
      {/* INPUT HEADER INPUT BAR */}
      <SafeAreaView edges={['top']} className="bg-[#1A1816] border-b border-white/5 pb-3">
        <View className="flex-row items-center px-4 mt-2">
          {/* Nút quay lại trang cũ */}
          <TouchableOpacity onPress={() => navigation.goBack()} className="pr-3 py-1">
            <Feather name="arrow-left" size={22} color="#E5E0D8" />
          </TouchableOpacity>
          
          {/* Ô Nhập từ khóa thật */}
          <View className="flex-1 flex-row h-10 bg-zinc-900 border border-white/10 items-center px-3 rounded-full">
            <Feather name="search" size={16} color="#7C766B" className="mr-2" />
            <TextInput
              className="flex-1 text-white text-sm h-full pt-0 pb-0"
              placeholder="Tìm kiếm phim, truyện tranh..."
              placeholderTextColor="#7C766B"
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus={true} // Tự động bật bàn phím khi mở trang
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Feather name="x-circle" size={16} color="#7C766B" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* HIỂN THỊ CẤU TRÚC NỘI DUNG */}
      {searchQuery.length === 0 ? (
        // Giao diện khi chưa gõ gì: Hiện từ khóa Hot
        <ScrollView className="flex-1 px-4 pt-6">
          <View className="flex-row items-center mb-4">
            <FontAwesome5 name="fire" size={14} color="#D4AF37" />
            <Text className="text-white font-bold text-base ml-2">Tìm kiếm phổ biến</Text>
          </View>
          <View className="flex-row flex-wrap">
            {hotKeywords.map((keyword) => (
              <TouchableOpacity 
                key={keyword}
                onPress={() => handleSearch(keyword)}
                className="bg-zinc-900 border border-white/5 px-4 py-2 rounded-full mr-3 mb-3"
              >
                <Text className="text-[#E5E0D8] text-xs font-medium">{keyword}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      ) : (
        // Giao diện khi CÓ KẾT QUẢ TÌM KIẾM đan xen tỷ lệ ảnh đứng/ngang chuyên nghiệp
        <View className="flex-1 px-4 pt-4">
          <Text className="text-[#7C766B] text-xs font-semibold mb-3">
            Tìm thấy {results.length} kết quả phù hợp
          </Text>
          <FlatList
            data={results}
            renderItem={renderResultItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={() => (
              <View className="items-center justify-center pt-20">
                <Feather name="inbox" size={40} color="#7C766B" />
                <Text className="text-[#7C766B] text-sm font-medium mt-3">Không tìm thấy nội dung phù hợp</Text>
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}