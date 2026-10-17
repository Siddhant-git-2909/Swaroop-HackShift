/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        cream: {
          50: '#ffffff',
          100: '#faf7f2',
          200: '#f5eee3',
          300: '#ede1d1',
        },
        brutal: {
          yellow: '#facc15',
          darkYellow: '#eab308',
          black: '#121212',
          coral: '#fb7185',
          green: '#4ade80',
          blue: '#38bdf8',
          orange: '#fb923c',
          purple: '#c084fc',
        }
      },
      boxShadow: {
        'hard-sm': '2px 2px 0px 0px #121212',
        'hard': '3px 3px 0px 0px #121212',
        'hard-md': '4px 4px 0px 0px #121212',
        'hard-lg': '6px 6px 0px 0px #121212',
        'hard-xl': '8px 8px 0px 0px #121212',
      },
      borderWidth: {
        '2.5': '2.5px',
        '3': '3px',
      }
    },
  },
  plugins: [],
}
