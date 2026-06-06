/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        sky: "#38BDF8",
        yellow: "#FACC15",
        green: "#22C55E",
        red: "#EF4444",
        dark: "#020617",
        light: "#F3F4F6",
      },
    },
  },
  plugins: [],
};
