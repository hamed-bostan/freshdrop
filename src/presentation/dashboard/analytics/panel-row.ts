/**
 * Shared row height for the overview's three-panel row (Top products, Top
 * categories, Customer insights). Each panel's row carries different content
 * — a thumbnail plus two text lines, two text lines alone, or a label/value
 * pair — so left to their own intrinsic sizes the three cards drift apart by
 * a few pixels per row, compounding across three rows into a visible gap
 * that the parent grid's stretch can only pad with blank space rather than
 * truly close. Pinning every row to the same minimum height removes the
 * drift at the source.
 */
export const OVERVIEW_ROW_MIN_HEIGHT = "min-h-22";
