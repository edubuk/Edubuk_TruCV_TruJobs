/** @type {import('tailwindcss').Config} */
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {},
      backgroundImage: {},
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
       slide: 'slide 10s linear infinite',
        slideOpposite: 'slideOpposite 10s linear infinite',
        zoomOut: 'zoomOut 1.5s ease-out forwards',
        typewriter: 'typewriter 2s steps(7) 1s forwards',
        bounceDot: 'bounceDot 1.5s infinite ease-in-out',
      },
      keyframes: {
  fadeIn: {
    '0%': { opacity: '0', transform: 'scale(0.95)' },
    '100%': { opacity: '1', transform: 'scale(1)' },
  },
  bounceDot: {
          '0%, 80%, 100%': { opacity:'0.2' },
          '40%': { opacity: '1' },
        },
  slide: {
    '0%': { transform: 'translateX(0)' },
    '100%': { transform: 'translateX(-40%)' },
  },
  slideOpposite: {
    '0%': { transform: 'translateX(-50%)' },
    '100%': { transform: 'translateX(0)' },
  },
}

    },
  },
  plugins: [tailwindcssAnimate],
};