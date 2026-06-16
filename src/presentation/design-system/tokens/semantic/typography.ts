import { typography as p } from "../primitives/typography";

export const typography = {
  heading: {
    h1: {
      size: p.fontSize[32],
      lineHeight: p.lineHeight[40],
      weight: p.fontWeight.bold,
      family: p.fontFamily.sans,
    },

    h2: {
      size: p.fontSize[24],
      lineHeight: p.lineHeight[28],
      weight: p.fontWeight.bold,
      family: p.fontFamily.sans,
    },

    h3: {
      size: p.fontSize[20],
      lineHeight: p.lineHeight[24],
      weight: p.fontWeight.bold,
      family: p.fontFamily.sans,
    },

    h4: {
      size: p.fontSize[20],
      lineHeight: p.lineHeight[24],
      weight: p.fontWeight.medium,
      family: p.fontFamily.sans,
    },
  },

  body: {
    b1: {
      size: p.fontSize[18],
      lineHeight: p.lineHeight[24],
      weight: p.fontWeight.bold,
      family: p.fontFamily.sans,
    },

    b2: {
      size: p.fontSize[16],
      lineHeight: p.lineHeight[24],
      weight: p.fontWeight.regular,
      family: p.fontFamily.sans,
    },

    b3: {
      size: p.fontSize[16],
      lineHeight: p.lineHeight[24],
      weight: p.fontWeight.medium,
      family: p.fontFamily.sans,
    },

    b4: {
      size: p.fontSize[16],
      lineHeight: p.lineHeight[24],
      weight: p.fontWeight.semibold,
      family: p.fontFamily.sans,
    },

    b5: {
      size: p.fontSize[16],
      lineHeight: p.lineHeight[24],
      weight: p.fontWeight.bold,
      family: p.fontFamily.sans,
    },

    b6: {
      size: p.fontSize[14],
      lineHeight: p.lineHeight[20],
      weight: p.fontWeight.regular,
      family: p.fontFamily.sans,
    },

    b7: {
      size: p.fontSize[14],
      lineHeight: p.lineHeight[20],
      weight: p.fontWeight.medium,
      family: p.fontFamily.sans,
    },

    b8: {
      size: p.fontSize[14],
      lineHeight: p.lineHeight[20],
      weight: p.fontWeight.semibold,
      family: p.fontFamily.sans,
    },

    b9: {
      size: p.fontSize[14],
      lineHeight: p.lineHeight[20],
      weight: p.fontWeight.bold,
      family: p.fontFamily.sans,
    },

    b10: {
      size: p.fontSize[12],
      lineHeight: p.lineHeight[16],
      weight: p.fontWeight.regular,
      family: p.fontFamily.sans,
    },

    b11: {
      size: p.fontSize[12],
      lineHeight: p.lineHeight[16],
      weight: p.fontWeight.medium,
      family: p.fontFamily.sans,
    },

    b12: {
      size: p.fontSize[12],
      lineHeight: p.lineHeight[16],
      weight: p.fontWeight.bold,
      family: p.fontFamily.sans,
    },

    b13: {
      size: p.fontSize[12],
      lineHeight: p.lineHeight[24],
      weight: p.fontWeight.bold,
      family: p.fontFamily.sans,
    },
  },

  button: {
    btn1: {
      size: p.fontSize[16],
      lineHeight: p.lineHeight[16],
      weight: p.fontWeight.semibold,
      family: p.fontFamily.sans,
    },

    btn2: {
      size: p.fontSize[14],
      lineHeight: p.lineHeight[14],
      weight: p.fontWeight.semibold,
      family: p.fontFamily.sans,
    },

    btn3: {
      size: p.fontSize[14],
      lineHeight: p.lineHeight[24],
      weight: p.fontWeight.medium,
      family: p.fontFamily.sans,
    },

    btn4: {
      size: p.fontSize[16],
      lineHeight: p.lineHeight[24],
      weight: p.fontWeight.medium,
      family: p.fontFamily.sans,
    },
  },

  label: {
    l1: {
      size: p.fontSize[12],
      lineHeight: p.lineHeight[12],
      weight: p.fontWeight.semibold,
      family: p.fontFamily.sans,
    },

    l2: {
      size: p.fontSize[10],
      lineHeight: p.lineHeight[10],
      weight: p.fontWeight.semibold,
      family: p.fontFamily.sans,
    },

    l3: {
      size: p.fontSize[10],
      lineHeight: p.lineHeight[10],
      weight: p.fontWeight.medium,
      family: p.fontFamily.sans,
    },

    l4: {
      size: p.fontSize[8],
      lineHeight: p.lineHeight[10],
      weight: p.fontWeight.medium,
      family: p.fontFamily.sans,
    },
  },
} as const;
