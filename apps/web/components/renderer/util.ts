export const calculateAspectRatio = (width: number, height: number): number => {
  return width / height;
}

export const isFirefox = (): boolean => navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

export const clamp = (val: number, min: number, max: number): number => {
  return Math.max(Math.min(max, val), min);
}

const noopTouchEvent = (evt: TouchEvent) => evt.preventDefault();

export const disableTouchInteraction = (element: HTMLElement): void => {
  element.style.touchAction = 'none';

  element.addEventListener('touchstart', noopTouchEvent);
  element.addEventListener('touchmove', noopTouchEvent);
  element.addEventListener('touchend', noopTouchEvent);
  element.addEventListener('touchcancel', noopTouchEvent);
}

export const enableTouchInteraction = (element: HTMLElement): void => {
  element.style.touchAction = 'initial';

  element.removeEventListener('touchstart', noopTouchEvent);
  element.removeEventListener('touchmove', noopTouchEvent);
  element.removeEventListener('touchend', noopTouchEvent);
  element.removeEventListener('touchcancel', noopTouchEvent);
}
