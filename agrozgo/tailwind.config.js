/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#F9F8F3',
          subtle: '#F2EFE9',
          warm: '#FCFBF7',
        },
        cream: {
          DEFAULT: '#F9F8F3', // Warm Cream (#F9F8F3)
          soft: '#F2EFE9',
          warm: '#FCFBF7',
        },
        beige: {
          DEFAULT: '#EAE6DC',
          card: '#E4DFD3',
        },
        charcoal: {
          DEFAULT: '#1A2218', // Deep Charcoal (#1A2218)
          logo: '#383838', // Rasmiy logotipdagi AGROZ rangi
          soft: '#253022',
          muted: '#4B554B',
          light: '#6E7A6E',
        },
        agroGreen: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#35CA56', // Rasmiy brend yashil
          600: '#22B343',
          700: '#1A8F34',
          800: '#15732A',
          900: '#115820',
          DEFAULT: '#35CA56',
          light: '#EAFDF0',
          hover: '#28B847',
          dark: '#1C8A37',
        },
        forest: {
          DEFAULT: '#1A2B1E', // Dark Contrast Section (#1A2B1E)
          dark: '#0E1911',
          card: '#142517',
          border: '#224027',
          badge: '#35CA56',
        },
        amber: {
          DEFAULT: '#E2B23B', // Golden Accent (#E2B23B)
          soft: '#FEF9EC',
          dark: '#C59520',
        },
        gold: {
          DEFAULT: '#E2B23B', // Golden Accent (#E2B23B)
          soft: '#FEF9EC',
          dark: '#C59520',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Manrope', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
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
