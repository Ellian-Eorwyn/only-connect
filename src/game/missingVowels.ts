// Generate the "vowels removed, spaces shifted" display for a Missing Vowels
// answer, e.g.  "DOLLY PARTON" -> "DL LYPR TN".
//
// The re-spacing is deterministic (seeded by the content) so the same answer
// always yields the same puzzle — important so a game plays identically every
// time and so the generated template is stable.

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uppercase, drop spaces/punctuation, then remove vowels (keeps Y and digits). */
export function stripToConsonants(phrase: string): string {
  const letters = phrase.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cons = letters.replace(/[AEIOU]/g, '');
  return cons.length ? cons : letters; // guard all-vowel answers
}

/** Re-group a consonant string into irregular chunks of ~2–4 characters. */
export function shiftSpaces(consonants: string, seed = 0): string {
  const N = consonants.length;
  if (N <= 3) return consonants;
  const rand = mulberry32(hashSeed(consonants) ^ seed);
  const sizes: number[] = [];
  let remaining = N;
  while (remaining > 0) {
    if (remaining <= 4) {
      sizes.push(remaining);
      break;
    }
    let size = 2 + Math.floor(rand() * 3); // 2, 3 or 4
    if (remaining - size === 1) size = remaining - 2; // never strand a single char
    sizes.push(size);
    remaining -= size;
  }
  const out: string[] = [];
  let idx = 0;
  for (const s of sizes) {
    out.push(consonants.slice(idx, idx + s));
    idx += s;
  }
  return out.join(' ');
}

/** Full pipeline: real phrase -> on-screen Missing Vowels puzzle. */
export function makeMissingVowels(phrase: string): string {
  return shiftSpaces(stripToConsonants(phrase));
}
