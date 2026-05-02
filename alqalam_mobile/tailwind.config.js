/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        gold:    '#fbbf24',
        cyan:    '#00e5ff',
        purple:  '#a78bfa',
        green:   '#34d399',
        red:     '#f87171',
        orange:  '#fb923c',
        bg:      '#0d1117',
        bg2:     '#161b22',
        bg3:     '#21262d',
        bg4:     '#30363d',
        border:  '#30363d',
      },
    },
  },
  plugins: [],
};
