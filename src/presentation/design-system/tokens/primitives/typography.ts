export const typography = {
  fontFamily: {
    sans: '"IBM Plex Sans", "SF Pro Display", sans-serif',
    display: '"SF Pro Display", "IBM Plex Sans", sans-serif',
  },

  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.1,
    normal: 1.2,
    relaxed: 1.5,
  },

  letterSpacing: {
    tight: "-0.02em",
    normal: "0",
    wide: "0.02em",
  },

  fontSize: {
    "2xs": "0.625rem", // 10px
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    md: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.625rem", // 26px
    "4xl": "2rem", // 32px
    "5xl": "2.5rem", // 40px
    "6xl": "3rem", // 48px
    "7xl": "4.5rem", // 72px
  },
} as const;
