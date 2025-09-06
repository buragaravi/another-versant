/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        headline: '#fffffe',
        paragraph: '#abd1c6',
        cardBackground: '#004643',
        cardHeading: '#fffffe',
        cardParagraph: '#abd1c6',
        subHeadline: '#0f3433',
        stroke: '#001e1d',
        main: '#e8e4e6',
        button: '#16a34a',
        buttonHover: '#22c55e',
        border: '#000000',
        text: '#000000',
        highlight: '#22c55e',
        secondary: '#f0fdf4',
        tertiary: '#bbf7d0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} 