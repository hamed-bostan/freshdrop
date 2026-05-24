import { radius as primitiveRadius } from "../primitives/radius";

export const radius = {
  button: {
    sm: primitiveRadius.sm,
    md: primitiveRadius.md,
  },
  input: {
    sm: primitiveRadius.sm,
    md: primitiveRadius.md,
  },
  card: {
    md: primitiveRadius.md,
    lg: primitiveRadius.lg,
    xl: primitiveRadius.xl,
  },
  badge: {
    sm: primitiveRadius.sm,
    md: primitiveRadius.md,
  },
  modal: primitiveRadius.lg,
  pill: primitiveRadius.full,
} as const;
