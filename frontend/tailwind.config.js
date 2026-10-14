/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAFAFA',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F4F4F5',
          hover: '#F8F8F9',
        },
        brand: {
          50: '#FBF8F3',
          100: '#F6EFE3',
          200: '#EBDDC5',
          300: '#DEC5A0',
          500: '#B88E52', // Warm refined gold / bronze
          600: '#9E743A',
          700: '#7E5B2B',
          900: '#483315',
        },
        slate: {
          850: '#151D2A',
          900: '#0F172A',
        }
      },
      borderRadius: {
        'card': '16px',
        'subtle': '12px',
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        'card-hover': '0 10px 25px -4px rgba(15, 23, 42, 0.08)',
        'dropdown': '0 12px 30px rgba(0, 0, 0, 0.08)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
