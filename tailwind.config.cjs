/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      typography: {
        feature: {
          css: {
            p: {
              fontSize: "1rem",
              lineHeight: "1.625",
              color: "#374151",
            },
            li: {
              fontSize: "1rem",
              lineHeight: "1.625",
              color: "#374151",
            },
            "@media (min-width: 1024px)": {
              p: {
                fontSize: "1.125rem",
                lineHeight: "1.75",
              },
              li: {
                fontSize: "1.125rem",
                lineHeight: "1.75",
              },
            },
          },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-in-out",
        fadeInSlow: "fadeInSlow 0.3s ease-in-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInSlow: {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
    screens: {
      xxs: "320px",
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
