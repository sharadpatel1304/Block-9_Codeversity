/** @type {import('tailwindcss').Config} */
export default {
  // 👇 THIS SECTION WAS MISSING
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // 👆 
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#B45309', // BodhiX Orange
          hover: '#92400e',
        },
        neutral: {
          900: '#1a1a1a', 
          500: '#737373', 
          50: '#fafafa',  
        }
      },
      fontFamily: {
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}