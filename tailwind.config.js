/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#990000',
          light: '#DD0031',
        },
        cream: '#EDEBEB',
        'text-main': '#191919',
      },
    },
  },
  plugins: [],
}

