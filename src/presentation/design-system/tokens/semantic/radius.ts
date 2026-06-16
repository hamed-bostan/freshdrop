import { radius as primitiveRadius } from "../primitives/radius";

export const radius = {
  button: {
    md: primitiveRadius.md,
    xl: primitiveRadius.xl,
  },
  input: {
    md: primitiveRadius.md,
    xl: primitiveRadius.xl,
  },
  card: {
    md: primitiveRadius.md,
    lg: primitiveRadius.lg,
    xl: primitiveRadius.xl,
  },
  badge: {
    md: primitiveRadius.md,
  },
  modal: primitiveRadius.lg,
  sheet: primitiveRadius["2xl"],
  pill: primitiveRadius.full,
} as const;
