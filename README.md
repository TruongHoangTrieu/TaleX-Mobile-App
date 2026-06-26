# TaleX Mobile App

## 1. Tổng quan dự án
**TaleX Mobile App** là ứng dụng di động giải trí đa phương tiện chất lượng cao, cung cấp cho người dùng trải nghiệm đọc truyện tranh (Comics) và xem video/phim (Movies) mượt mà và trực quan. Ứng dụng được thiết kế với giao diện tối (Dark mode) sang trọng, kết hợp phong cách thiết kế hiện đại, nhiều hiệu ứng chuyển cảnh mượt mà và tối ưu hóa hiển thị trên các thiết bị iOS/Android (bao gồm cả các dòng máy có tai thỏ/dynamic island).

Các tính năng chính:
- **Xác thực người dùng**: Đăng nhập, đăng ký tài khoản và xác thực OTP.
- **Đọc truyện tranh (Comics)**: Danh sách truyện phân loại theo thể loại, băng chuyền (carousel) nổi bật, trang chi tiết truyện với danh sách chương có thể thu gọn/mở rộng (accordion) để xem các tập con.
- **Xem phim/video (Movies)**: Trình phát video chuyên nghiệp hỗ trợ phát theo từng tập trực quan, hiển thị thông tin diễn viên, danh sách đề xuất liên quan và hỗ trợ chế độ xem toàn màn hình (fullscreen).
- **Tìm kiếm**: Tìm kiếm nhanh chóng nội dung yêu thích.
- **Cá nhân hóa**: Trang cá nhân (Profile) và chỉnh sửa thông tin người dùng.

---

## 2. Công nghệ và thư viện sử dụng

### Công nghệ cốt lõi
- **React Native & Expo (SDK 54)**: Nền tảng xây dựng ứng dụng di động đa nền tảng mạnh mẽ và nhanh chóng.
- **TypeScript**: Tăng tính an toàn của mã nguồn và cải thiện trải nghiệm lập trình.

### Thư viện UI & Styling
- **NativeWind (v4)**: Cho phép áp dụng Tailwind CSS vào React Native, đem lại tốc độ phát triển giao diện nhanh chóng và nhất quán.
- **Tailwind CSS (v3)**: Hệ thống utility-first CSS dùng để định nghĩa các lớp kiểu dáng.
- **@expo/vector-icons**: Bộ sưu tập các bộ icon phổ biến (Feather, FontAwesome, v.v.).
- **expo-linear-gradient**: Hỗ trợ vẽ dải màu gradient mượt mà cho các banner/giao diện.

### Thư viện Điều hướng (Navigation)
- **React Navigation (v7)**: Bộ thư viện quản lý luồng chuyển màn hình:
  - `@react-navigation/native` & `@react-navigation/native-stack`
  - `@react-navigation/bottom-tabs`

### Trình phát Video
- **expo-video**: Thư viện phát video chính thức từ Expo, tối ưu hiệu năng và tương thích hoàn toàn với Expo Go.

### Thư viện bổ trợ khác
- `react-native-safe-area-context`: Xử lý vùng an toàn (Safe Area) tránh va chạm với tai thỏ (notch) trên iOS/Android.
- `react-native-screens`: Tối ưu hóa hiệu năng render các màn hình native.
- `react-native-toast-message`: Hiển thị thông báo (toast) trực quan, đẹp mắt.
- `expo-secure-store`: Lưu trữ dữ liệu bảo mật (token đăng nhập, thông tin cấu hình).
- `@react-native-community/datetimepicker`: Hỗ trợ chọn ngày/tháng/năm sinh.

---

## 3. Cấu trúc thư mục dự án

```text
TaleX-Mobile-App/
├── .expo/                  # Thư mục cấu hình cache của Expo
├── android/                # Thư mục cấu hình dự án chạy Native Android
├── assets/                 # Thư mục lưu trữ hình ảnh, icon, hình nền tĩnh của ứng dụng
├── src/                    # Thư mục chứa toàn bộ mã nguồn của dự án
│   ├── components/         # Các component dùng chung (Header, Navigation, Carousels,...)
│   ├── config/             # Cấu hình hệ thống, thiết lập API, biến môi trường
│   ├── constants/          # Định nghĩa hằng số hệ thống, bảng màu, font chữ
│   ├── context/            # React Context dùng để quản lý state toàn cục (Auth, Theme,...)
│   ├── hooks/              # Custom hooks dùng để tái sử dụng logic xử lý
│   ├── navigation/         # Cấu hình luồng di chuyển màn hình (Tab và Stack Navigators)
│   ├── screens/            # Các màn hình chính trong ứng dụng
│   │   ├── auth/           # Đăng nhập (Login), Đăng ký (Register), Xác thực OTP
│   │   ├── comics/         # Trang danh sách truyện và chi tiết truyện tranh
│   │   ├── home/           # Trang chủ ứng dụng hiển thị tổng quan
│   │   ├── movies/         # Trang danh sách phim và chi tiết xem video
│   │   ├── profile/        # Trang cá nhân và chỉnh sửa thông tin người dùng
│   │   └── SearchScreen.tsx# Màn hình tìm kiếm nội dung
│   ├── services/           # Các dịch vụ xử lý gọi API kết nối Server
│   ├── types/              # Khai báo kiểu TypeScript chung cho toàn bộ dự án
│   └── utils/              # Các hàm tiện ích dùng chung trong xử lý logic
├── App.tsx                 # Điểm khởi chạy chính của ứng dụng
├── app.json                # Cấu hình chung cho Expo (tên ứng dụng, biểu tượng, splash screen,...)
├── babel.config.js         # Cấu hình trình biên dịch Babel
├── global.css              # Tệp cấu hình CSS toàn cục cho NativeWind
├── metro.config.js         # Cấu hình Metro Bundler cho Expo
├── tailwind.config.js      # Cấu hình cài đặt Tailwind CSS/NativeWind
└── tsconfig.json           # Cấu hình biên dịch TypeScript
```

---

## 4. Cài đặt môi trường

Để chạy dự án TaleX Mobile App ở môi trường local, bạn cần chuẩn bị các phần mềm sau:
1. **Node.js**: Phiên bản khuyến nghị là `LTS >= 20.x` (Đặc biệt tương thích với React Native 0.81).
2. **Git**: Để tải và quản lý mã nguồn.
3. **Expo Go**: Tải ứng dụng này trên điện thoại (App Store cho iOS hoặc CH Play cho Android) để chạy thử trực tiếp.

### Các bước cài đặt:
1. **Tải mã nguồn về máy**:
   ```bash
   git clone <URL_DỰ_ÁN>
   cd TaleX-Mobile-App
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies)**:
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường**:
   - Tạo file `.env` tại thư mục gốc nếu chưa có.
   - Định nghĩa các khóa cần thiết (ví dụ: API_URL, cấu hình xác thực...).

---

## 5. Scripts hữu ích

Trong quá trình phát triển, bạn có thể chạy các câu lệnh sau qua `npm` hoặc `npx expo`:

- **Khởi chạy ứng dụng**:
  ```bash
  npm run start
  # hoặc
  npx expo start -c
  ```
  *(Lệnh `-c` giúp xóa bộ nhớ cache trước khi chạy, đảm bảo cấu hình mới được áp dụng hoàn chỉnh).*

- **Chạy trên thiết bị giả lập Android**:
  ```bash
  npm run android
  ```

- **Chạy trên thiết bị giả lập iOS (Yêu cầu macOS và Xcode)**:
  ```bash
  npm run ios
  ```

- **Chạy kiểm tra lỗi TypeScript**:
  ```bash
  npx tsc --noEmit
  ```

---

## 6. Quy trình phát triển đề xuất

Để duy trì mã nguồn sạch và giảm thiểu xung đột khi làm việc nhóm, bạn nên tuân thủ quy trình sau:
1. **Tạo nhánh mới từ `main`**:
   - Tên nhánh nên theo chuẩn: `feature/ten-tinh-nang` hoặc `bugfix/ten-loi`.
2. **Kiểm tra TypeScript trước khi Commit**:
   - Luôn chạy lệnh `npx tsc --noEmit` để đảm bảo dự án không phát sinh lỗi kiểu dữ liệu.
3. **Quy tắc viết code**:
   - Sử dụng các Class Utility của NativeWind để viết CSS trực tiếp trên component thay vì sử dụng stylesheet truyền thống.
   - Đảm bảo các thuộc tính dữ liệu tĩnh/mock được lưu trữ riêng biệt tại các tệp `*MockData.ts` thay vì viết cứng trong UI.
4. **Tạo Pull Request (PR)**:
   - Khi hoàn thành tính năng, tạo PR và nhờ thành viên khác review trước khi merge vào nhánh chính.
