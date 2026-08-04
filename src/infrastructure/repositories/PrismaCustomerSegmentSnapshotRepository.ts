import type { CustomerSegmentAssignment } from "@/src/domain/entities/CustomerSegmentsReport";
import type { ICustomerSegmentSnapshotRepository } from "@/src/domain/repositories/ICustomerSegmentSnapshotRepository";
import { prisma } from "@/src/infrastructure/prisma/client";
import type { PrismaDb } from "@/src/infrastructure/prisma/transaction";

export class PrismaCustomerSegmentSnapshotRepository implements ICustomerSegmentSnapshotRepository {
  constructor(private readonly db: PrismaDb = prisma) {}

  async record(capturedOn: string, assignments: CustomerSegmentAssignment[]): Promise<number> {
    if (assignments.length === 0) return 0;
    const capturedOnDate = new Date(`${capturedOn}T00:00:00.000Z`);
    const result = await this.db.customerSegmentSnapshot.createMany({
      data: assignments.map((assignment) => ({
        userId: assignment.userId,
        segment: assignment.segment,
        capturedOn: capturedOnDate,
        orders: assignment.orders,
        revenue: assignment.revenue,
      })),
      // A rerun for a day already captured writes nothing new — see the port doc.
      skipDuplicates: true,
    });
    return result.count;
  }
}
