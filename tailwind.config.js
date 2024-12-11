/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./content/**/*.md', './layouts/**/*.html', './assets/**/*.css'],
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
