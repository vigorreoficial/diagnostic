import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'vigorre-primary': '#0F5FA8',
        'vigorre-secondary': '#0A3D78',
        'vigorre-dark': '#072F5F',
        'vigorre-light': '#4D90D9',
        'vigorre-very-light': '#EAF3FC',
        'vigorre-white': '#FFFFFF',
        'vigorre-gray-light': '#F7F8FA',
        'vigorre-gray-medium': '#D7DEE8',
        'vigorre-gray-dark': '#5E6C84',
        'vigorre-black': '#1C1F26',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        'ibm-plex': ['IBM Plex Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
