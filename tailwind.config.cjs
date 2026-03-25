/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': '#1F5E3B',
        'brand-dark-blue': '#12355B',
        'brand-light-blue': '#1D6FA3',
        'brand-orange': '#FF7A00',
        'brand-cream': '#F3E9DC',
      },
      fontFamily: {
        primary: ['"Plus Jakarta Sans"', 'sans-serif'],
        secondary: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
