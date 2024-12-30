export interface Point {
  x: number,
  y: number
}

export interface Rectangle {
  x1: number,
  x2: number,
  y1: number,
  y2: number
}

export interface BoundingBox {
  width: number,
  height: number
}

export const rectangleIntersection = (
  a: Rectangle,
  b: Rectangle
): boolean => {
  const horizontal  = a.x1 < b.x2 && a.x2 > b.x1;
  const vertical    = a.y1 < b.y2 && a.y2 > b.y1;

  return horizontal && vertical;
}

export const rectangleAnyIntersection = (
  rect: Rectangle,
  others: Rectangle[]
): boolean => {
  return others.some(x => rectangleIntersection(rect, x));
}

export const pointInsideRectangle = (
  point: Point,
  rect: Rectangle
): boolean => {
  const horizontal  = point.x > rect.x1 && point.x < rect.x2;
  const vertical    = point.y > rect.y1 && point.y < rect.y2;

  return horizontal && vertical;
}

export const pointInsideAnyRectangles = (
  point: Point,
  rects: Rectangle[]
): boolean => {
  return rects.some(x => pointInsideRectangle(point, x));
}

export const pointIndexInsideAnyRectangles = (
  point: Point,
  rects: Rectangle[]
): number => {
  return rects.findIndex(x => pointInsideRectangle(point, x));
}

export const pointMagnitude = (a: Point, b: Point): number => {
  const xAxis = Math.abs(b.x - a.x);
  const yAxis = Math.abs(b.y - a.y);

  return Math.sqrt(xAxis * xAxis + yAxis * yAxis);
}
