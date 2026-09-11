/**
 * The single keyboard-focus treatment for the whole design system.
 *
 * Every interactive control uses this, so focus reads identically everywhere
 * instead of drifting between `ring`, `ring-2`, and `ring-2 ring-offset-2`.
 * `focus-visible` (not `focus`) keeps the ring off pointer interactions.
 *
 * Two flavours:
 *  - `focusRing` — drawn inside the control's own box. The default: correct for
 *    anything with a fill or border of its own (buttons, fields, chips, tabs).
 *  - `focusRingOffset` — separated from the control by a background-coloured gap,
 *    for small controls whose own fill would otherwise swallow the ring (Switch).
 */
export const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export const focusRingOffset = `${focusRing} focus-visible:ring-offset-2 focus-visible:ring-offset-background`;

/**
 * The same treatment keyed off a *descendant* receiving focus, for controls
 * whose real input is visually hidden inside a wrapper (e.g. a chip wrapping an
 * `sr-only` checkbox). Pair with the hidden input, never with a focusable host.
 */
export const focusRingWithin = "has-focus-visible:ring-2 has-focus-visible:ring-ring";
