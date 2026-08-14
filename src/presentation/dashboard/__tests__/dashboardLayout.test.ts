import { describe, expect, it } from "vitest";

import { DASHBOARD_SPLIT_GRID_CLASS } from "../dashboardLayout";

describe("dashboard responsive layout contract", () => {
  it("uses the standard xl grid breakpoint for the shared asymmetric grid", () => {
    expect(DASHBOARD_SPLIT_GRID_CLASS).toContain("xl:grid-cols-");
    expect(DASHBOARD_SPLIT_GRID_CLASS).toContain("1.75fr");
    expect(DASHBOARD_SPLIT_GRID_CLASS).toContain("minmax(26rem,1fr)");
    expect(DASHBOARD_SPLIT_GRID_CLASS).not.toContain("dashboard-wide");
  });
});
