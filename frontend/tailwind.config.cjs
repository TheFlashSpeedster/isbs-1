module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#e6f6ff",
          100: "#cceeff",
          200: "#99ddff",
          300: "#66ccff",
          400: "#33bbff",
          500: "#0099ff",
          600: "#007acc",
          700: "#005c99",
          800: "#003d66",
          900: "#001f33"
        },
        accent: {
          50: "#e8fff5",
          100: "#c9ffe7",
          200: "#9affd4",
          300: "#64f5be",
          400: "#35e0a1",
          500: "#12c686",
          600: "#0aa36d",
          700: "#077a52",
          800: "#055139",
          900: "#03281e"
        },
        emergency: "#e63946"
      },
      fontFamily: {
        display: ["Plus Jakarta Sans", "sans-serif"],
        body: ["Manrope", "sans-serif"]
      },
      boxShadow: {
        soft: "0 12px 30px -12px rgba(0, 122, 204, 0.35)",
        card: "0 20px 50px -35px rgba(0, 0, 0, 0.4)"
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseSlow: "pulseSlow 3s ease-in-out infinite",
        rise: "rise 0.8s ease-out both"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" }
        },
        pulseSlow: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.03)" }
        },
        rise: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0px)" }
        }
      }
    }
  },
  plugins: []
};
