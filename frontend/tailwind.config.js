/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        'custom-orange': '#f97315',
        'orange-vibrant': '#ff7939',
        'light-gray': '#f2f2f2',
        'medium-gray': '#707070',
        'dark-gray': '#9a9a9a',
        'light-border': '#e5e5e5',
        'border-secondary': '#d9d9d9',
        'cloud-blue': '#ebf2fe',
        'vibrant-mint': '#f0fdf4',
        'coral-mist': '#fff5f5',
        'light-vibrant-green': '#bbf7d0',
        'faded-ember': '#fecaca',
        'translucent-bright-blue': '#93c5fd',
        'softer-gray': '#f8f8f8',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};