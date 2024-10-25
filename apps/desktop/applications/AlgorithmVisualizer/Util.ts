import { Point } from "../math";

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function equals(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

export function adjacentEdges(point: Point): Point[] {
  let results: Point[] = [];

  for (let edge of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const [edgeX, edgeY] = edge;

    const x = point.x + edgeX;
    const y = point.y + edgeY;

    results.push({ x, y });
  }

  return results;
}

export function pointToString(point: Point): string {
  return `x${point.x};y${point.y}`;
}
