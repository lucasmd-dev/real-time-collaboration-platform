/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'sans-serif'],
        display: ['Newsreader', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
