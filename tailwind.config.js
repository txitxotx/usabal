/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        brand: {
          50: '#e6f4ff',
          100: '#b3deff',
          200: '#66bdff',
          500: '#0077cc',
          600: '#005fa3',
          700: '#004d87',
          900: '#00264d',
        },
        water: {
          50: '#e0f7fa',
          100: '#b2ebf2',
          400: '#26c6da',
          600: '#00838f',
        }
      }
    }
  },
  plugins: [],
}
