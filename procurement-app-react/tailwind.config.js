/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  important: '#root',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e8edf3',
          100: '#c5d0df',
          200: '#9eb0ca',
          300: '#7790b5',
          400: '#5a78a5',
          500: '#3d6095',
          600: '#2E75B6',
          700: '#1F3A5F',
          800: '#162b47',
          900: '#0d1d30',
        },
        sme:   { DEFAULT: '#155724', light: '#d4edda', badge: '#28a745' },
        large: { DEFAULT: '#721C24', light: '#f8d7da', badge: '#dc3545' },
      },
      fontFamily: { sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'] },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.07)',
        lg: '0 10px 15px rgba(0,0,0,0.10)',
        card: '0 2px 8px rgba(31,58,95,0.08)',
        'card-hover': '0 6px 20px rgba(31,58,95,0.14)',
      },
      borderRadius: { DEFAULT: '8px', lg: '12px', xl: '16px' },
    },
  },
  plugins: [],
}
