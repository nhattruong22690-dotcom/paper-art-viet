/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#D8B4FE', // Neo-Purple
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        neo: {
          purple: '#D8B4FE',
          mint: '#D1FAE5',
          yellow: '#FEF3C7',
          red: '#FEE2E2',
          black: '#000000',
          slate: '#0F172A',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        space: ['var(--font-space-grotesk)', 'sans-serif'],
      },
      borderWidth: {
        'neo': '2.5px',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'neo': '4px 4px 0px 0px #000000',
        'neo-active': '2px 2px 0px 0px #000000',
        'soft': '0 10px 15px -3px rgba(148, 163, 184, 0.1), 0 4px 6px -4px rgba(148, 163, 184, 0.1)',
        'vibrant': '0 20px 25px -5px rgba(59, 130, 246, 0.1), 0 10px 10px -5px rgba(59, 130, 246, 0.04)',
      }
    },
  },
  plugins: [],
}
