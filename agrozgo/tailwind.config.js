/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#F8FAF5',
          soft: '#F4F7EF',
          warm: '#FBFDF8',
        },
        beige: {
          DEFAULT: '#EDF2E8',
          card: '#E8EFE3',
        },
        charcoal: {
          DEFAULT: '#1E241E',
          soft: '#2D352D',
          muted: '#4B554B',
          light: '#6E7A6E',
        },
        agroGreen: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#35CA56', // Brand Logo Green
          600: '#22B343',
          700: '#1A8F34',
          800: '#17712C',
          900: '#145D26',
          DEFAULT: '#35CA56',
          light: '#EAFDF0',
          hover: '#29B648',
          dark: '#1C8A37',
        },
        forest: {
          DEFAULT: '#0F2314', // Deep premium emerald-forest
          dark: '#0A170D',
          card: '#152E1C',
          border: '#21422A',
          badge: '#35CA56',
        },
        gold: {
          DEFAULT: '#E5A93C', // Harvest grain gold
          soft: '#FEF7E6',
          dark: '#B87B14',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 36px -12px rgba(15, 35, 20, 0.12)',
        card: '0 2px 14px -2px rgba(15, 35, 20, 0.06)',
        'glow-green': '0 10px 30px -8px rgba(53, 202, 86, 0.35)',
        'glow-subtle': '0 8px 24px -6px rgba(53, 202, 86, 0.18)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s ease-out both',
      },
    },
  },
  plugins: [],
};
