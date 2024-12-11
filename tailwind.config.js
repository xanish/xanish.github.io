/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./content/**/*.md', './layouts/**/*.html',],
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
