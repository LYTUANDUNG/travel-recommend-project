export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdbb74',
          400: '#fb923c',
          500: '#f97316', // Unified Brand Orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Unified Amber
          600: '#d97706',
          700: '#b45309',
        },
        premium: {
          bg: '#F8FAFC', // Slate 50
          card: '#FFFFFF',
          border: '#E2E8F0',
        }
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(249, 115, 22, 0.08)',
        'premium': '0 20px 50px -12px rgba(0, 0, 0, 0.05)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'sans-serif'],
        serif: ['Lora', 'serif'],
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}
