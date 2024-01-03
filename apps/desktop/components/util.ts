import { TouchData } from "@/data/TouchData";

export const clamp = (val: number, min: number, max: number): number => {
  return Math.max(Math.min(max, val), min);
}

export type Action<T> = () => T;

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

export const isSafari = (): boolean => /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

/*
 * It seems that desktop Safari and iPad OS Safari are different versions of Safari
 * They also implement the touch events in a slightly different way, so we need to be able to differentiate between these browser
 */
export function isPhoneSafari(): boolean {
  if (!isSafari) { return false; }

  // We can check if it is an iOS device by checking the userAgent
  // Both the iPad do not have "Mobile" in the userAgent. Example:
  // iPad:    Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15
  // iPhone:  Mozilla/5.0 (iPhone; CPU iPhone OS 17_0_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0.1 Mobile/15E148 Safari/604.1
  return navigator.userAgent.indexOf("Mobile") > 0;
}
