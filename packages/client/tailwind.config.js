/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tg: {
          bg: 'var(--tg-theme-bg-color, #1e1b4b)',
          text: 'var(--tg-theme-text-color, #ffffff)',
          hint: 'var(--tg-theme-hint-color, #94a3b8)',
          link: 'var(--tg-theme-link-color, #38bdf8)',
          button: 'var(--tg-theme-button-color, #6366f1)',
          buttonText: 'var(--tg-theme-button-text-color, #ffffff)',
          secondary: 'var(--tg-theme-secondary-bg-color, #312e81)',
        }
      },
      fontFamily: {
        sans: ['Nunito', 'Fredoka', '"SF Pro Rounded"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Fredoka', 'Nunito', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
