export type Erp = (start: number, end: number, amt: number) => number;

export function lerp(start: number, end: number, amt: number): number {
  return (1 - amt) * start + amt * end;
}

export function easeOutCubicErp(start: number, end: number, amt: number): number {
  return 1 - Math.pow(1 - lerp(start, end, amt), 3);
}
