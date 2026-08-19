/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Azul marino profundo del Sidebar y Header
        cecsa: {
          dark: '#071830',
          sidebar: '#0b2144',
          hover: '#133261',
        },
        // Azul de acción / botones / acentos
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          500: '#0070e0',
          600: '#0061c2',
          700: '#004ea1',
        },
        // Fondo general celeste muy suave
        canvas: '#f0f5fa',
      }
    },
  },
  plugins: [],
}