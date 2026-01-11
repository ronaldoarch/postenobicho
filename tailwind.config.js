/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'blue': '#052370',
        'blue-scale': {
          '70': '#0a3d8a',
          '100': '#052370',
          '2-10': 'rgba(5, 35, 112, 0.1)',
        },
        'yellow': '#FFA100',
        'yellow-50': '#ffeb99',
        'white-125': 'rgba(255, 255, 255, 0.125)',
        'gray-scale': {
          '100': '#f5f5f5',
          '700': '#4a4a4a',
          '950': '#1c1c1c',
        },
        'grey-scale': {
          '900': '#1c1c1c',
        },
        'white-scale': {
          '0': '#ffffff',
        },
      },
      fontFamily: {
        'sora': ['Sora', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
