/** @type {import('tailwindcss').Config} */

/** rgb(var(--x) / <alpha-value>) — lets Tailwind opacity modifiers work. */
const rgbVar = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: rgbVar("background"),
        foreground: rgbVar("foreground"),
        card: {
          DEFAULT: rgbVar("card"),
          foreground: rgbVar("card-foreground"),
        },
        popover: {
          DEFAULT: rgbVar("popover"),
          foreground: rgbVar("popover-foreground"),
        },
        primary: {
          DEFAULT: rgbVar("primary"),
          foreground: rgbVar("primary-foreground"),
        },
        secondary: {
          DEFAULT: rgbVar("secondary"),
          foreground: rgbVar("secondary-foreground"),
        },
        destructive: {
          DEFAULT: rgbVar("destructive"),
          foreground: rgbVar("destructive-foreground"),
        },
        muted: {
          DEFAULT: rgbVar("muted"),
          foreground: rgbVar("muted-foreground"),
        },
        accent: {
          DEFAULT: rgbVar("accent"),
          foreground: rgbVar("accent-foreground"),
        },
        popover: {
          DEFAULT: rgbVar("popover"),
          foreground: rgbVar("popover-foreground"),
        },
        border: rgbVar("border"),
        input: rgbVar("input"),
        ring: rgbVar("ring"),

        sidebar: {
          DEFAULT: rgbVar("sidebar-bg"),
          foreground: rgbVar("sidebar-fg"),
          border: rgbVar("sidebar-border"),
          active: rgbVar("sidebar-active-bg"),
          "active-foreground": rgbVar("sidebar-active-fg"),
          muted: rgbVar("sidebar-muted"),
        },

        // SkillsHub brand palette
        indigo: {
          DEFAULT: "var(--brand-indigo)",
          deep:    "var(--brand-indigo-deep)",
          press:   "var(--brand-indigo-press)",
          soft:    "var(--brand-indigo-soft)",
        },
        coral: {
          DEFAULT: "var(--brand-coral)",
          deep:    "var(--brand-coral-deep)",
          press:   "var(--brand-coral-press)",
          soft:    "var(--brand-coral-soft)",
        },
        teal: {
          DEFAULT: "var(--brand-teal)",
          deep:    "var(--brand-teal-deep)",
          soft:    "var(--brand-teal-soft)",
        },
        amber: {
          DEFAULT: "var(--brand-amber)",
          deep:    "var(--brand-amber-deep)",
          soft:    "var(--brand-amber-soft)",
        },

        // Ink neutral scale
        ink: {
          0:   "var(--ink-0)",
          50:  "var(--ink-50)",
          100: "var(--ink-100)",
          200: "var(--ink-200)",
          300: "var(--ink-300)",
          400: "var(--ink-400)",
          500: "var(--ink-500)",
          600: "var(--ink-600)",
          700: "var(--ink-700)",
          800: "var(--ink-800)",
          900: "var(--ink-900)",
        },
      },

      borderRadius: {
        xs:   "var(--r-xs)",
        sm:   "var(--r-sm)",
        md:   "var(--r-md)",
        lg:   "var(--r-lg)",
        xl:   "var(--r-xl)",
        pill: "var(--r-pill)",
      },

      boxShadow: {
        1: "var(--shadow-1)",
        2: "var(--shadow-2)",
        3: "var(--shadow-3)",
        4: "var(--shadow-4)",
        focus:       "var(--shadow-focus)",
        "focus-coral": "var(--shadow-focus-coral)",
      },

      transitionTimingFunction: {
        out:      "var(--ease-out)",
        "in-out": "var(--ease-in-out)",
        spring:   "var(--ease-spring)",
      },

      transitionDuration: {
        fast: "120ms",
        base: "200ms",
        slow: "320ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
