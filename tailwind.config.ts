import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#efe5cf",
        ink: "#2d251e",
        brass: "#b88a46",
        obsidian: "#12131b",
        signal: "#7df8ff",
        warning: "#ff5a5a"
      },
      fontFamily: {
        serif: ["var(--font-noto-serif-sc)", "Songti SC", "serif"],
        sans: ["var(--font-noto-sans-sc)", "PingFang SC", "sans-serif"]
      },
      boxShadow: {
        card: "0 22px 60px rgba(31, 23, 15, 0.25)",
        glow: "0 0 34px rgba(125, 248, 255, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
