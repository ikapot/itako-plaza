/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'itako-clay': '#bd8a78',     /* Terracotta/Clay */
        'itako-sage': '#899d90',     /* Sage Green */
        'itako-sand': '#c8b39c',     /* Warm Beige/Sand */
        'itako-stone': '#f4f4f2',    /* Light Background */
        'itako-deep': '#242424',     /* Charcoal Text/Elements */
        'itako-orange': '#bd8a78',   /* Override old orange with clay */
      },
      fontFamily: {
        sans: ['"BIZ UDGothic"', 'sans-serif'],
        serif: ['"Noto Serif JP"', 'serif'],
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
