import { primary, secondary, neutral, success, error, warning, info } from "../primitives/colors";

export const colors = {
  background: neutral[0],
  foreground: neutral[950],
  surface: neutral[75],

  card: {
    DEFAULT: neutral[50],
    foreground: neutral[950],
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

  input: {
    DEFAULT: neutral[50],
    focus: neutral[0],
    foreground: neutral[700],
    placeholder: neutral[700],
  },

  discount: {
    DEFAULT: error[500],
    foreground: neutral[0],
  },

  border: neutral[200],
  ring: primary[300],
} as const;
