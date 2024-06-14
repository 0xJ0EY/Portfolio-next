export type Erp = (start: number, end: number, amt: number) => number;

export function lerp(start: number, end: number, amt: number): number {
  return (1 - amt) * start + amt * end;
}

export function easeOutCubicErp(start: number, end: number, amt: number): number {
  const factor = 1 - Math.pow(1 - amt, 3);

  return (1 - factor) * start + factor * end;
}
