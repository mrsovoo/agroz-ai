/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F9F8F3',
        beige: '#F2EFE9',
        charcoal: '#383838',
        agroGreen: {
          DEFAULT: '#35ca56',
          light: '#eafaf0',
          hover: '#2ea848',
          dark: '#1e7e34',
        },
        forest: {
          DEFAULT: '#1A2B1E',
          light: '#2F4A35',
          badge: '#35ca56',
        },
        gold: {
          DEFAULT: '#E2B23B',
          soft: '#F6E7B8',
          dark: '#B88A1E',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 30px -12px rgba(26, 34, 24, 0.18)',
        card: '0 2px 12px -4px rgba(26, 34, 24, 0.10)',
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

