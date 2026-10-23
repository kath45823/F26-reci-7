import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { matchGuess } from '../src/wordle';

// Recitation Part 1: follow along with your TA, filling in the todos below.
// Problem set Task 1: keep adding properties until `npm run mutants:wordle`
// kills every mutant. Read the spec in src/wordle/matchGuess.ts.
//
// Label every property with its pattern, on the line above its `it(`:
//   // Pattern: invariant. The result always has exactly five colors.
// (invariant, algebraic, metamorphic, differential, or conditional)

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Step 1: a generator for five-letter uppercase words.
const wordOver = (letters: string) =>
  fc.array(fc.constantFrom(...letters), { minLength: 5, maxLength: 5 }).map(cs => cs.join(''));
const word = wordOver(ALPHABET);
const smallWord = wordOver('ABC');
const anyWord = fc.oneof(word, smallWord);

const secretAndAnagram = word.chain(secret =>
  fc.tuple(
    fc.constant(secret),
    fc.shuffledSubarray([...secret], { minLength: 5, maxLength: 5 }).map(cs => cs.join('')),
  ),
);

const relabeling = fc.shuffledSubarray([...ALPHABET], { minLength: 26, maxLength: 26 });
const rename = (s: string, perm: string[]) => [...s].map(c => perm[ALPHABET.indexOf(c)]).join('');

const count = (s: string, letter: string) => [...s].filter(c => c === letter).length;

describe('matchGuess', () => {
  // Pattern: invariant. The result always has exactly five colors.
  it('returns exactly five colors', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        expect(matchGuess(secret, guess)).toHaveLength(5);
      }),
    );
  });

  // Pattern: invariant. Every color is G, Y, or B.
  it('only uses the colors G, Y, B', () => {
    fc.assert(
      fc.property(word, word, (secret, guess) => {
        for (const c of matchGuess(secret, guess)) expect(['G', 'Y', 'B']).toContain(c);
      }),
    );
  });

  // Pattern: conditional. If the guess equals the secret, every color is G.
  it('guessing the secret gives all greens', () => {
    fc.assert(
      fc.property(word, secret => {
        expect(matchGuess(secret, secret)).toEqual(['G', 'G', 'G', 'G', 'G']);
      }),
    );
  });

  // Pattern: invariant. Each letter gets at most as many G/Y as the secret contains it.
  it('never credits a letter more times than the secret contains it', () => {
    fc.assert(
      fc.property(smallWord, smallWord, (secret, guess) => {
        const colors = matchGuess(secret, guess);
        for (const letter of new Set(guess)) {
          const credited = [...guess].filter((c, i) => c === letter && colors[i] !== 'B').length;
          expect(credited).toBeLessThanOrEqual(count(secret, letter));
        }
      }),
    );
  });

  // Pattern: invariant. A position is G exactly when the guess letter equals the secret letter there.
  it('gives green exactly where the letters match', () => {
    fc.assert(
      fc.property(anyWord, anyWord, (secret, guess) => {
        const colors = matchGuess(secret, guess);
        for (let i = 0; i < 5; i++) expect(colors[i] === 'G').toBe(guess[i] === secret[i]);
      }),
    );
  });

  // Pattern: invariant. Each letter is credited (G or Y) exactly min(times in guess, times in secret) times.
  it('credits each letter as often as both words share it', () => {
    fc.assert(
      fc.property(anyWord, anyWord, (secret, guess) => {
        const colors = matchGuess(secret, guess);
        for (const letter of new Set(guess)) {
          const credited = [...guess].filter((c, i) => c === letter && colors[i] !== 'B').length;
          expect(credited).toBe(Math.min(count(guess, letter), count(secret, letter)));
        }
      }),
    );
  });

  // Pattern: invariant. Yellows go left to right: a non-green letter is never Y after a B of the same letter.
  it('assigns yellows left to right', () => {
    fc.assert(
      fc.property(anyWord, anyWord, (secret, guess) => {
        const colors = matchGuess(secret, guess);
        for (const letter of new Set(guess)) {
          const nonGreen = [...guess].flatMap((c, i) => (c === letter && colors[i] !== 'G' ? [colors[i]] : []));
          expect(nonGreen.join('')).toMatch(/^Y*B*$/);
        }
      }),
    );
  });

  // Pattern: conditional. If the guess is a rearrangement of the secret, no position is B.
  it('a rearrangement of the secret has no blacks', () => {
    fc.assert(
      fc.property(secretAndAnagram, ([secret, guess]) => {
        expect(matchGuess(secret, guess)).not.toContain('B');
      }),
    );
  });

  // Pattern: metamorphic. Renaming letters one-to-one in both words does not change the colors.
  it('does not depend on which letters are used', () => {
    fc.assert(
      fc.property(anyWord, anyWord, relabeling, (secret, guess, perm) => {
        expect(matchGuess(rename(secret, perm), rename(guess, perm))).toEqual(matchGuess(secret, guess));
      }),
    );
  });
});
