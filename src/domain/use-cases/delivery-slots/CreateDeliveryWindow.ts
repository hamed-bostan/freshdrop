import type { ActivityActor } from "../../entities/ActivityEntry";
import { activityValue } from "../../entities/ActivityEntry";
import type { DeliveryWindow } from "../../entities/DeliveryWindow";
import type { IActivityLog } from "../../repositories/IActivityLog";
import type { IDeliverySlotRepository } from "../../repositories/IDeliverySlotRepository";
import { UniqueConstraintError } from "../../errors/UniqueConstraintError";
import { assertValidDeliveryWindow, assertValidWindowId } from "./deliveryWindowRules";
import { deliveryWindowSnapshot } from "./deliveryWindowActivity";
import { recordActivity } from "../activity/recordActivity";

/**
 * Add a delivery window to the catalog. It becomes bookable across the whole
 * horizon on the next checkout render — the slot list is computed per request from
 * this catalog, so nothing has to be regenerated for existing days.
 */
export class CreateDeliveryWindow {
  constructor(
    private readonly slotRepo: IDeliverySlotRepository,
    private readonly activityLog: IActivityLog,
  ) {}

  async execute(input: DeliveryWindow, actor: ActivityActor): Promise<DeliveryWindow> {
    const id = input.id.trim().toLowerCase();
    assertValidWindowId(id);

    const window: DeliveryWindow = { ...input, id, label: input.label.trim() };
    assertValidDeliveryWindow(window);

    // Id uniqueness is this use-case's invariant, enforced here so every caller
    // gets it. Reusing a retired window's slug would silently adopt its booking
    // ledger rows — a brand-new window that starts out partly full. The primary
    // key still guards the check-to-insert race, surfacing as the same error.
    const existing = await this.slotRepo.getWindow(id);
    if (existing) throw new UniqueConstraintError(["id"]);

    const created = await this.slotRepo.createWindow(window);

    await recordActivity(this.activityLog, {
      actorId: actor.id,
      actorName: actor.name,
      action: "deliveryWindow.created",
      entityType: "deliveryWindow",
      entityId: created.id,
      entityLabel: created.label,
      changes: Object.entries(deliveryWindowSnapshot(created))
        .map(([field, value]) => ({ field, before: null, after: activityValue(value) }))
        .filter((change) => change.after !== null),
    });

    return created;
  }
}
