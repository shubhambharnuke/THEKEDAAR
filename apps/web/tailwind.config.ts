import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        graphite: "#171717",
        ink: "#242424",
        paper: "#F5F5F2",
        white: "#FFFFFF",
        border: "#D9D9D4",
        muted: "#70706B",
        signal: {
          orange: "#E86A36",
          tint: "#F9E9E1",
        },
        status: {
          success: "#237A50",
          warning: "#946318",
          error: "#B83A32",
          info: "#315D8A",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
      },
      borderWidth: {
        DEFAULT: "1px",
      },
    },
  },
  plugins: [],
};

export default config;
