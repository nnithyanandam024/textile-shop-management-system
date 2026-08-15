/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fd',
          400: '#36a9fa',
          500: '#0c8de9',
          600: '#006ec7',
          700: '#0058a3',
          800: '#054a85',
          900: '#0a3e6f',
          950: '#072749',
        },
      },
    },
  },
  plugins: [],
}
