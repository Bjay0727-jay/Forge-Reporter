/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Forge Cyber Defense Brand Colors
        forge: {
          navy: {
            DEFAULT: '#1e3a5f',
            light: '#2d4a6f',
            dark: '#152a4a',
          },
          teal: {
            DEFAULT: '#14b8a6',
            light: '#2dd4bf',
            dark: '#0d9488',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'DM Sans', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
