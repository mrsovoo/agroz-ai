/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#FBF9F4',
          subtle: '#F4F0E6',
          warm: '#FCFBF7',
        },
        cream: {
          DEFAULT: '#FBF9F4', // Warm Cream (#FBF9F4) matching reference 1:1
          soft: '#F4F0E6',
          warm: '#FCFBF7',
        },
        beige: {
          DEFAULT: '#EAE6DC',
          card: '#E4DFD3',
        },
        charcoal: {
          DEFAULT: '#1B211D', // Deep Charcoal (#1B211D)
          logo: '#383838', // Rasmiy logotipdagi AGROZ rangi
          soft: '#242C27',
          muted: '#4D5850',
          light: '#727E76',
        },
        // Brand Primary Accent: #FEAD32 (Golden Amber / Sun Wheat matching reference 1:1)
        agroGreen: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#FEAD32', // Rasmiy brend oltin-sariq #FEAD32
          600: '#E59B20',
          700: '#C77F14',
          800: '#A16207',
          900: '#78350F',
          DEFAULT: '#FEAD32',
          light: '#FEF9EC',
          hover: '#F59E0B',
          dark: '#D97706',
        },
        forest: {
          DEFAULT: '#1F2622', // Dark Contrast Section (#1F2622)
          dark: '#141A16',
          card: '#1B221E',
          border: '#2E3831',
          badge: '#FEAD32',
        },
        amber: {
          DEFAULT: '#FEAD32',
          soft: '#FEF9EC',
          dark: '#C77F14',
        },
        gold: {
          DEFAULT: '#FEAD32',
          soft: '#FEF9EC',
          dark: '#C77F14',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Manrope', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 12px 36px -12px rgba(27, 33, 29, 0.1)',
        card: '0 2px 14px -2px rgba(27, 33, 29, 0.06)',
        'glow-green': '0 10px 30px -8px rgba(254, 173, 50, 0.4)',
        'glow-subtle': '0 8px 24px -6px rgba(254, 173, 50, 0.2)',
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
