/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#003366',
        secondary: '#FF6B35',
        success: '#4CAF50',
        warning: '#FFC107',
        danger: '#F44336',
        light: '#F5F5F5',
        dark: '#333333',
      },
    },
  },
  plugins: [],
};
