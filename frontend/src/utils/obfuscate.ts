/**
 * Obfuscation utilities for sequential database IDs in URL paths.
 * Uses base36 scaling with a prime multiplier to make IDs non-guessable.
 */

export function encodeId(id: number | string | undefined): string {
  if (id === undefined) return '';
  const numericId = Number(id);
  if (isNaN(numericId)) return String(id);
  // Reversible prime multiplication with offset, encoded to base36
  return ((numericId * 137) + 1042).toString(36);
}

export function decodeId(encoded: string | undefined): number {
  if (!encoded) return 0;
  // Fallback for direct legacy numeric paths (e.g. /location/1)
  if (/^\d+$/.test(encoded)) {
    return Number(encoded);
  }
  const parsed = parseInt(encoded, 36);
  if (isNaN(parsed)) return 0;
  const diff = parsed - 1042;
  if (diff < 0 || diff % 137 !== 0) {
    return 0;
  }
  return diff / 137;
}
