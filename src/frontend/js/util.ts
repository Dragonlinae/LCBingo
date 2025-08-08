/**
 * Returns milliseconds timestamp in HHH:MM:SS format
 */
export function formatTimestamp(timestamp: number): string {
  timestamp /= 1000;
  const h = Math.floor(timestamp / (60 * 60));
  const m = Math.floor(timestamp / 60) % 60;
  const s = Math.floor(timestamp) % 60;
  return [h, m, s].map((x) => x.toString().padStart(2, '0')).join(':');
}
