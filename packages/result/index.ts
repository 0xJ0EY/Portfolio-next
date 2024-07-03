export type Result<T, E = Error> = { ok: true, value: T } | { ok: false, value: E }

export function unwrap<T>(result: Result<T, Error>): T | null {
  if (!result.ok) { return null; }

  return result.value;
}

export function Ok<T, E = Error>(value: T): Result<T, E> {
  return { ok: true, value };
}

export function Err<T, E = Error>(error: E): Result<T, E> {
  return { ok: false, value: error };
}
