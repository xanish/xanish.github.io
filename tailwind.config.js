/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./content/**/*.md", "./layouts/**/*.html", "./assets/**/*.css"],
  theme: {
    extend: {
      fontFamily: {
        body: [
          "Atkinson Hyperlegible Next",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
        heading: [
          "Bitter",
          "ui-serif",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "Times",
          "serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
