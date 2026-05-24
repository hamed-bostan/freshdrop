import { primary, neutral, success, warning, error } from "../primitives/colors";

export const colors = {
  background: neutral[950],
  foreground: neutral[0],

  surface: neutral[900],
  surface_foreground: neutral[0],

  card: neutral[800],
  card_foreground: neutral[0],

  popover: neutral[800],
  popover_foreground: neutral[0],

  muted: neutral[800],
  muted_foreground: neutral[400],

  border: neutral[700],
  input: neutral[700],
  ring: primary[300],

  primary: {
    DEFAULT: primary[200],
    hover: primary[300],
    active: primary[400],
    foreground: neutral[0],
  },

  secondary: {
    DEFAULT: neutral[600],
    hover: neutral[700],
    active: neutral[800],
    foreground: neutral[0],
  },

  accent: {
    DEFAULT: neutral[600],
    hover: neutral[700],
    active: neutral[800],
    foreground: neutral[0],
  },

  success: {
    DEFAULT: success[300],
    hover: success[100],
    active: success[700],
    foreground: neutral[0],
  },

  warning: {
    DEFAULT: warning[200],
    hover: warning[100],
    active: warning[700],
    foreground: neutral[900],
  },

  destructive: {
    DEFAULT: error[300],
    hover: error[100],
    active: error[700],
    foreground: neutral[0],
  },
} as const;
