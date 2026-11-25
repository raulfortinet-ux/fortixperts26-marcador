import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "#0B0F14",
        surface: "#141B22",
        surface2: "#1B242D",
        border: "#1F2A33",
        accent: "#E8362F",
        accent2: "#FF6B64",
        success: "#2BB673",
        danger: "#E24C4C",
        warn: "#E0A33E",
        muted: "#8A97A3"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -16px rgba(0,0,0,0.6)"
      }
    }
  },
  plugins: []
};
export default config;
