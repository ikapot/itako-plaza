/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'itako-beige': '#F5F5DC',
        'itako-orange': '#FF8C00',
        'itako-grey': '#2F4F4F',
        'itako-warm-beige': '#FDF5E6',
      },
      fontFamily: {
        serif: ['"Noto Serif JP"', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
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
