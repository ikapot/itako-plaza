/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'itako-beige': '#1c1c1c',     /* Dark panel background */
        'itako-orange': '#FF8C00',    /* Keep orange */
        'itako-grey': '#eeeeee',      /* Light text */
        'itako-warm-beige': '#0b0b0b',/* Darkest background */
      },
      fontFamily: {
        serif: ['"Noto Serif JP"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundColor: {
        'white': '#1c1c1c',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'itako': '0 4px 20px -2px rgba(0, 0, 0, 0.1), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
