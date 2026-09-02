/**
 * Generates a clean 7-digit Account ID / Company ID (e.g. 7482910) deterministically from a user UUID or seed.
 * Range: 1000000 - 9999999
 */
export function generateAccountId(seed: string | null | undefined): string {
  if (!seed) return '1000001';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const absHash = Math.abs(hash);
  const num = 1000000 + (absHash % 9000000);
  return num.toString();
}

/**
 * Generates a unique Staff ID code (e.g. STF-1001 or STF-XXXX).
 */
export function generateStaffCode(indexOrSeed?: number | string): string {
  if (typeof indexOrSeed === 'number') {
    return `STF-${1000 + indexOrSeed}`;
  }
  if (typeof indexOrSeed === 'string') {
    const accountNum = generateAccountId(indexOrSeed);
    return `STF-${accountNum.slice(-4)}`;
  }
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `STF-${randomSuffix}`;
}
