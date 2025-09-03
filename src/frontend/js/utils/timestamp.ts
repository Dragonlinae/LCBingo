/**
 * Returns milliseconds timestamp in HHH:MM:SS format
 */
export function formatTimestamp(timestamp: number): string {
  let prefix = '';
  if (timestamp < 0) {
    prefix = '-';
    timestamp *= -1;
  }
  timestamp /= 1000;
  const h = Math.floor(timestamp / (60 * 60));
  const m = Math.floor(timestamp / 60) % 60;
  const s = Math.floor(timestamp) % 60;
  return prefix + [h, m, s].map((x) => x.toString().padStart(2, '0')).join(':');
}
