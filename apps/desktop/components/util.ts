export const clamp = (val: number, min: number, max: number): number => {
  return Math.max(Math.min(max, val), min);
}

export type Action<T> = () => T


export const minimumDigits = (value: number, digits: number): string => {
  return (value).toLocaleString(undefined, { minimumIntegerDigits: digits });
}
