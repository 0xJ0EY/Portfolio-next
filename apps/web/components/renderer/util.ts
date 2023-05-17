export const calculateAspectRatio = (width: number, height: number): number => {
  return width / height;
}

export const isFirefox = (): boolean => navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
