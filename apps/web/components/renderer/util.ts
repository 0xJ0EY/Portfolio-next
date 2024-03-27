import { time } from "console";

export const calculateAspectRatio = (width: number, height: number): number => {
  return width / height;
}

export const isFirefox = (): boolean => navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

// https://stackoverflow.com/a/23522755
export const isSafari = (): boolean => /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

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

export function writeOutCharsStreaming(
  stream: () => string,
  output: (value: string) => void,
  timeBetweenInMs: number
): () => void {
  let index = 0;
  let cancelled = false;

  function writeChar() {
    const string = stream();

    const slice = string.slice(0, ++index);
    output(slice);

    if (index < string.length && cancelled === false) {
      setTimeout(writeChar, timeBetweenInMs);
    }
  }

  writeChar();

  return () => { cancelled = true; }
}

export function writeOutChars(value: string, output: (value: string) => void, timeBetweenInMs: number): () => void {
  return writeOutCharsStreaming(() => value, output, timeBetweenInMs);
}

export function joinStyles(styles: (string | null)[]) {
  return styles.filter(x => x !== null).join(" ");
}
