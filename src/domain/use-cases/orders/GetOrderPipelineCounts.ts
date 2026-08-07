import { pipelineCounts, type OrderPipelineStage } from "../../entities/OrderPipelineStage";

import type { IAnalyticsOverviewRepository } from "../../repositories/IAnalyticsRepository";

/** How many orders sit at each pipeline stage, plus the store's whole order count. */
export type OrderPipelineCounts = {
  /** Every order ever placed — the denominator the four cards are read against. */
  total: number;
  counts: Record<OrderPipelineStage, number>;
};

/**
 * How the order queue currently divides up. Backs `GET /api/admin/orders/counts`,
 * which feeds the order list's summary cards and the numbers beside each option in
 * its status filter.
 *
 * One aggregate query, folded in the domain — see `pipelineCounts` for why the
 * fold can't be pushed into SQL (the stages overlap, and a `GROUP BY` row can only
 * be in one group).
 *
 * `total` is summed from the same rows rather than counted separately, which is
 * what stops the cards from disagreeing with each other: two queries could be
 * answered either side of an order landing, and "156 orders" above four cards
 * adding to 157 is the kind of arithmetic people notice and then stop trusting.
 */
export class GetOrderPipelineCounts {
  constructor(private readonly analytics: IAnalyticsOverviewRepository) {}

  async execute(): Promise<OrderPipelineCounts> {
    const groups = await this.analytics.orderStateCounts();
    return {
      total: groups.reduce((sum, group) => sum + group.orders, 0),
      counts: pipelineCounts(groups),
    };
  }
}
