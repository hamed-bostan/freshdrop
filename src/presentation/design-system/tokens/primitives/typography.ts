export const typography = {
  fontFamily: {
    // Reference the next/font-loaded Inter (exposed as --font-inter), not the
    // literal "Inter" system-font name, so the self-hosted webfont is used.
    sans: "var(--font-inter), sans-serif",
  },

  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  fontSize: {
    8: "0.5rem", // 8px
    10: "0.625rem", // 10px
    12: "0.75rem", // 12px
    14: "0.875rem", // 14px
    16: "1rem", // 16px
    18: "1.125rem", // 18px
    20: "1.25rem", // 20px
    24: "1.5rem", // 24px
    32: "2rem", // 32px
  },

  lineHeight: {
    10: "10px",
    12: "12px",
    14: "14px",
    16: "16px",
    20: "20px",
    24: "24px",
    28: "28px",
    40: "40px",
  },
} as const;
