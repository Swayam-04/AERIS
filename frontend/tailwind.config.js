/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aerotwin: {
          bg: '#090d16',
          panel: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          accent: '#06b6d4',      // Cyan accent
          emerald: '#10b981',     // Normal status
          amber: '#f59e0b',       // Warning status
          rose: '#f43f5e',        // Critical status
          blue: '#3b82f6',        // Information
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
