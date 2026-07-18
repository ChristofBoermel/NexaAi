/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Nexa brand palette, anchored on the corporate navy #0E3652.
        // 800 is the identity color (buttons, headings, logo primary).
        // Contrast check: brand-800 on white = 11.8:1 (AAA).
        brand: {
          50: '#F0F5F9',
          100: '#DDE7EF',
          200: '#B0C4D5',
          300: '#829FB8',
          400: '#4E7A9C',
          500: '#265D82',
          600: '#164764',
          700: '#0F3B57',
          800: '#0E3652',
          900: '#092640',
          950: '#04182D',
        },
        // Warm editorial cream palette for hero surfaces (feed, match, home).
        // Complements the cool navy without leaning into fintech purple-blue tropes.
        cream: {
          50: '#FBF9F5',
          100: '#F5F1E9',
          200: '#EDE5D5',
          300: '#DFD2B4',
          400: '#C2B08A',
          500: '#A08A64',
        },
      },
    },
  },
  plugins: [],
}
