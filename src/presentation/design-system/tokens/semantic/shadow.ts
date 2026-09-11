// Elevation shadows. Kept minimal — add an entry here (never a literal
// box-shadow/rgba in component code) as new elevation needs come up.
export const shadow = {
  // Bottom sheets raised over page content (cart summary bar, checkout sheet).
  sheet: "0 -4px 24px rgba(0, 0, 0, 0.08)",
  // Map marker badges (delivery tracking).
  marker: "0 2px 8px rgba(0, 0, 0, 0.25)",
} as const;
