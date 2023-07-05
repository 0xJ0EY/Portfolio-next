export const clamp = (val: number, min: number, max: number): number => {
  return Math.max(Math.min(max, val), min);
}
