import { TouchData } from "@/data/TouchData";

export const clamp = (val: number, min: number, max: number): number => {
  return Math.max(Math.min(max, val), min);
}

export type Action<T> = () => T


export const minimumDigits = (value: number, digits: number): string => {
  return (value).toLocaleString(undefined, { minimumIntegerDigits: digits });
}


export function isTouchTap(data: TouchData): boolean {
  return data.hasTouchesDown(1);
}

export function isTouchRotateCamera(data: TouchData): boolean {
  return data.hasTouchesDown(1);
}

export function isTouchMoveCamera(data: TouchData): boolean {
  return data.hasTouchesDown(2) || data.hasTouchesDown(3);
}

export function isTouchZoom(data: TouchData): boolean {
  return data.hasTouchesDown(2);
}
