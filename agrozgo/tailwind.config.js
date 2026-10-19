/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#F8FAF6',
          subtle: '#F1F6ED',
          warm: '#FCFDFB',
        },
        cream: {
          DEFAULT: '#F8FAF6',
          soft: '#F1F6ED',
          warm: '#FCFDFB',
        },
        beige: {
          DEFAULT: '#EBF2E5',
          card: '#E4EDE0',
        },
        charcoal: {
          DEFAULT: '#1E241E',
          logo: '#383838', // Rasmiy logotipdagi AGROZ rangi
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
          DEFAULT: '#0C1C10', // Chuqur premium zumrad-o'rmon
          dark: '#08140B',
          card: '#122718',
          border: '#1F3F27',
          badge: '#35CA56',
        },
        amber: {
          DEFAULT: '#E5A93C', // Hosil / bug'doy sarg'ish aksenti
          soft: '#FEF7E6',
          dark: '#B87B14',
        },
        gold: {
          DEFAULT: '#E5A93C',
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
