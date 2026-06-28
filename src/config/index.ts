export const BASE_URL =
  (process.env.EXPO_PUBLIC_BASE_URL as string) ||
  (process.env.BASE_URL as string) ||
  "http://localhost:8080";
