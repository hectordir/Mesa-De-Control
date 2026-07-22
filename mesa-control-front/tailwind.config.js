/**
 * Fibex Control — Tailwind CSS config (v3)
 *
 * Los colores apuntan a las variables CSS de `src/styles/tokens.css`, por lo que
 * el tema dark/light es automático: basta alternar `data-theme` en un ancestro.
 * Sintaxis ESM porque el paquete es `"type": "module"`.
 */

/**
 * Deriva un color semitransparente a partir de un token, sin literales hex.
 * `color-mix` mantiene el vínculo con la variable, así el tema claro/oscuro
 * sigue funcionando (Tailwind v3 no puede aplicar `/opacity` sobre un `var()`
 * que contiene un hex ya resuelto).
 */
const alpha = (token, percent) =>
  `color-mix(in srgb, var(${token}) ${percent}%, transparent)`;

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "var(--color-bg)",
          // fondo de campos de formulario sobre superficies translúcidas
          field: alpha("--color-bg", 70),
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          elevated: "var(--color-surface-elevated)",
          // tarjeta "glass" (con backdrop-blur)
          glass: alpha("--color-surface", 84),
        },
        border: {
          DEFAULT: "var(--color-border)",
          subtle: "var(--color-border-subtle)",
        },
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
        },
        brand: {
          DEFAULT: "var(--color-brand)",
          fg: "var(--color-on-brand)",
          soft: alpha("--color-brand", 14),
          outline: alpha("--color-brand", 40),
          ring: alpha("--color-brand", 22),
          // derivados del monitor diario (ver tokens.css)
          nav: "var(--color-brand-nav)",
          chip: "var(--color-brand-chip)",
          avatar: "var(--color-brand-avatar)",
        },
        success: {
          DEFAULT: "var(--color-success)",
          soft: "var(--color-success-soft)",
          outline: alpha("--color-success", 30),
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          soft: "var(--color-warning-soft)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          soft: "var(--color-danger-soft)",
        },
        info: {
          DEFAULT: "var(--color-info)",
          soft: "var(--color-info-soft)",
        },
        neutral: {
          DEFAULT: "var(--color-neutral)",
          soft: "var(--color-neutral-soft)",
        },
        cat: {
          1: "var(--color-cat-1)",
          2: "var(--color-cat-2)",
          3: "var(--color-cat-3)",
          4: "var(--color-cat-4)",
          5: "var(--color-cat-5)",
          6: "var(--color-cat-6)",
        },
        map: {
          bg: "var(--color-map-bg)",
          grid: "var(--color-map-grid)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      // Type scale — [size, { lineHeight, letterSpacing }]
      fontSize: {
        display: ["48px", { lineHeight: "1.05", letterSpacing: "-0.025em", fontWeight: "700" }],
        h1: ["32px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "700" }],
        h2: ["24px", { lineHeight: "1.3", letterSpacing: "-0.01em", fontWeight: "600" }],
        h3: ["18px", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["14px", { lineHeight: "1.5" }],
        label: ["11px", { lineHeight: "1.3", letterSpacing: "0.08em", fontWeight: "600" }],
        caption: ["12px", { lineHeight: "1.4" }],
      },
      // Spacing scale (base 4px)
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
        12: "48px",
      },
      borderRadius: {
        card: "12px", // tarjetas
        control: "8px", // inputs / botones
        chip: "6px", // chips
        auth: "20px", // tarjeta de acceso
        cta: "10px", // botón primario de acceso
        pill: "999px", // píldoras / badges redondos
      },
      boxShadow: {
        elevation: "var(--shadow-elevation)",
        auth: "0 24px 60px rgba(0, 0, 0, .5), inset 0 1px 0 rgba(255, 255, 255, .06)",
        cta: `0 8px 22px ${alpha("--color-brand", 40)}`,
      },
      backgroundImage: {
        // velo del fondo de acceso: degradado vertical + viñeta radial
        "auth-overlay": [
          `linear-gradient(180deg, ${alpha("--color-bg", 82)}, ${alpha("--color-bg", 62)})`,
          `radial-gradient(120% 90% at 50% 40%, transparent 40%, ${alpha("--color-bg", 78)} 100%)`,
        ].join(", "),
      },
    },
  },
  plugins: [],
};
