/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,tsx,ts,jsx}',
    './components/**/*.{js,tsx,ts,jsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
};
