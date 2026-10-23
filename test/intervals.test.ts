import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { mergeIntervals, type Interval } from '../src/intervals';

// Recitation Part 2 (groups) and problem set Task 2.
// Read the spec in src/intervals/mergeIntervals.ts, then check your progress
// with `npm run mutants:intervals`.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The output is sorted.
// (invariant, algebraic, metamorphic, differential, or conditional)

const interval: fc.Arbitrary<Interval> = fc
  .tuple(fc.integer({ min: -20, max: 20 }), fc.nat(5))
  .map(([start, length]): Interval => [start, start + length]);
const intervalList = fc.array(interval, { maxLength: 8 });

const disjointSorted: fc.Arbitrary<Interval[]> = fc
  .tuple(fc.integer({ min: -20, max: 20 }), fc.array(fc.tuple(fc.integer({ min: 1, max: 3 }), fc.nat(3)), { maxLength: 6 }))
  .map(([first, steps]) => {
    const out: Interval[] = [];
    let end = first - 1;
    for (const [gap, length] of steps) {
      const start = end + gap;
      end = start + length;
      out.push([start, end]);
    }
    return out;
  });

const covered = (xs: readonly Interval[], p: number) => xs.some(([s, e]) => s <= p && p <= e);

describe('mergeIntervals', () => {
  // Pattern: invariant. Every input interval lies inside some output interval.
  it('every input interval lies inside some output interval', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        const uncovered = xs.filter(([s, e]) => !out.some(([a, b]) => a <= s && e <= b));
        expect(uncovered).toEqual([]);
      }),
    );
  });

  // Pattern: invariant. The output is sorted, and consecutive intervals neither overlap nor touch.
  it('returns sorted intervals that neither overlap nor touch', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        for (let i = 0; i + 1 < out.length; i++) expect(out[i][1]).toBeLessThan(out[i + 1][0]);
      }),
    );
  });

  // Pattern: invariant. The input array and its intervals are not modified.
  it('does not modify the input', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const copy = xs.map(([s, e]): Interval => [s, e]);
        mergeIntervals(xs);
        expect(xs).toEqual(copy);
      }),
    );
  });

  // Pattern: differential. Every point (integers and halfway points) is covered by the output exactly when it is covered by the input.
  it('covers exactly the same points as the input', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const out = mergeIntervals(xs);
        for (let p = -22; p <= 27; p += 0.5) expect(covered(out, p)).toBe(covered(xs, p));
      }),
    );
  });

  // Pattern: metamorphic. Shuffling the input does not change the output.
  it('does not depend on the order of the input', () => {
    fc.assert(
      fc.property(
        intervalList.chain(xs =>
          fc.tuple(fc.constant(xs), fc.shuffledSubarray(xs, { minLength: xs.length, maxLength: xs.length })),
        ),
        ([xs, shuffled]) => {
          expect(mergeIntervals(shuffled)).toEqual(mergeIntervals(xs));
        },
      ),
    );
  });

  // Pattern: algebraic. Merging is idempotent.
  it('merging an already merged list changes nothing', () => {
    fc.assert(
      fc.property(intervalList, xs => {
        const once = mergeIntervals(xs);
        expect(mergeIntervals(once)).toEqual(once);
      }),
    );
  });

  // Pattern: conditional. If no two input intervals overlap or touch, the output is the input sorted by start.
  it('returns already-disjoint input sorted and otherwise unchanged', () => {
    fc.assert(
      fc.property(
        disjointSorted.chain(sorted =>
          fc.tuple(fc.constant(sorted), fc.shuffledSubarray(sorted, { minLength: sorted.length, maxLength: sorted.length })),
        ),
        ([sorted, shuffled]) => {
          expect(mergeIntervals(shuffled)).toEqual(sorted);
        },
      ),
    );
  });
});
