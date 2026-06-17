import { defineConfig } from 'tailwindcss'

export default defineConfig({
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './src/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
})
