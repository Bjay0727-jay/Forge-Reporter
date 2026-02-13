/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ForgeComply Brand Colors
        forge: {
          primary: '#0ea5e9',      // Sky-500
          'primary-dark': '#0284c7', // Sky-600
          accent: '#14b8a6',       // Teal-500
          'accent-dark': '#0d9488', // Teal-600
        },
        // Tag Colors
        tag: {
          original: '#64748b',     // Slate-500 (gray)
          fedramp: '#3b82f6',      // Blue-500
          fisma: '#f97316',        // Orange-500
        }
      },
      fontFamily: {
        sans: ['DM Sans', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
