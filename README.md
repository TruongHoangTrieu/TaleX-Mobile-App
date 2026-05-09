# TaleX — Project Skeleton

TaleX là một ứng dụng nền tảng kể chuyện ngắn và truyện tranh số (short-video storytelling & digital comics), lấy cảm hứng từ TikTok, Webtoon và các UX mạng xã hội hiện đại. Repository này chỉ chứa scaffold kiến trúc dự án (folder structure) và các tệp cấu hình tối thiểu để bắt đầu phát triển.

## Tổng quan ngắn
- **Tên dự án:** TaleX
- **Mục tiêu:** Nền tảng trải nghiệm video dạng ngắn tích hợp truyện tranh số, tối ưu cho tương tác, khám phá và chia sẻ nội dung.

## Tech stack chính
- React Native + Expo
- TypeScript (strict)
- React Navigation (native-stack, bottom-tabs)
- Zustand (local UI state)
- Axios (HTTP client)
- TanStack Query (server state caching)
- NativeWind / TailwindCSS (styling)
- React Native Reanimated + Gesture Handler
- AsyncStorage (persisted storage)
- React Hook Form + Zod (forms & validation)

## Các tầng (Layers) & Mục đích thư mục

- `src/app/` — App bootstrap và provider composition (QueryClientProvider, ThemeProvider, Store providers). Tách wiring/initialization khỏi logic.
- `src/features/` — Feature-based modules (ví dụ `Feed`, `Story`, `Upload`, `Profile`). Mỗi feature chứa `screens`, `components`, `hooks`, `services`, `store` và `types` riêng. Giữ tính cô lập, dễ thay thế và test.
- `src/shared/` — Thành phần tái sử dụng (UI primitives: atoms/molecules), wrappers cho form controls, layout dùng chung, và utilities UI.
- `src/navigation/` — Cấu trúc navigator (Root, MainStack, ModalStack) và `navigation.types.ts` để typed routes.
- `src/services/` — Adapters cho bên ngoài: `api/` (axios client, interceptors), `storage/` (AsyncStorage wrappers), `notifications/`, analytics, v.v.
- `src/store/` — Root Zustand store và các slice global (auth, ui, player). Dùng cho UI/local state; server state xử lý bằng React Query.
- `src/hooks/` — Custom hooks dùng chung (useAuth, useDebouncedValue, useInfiniteQuery helpers).
- `src/styles/` — Theme tokens, NativeWind/Tailwind config và helpers cho design tokens.
- `src/types/` — DTOs, api requests/responses, domain types, navigation param lists, form types.
- `src/utils/` — Pure helpers (formatters, parsers) không side-effect.
- `src/constants/` — Hằng số ứng dụng, feature flags, route names, timeouts.
- `assets/` — `images/`, `icons/`, `fonts/` (tổ chức theo feature khi cần).
- `scripts/` — Codegen, asset processing, build helpers.

## Clean Architecture (frontend) áp dụng

- **UI Layer:** `shared/components`, `features/*/components` — chỉ render UI, không gọi API trực tiếp.
- **Presentation:** screens + view-model hooks (ví dụ `useFeedViewModel`) — compose hooks, lấy dữ liệu, xử lý trình bày.
- **Domain / Use-cases:** hooks/services chứa business logic (ví dụ `usePublishStory`, `followUserUseCase`).
- **Data / Adapters:** `services/api/*`, `services/storage/*` — giao tiếp I/O, mapping DTO <-> domain.

Luồng phụ thuộc: UI -> Presentation -> Domain -> Data. UI không được gọi adapter trực tiếp.

## Quy ước đặt tên & typing
- File components: `PascalCase` cho file component (ví dụ `FeedItem.tsx`).
- Hooks: `useSomething.ts` (ví dụ `useFeed.ts`).
- Stores: `auth.store.ts`, `player.slice.ts`.
- Types: `types/api/*` cho DTO (`UserDto`, `FeedItemResponse`), `types/domain/*` cho model ứng dụng.
- Zod: giữ schema gần form và export `z.infer<typeof schema>` để tái sử dụng.

## Cách dùng nhanh (dev)

1. Cài dependencies:

```bash
npm install
```

2. Chạy app (Expo):

```bash
npm run start
```

> Lưu ý: bật `tsconfig.json` với `strict: true` để tận dụng TypeScript an toàn.


