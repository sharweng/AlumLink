import daisyui from 'daisyui'
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [{
      alumnilink: {
        "primary": "#D62F2F",
        "secondary": "#FFFFFF",
        "accent": "#FF7F7F",
        "neutral": "#000000",
        "base-100": "#FFEDED",
        "info": "#5E5E5E",
        "success": "#057642",
        "warning": "#F5C75D",
        "error": "#CC1016"
      }
    }]
  }
}