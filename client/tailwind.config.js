/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        rwanda: {
          blue: '#00A1DE',
          'blue-dark': '#0077A8',
          'blue-soft': '#E5F7FD',
          yellow: '#FAD201',
          'yellow-soft': '#FFF8D6',
          green: '#20603D',
          'green-dark': '#15452B',
          'green-soft': '#EAF4EE',
          cream: '#FFFDF5'
        },
        ink: {
          DEFAULT: '#102A2D',
          soft: '#395E62',
          muted: '#6B8588'
        },
        cream: '#FFFDF5'
      },
      fontFamily: {
        display: ['Manrope', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft: '0 18px 50px -24px rgba(16, 42, 45, 0.28)',
        card: '0 12px 30px -18px rgba(16, 42, 45, 0.22)',
        glow: '0 22px 70px -30px rgba(0, 161, 222, 0.55)'
      },
      backgroundImage: {
        'rwanda-flag':
          'linear-gradient(180deg, #00A1DE 0%, #00A1DE 50%, #FAD201 50%, #FAD201 70%, #20603D 70%, #20603D 100%)'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' }
        }
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'fade-up': 'fade-up 0.6s ease-out both',
        shimmer: 'shimmer 1.5s linear infinite'
      }
    }
  },
  plugins: []
};
