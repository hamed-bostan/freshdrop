interface GuideRow {
  name: string;
  label: string;
  whenToUse: string;
}

const ROWS: GuideRow[] = [
  {
    name: "Input",
    label: "none (aria-label)",
    whenToUse: "A label-less control — search, or a building block inside a custom field. Always pass an aria-label.",
  },
  {
    name: "TextField",
    label: "static, above",
    whenToUse: "The default for forms. The label is always visible — the most legible and accessible choice.",
  },
  {
    name: "FloatingField",
    label: "floating",
    whenToUse: "When the design calls for the floating-label look. Single-line controls only.",
  },
];

/** In-app reference explaining which field component to reach for, and the rule. */
export function FieldGuide() {
  return (
    <section className="flex flex-col gap-4 rounded-card-lg bg-surface p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-body-b1 text-foreground">When to use each</h2>
        <p className="text-body-b10 text-muted-foreground">
          Pick the field by how its label is presented. Any control — <code>Input</code>, <code>PasswordInput</code>,
          … — works with <code>TextField</code> or <code>FloatingField</code> through their render-prop;{" "}
          <code>Textarea</code> is static-label only.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {ROWS.map((row) => (
          <li key={row.name} className="flex flex-col gap-0.5">
            <div className="flex items-baseline gap-2">
              <code className="text-body-b9 text-foreground">{row.name}</code>
              <span className="text-body-b11 text-muted-foreground">label: {row.label}</span>
            </div>
            <p className="text-body-b10 text-muted-foreground">{row.whenToUse}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-1 border-t border-border pt-3">
        <p className="text-body-b9 text-foreground">The rule</p>
        <p className="text-body-b10 text-muted-foreground">
          Floating label → no placeholder, no static label. Placeholder → no floating label, optional static label.
          The two modes are mutually exclusive, enforced by which component you choose.
        </p>
      </div>
    </section>
  );
}
