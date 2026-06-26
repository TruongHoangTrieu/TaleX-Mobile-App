/** @type {import('tailwindcss').Config} */
module.exports = {
  // THAY ĐỔI DÒNG NÀY: Thêm "./src/**/*.{js,jsx,ts,tsx}" để Tailwind quét cả thư mục src
  content: [
    "./App.tsx", 
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
}