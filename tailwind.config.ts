import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0b0b0e",
          surface: "#151821",
          elevated: "#1d2230",
          glow: "#101623",
        },
        accent: {
          DEFAULT: "#7c9cff",
          secondary: "#49dcb1",
          warm: "#f5a65b",
        },
        text: {
          primary: "#f8fafc",
          secondary: "#aab6cf",
          muted: "#70809c",
        },
        border: {
          DEFAULT: "#263042",
          strong: "#33415a",
        },
        status: {
          danger: "#f87171",
          caution: "#fbbf24",
          stable: "#34d399",
        },
      },
      fontFamily: {
        display: ["DM Sans", "system-ui", "sans-serif"],
        body: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["DM Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 12px 40px rgba(0,0,0,0.28)",
      },
    },
  },
  plugins: [],
}

export default config
