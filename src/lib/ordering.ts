/**
 * Fractional ordering: each task stores a float `position`. To insert between two
 * neighbours we take the midpoint, so a move is a single UPDATE instead of
 * renumbering the whole column. When the gap gets too small we rebalance.
 */
export const POSITION_STEP = 1000;
export const MIN_GAP = 1e-6;

export function positionBetween(before?: number, after?: number): number {
  if (before === undefined && after === undefined) return POSITION_STEP;
  if (before === undefined) return after! - POSITION_STEP;
  if (after === undefined) return before + POSITION_STEP;
  if (before >= after) {
    throw new RangeError(`Invalid neighbours: ${before} must be lower than ${after}`);
  }
  return (before + after) / 2;
}

export function needsRebalance(before?: number, after?: number): boolean {
  if (before === undefined || after === undefined) return false;
  return after - before < MIN_GAP;
}

export function rebalancedPositions(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * POSITION_STEP);
}
