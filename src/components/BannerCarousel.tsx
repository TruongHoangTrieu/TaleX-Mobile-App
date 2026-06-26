import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  Animated 
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface ParallaxItem {
  id: string;
  title: string;
  subtitle: string;
  bg: any;         
  character: any;  
}

const parallaxData: ParallaxItem[] = [
  { 
    id: 'p1', 
    title: 'Vân Tú Hành', 
    subtitle: 'Trung Quốc đại lục · Cập nhật tập 14', 
    bg: require('@assets/movie1_bg.webp'),         
    character: require('@assets/movie1_char.webp')  
  },
  { 
    id: 'p2', 
    title: 'Mùa Hè Nồng Nhiệt', 
    subtitle: 'Hàn Quốc · Trọn bộ bản đẹp', 
    bg: require('@assets/movie2_bg.webp'), 
    character: require('@assets/movie2_char.webp')
  },
  { 
    id: 'p3', 
    title: 'Story Of Kunning Place', 
    subtitle: 'Trung Quốc · Trọn bộ bản đẹp', 
    bg: require('@assets/movie3_bg.webp'), 
    character: require('@assets/movie3_char.webp')
  },
];

export default function BannerCarousel() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);
  const currentIndex = useRef(0);

  // Tự động lướt trang sau mỗi 4.5 giây
  useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = currentIndex.current + 1;
      if (nextIndex >= parallaxData.length) {
        nextIndex = 0;
      }
      currentIndex.current = nextIndex;

      flatListRef.current?.scrollToOffset({
        offset: nextIndex * screenWidth,
        animated: true, // Chuyển động lướt tự động mượt mà của hệ thống
      });
    }, 4500); 

    return () => clearInterval(timer);
  }, []);

  const handleMomentumScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    currentIndex.current = Math.round(contentOffsetX / screenWidth);
  };

  const renderParallaxItem = ({ item, index }: { item: ParallaxItem, index: number }) => {
    const inputRange = [
      (index - 1) * screenWidth,
      index * screenWidth,
      (index + 1) * screenWidth
    ];

    // LỚP 1: NỀN - Ép di chuyển siêu chậm, gần như đứng im ở sau (Biên độ giảm xuống 0.05)
    const translateXBg = scrollX.interpolate({
      inputRange,
      outputRange: [-screenWidth * 0.05, 0, screenWidth * 0.05],
      extrapolate: 'clamp',
    });

    // LỚP 2: NHÂN VẬT - Trôi với biên độ vừa phải để tách biệt khỏi nền (Tăng lên 0.22)
    const translateXChar = scrollX.interpolate({
      inputRange,
      outputRange: [-screenWidth * 0.22, 0, screenWidth * 0.22],
      extrapolate: 'clamp',
    });

    const scaleChar = scrollX.interpolate({
      inputRange,
      outputRange: [0.92, 1, 0.92],
      extrapolate: 'clamp',
    });

    // LỚP 3: CHỮ - Đẩy biên độ lên cực đại (0.65). Chữ sẽ bay vèo lên phía trước như tên bắn
    const translateXText = scrollX.interpolate({
      inputRange,
      outputRange: [-screenWidth * 0.65, 0, screenWidth * 0.65],
      extrapolate: 'clamp',
    });

    const opacityText = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={{ width: screenWidth }} className="h-[400px] relative overflow-hidden">
        
        {/* LAYER 1: BACKGROUND */}
        <Animated.Image 
          source={item.bg} 
          style={{
            width: screenWidth * 1.15, 
            // 1. PHÓNG TO: Nâng chiều cao từ 100% lên 120% để ảnh nở rộng ra
            height: '120%', 
            position: 'absolute',
            // 2. TRÀN VIỀN: Đẩy margin âm lên trên -10% để ảnh lọt hẳn lên trên vùng tai thỏ làm nền cho Header
            top: '-10%', 
            left: '-7.5%',
            transform: [{ translateX: translateXBg }] // Giữ nguyên hiệu ứng trôi cũ của bạn
          }}
          resizeMode="cover"
        />

        {/* LAYER 2: CHARACTER */}
        <Animated.Image 
          source={item.character} 
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            transform: [
              { translateX: translateXChar },
              { scale: scaleChar }
            ]
          }}
          resizeMode="contain"
        />

        {/* LAYER 3: TEXT & BUTTON (Lao vút đi trước không góc mờ) */}
        <Animated.View 
          style={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            right: 0,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            opacity: opacityText,
            transform: [{ translateX: translateXText }] 
          }}
        >
          <View className="flex-1 mr-4">
            {/* Tăng độ đậm bóng chữ bằng Tailwind để nhìn rõ trên mọi ảnh nền */}
            <Text className="text-white text-2xl font-bold tracking-wide shadow-black shadow-xl" style={{ textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 }}>{item.title}</Text>
            <Text className="text-zinc-100 text-xs mt-1.5 font-medium shadow-black shadow-lg" style={{ textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>{item.subtitle}</Text>
          </View>
          
          <TouchableOpacity className="w-12 h-12 bg-[#D4AF37] rounded-full items-center justify-center shadow-lg">
            <View className="ml-0.5"><FontAwesome5 name="play" size={16} color="#141210" /></View>
          </TouchableOpacity>
        </Animated.View>

      </View>
    );
  };

  return (
    <View className="relative h-[400px]">
      <Animated.FlatList
        ref={flatListRef}
        data={parallaxData}
        renderItem={renderParallaxItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        
        pagingEnabled={false} 
        snapToInterval={screenWidth} 
        snapToAlignment="center"
        
        // ĐIỀU CHỈNH ĐỘ GHÌ TRÔI: Đổi từ 0.985 sang 0.992 để hãm phanh chậm hơn hẳn, tạo độ lướt trôi "lười biếng" cực đã mắt
        decelerationRate={0.992} 
        
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd} 
        getItemLayout={(_, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
      />
    </View>
  );
}