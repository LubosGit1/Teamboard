import { describe, expect, it } from "vitest";
import {
  MIN_GAP,
  needsRebalance,
  POSITION_STEP,
  positionBetween,
  rebalancedPositions,
} from "@/lib/ordering";

describe("positionBetween", () => {
  it("starts an empty column at one step", () => {
    expect(positionBetween()).toBe(POSITION_STEP);
  });

  it("appends after the last item and prepends before the first", () => {
    expect(positionBetween(3000, undefined)).toBe(4000);
    expect(positionBetween(undefined, 1000)).toBe(0);
  });

  it("returns the midpoint between two neighbours", () => {
    expect(positionBetween(1000, 2000)).toBe(1500);
  });

  it("keeps order across many inserts at the same spot", () => {
    let after = 2000;
    for (let i = 0; i < 20; i++) {
      const next = positionBetween(1000, after);
      expect(next).toBeGreaterThan(1000);
      expect(next).toBeLessThan(after);
      after = next;
    }
  });

  it("rejects neighbours in the wrong order", () => {
    expect(() => positionBetween(2000, 1000)).toThrow(RangeError);
  });
});

describe("needsRebalance", () => {
  it("is false at the edges of a column", () => {
    expect(needsRebalance(undefined, 1)).toBe(false);
    expect(needsRebalance(1, undefined)).toBe(false);
  });

  it("is true once the gap is smaller than MIN_GAP", () => {
    expect(needsRebalance(1, 1 + MIN_GAP / 10)).toBe(true);
    expect(needsRebalance(1, 2)).toBe(false);
  });
});

it("rebalancedPositions spaces items evenly", () => {
  expect(rebalancedPositions(3)).toEqual([1000, 2000, 3000]);
  expect(rebalancedPositions(0)).toEqual([]);
});
