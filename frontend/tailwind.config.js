/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0F172A',
          blue: '#1E40AF',
          lightBlue: '#EFF6FF',
          accent: '#2563EB',
          slate: '#475569',
          success: '#16A34A',
          warning: '#D97706',
          danger: '#DC2626'
        }
      }
    },
  },
  plugins: [],
}
