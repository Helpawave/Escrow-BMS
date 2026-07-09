/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Outfit', '"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"Courier New"', 'monospace'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        slate: {
          650: "#3d4b5f",
          750: "#28364a",
          850: "#16202e",
        },
        gray: {
          650: "#414b5a",
          750: "#2c3646",
          850: "#17202c",
        },
        zinc: {
          650: "#484850",
          750: "#33333b",
          850: "#1e1e24",
        },
        neutral: {
          650: "#494949",
          750: "#343434",
          850: "#1e1e1e",
        },
        stone: {
          650: "#4e4a45",
          750: "#383430",
          850: "#221e1a",
        },
        red: {
          650: "#cd2121",
          750: "#a91818",
          850: "#8d1414",
        },
        orange: {
          650: "#d64c0c",
          750: "#b0380c",
          850: "#8f2b0c",
        },
        amber: {
          650: "#c66507",
          750: "#a34609",
          850: "#83350b",
        },
        yellow: {
          650: "#b57605",
          750: "#905106",
          850: "#733e06",
        },
        lime: {
          650: "#59900e",
          750: "#446e0e",
          850: "#36570c",
        },
        green: {
          650: "#159143",
          750: "#157438",
          850: "#145b2d",
        },
        emerald: {
          650: "#04875f",
          750: "#046d4f",
          850: "#05553e",
        },
        teal: {
          650: "#0e857a",
          750: "#0e6a63",
          850: "#0f524d",
        },
        cyan: {
          650: "#0b82a1",
          750: "#0c6a83",
          850: "#0e5267",
        },
        sky: {
          650: "#0276b4",
          750: "#035fa3",
          850: "#074b81",
        },
        blue: {
          650: "#2158e1",
          750: "#1a45ce",
          850: "#1b37b0",
        },
        indigo: {
          650: "#493fdf",
          750: "#3d32c0",
          850: "#3026a7",
        },
        violet: {
          650: "#7431e3",
          750: "#641ece",
          850: "#5216af",
        },
        purple: {
          650: "#892bde",
          750: "#741bc1",
          850: "#5e16a2",
        },
        fuchsia: {
          650: "#b121c1",
          750: "#9519a1",
          850: "#791383",
        },
        pink: {
          650: "#cc1f6a",
          750: "#ad1554",
          850: "#8d1045",
        },
        rose: {
          650: "#cf1742",
          750: "#ad0f36",
          850: "#8c0b2c",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
