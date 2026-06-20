/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eefdf8',
          100: '#d5f8ef',
          200: '#aef0df',
          300: '#78e1ca',
          400: '#38ccb1',
          500: '#16b79d',
          600: '#0d927f',
          700: '#0f7467',
          800: '#105d54',
          900: '#124d47',
          950: '#062d2b',
        },
        accent: {
          amber: '#f6c85f',
          coral: '#ff7a68',
          sky: '#62c8ff',
          violet: '#a78bfa',
        },
        surface: {
          50: '#f8fafc',
          100: '#edf2f7',
          200: '#d8e0e8',
          300: '#b4c1ce',
          400: '#8493a3',
          500: '#5f6e7f',
          600: '#44515f',
          700: '#2b3642',
          800: '#1a222c',
          900: '#101820',
          950: '#070b10',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
}
