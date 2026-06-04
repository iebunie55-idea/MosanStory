import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          primary: "#071A33",
          deep: "#031225"
        },
        accent: {
          yellow: "#F3C33A",
          hover: "#E0B12E"
        },
        surface: "#F7F8FA",
        text: {
          dark: "#111827",
          sub: "#6B7280"
        },
        line: "#E5E7EB"
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "SUIT",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif"
        ]
      },
      boxShadow: {
        card: "0 12px 40px rgba(15, 23, 42, 0.06)",
        soft: "0 18px 60px rgba(3, 18, 37, 0.12)"
      },
      borderRadius: {
        card: "20px"
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)"
      }
    }
  },
  plugins: []
};

export default config;
