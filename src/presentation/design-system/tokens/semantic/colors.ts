import { primary, secondary, neutral, success, error, warning, info, amber } from "../primitives/colors";

export const colors = {
  background: neutral[0],
  foreground: neutral[950],

  surface: {
    // Default elevated neutral fill used across cards, panels, inputs and wells.
    DEFAULT: neutral[50],
    // Deeper, recessed step for sunken areas (category tiles, nested image wells).
    sunken: neutral[75],
  },

  popover: {
    DEFAULT: neutral[0],
    foreground: neutral[950],
  },

  primary: {
    DEFAULT: primary[500],
    foreground: neutral[0],
    pressed: primary[600],
  },

  disabled: {
    DEFAULT: neutral[100],
    foreground: neutral[300],
    border: neutral[300],
  },

  secondary: {
    DEFAULT: secondary[500],
    foreground: neutral[0],
  },

  muted: {
    DEFAULT: neutral[50],
    foreground: neutral[500],
    strong: neutral[100],
  },

  accent: {
    DEFAULT: primary[50],
    foreground: primary[700],
  },

  destructive: {
    DEFAULT: error[500],
    foreground: neutral[0],
  },

  success: {
    DEFAULT: success[100],
    foreground: success[700],
  },

  warning: {
    DEFAULT: warning[100],
    foreground: warning[700],
  },

  info: {
    DEFAULT: info[100],
    foreground: info[700],
  },

  error: {
    DEFAULT: error[100],
    foreground: error[700],
  },

  icon: {
    muted: neutral[400],
  },

  // Rating stars (and gold decorative glyphs such as the cash-on-delivery coin).
  rating: amber[500],

  input: {
    // Standard (outline) form field fill — white, paired with a border so it
    // reads on white page backgrounds.
    DEFAULT: neutral[0],
    // Filled-variant fill — the borderless grey well used by search fields.
    filled: neutral[50],
    foreground: neutral[700],
    placeholder: neutral[500],
  },

  discount: {
    DEFAULT: error[500],
    foreground: neutral[0],
  },

  border: neutral[200],
  ring: primary[300],
} as const;
