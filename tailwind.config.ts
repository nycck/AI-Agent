import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // OfficeHeart accent palette
        brand: {
          DEFAULT: "#e11d48",
          dark: "#be123c",
        },
        sidebar: "#171717",
        surface: "#212121",
        bubble: "#2f2f2f",
      },
    },
  },
  plugins: [],
};

export default config;
