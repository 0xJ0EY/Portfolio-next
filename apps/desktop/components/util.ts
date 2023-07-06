export const clamp = (val: number, min: number, max: number): number => {
  return Math.max(Math.min(max, val), min);
}

export type Result<T, E = Error> = { ok: true, value: T } | { ok: false, value: E }

export function Ok<T, E = Error>(value: T): Result<T, E> {
  return { ok: true, value };
}

export function Err<T, E = Error>(error: E): Result<T, E> {
  return { ok: false, value: error };
}
