import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Background colors
        bg: {
          primary: "rgb(var(--bg-primary) / <alpha-value>)",
          surface: "rgb(var(--bg-surface) / <alpha-value>)",
          elevated: "rgb(var(--bg-elevated) / <alpha-value>)",
          glow: "rgb(var(--bg-glow) / <alpha-value>)",
        },

        // Surface elevation scale
        surface: {
          1: "rgb(var(--surface-1) / <alpha-value>)",
          2: "rgb(var(--surface-2) / <alpha-value>)",
          3: "rgb(var(--surface-3) / <alpha-value>)",
          4: "rgb(var(--surface-4) / <alpha-value>)",
          5: "rgb(var(--surface-5) / <alpha-value>)",
          hover: "rgb(var(--surface-hover) / <alpha-value>)",
          active: "rgb(var(--surface-active) / <alpha-value>)",
          pressed: "rgb(var(--surface-pressed) / <alpha-value>)",
        },

        // Accent colors — Core Neo-Brutalist
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          secondary: "rgb(var(--accent-secondary) / <alpha-value>)",
          warm: "rgb(var(--accent-warm) / <alpha-value>)",
          yellow: "rgb(var(--accent-yellow) / <alpha-value>)",
          orange: "rgb(var(--accent-orange) / <alpha-value>)",
        },

        // Cloudflare-inspired additional accents
        brand: {
          orange: "rgb(var(--brand-orange) / <alpha-value>)",
        },
        sky: {
          DEFAULT: "rgb(var(--sky-blue) / <alpha-value>)",
          blue: "rgb(var(--sky-blue) / <alpha-value>)",
        },
        indigo: {
          DEFAULT: "rgb(var(--indigo) / <alpha-value>)",
        },
        violet: {
          DEFAULT: "rgb(var(--violet) / <alpha-value>)",
        },
        fuchsia: {
          DEFAULT: "rgb(var(--fuchsia) / <alpha-value>)",
        },
        emerald: {
          DEFAULT: "rgb(var(--emerald) / <alpha-value>)",
        },
        rose: {
          DEFAULT: "rgb(var(--rose) / <alpha-value>)",
        },
        amber: {
          DEFAULT: "rgb(var(--amber) / <alpha-value>)",
        },

        // Text colors
        text: {
          primary: "rgb(var(--text-primary) / <alpha-value>)",
          secondary: "rgb(var(--text-secondary) / <alpha-value>)",
          muted: "rgb(var(--text-muted) / <alpha-value>)",
          disabled: "rgb(var(--text-disabled) / <alpha-value>)",
          placeholder: "rgb(var(--text-placeholder) / <alpha-value>)",
          inverse: "rgb(var(--text-inverse) / <alpha-value>)",
        },

        // Border colors
        border: {
          DEFAULT: "rgb(var(--border) / <alpha-value>)",
          subtle: "rgb(var(--border-subtle) / <alpha-value>)",
          strong: "rgb(var(--border-strong) / <alpha-value>)",
          accent: "rgb(var(--border-accent) / <alpha-value>)",
        },

        // Status colors — Legacy mappings
        status: {
          danger: "rgb(var(--status-danger) / <alpha-value>)",
          caution: "rgb(var(--status-caution) / <alpha-value>)",
          stable: "rgb(var(--status-stable) / <alpha-value>)",
          info: "rgb(var(--status-info) / <alpha-value>)",
        },

        // Semantic color scales — Success
        success: {
          DEFAULT: "rgb(var(--status-success) / <alpha-value>)",
          light: "rgb(var(--status-success-light) / <alpha-value>)",
          dark: "rgb(var(--status-success-dark) / <alpha-value>)",
          bg: "rgb(var(--status-success-bg) / <alpha-value>)",
          border: "rgb(var(--status-success-border) / <alpha-value>)",
        },

        // Semantic color scales — Warning
        warning: {
          DEFAULT: "rgb(var(--status-warning) / <alpha-value>)",
          light: "rgb(var(--status-warning-light) / <alpha-value>)",
          dark: "rgb(var(--status-warning-dark) / <alpha-value>)",
          bg: "rgb(var(--status-warning-bg) / <alpha-value>)",
          border: "rgb(var(--status-warning-border) / <alpha-value>)",
        },

        // Semantic color scales — Error
        error: {
          DEFAULT: "rgb(var(--status-error) / <alpha-value>)",
          light: "rgb(var(--status-error-light) / <alpha-value>)",
          dark: "rgb(var(--status-error-dark) / <alpha-value>)",
          bg: "rgb(var(--status-error-bg) / <alpha-value>)",
          border: "rgb(var(--status-error-border) / <alpha-value>)",
        },

        // Semantic color scales — Info
        info: {
          DEFAULT: "rgb(var(--status-info) / <alpha-value>)",
          light: "rgb(var(--status-info-light) / <alpha-value>)",
          dark: "rgb(var(--status-info-dark) / <alpha-value>)",
          bg: "rgb(var(--status-info-bg) / <alpha-value>)",
          border: "rgb(var(--status-info-border) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        body: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
        brutal: "var(--shadow-panel)",
        "brutal-sm": "var(--shadow-sm)",
        "brutal-lg": "var(--shadow-hard)",
        hard: "var(--shadow-hard)",
      },
      borderWidth: {
        DEFAULT: "1px",
        2: "2px",
        3: "3px",
        4: "4px",
      },
    },
  },
  plugins: [],
}

export default config
