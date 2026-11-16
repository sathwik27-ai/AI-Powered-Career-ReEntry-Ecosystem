/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Bright Juicy Jelly Palette
        jelly: {
          purple: "#8E5CFF",
          strawberry: "#FF5C8A",
          aqua: "#2FC9E3",
          blueberry: "#4D8DFF",
          lime: "#43D98C",
          lemon: "#FFD93D",
          tangerine: "#FF9A3D",
        },
        surface: {
          DEFAULT: "rgb(var(--bg-surface-rgb, 255 255 255) / <alpha-value>)",
        },
        paper: {
          DEFAULT: "rgb(var(--bg-primary-rgb, 250 248 253) / <alpha-value>)",
          deep: "rgb(var(--bg-secondary-rgb, 243 238 250) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--text-primary-rgb, 30 18 49) / <alpha-value>)",
          soft: "rgb(var(--text-secondary-rgb, 74 62 94) / <alpha-value>)",
          faint: "rgb(var(--text-muted-rgb, 126 112 146) / <alpha-value>)",
        },
        line: {
          DEFAULT: "var(--border-line, rgba(142, 92, 255, 0.12))",
          strong: "var(--border-strong, rgba(142, 92, 255, 0.22))",
        },
        plum: {
          50: "#FAF5FF",
          100: "#F3E8FF",
          200: "#E9D5FF",
          300: "#D8B4FE",
          500: "#8E5CFF",
          600: "#7A45F0",
          700: "#6933DE",
          800: "#5524BF",
          900: "#441A9E",
          950: "#2B0F6B",
        },
        lilac: {
          50: "#F0F7FF",
          100: "#E0EFFF",
          200: "#BAE0FF",
          300: "#82C2FF",
          400: "#4D8DFF",
          600: "#2A6CE6",
          700: "#1E52B3",
        },
        sage: {
          100: "#E6FBF0",
          600: "#43D98C",
          700: "#22B569",
        },
        ochre: {
          100: "#FFF8DC",
          600: "#FF9A3D",
          700: "#E67E1E",
        },
        rosewood: {
          100: "#FFE6EE",
          600: "#FF5C8A",
          700: "#E63A6A",
        },
      },
      fontFamily: {
        display: ["Nunito", "Inter", "system-ui", "-apple-system", "sans-serif"],
        sans: ["Nunito", "Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        eyebrow: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.04em", fontWeight: "700" }],
      },
      borderRadius: {
        card: "1.25rem", // 20px
        jelly: "1.5rem",  // 24px
      },
      boxShadow: {
        card: "0 8px 24px -6px rgba(142, 92, 255, 0.08), 0 2px 6px -2px rgba(43, 27, 61, 0.04)",
        lift: "0 12px 32px -8px rgba(142, 92, 255, 0.16)",
        jelly: "0 8px 20px -4px rgba(142, 92, 255, 0.25)",
        pop: "0 20px 48px -12px rgba(43, 27, 61, 0.28)",
      },
      keyframes: {
        pulsedot: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.35" } },
        rise: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        wobble: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-1deg) scale(1.01)" },
          "75%": { transform: "rotate(1deg) scale(1.01)" },
        },
      },
      animation: {
        pulsedot: "pulsedot 1.4s ease-in-out infinite",
        rise: "rise .25s ease-out both",
        wobble: "wobble 0.3s ease-in-out",
      },
    },
  },
  plugins: [],
};
