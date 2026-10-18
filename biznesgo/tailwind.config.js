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
          DEFAULT: '#059669',
          dark: '#047857',
          light: '#10b981',
          bg: '#ecfdf5',
        },
        accent: {
          DEFAULT: '#2563eb',
          light: '#eff6ff',
        }
      }
    },
  },
  plugins: [],
}

