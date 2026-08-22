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
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#3b25f0',
          600: '#2012ad', // Primary Brand Color
          700: '#1a0e91',
          800: '#150b74',
          900: '#100858',
          950: '#0a0538',
        },
      },
    },
  },
  plugins: [],
}
