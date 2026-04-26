import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#F7F5F0",
        "bege-claro": "#EAE2D2",
        "bege-areia": "#D8CBB1",
        salvia: "#9CAA7C",
        oliva: "#6F7D52",
        texto: "#5E5A50",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        /** Nome no hero — Cormorant Garamond (`src/app/layout.tsx`). */
        "hero-name": [
          "var(--font-hero-name)",
          "var(--font-display)",
          "Georgia",
          "serif",
        ],
      },
      backgroundImage: {
        "botanical-fade":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(156,170,124,0.15), transparent)",
      },
      animation: {
        "fade-up": "fadeUp 0.7s ease-out forwards",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
