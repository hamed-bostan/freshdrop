import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Physical-direction Tailwind classes — banned in favor of logical (RTL-aware)
// equivalents, since the app supports Persian (fa) as well as English.
const PHYSICAL_PROPERTY_MESSAGE =
  "Use the logical equivalent instead of a physical-direction class (ml- → ms-, mr- → me-, pl- → ps-, pr- → pe-, left- → start-, right- → end-, text-left → text-start, text-right → text-end) — this app renders RTL for the fa locale.";
const PHYSICAL_PROPERTY_REGEX = "\\b(ml|mr|pl|pr|left|right)-|\\btext-(left|right)\\b";

// Raw color values — banned in favor of design-system `--color-*` tokens
// (`src/presentation/design-system/tokens/`), so themes/dark-mode stay centralized.
const RAW_COLOR_MESSAGE =
  "Don't use a literal color (hex, rgb()/rgba(), or a raw white/black/gray-scale utility class) — add or reuse a design-system color token instead.";
const RAW_COLOR_REGEX =
  "#[0-9a-fA-F]{3,8}\\b|rgba?\\(|\\b(?:bg|text|border|ring|from|via|to|fill|stroke|shadow|outline|decoration|caret|divide|accent)-(?:white|black|gray-\\d+|slate-\\d+|zinc-\\d+|neutral-\\d+|stone-\\d+)\\b";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude Code session state — worktrees carry a full repo copy (incl. its own
    // .next build output), which otherwise floods lint with generated-code errors.
    ".claude/**",
  ]),
  {
    files: ["src/presentation/**/*.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: `Literal[value=/${PHYSICAL_PROPERTY_REGEX}/]`,
          message: PHYSICAL_PROPERTY_MESSAGE,
        },
        {
          selector: `TemplateElement[value.raw=/${PHYSICAL_PROPERTY_REGEX}/]`,
          message: PHYSICAL_PROPERTY_MESSAGE,
        },
        {
          selector: `Literal[value=/${RAW_COLOR_REGEX}/]`,
          message: RAW_COLOR_MESSAGE,
        },
        {
          selector: `TemplateElement[value.raw=/${RAW_COLOR_REGEX}/]`,
          message: RAW_COLOR_MESSAGE,
        },
      ],
    },
  },
]);

export default eslintConfig;
