
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neon-bg': '#0B0E14',
        'neon-panel': 'rgba(21, 25, 36, 0.6)',
        'neon-cyan': '#00F0FF',
        'neon-green': '#00FF9D',
        'neon-red': '#FF3366',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      },
      animation: {
        marquee: 'marquee 25s linear infinite',
      }
    },
  },
  plugins: [],
}
