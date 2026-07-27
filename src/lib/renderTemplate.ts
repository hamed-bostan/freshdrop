/**
 * Fill a `{{VAR}}` placeholder template with named values.
 *
 * Unknown placeholders (a typo, or a variable this call site never supplies)
 * are left in the output as-is and logged — a template author's mistake must
 * never turn into a broken or empty send, only a visibly wrong one they can
 * catch from the preview.
 */
export function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    if (Object.prototype.hasOwnProperty.call(vars, name)) return vars[name];
    console.warn(`[renderTemplate] unknown placeholder {{${name}}}`);
    return match;
  });
}
