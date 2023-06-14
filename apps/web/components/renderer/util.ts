export const calculateAspectRatio = (width: number, height: number): number => {
  return width / height;
}

export const isFirefox = (): boolean => navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

export const clamp = (val: number, min: number, max: number): number => {
  return Math.max(Math.min(max, val), min);
}
