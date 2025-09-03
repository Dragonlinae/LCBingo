import { expect, it, describe } from 'vitest';
import { formatTimestamp } from '../../frontend/js/utils/timestamp.ts';

describe('timestamp utility', () => {
  it('formats 0 time', () => {
    expect(formatTimestamp(0)).toBe('00:00:00');
  });
  it('formats subsec time', () => {
    expect(formatTimestamp(999)).toBe('00:00:00');
  });
  it('formats 0:01 time', () => {
    expect(formatTimestamp(1000)).toBe('00:00:01');
  });
  it('formats 1:00 time', () => {
    expect(formatTimestamp(60000)).toBe('00:01:00');
  });
  it('formats 1:00:00 time', () => {
    expect(formatTimestamp(3600000)).toBe('01:00:00');
  });
  it('formats 100:00:00 time', () => {
    expect(formatTimestamp(360000000)).toBe('100:00:00');
  });
  it('formats 100:00:00 time', () => {
    expect(formatTimestamp(360000000)).toBe('100:00:00');
  });
  it('formats positive time', () => {
    expect(formatTimestamp(7591921)).toBe('02:06:31');
  });
  it('formats negative time', () => {
    expect(formatTimestamp(-7591921)).toBe('-02:06:31');
  });
});
