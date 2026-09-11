import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardSplitGrid } from "../DashboardSplitGrid";

describe("DashboardSplitGrid", () => {
  it("uses a container-aware 12-column layout without arbitrary track sizes", () => {
    const html = renderToStaticMarkup(
      <DashboardSplitGrid
        primary={<section data-panel="primary" />}
        secondary={<section data-panel="secondary" />}
      />,
    );

    expect(html).toContain("@5xl:grid-cols-12");
    expect(html).toContain("@5xl:col-span-8");
    expect(html).toContain("@5xl:col-span-4");
    expect(html).not.toContain("grid-cols-[");
  });
});
