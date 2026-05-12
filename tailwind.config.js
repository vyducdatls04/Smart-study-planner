export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg:      "#1e2433",  // nền chính
          surface: "#252d3d",  // card, sidebar
          border:  "#2e3a4e",  // viền
          input:   "#2a3347",  // ô input
        }
      }
    },
  },
  plugins: [],
};