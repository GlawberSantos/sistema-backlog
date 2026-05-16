import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        smra: {
          bg: '#0a0f1a',
          panel: '#0f1829',
          card: '#121f35',
          hover: '#192840',
          border: '#1e2e4a',
          'border-light': '#243450',
          text: {
            primary: '#e8edf5',
            secondary: '#8a9bbf',
            muted: '#4a5a7a',
          },
          accent: {
            blue: '#2d7ef0',
            'blue-light': '#4d9ef8',
            green: '#0eb88a',
            orange: '#f5882a',
            red: '#e85555',
            cyan: '#0dd8d8',
            purple: '#8b5cf6',
          }
        }
      }
    },
  },
  plugins: [],
} satisfies Config