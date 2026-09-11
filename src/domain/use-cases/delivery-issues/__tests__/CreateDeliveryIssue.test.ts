import { describe, expect, it, vi } from "vitest";

import { ValidationError } from "../../../errors/ValidationError";
import { CreateDeliveryIssue } from "../CreateDeliveryIssue";

import type { IDeliveryIssueRepository } from "../../../repositories/IDeliveryIssueRepository";

describe("CreateDeliveryIssue", () => {
  it("rejects a negative delay without touching the repository", async () => {
    const create = vi.fn();
    const useCase = new CreateDeliveryIssue({ create } as unknown as IDeliveryIssueRepository);

    await expect(useCase.execute("o1", "traffic_delay", -5)).rejects.toThrow(ValidationError);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a fractional delay", async () => {
    const create = vi.fn();
    const useCase = new CreateDeliveryIssue({ create } as unknown as IDeliveryIssueRepository);

    await expect(useCase.execute("o1", "traffic_delay", 5.5)).rejects.toThrow(ValidationError);
    expect(create).not.toHaveBeenCalled();
  });

  it("delegates to the repository on a valid delay", async () => {
    const issue = { id: "i1", orderId: "o1", orderNumber: 1, zone: "Downtown", type: "traffic_delay" as const, status: "open" as const, driverId: null, driverName: null, delayMinutes: 20, createdAt: "2026-07-10T00:00:00.000Z" };
    const create = vi.fn().mockResolvedValue(issue);
    const useCase = new CreateDeliveryIssue({ create } as unknown as IDeliveryIssueRepository);

    const result = await useCase.execute("o1", "traffic_delay", 20);

    expect(result).toEqual(issue);
    expect(create).toHaveBeenCalledWith({ orderId: "o1", type: "traffic_delay", delayMinutes: 20 });
  });
});
