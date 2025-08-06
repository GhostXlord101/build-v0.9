import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#181026',
          violet: '#7c3aed',
          violetDark: '#4c1d95',
          accent: '#a78bfa',
          background: '#130f23',
          surface: '#232136',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        md: '0.375rem',
        lg: '0.5rem',
      },
      boxShadow: {
        'md-brand': '0 4px 6px rgba(124, 58, 237, 0.2)',
        'lg-brand': '0 10px 15px rgba(124, 58, 237, 0.3)',
      },
    },
  },
  plugins: [forms, typography],
};
