import type { RoleChange } from "../../entities/RoleChange";
import type { IRoleChangeLog } from "../../repositories/IRoleChangeLog";

/** How many entries the team page shows without asking for more. */
const DEFAULT_LIMIT = 20;

/** The most recent dashboard access changes, newest first. */
export class ListRoleChanges {
  constructor(private readonly log: IRoleChangeLog) {}

  execute(limit: number = DEFAULT_LIMIT): Promise<RoleChange[]> {
    return this.log.list(limit);
  }
}
