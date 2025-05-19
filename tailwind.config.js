/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class', // isso é essencial para alternar manualmente com classList
    content: [
      './pages/**/*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}',
      './app/**/*.{js,ts,jsx,tsx}' // caso esteja usando a pasta /app (Next 13+)
    ],
    theme: {
      extend: {},
    },
    plugins: [],
  }

  