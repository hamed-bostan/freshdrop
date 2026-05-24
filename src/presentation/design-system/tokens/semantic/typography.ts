import { typography as primitives } from "../primitives/typography";

const cssVar = (prefix: string, key: string) => `var(--${prefix}-${key})`;

const family = Object.fromEntries(
  Object.keys(primitives.fontFamily).map((k) => [k, cssVar("font-family", k)]),
) as Record<keyof typeof primitives.fontFamily, string>;

const weight = Object.fromEntries(
  Object.keys(primitives.fontWeight).map((k) => [k, cssVar("font-weight", k)]),
) as Record<keyof typeof primitives.fontWeight, string>;

const size = Object.fromEntries(Object.keys(primitives.fontSize).map((k) => [k, cssVar("font-size", k)])) as Record<
  keyof typeof primitives.fontSize,
  string
>;

const line = Object.fromEntries(Object.keys(primitives.lineHeight).map((k) => [k, cssVar("line-height", k)])) as Record<
  keyof typeof primitives.lineHeight,
  string
>;

export const typography = {
  display: {
    1: {
      family: family.display,
      size: size["7xl"],
      lineHeight: line.normal,
      weight: weight.bold,
    },
    2: {
      family: family.display,
      size: size["5xl"],
      lineHeight: line.normal,
      weight: weight.bold,
    },
  },

  heading: {
    1: {
      family: family.display,
      size: size["6xl"],
      lineHeight: line.normal,
      weight: weight.bold,
    },
    2: {
      family: family.display,
      size: size["5xl"],
      lineHeight: line.normal,
      weight: weight.bold,
    },
    3: {
      family: family.display,
      size: size["4xl"],
      lineHeight: line.normal,
      weight: weight.bold,
    },
    4: {
      family: family.display,
      size: size["2xl"],
      lineHeight: line.normal,
      weight: weight.medium,
    },
  },

  body: {
    1: {
      family: family.sans,
      size: size["3xl"],
      lineHeight: line.normal,
      weight: weight.semibold,
    },
    2: {
      family: family.sans,
      size: size["3xl"],
      lineHeight: line.normal,
      weight: weight.medium,
    },
    3: {
      family: family.sans,
      size: size["2xl"],
      lineHeight: line.normal,
      weight: weight.bold,
    },
    4: {
      family: family.sans,
      size: size["2xl"],
      lineHeight: line.normal,
      weight: weight.regular,
    },
    5: {
      family: family.sans,
      size: size.xl,
      lineHeight: line.normal,
      weight: weight.bold,
    },
    6: {
      family: family.sans,
      size: size.xl,
      lineHeight: line.normal,
      weight: weight.regular,
    },
    7: {
      family: family.sans,
      size: size.xl,
      lineHeight: line.relaxed,
      weight: weight.regular,
    },
    8: {
      family: family.sans,
      size: size.lg,
      lineHeight: line.normal,
      weight: weight.medium,
    },
    9: {
      family: family.sans,
      size: size.lg,
      lineHeight: line.normal,
      weight: weight.medium,
    },
    10: {
      family: family.sans,
      size: size.lg,
      lineHeight: line.normal,
      weight: weight.regular,
    },
    11: {
      family: family.sans,
      size: size.md,
      lineHeight: line.normal,
      weight: weight.bold,
    },
    12: {
      family: family.sans,
      size: size.md,
      lineHeight: line.normal,
      weight: weight.medium,
    },
    13: {
      family: family.sans,
      size: size.md,
      lineHeight: line.normal,
      weight: weight.regular,
    },
    14: {
      family: family.sans,
      size: size.sm,
      lineHeight: line.normal,
      weight: weight.medium,
    },
    15: {
      family: family.sans,
      size: size.sm,
      lineHeight: line.normal,
      weight: weight.regular,
    },
    16: {
      family: family.sans,
      size: size.xs,
      lineHeight: line.normal,
      weight: weight.regular,
    },
    17: {
      family: family.sans,
      size: size["2xs"],
      lineHeight: line.normal,
      weight: weight.regular,
    },
  },

  caption: {
    1: {
      family: family.sans,
      size: size.lg,
      lineHeight: line.normal,
      weight: weight.medium,
    },
    2: {
      family: family.sans,
      size: size.sm,
      lineHeight: line.normal,
      weight: weight.regular,
    },
    3: {
      family: family.sans,
      size: size.xs,
      lineHeight: line.normal,
      weight: weight.bold,
    },
    4: {
      family: family.sans,
      size: size.xs,
      lineHeight: line.normal,
      weight: weight.medium,
    },
    5: {
      family: family.sans,
      size: size.xs,
      lineHeight: line.normal,
      weight: weight.regular,
    },
  },

  button: {
    1: {
      family: family.sans,
      size: size.lg,
      lineHeight: line.normal,
      weight: weight.medium,
    },
    2: {
      family: family.sans,
      size: size.lg,
      lineHeight: line.normal,
      weight: weight.regular,
    },
    3: {
      family: family.sans,
      size: size.md,
      lineHeight: line.normal,
      weight: weight.medium,
    },
    4: {
      family: family.sans,
      size: size.md,
      lineHeight: line.normal,
      weight: weight.regular,
    },
    5: {
      family: family.sans,
      size: size.sm,
      lineHeight: line.normal,
      weight: weight.medium,
    },
    6: {
      family: family.sans,
      size: size.sm,
      lineHeight: line.normal,
      weight: weight.regular,
    },
  },

  chart: {
    1: {
      family: family.sans,
      size: size.xs,
      lineHeight: line.normal,
      weight: weight.semibold,
    },
    2: {
      family: family.sans,
      size: size.xs,
      lineHeight: line.normal,
      weight: weight.regular,
    },
    3: {
      family: family.sans,
      size: size["2xs"],
      lineHeight: line.normal,
      weight: weight.bold,
    },
    4: {
      family: family.sans,
      size: size["2xs"],
      lineHeight: line.normal,
      weight: weight.semibold,
    },
  },
} as const;
