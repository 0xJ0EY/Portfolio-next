import { Point } from "../math";

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function equals(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

export function adjacentEdges(point: Point): Point[] {
  let results: Point[] = [];

  // For directions, go up, right, down, left
  for (let edge of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
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

export function shuffleArray<T>(input: T[]): T[] {
  // Based on https://en.wikipedia.org/wiki/Schwartzian_transform

  return input
    .map(x => ({ value: x, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(x => x.value);
}
