import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Oswald', 'Inter', 'sans-serif'],
      },
      colors: {
        alvarado: {
          navy: '#0f2044',
          'navy-light': '#1a3260',
          blue: '#1e3a6e',
          'blue-mid': '#2d52a0',
          accent: '#3b6fd4',
          white: '#f5f7fa',
        },
      },
    },
  },
  plugins: [],
};

export default config;
