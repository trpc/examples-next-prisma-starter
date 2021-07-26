export function parseIntOrNull(value?: unknown): number | null {
  if (typeof value === 'number') {
    return Math.trunc(value);
  }
  if (typeof value !== 'string') {
    return null;
  }
  if (!/^-{0,1}\d+$/.test(value)) {
    return null;
  }
  return parseInt(value, 10);
}
