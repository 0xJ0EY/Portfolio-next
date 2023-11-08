/** @type {import('tailwindcss').Config} */
module.exports = {
  corePlugins: {
    preflight: false
  },
  content: [
    './applications/**/*.tsx',
    './components/**/*.tsx',
    './pages/**/*.tsx',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
