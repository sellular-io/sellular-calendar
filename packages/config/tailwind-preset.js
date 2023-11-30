const plugin = require("tailwindcss/plugin");
const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
const subtleColor = "#E5E7EB";
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "../../packages/app-store/**/*{components,pages}/**/*.{js,ts,jsx,tsx}",
    "../../packages/features/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/**/*.{js,ts,jsx,tsx}",
    "../../packages/atoms/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "false",
  theme: {
    extend: {
      colors: {
        emphasis: "var(--cal-bg-emphasis)",
        default: "var(--cal-bg, white)",
        subtle: "var(--cal-bg-subtle)",
        muted: "var(--cal-bg-muted)",
        inverted: "var(--cal-bg-inverted)",
        info: "var(--cal-bg-info)",
        success: "var(--cal-bg-success)",
        attention: "var(--cal-bg-attention)",
        error: "var(--cal-bg-error)",
        black: "#111111",
        green:'var(--sel-success-c1)',
        disabled:'var(--sel-neutral-c5-disabled)',
        'sel-secondary':'var(--sel-primary-c2)',
        'sel-tooltip-background':'var(--sel-neutral-c7)',
        'sel-main-primary':"var(--sel-primary-c1)",
        active:'var(--sel-supporting-c1)',
        normal:'var(--sel-neutral-c4)',
        header:'var(--sel-neutral-c3)',
        brand: {
          default: "var(--cal-brand,#111827)",
          emphasis: "var(--cal-brand-emphasis,#101010)",
          subtle: "var(--cal-brand-subtle,#9CA3AF)",
          accent: "var(--cal-brand-accent,white)",
        },
        gray: {
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
      },
      borderColor: {
        emphasis: "var(--cal-border-emphasis, #9CA3AF)",
        default: "var(--cal-border, #D1D5DB)",
        subtle: `var(--cal-border-subtle, ${subtleColor})`,
        muted: "var(--cal-border-muted, #F3F4F6)",
        booker: `var(--cal-border-booker, ${subtleColor})`,
        'sel-main-primary':"var(--sel-primary-c1)",
        'sel-gray-base':"var(--sel-neutral-c4)",
        'sel-secondary':"var(--sele-neutral-c5)"
      },
      textColor: {
        emphasis: "var(--cal-text-emphasis, #111827)",
        default: "var(--cal-text, #374151)",
        subtle: "var(--cal-text-subtle, #6B7280)",
        muted: "var(--cal-text-muted, #9CA3AF)",
        inverted: "var(--cal-text-inverted, white)",
        info: "var(--cal-text-info, #253985)",
        success: "var(--cal-text-success, #285231)",
        attention: "var(--cal-text-attention, #73321B)",
        error: "var(--cal-text-error, #752522)",
        brand: "var(--cal-brand-text,'white')",
        green: "var(--sel-success-c1)",
        'sel-text-secondary':"var(--sel-neutral-c5)",
        'sel-main-primary':"var(--sel-primary-c1)"
      },
      fill: {
        emphasis: "var(--cal-text-emphasis, #111827)",
        default: "var(--cal-text, #374151)",
        subtle: "var(--cal-text-subtle, #6B7280)",
        muted: "var(--cal-text-muted, #9CA3AF)",
        inverted: "var(--cal-text-inverted, white)",
        info: "var(--cal-text-info, #253985)",
        success: "var(--cal-text-success, #285231)",
        attention: "var(--cal-text-attention, #73321B)",
        error: "var(--cal-text-error, #752522)",
        brand: "var(--cal-brand-text)",
      },
      screens: {
        pwa: { raw: "(display-mode: standalone)" },
      },
      keyframes: {
        "fade-in-up": {
          from: { opacity: 0, transform: "translateY(10px)" },
          to: { opacity: 1, transform: "none" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 600ms var(--animation-delay, 0ms) cubic-bezier(.21,1.02,.73,1) forwards",
      },
      boxShadow: {
        dropdown: "0px 2px 6px -1px rgba(0, 0, 0, 0.08)",
      },
      borderWidth: {
        "booker-width": "var(--cal-border-booker-width, 1px)",
      },
      fontFamily: {
        cal: ["var(--font-cal)", ...fontFamily.serif],
        sans: ["var(--font-sellular)", ...fontFamily.sans],
        mono: ["Roboto Mono", "monospace"],
      },
      maxHeight: (theme) => ({
        0: "0",
        97: "25rem",
        ...theme("spacing"),
        full: "100%",
        screen: "100vh",
      }),
      minHeight: (theme) => ({
        0: "0",
        ...theme("spacing"),
        full: "100%",
        screen: "100vh",
      }),
      minWidth: (theme) => ({
        0: "0",
        ...theme("spacing"),
        full: "100%",
        screen: "100vw",
      }),
      maxWidth: (theme, { breakpoints }) => ({
        0: "0",
        ...theme("spacing"),
        ...breakpoints(theme("screens")),
        full: "100%",
        screen: "100vw",
      }),
      backgroundImage: {
        "gradient-primary": "radial-gradient(162.05% 170% at 109.58% 35%, #667593 0%, #E3E3E3 100%)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("tailwind-scrollbar"),
    require("tailwindcss-radix")(),
    require("@savvywombat/tailwindcss-grid-areas"),
    plugin(({ addVariant }) => {
      addVariant("mac", ".mac &");
      addVariant("windows", ".windows &");
      addVariant("ios", ".ios &");
    }),
    plugin(({ addBase, theme }) => {
      addBase({
        hr: {
          borderColor: theme("subtle"),
        },
      });
    }),
  ],
  variants: {
    scrollbar: ["rounded", "dark"],
  },
};
